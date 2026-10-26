import { NextResponse } from "next/server";
import { getSupabaseClient, logAudit } from "@/lib/db";
import { getSessionUser, hashPassword, canManageUsers } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser || !canManageUsers(currentUser)) {
      return NextResponse.json({ error: "Access Denied: Administrator or Vice Chairman privileges required." }, { status: 403 });
    }

    const sb = getSupabaseClient();

    const [
      { data: usersRows, error: userErr },
      { data: deptsRows, error: deptErr },
      { data: loginLogs, error: logErr },
      { data: auditLogs, error: auditErr },
    ] = await Promise.all([
      sb
        .from("users")
        .select("id, name, email, mobile, designation, role, department_id, status, created_at, updated_at, last_login")
        .order("id", { ascending: true }),
      sb
        .from("departments")
        .select("id, name, code, head_of_department, display_order, active")
        .eq("active", true)
        .order("display_order"),
      sb
        .from("login_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(30),
      sb
        .from("audit_log")
        .select("*")
        .in("action", ["CREATE_USER", "UPDATE_USER", "ACTIVATE_USER", "DEACTIVATE_USER", "USER_LOGIN", "LOGIN_FAILED"])
        .order("timestamp", { ascending: false })
        .limit(30),
    ]);

    if (userErr) throw userErr;

    const deptMap = new Map<number, any>();
    for (const d of deptsRows || []) {
      deptMap.set(Number(d.id), d);
    }

    const users = (usersRows || []).map((u: any) => {
      const d = u.department_id ? deptMap.get(Number(u.department_id)) : null;
      return {
        ...u,
        department_name: d?.name || (u.department_id === null ? "Global Executive / Admin" : "Department"),
        department_code: d?.code || "GLOBAL",
        head_of_department: d?.head_of_department || "To be hired",
      };
    });

    return NextResponse.json({
      success: true,
      users,
      departments: deptsRows || [],
      loginLogs: loginLogs || [],
      auditLogs: auditLogs || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser || !canManageUsers(currentUser)) {
      return NextResponse.json({ error: "Access Denied: Administrator or Vice Chairman privileges required." }, { status: 403 });
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
      return NextResponse.json({ error: "A user with this email address already exists in Supabase." }, { status: 400 });
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
      return NextResponse.json({ error: insError?.message || "Failed to create user credential" }, { status: 500 });
    }

    let deptName = "Global / None";
    if (deptId) {
      const { data: d } = await sb.from("departments").select("name").eq("id", deptId).maybeSingle();
      deptName = d?.name || "Assigned Dept";
    }

    // Record creation in Supabase audit_log and login_logs
    await Promise.allSettled([
      logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        action: "CREATE_USER",
        departmentId: deptId,
        departmentName: deptName,
        recordId: newUser.id,
        details: `${currentUser.name} (${currentUser.role}) created new credential for ${newUser.name} (${newUser.email}) in department: ${deptName} [Role: ${role}]`,
      }),
      sb.from("login_logs").insert({
        user_id: newUser.id,
        email: newUser.email,
        user_name: newUser.name,
        role: newUser.role,
        department_id: deptId,
        status: "ACCOUNT_CREATED",
        details: `Initial credential provisioned by ${currentUser.name} (${currentUser.role}).`,
      }),
    ]);

    return NextResponse.json({ success: true, user: newUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
