import { NextResponse } from "next/server";
import { query, logAudit } from "@/lib/db";
import { getSessionUser, hashPassword, hasFullAccess, canManageUsers } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

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

    const userRes = await query("SELECT * FROM users WHERE id = $1", [userId]);
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const targetUser = userRes.rows[0];

    const body = await req.json();
    const { name, email, mobile, designation, role, department_id, status, password } = body;

    let newHash: string | undefined = undefined;
    if (password && password.trim()) {
      newHash = await hashPassword(password.trim());
    }

    const deptId = department_id !== undefined ? (department_id ? parseInt(department_id, 10) : null) : targetUser.department_id;

    const updateRes = await query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        mobile = COALESCE($3, mobile),
        designation = COALESCE($4, designation),
        role = COALESCE($5, role),
        department_id = $6,
        status = COALESCE($7, status),
        password_hash = COALESCE($8, password_hash),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, name, email, mobile, designation, role, department_id, status, updated_at`,
      [
        name,
        email ? email.trim().toLowerCase() : undefined,
        mobile,
        designation,
        role,
        deptId,
        status,
        newHash,
        userId,
      ]
    );

    const updatedUser = updateRes.rows[0];

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
