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

    // Compute safe next ID to avoid sequence desynchronization
    const nextIdRes = await query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM departments");
    const nextId = parseInt(nextIdRes.rows[0].next_id, 10);

    const insertRes = await query(
      "INSERT INTO departments (id, name, code, active) VALUES ($1, $2, $3, TRUE) RETURNING *",
      [nextId, name.trim(), cleanCode]
    );

    const newDept = insertRes.rows[0];

    // Synchronize sequence if present
    try {
      await query("SELECT setval(pg_get_serial_sequence('departments', 'id'), $1)", [nextId]);
    } catch (e) {
      try {
        await query("SELECT setval('departments_id_seq', $1)", [nextId]);
      } catch (err) {}
    }

    // Create default overview entry safely with next ID
    const ovNextIdRes = await query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM department_overview");
    const ovNextId = parseInt(ovNextIdRes.rows[0].next_id, 10);

    await query(
      "INSERT INTO department_overview (id, department_id, readiness_percentage, rag_status, key_focus, updated_by, submission_status) VALUES ($1, $2, 0, 'NOT STARTED', 'Initial Setup', $3, 'DRAFT')",
      [ovNextId, newDept.id, user.name]
    );

    try {
      await query("SELECT setval(pg_get_serial_sequence('department_overview', 'id'), $1)", [ovNextId]);
    } catch (e) {
      try {
        await query("SELECT setval('department_overview_id_seq', $1)", [ovNextId]);
      } catch (err) {}
    }

    // Seed default overview section and 3 standard initial fields for the new department
    try {
      const secNextIdRes = await query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM form_sections");
      const secNextId = parseInt(secNextIdRes.rows[0].next_id, 10);
      const secRes = await query(
        `INSERT INTO form_sections (id, department_id, section_key, title, display_order, active)
         VALUES ($1, $2, 'overview_section', 'Sector Overview & Vice Chairman Focus / Decision Required', 1, TRUE)
         RETURNING id`,
        [secNextId, newDept.id]
      );
      const sectionId = secRes.rows[0]?.id || secNextId;

      const defaultFields = [
        { key: "readiness_score", label: "Readiness Score", type: "Percentage", req: true, order: 1, help: "0-100 percentage" },
        { key: "rag_status", label: "RAG Status", type: "RAG Status", req: true, order: 2, help: "Current operational RAG status" },
        { key: "vc_focus_decision", label: "Vice Chairman Focus / Decision", type: "Long Text", req: false, order: 3, help: "Direct decisions required from Vice Chairman" },
      ];

      for (const f of defaultFields) {
        const fNextIdRes = await query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM form_fields");
        const fNextId = parseInt(fNextIdRes.rows[0].next_id, 10);
        await query(
          `INSERT INTO form_fields (id, department_id, section_id, field_key, label, field_type, required, active, display_order, help_text)
           VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8, $9)`,
          [fNextId, newDept.id, sectionId, f.key, f.label, f.type, f.req, f.order, f.help]
        );
      }
    } catch (formErr) {
      console.warn("Could not seed default form fields for new department:", formErr);
    }

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
