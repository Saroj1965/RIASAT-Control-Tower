import { NextResponse } from "next/server";
import { query, logAudit } from "@/lib/db";
import { getSessionUser, hasFullAccess } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deptRes = await query(`
      SELECT d.*, 
             o.readiness_percentage, 
             o.rag_status, 
             o.key_focus, 
             o.last_updated, 
             o.updated_by
      FROM departments d
      LEFT JOIN department_overview o ON d.id = o.department_id
      WHERE d.active = TRUE
      ORDER BY d.id ASC
    `);

    // Fetch workstream stats per department
    const wsStatsRes = await query(`
      SELECT department_id,
             COUNT(*) as total_count,
             COUNT(CASE WHEN status NOT IN ('Completed', 'On Hold') THEN 1 END) as open_count,
             COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_count,
             COUNT(CASE WHEN status IN ('Delayed', 'Blocked') THEN 1 END) as delayed_count
      FROM workstreams
      GROUP BY department_id
    `);

    const statsMap: Record<number, any> = {};
    for (const row of wsStatsRes.rows) {
      statsMap[row.department_id] = row;
    }

    // HR stats
    const hrStatsRes = await query(`
      SELECT COUNT(*) as total_count,
             COUNT(CASE WHEN status NOT IN ('Joined', 'Closed') THEN 1 END) as open_count,
             COUNT(CASE WHEN status = 'Joined' THEN 1 END) as completed_count,
             COUNT(CASE WHEN priority = 'Critical' AND status NOT IN ('Joined', 'Closed') THEN 1 END) as delayed_count
      FROM recruitment
    `);
    const hrStat = hrStatsRes.rows[0];

    const departments = deptRes.rows.map((d: any) => {
      const stats = d.code === "HR_REC" ? hrStat : (statsMap[d.id] || { total_count: 0, open_count: 0, completed_count: 0, delayed_count: 0 });
      
      // Calculate if update is required (e.g. > 7 days or not updated)
      let updateRequired = false;
      if (!d.last_updated) {
        updateRequired = true;
      } else {
        const lastDate = new Date(d.last_updated).getTime();
        const diffDays = (Date.now() - lastDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) {
          updateRequired = true;
        }
      }

      return {
        ...d,
        stats: {
          total: parseInt(stats.total_count || "0", 10),
          open: parseInt(stats.open_count || "0", 10),
          completed: parseInt(stats.completed_count || "0", 10),
          delayed: parseInt(stats.delayed_count || "0", 10),
        },
        updateRequired,
      };
    });

    return NextResponse.json({ departments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !hasFullAccess(user)) {
      return NextResponse.json({ error: "Vice Chairman or Admin privileges required to create departments." }, { status: 403 });
    }

    const { name, code } = await req.json();
    if (!name || !code) {
      return NextResponse.json({ error: "Department name and unique code are required" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "_");

    const insertRes = await query(
      "INSERT INTO departments (name, code, active) VALUES ($1, $2, TRUE) RETURNING *",
      [name.trim(), cleanCode]
    );

    const newDept = insertRes.rows[0];

    // Create default overview entry
    await query(
      "INSERT INTO department_overview (department_id, readiness_percentage, rag_status, key_focus, updated_by) VALUES ($1, 0, 'NOT STARTED', 'Initial Setup', $2)",
      [newDept.id, user.name]
    );

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "CREATE_DEPARTMENT",
      departmentId: newDept.id,
      departmentName: newDept.name,
      details: `Admin created new department: ${newDept.name} (${newDept.code})`,
    });

    return NextResponse.json({ success: true, department: newDept });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
