import { NextResponse } from "next/server";
import { query, logAudit } from "@/lib/db";
import { getSessionUser, canEditDepartment } from "@/lib/auth";

interface Params {
  params: { id: string };
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wsId = parseInt(params.id, 10);
    if (isNaN(wsId)) {
      return NextResponse.json({ error: "Invalid workstream ID" }, { status: 400 });
    }

    // Check existing workstream
    const existingRes = await query("SELECT * FROM workstreams WHERE id = $1", [wsId]);
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ error: "Workstream not found" }, { status: 404 });
    }
    const existing = existingRes.rows[0];

    // Check permissions
    if (!canEditDepartment(user, existing.department_id)) {
      return NextResponse.json(
        { error: "Access Denied: You cannot edit records for this department." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
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

    const updatedRes = await query(
      `UPDATE workstreams SET
        category = COALESCE($1, category),
        deliverable = COALESCE($2, deliverable),
        infrastructure_partnership = COALESCE($3, infrastructure_partnership),
        target_date = COALESCE($4, target_date),
        status = COALESCE($5, status),
        capex = COALESCE($6, capex),
        revenue_pipeline = COALESCE($7, revenue_pipeline),
        owner = COALESCE($8, owner),
        risks_blockers = COALESCE($9, risks_blockers),
        decision_action = COALESCE($10, decision_action),
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $11
      WHERE id = $12
      RETURNING *`,
      [
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
        user.name,
        wsId,
      ]
    );

    const updated = updatedRes.rows[0];

    // Update department_overview timestamp
    await query(
      `UPDATE department_overview 
       SET last_updated = CURRENT_TIMESTAMP, updated_by = $1 
       WHERE department_id = $2`,
      [user.name, existing.department_id]
    );

    const dRes = await query("SELECT name FROM departments WHERE id = $1", [existing.department_id]);
    const deptName = dRes.rows[0]?.name || "Department";

    // Format human-readable audit detail (e.g., "Semicon Department Head updated SEM-004 status from In Progress to Completed.")
    let detailMsg = `${user.name} (${user.role}) updated workstream "${updated.deliverable}" in ${deptName}`;
    if (existing.status !== updated.status) {
      detailMsg = `${user.name} updated workstream "${updated.deliverable}" status from "${existing.status}" to "${updated.status}".`;
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "UPDATE_WORKSTREAM",
      departmentId: existing.department_id,
      departmentName: deptName,
      recordId: wsId,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(updated),
      details: detailMsg,
    });

    return NextResponse.json({ success: true, workstream: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wsId = parseInt(params.id, 10);
    if (isNaN(wsId)) {
      return NextResponse.json({ error: "Invalid workstream ID" }, { status: 400 });
    }

    const existingRes = await query("SELECT * FROM workstreams WHERE id = $1", [wsId]);
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ error: "Workstream not found" }, { status: 404 });
    }
    const existing = existingRes.rows[0];

    if (!canEditDepartment(user, existing.department_id)) {
      return NextResponse.json({ error: "Access Denied: You cannot delete this record." }, { status: 403 });
    }

    await query("DELETE FROM workstreams WHERE id = $1", [wsId]);

    // Update department_overview timestamp
    await query(
      `UPDATE department_overview 
       SET last_updated = CURRENT_TIMESTAMP, updated_by = $1 
       WHERE department_id = $2`,
      [user.name, existing.department_id]
    );

    const dRes = await query("SELECT name FROM departments WHERE id = $1", [existing.department_id]);
    const deptName = dRes.rows[0]?.name || "Department";

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "DELETE_WORKSTREAM",
      departmentId: existing.department_id,
      departmentName: deptName,
      recordId: wsId,
      details: `${user.name} removed workstream "${existing.deliverable}" from ${deptName}`,
    });

    return NextResponse.json({ success: true, message: "Workstream deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
