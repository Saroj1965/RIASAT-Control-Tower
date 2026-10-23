import { NextResponse } from "next/server";
import { getSupabaseClient, logAudit } from "@/lib/db";
import { getSessionUser, hashPassword, canManageUsers } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Params {
  params: { id: string };
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser || !canManageUsers(currentUser)) {
      return NextResponse.json({ error: "Access Denied: User Administrator privileges required." }, { status: 403 });
    }

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const sb = getSupabaseClient();
    const { data: targetUser } = await sb.from("users").select("*").eq("id", userId).maybeSingle();
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, email, mobile, designation, role, department_id, status, password } = body;

    let newHash: string | undefined = undefined;
    if (password && password.trim()) {
      newHash = await hashPassword(password.trim());
    }

    const deptId =
      department_id !== undefined ? (department_id ? parseInt(department_id, 10) : null) : targetUser.department_id;

    const updatePayload: Record<string, any> = {
      name: name !== undefined ? name : targetUser.name,
      email: email ? email.trim().toLowerCase() : targetUser.email,
      mobile: mobile !== undefined ? mobile : targetUser.mobile,
      designation: designation !== undefined ? designation : targetUser.designation,
      role: role !== undefined ? role : targetUser.role,
      department_id: deptId,
      status: status !== undefined ? status : targetUser.status,
      updated_at: new Date().toISOString(),
    };
    if (newHash) {
      updatePayload.password_hash = newHash;
    }

    const { data: updatedUser, error: upError } = await sb
      .from("users")
      .update(updatePayload)
      .eq("id", userId)
      .select("id, name, email, mobile, designation, role, department_id, status, updated_at")
      .single();

    if (upError || !updatedUser) {
      return NextResponse.json({ error: upError?.message || "Failed to update user" }, { status: 500 });
    }

    let action = "UPDATE_USER";
    let detailMsg = `Admin updated user details for ${updatedUser.name}`;
    if (targetUser.status !== updatedUser.status) {
      action = updatedUser.status === "Active" ? "ACTIVATE_USER" : "DEACTIVATE_USER";
      detailMsg = `Admin set user ${updatedUser.name} status to ${updatedUser.status}`;
    }

    await logAudit({
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      recordId: userId,
      details: detailMsg,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
