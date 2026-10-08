import { NextResponse } from "next/server";
import { query, logAudit } from "@/lib/db";
import { getSessionUser, canEditDepartment } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      item_id,
      department_id,
      category,
      deliverable,
      infrastructure_partnership,
      target_date,
      status,
      capex,
      revenue_pipeline,
      owner,
      risks_blockers,
      decision_action,
    } = body;

    const deptId = parseInt(department_id, 10);
    if (isNaN(deptId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    // Access control
    if (!canEditDepartment(user, deptId)) {
      return NextResponse.json(
        { error: "Access Denied: You cannot create workstreams for this department." },
        { status: 403 }
      );
    }

    if (!category || !deliverable) {
      return NextResponse.json({ error: "Category and Deliverable/Milestone are required" }, { status: 400 });
    }

    // Auto-generate Item_ID if not supplied
    let finalItemId = (item_id || "").trim();
    if (!finalItemId) {
      const countRes = await query("SELECT COUNT(*) as count FROM workstreams WHERE department_id = $1", [deptId]);
      const currentCount = parseInt(countRes.rows[0]?.count || "0", 10);
      finalItemId = `WS-${String(currentCount + 1).padStart(2, "0")}`;
    }

    // Insert workstream
    const insertRes = await query(
      `INSERT INTO workstreams (
        item_id, department_id, category, deliverable, infrastructure_partnership, 
        target_date, status, capex, revenue_pipeline, owner, 
        risks_blockers, decision_action, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        finalItemId,
        deptId,
        category.trim(),
        deliverable.trim(),
        infrastructure_partnership || "",
        target_date || "",
        status || "Not Started",
        capex || "",
        revenue_pipeline || "",
        owner || user.name,
        risks_blockers || "",
        decision_action || "",
        user.name,
      ]
    );

    const newWs = insertRes.rows[0];

    // Update department_overview timestamp
    await query(
      `UPDATE department_overview 
       SET last_updated = CURRENT_TIMESTAMP, updated_by = $1 
       WHERE department_id = $2`,
      [user.name, deptId]
    );

    // Fetch department name for log
    const dRes = await query("SELECT name FROM departments WHERE id = $1", [deptId]);
    const deptName = dRes.rows[0]?.name || "Department";

    // Audit log
    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "CREATE_WORKSTREAM",
      departmentId: deptId,
      departmentName: deptName,
      recordId: newWs.id,
      details: `${user.name} created workstream "${newWs.deliverable}" (${newWs.status}) in ${deptName}`,
    });

    return NextResponse.json({ success: true, workstream: newWs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
