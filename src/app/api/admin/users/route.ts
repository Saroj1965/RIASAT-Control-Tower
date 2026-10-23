import { NextResponse } from "next/server";
import { getSupabaseClient, logAudit } from "@/lib/db";
import { getSessionUser, hashPassword, canManageUsers } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || !canManageUsers(user)) {
      return NextResponse.json({ error: "Access Denied: User Administrator privileges required." }, { status: 403 });
    }

    const sb = getSupabaseClient();
    const [{ data: usersRows }, { data: deptsRows }] = await Promise.all([
      sb
        .from("users")
        .select("id, name, email, mobile, designation, role, department_id, status, created_at, updated_at, last_login")
        .order("id", { ascending: true }),
      sb.from("departments").select("id, name, code"),
    ]);

    const deptMap = new Map<number, any>();
    for (const d of deptsRows || []) {
      deptMap.set(Number(d.id), d);
    }

    const users = (usersRows || []).map((u: any) => {
      const d = u.department_id ? deptMap.get(Number(u.department_id)) : null;
      return {
        ...u,
        department_name: d?.name || null,
        department_code: d?.code || null,
      };
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser || !canManageUsers(currentUser)) {
      return NextResponse.json({ error: "Access Denied: User Administrator privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, mobile, designation, role, department_id, status, password } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Name, email, and role are required." }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const sb = getSupabaseClient();

    const { data: existing } = await sb.from("users").select("id").ilike("email", trimmedEmail).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "A user with this email address already exists." }, { status: 400 });
    }

    const userPassword = password && password.trim() ? password.trim() : "Welcome@RIASAT1";
    const passwordHash = await hashPassword(userPassword);

    const deptId = department_id ? parseInt(department_id, 10) : null;
    const userStatus = status === "Inactive" ? "Inactive" : "Active";

    const { data: newUser, error: insError } = await sb
      .from("users")
      .insert({
        name: name.trim(),
        email: trimmedEmail,
        password_hash: passwordHash,
        mobile: mobile || "",
        designation: designation || "",
        role,
        department_id: deptId,
        status: userStatus,
      })
      .select("id, name, email, mobile, designation, role, department_id, status, created_at")
      .single();

    if (insError || !newUser) {
      return NextResponse.json({ error: insError?.message || "Failed to create user" }, { status: 500 });
    }

    let deptName = "None";
    if (deptId) {
      const { data: d } = await sb.from("departments").select("name").eq("id", deptId).maybeSingle();
      deptName = d?.name || "Assigned Dept";
    }

    await logAudit({
      userId: currentUser.id,
      userName: currentUser.name,
      action: "CREATE_USER",
      departmentId: deptId,
      departmentName: deptName,
      recordId: newUser.id,
      details: `Admin created user: ${newUser.name} (${newUser.email}) with role ${newUser.role} assigned to ${deptName}`,
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
