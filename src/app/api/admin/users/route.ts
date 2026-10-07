import { NextResponse } from "next/server";
import { query, logAudit } from "@/lib/db";
import { getSessionUser, hashPassword, hasFullAccess } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || !hasFullAccess(user)) {
      return NextResponse.json({ error: "Access Denied: Vice Chairman or Admin privileges required." }, { status: 403 });
    }

    const res = await query(`
      SELECT u.id, u.name, u.email, u.mobile, u.designation, u.role, u.department_id, 
             u.status, u.created_at, u.updated_at, u.last_login,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.id ASC
    `);

    return NextResponse.json({ users: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser || !hasFullAccess(currentUser)) {
      return NextResponse.json({ error: "Access Denied: Vice Chairman or Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, mobile, designation, role, department_id, status, password } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Name, email, and role are required." }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existing = await query("SELECT id FROM users WHERE LOWER(email) = $1", [trimmedEmail]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "A user with this email address already exists." }, { status: 400 });
    }

    // Default password if none provided
    const userPassword = password && password.trim() ? password.trim() : "Welcome@RIASAT1";
    const passwordHash = await hashPassword(userPassword);

    const deptId = department_id ? parseInt(department_id, 10) : null;
    const userStatus = status === "Inactive" ? "Inactive" : "Active";

    const insertRes = await query(
      `INSERT INTO users (name, email, password_hash, mobile, designation, role, department_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, email, mobile, designation, role, department_id, status, created_at`,
      [name.trim(), trimmedEmail, passwordHash, mobile || "", designation || "", role, deptId, userStatus]
    );

    const newUser = insertRes.rows[0];

    // Fetch department name for log
    let deptName = "None";
    if (deptId) {
      const d = await query("SELECT name FROM departments WHERE id = $1", [deptId]);
      deptName = d.rows[0]?.name || "Assigned Dept";
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
