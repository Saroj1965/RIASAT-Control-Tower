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
      item_id,
      category,
      deliverable,
      action_point,
      infrastructure_partnership,
      target_date,
      timeline,
      status,
      rag_status,
      capex,
      revenue_pipeline,
      owner,
      ownership,
      risks_blockers,
      decision_action,
      remarks,
      vc_decision_required,
    } = body;

    const finalActionPoint = action_point !== undefined ? action_point : deliverable;
    const finalOwnership = ownership !== undefined ? ownership : owner;
    const finalTimeline = timeline !== undefined ? timeline : target_date;
    const finalRemarks = remarks !== undefined ? remarks : risks_blockers;
    const finalDecisionAction = decision_action !== undefined ? decision_action : null;

    const updatedRes = await query(
      `UPDATE workstreams SET
        item_id = COALESCE($1, item_id),
        category = COALESCE($2, category),
        deliverable = COALESCE($3, deliverable),
        action_point = COALESCE($4, action_point, deliverable),
        infrastructure_partnership = COALESCE($5, infrastructure_partnership),
        target_date = COALESCE($6, target_date),
        timeline = COALESCE($7, timeline, target_date),
        status = COALESCE($8, status),
        rag_status = COALESCE($9, rag_status),
        capex = COALESCE($10, capex),
        revenue_pipeline = COALESCE($11, revenue_pipeline),
        owner = COALESCE($12, owner),
        ownership = COALESCE($13, ownership, owner),
        risks_blockers = COALESCE($14, risks_blockers),
        decision_action = COALESCE($15, decision_action),
        remarks = COALESCE($16, remarks),
        vc_decision_required = COALESCE($17, vc_decision_required),
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $18
      WHERE id = $19
      RETURNING *`,
      [
        item_id !== undefined ? (item_id || null) : null,
        category !== undefined ? category : null,
        finalActionPoint !== undefined ? finalActionPoint : null,
        finalActionPoint !== undefined ? finalActionPoint : null,
        infrastructure_partnership !== undefined ? infrastructure_partnership : null,
        finalTimeline !== undefined ? finalTimeline : null,
        finalTimeline !== undefined ? finalTimeline : null,
        status !== undefined ? status : null,
        rag_status !== undefined ? rag_status : null,
        capex !== undefined ? capex : null,
        revenue_pipeline !== undefined ? revenue_pipeline : null,
        finalOwnership !== undefined ? finalOwnership : null,
        finalOwnership !== undefined ? finalOwnership : null,
        risks_blockers !== undefined ? risks_blockers : null,
        finalDecisionAction,
        finalRemarks !== undefined ? finalRemarks : null,
        vc_decision_required !== undefined ? vc_decision_required : null,
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
