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
      return NextResponse.json({ error: "Access Denied: Administrator or Vice Chairman privileges required." }, { status: 403 });
    }

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const sb = getSupabaseClient();
    const { data: targetUser } = await sb.from("users").select("*").eq("id", userId).maybeSingle();
    if (!targetUser) {
      return NextResponse.json({ error: "User credential not found in Supabase" }, { status: 404 });
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
      name: name !== undefined ? name.trim() : targetUser.name,
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
      return NextResponse.json({ error: upError?.message || "Failed to update credential" }, { status: 500 });
    }

    let deptName = "Global / None";
    if (deptId) {
      const { data: d } = await sb.from("departments").select("name").eq("id", deptId).maybeSingle();
      deptName = d?.name || "Assigned Dept";
    }

    let action = "UPDATE_USER";
    let detailMsg = `${currentUser.name} (${currentUser.role}) updated credential for ${updatedUser.name} [Dept: ${deptName}, Role: ${updatedUser.role}]`;
    if (newHash) {
      detailMsg += " (password changed)";
    }
    if (targetUser.status !== updatedUser.status) {
      action = updatedUser.status === "Active" ? "ACTIVATE_USER" : "DEACTIVATE_USER";
      detailMsg = `${currentUser.name} changed ${updatedUser.name}'s status to ${updatedUser.status}`;
    }

    await Promise.allSettled([
      logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        action,
        departmentId: deptId,
        departmentName: deptName,
        recordId: userId,
        details: detailMsg,
      }),
      sb.from("login_logs").insert({
        user_id: updatedUser.id,
        email: updatedUser.email,
        user_name: updatedUser.name,
        role: updatedUser.role,
        department_id: deptId,
        status: "CREDENTIAL_UPDATED",
        details: detailMsg,
      }),
    ]);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser || !canManageUsers(currentUser)) {
      return NextResponse.json({ error: "Access Denied: Administrator or Vice Chairman privileges required." }, { status: 403 });
    }

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const sb = getSupabaseClient();
    const { data: targetUser } = await sb.from("users").select("*").eq("id", userId).maybeSingle();
    if (!targetUser) {
      return NextResponse.json({ error: "User credential not found" }, { status: 404 });
    }

    // Safety: prevent deleting self
    if (targetUser.id === currentUser.id) {
      return NextResponse.json({ error: "You cannot delete your own logged-in account." }, { status: 400 });
    }

    // Deactivate rather than hard delete to preserve historical integrity, or hard delete if inactive
    const { error: delError } = await sb
      .from("users")
      .update({ status: "Inactive", updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }

    await logAudit({
      userId: currentUser.id,
      userName: currentUser.name,
      action: "DEACTIVATE_USER",
      departmentId: targetUser.department_id,
      recordId: userId,
      details: `${currentUser.name} (${currentUser.role}) deactivated user credential for ${targetUser.name} (${targetUser.email})`,
    });

    return NextResponse.json({ success: true, message: "User credential deactivated successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
