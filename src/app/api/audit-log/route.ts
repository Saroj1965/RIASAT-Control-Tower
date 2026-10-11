import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    let res;
    if (user.role === ROLES.ADMIN || user.role === ROLES.EXECUTIVE) {
      res = await query(
        `SELECT a.*, d.name as department_name_full
         FROM audit_log a
         LEFT JOIN departments d ON a.department_id = d.id
         ORDER BY a.timestamp DESC
         LIMIT $1`,
        [limit]
      );
    } else {
      // Department Head sees logs related to their own department
      res = await query(
        `SELECT a.*, d.name as department_name_full
         FROM audit_log a
         LEFT JOIN departments d ON a.department_id = d.id
         WHERE a.department_id = $1 OR a.user_id = $2
         ORDER BY a.timestamp DESC
         LIMIT $3`,
        [user.department_id, user.id, limit]
      );
    }

    return NextResponse.json({ logs: res.rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
