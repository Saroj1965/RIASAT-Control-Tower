import { NextResponse } from "next/server";
import { query, logAudit } from "@/lib/db";
import { getSessionUser, canEditDepartment } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wsId = parseInt(params.id, 10);
    if (isNaN(wsId)) {
      return NextResponse.json({ error: "Invalid workstream ID" }, { status: 400 });
    }

    const res = await query(
      `SELECT w.*, d.name as department_name, d.code as department_code
       FROM workstreams w
       JOIN departments d ON w.department_id = d.id
       WHERE w.id = $1`,
      [wsId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Workstream not found" }, { status: 404 });
    }

    return NextResponse.json({ workstream: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
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

    // Check permissions (primary department owner, supporting department owner, or executive/admin)
    const isSupportingDeptUser = user.department_id && (
      existing.supporting_department_ids?.split(',').map((x: string) => x.trim()).includes(String(user.department_id))
    );
    const isPermitted = canEditDepartment(user, existing.department_id) || isSupportingDeptUser;
    if (!isPermitted) {
      return NextResponse.json(
        { error: "Access Denied: You cannot edit records for this department." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      item_id,
      department_id,
      category,
      deliverable,
      action_point,
      priority,
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
      supporting_departments,
      supporting_department_ids,
      next_followup_date,
      closure_remarks,
    } = body;

    const finalActionPoint = action_point !== undefined ? action_point : deliverable;
    const finalOwnership = ownership !== undefined ? ownership : owner;
    const finalTimeline = timeline !== undefined ? timeline : target_date;
    const finalRemarks = remarks !== undefined ? remarks : risks_blockers;
    const finalDecisionAction = decision_action !== undefined ? decision_action : null;

    // Handle closure and reopening states
    const targetStatus = status !== undefined ? status : existing.status;
    const isClosing = (targetStatus === "CLOSED" || targetStatus === "Closed");
    const wasClosed = (existing.status === "CLOSED" || existing.status === "Closed");
    const isReopening = wasClosed && !isClosing;

    let finalClosureDate = existing.closure_date;
    let finalClosureRemarks = existing.closure_remarks;
    let finalClosedBy = existing.closed_by;

    if (isClosing) {
      finalClosureDate = new Date();
      finalClosureRemarks = closure_remarks || finalRemarks || "Closed during management review";
      finalClosedBy = user.name;
    } else if (isReopening) {
      finalClosureDate = null;
      finalClosureRemarks = null;
      finalClosedBy = null;
    }

    // Maintain action history
    let history: any[] = [];
    try {
      history = typeof existing.action_history === "string" ? JSON.parse(existing.action_history || "[]") : (existing.action_history || []);
    } catch {
      history = [];
    }
    const historyAction = isClosing ? "CLOSED" : isReopening ? "REOPENED" : "UPDATED";
    history.unshift({
      timestamp: new Date().toISOString(),
      user: user.name,
      role: user.role,
      action: historyAction,
      status: targetStatus,
      remarks: finalClosureRemarks || finalRemarks || existing.remarks,
    });

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
        supporting_departments = COALESCE($18, supporting_departments),
        supporting_department_ids = COALESCE($19, supporting_department_ids),
        next_followup_date = COALESCE($20, next_followup_date),
        closure_date = $21,
        closure_remarks = $22,
        closed_by = $23,
        action_history = $24,
        priority = COALESCE($25, priority),
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $26,
        review_meeting_date = COALESCE($27, review_meeting_date),
        review_week = COALESCE($28, review_week),
        department_id = COALESCE($29, department_id)
      WHERE id = $30
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
        supporting_departments !== undefined ? supporting_departments : null,
        supporting_department_ids !== undefined ? supporting_department_ids : null,
        next_followup_date !== undefined ? next_followup_date : null,
        finalClosureDate,
        finalClosureRemarks,
        finalClosedBy,
        JSON.stringify(history),
        priority !== undefined ? priority : null,
        user.name,
        body.review_meeting_date !== undefined ? (body.review_meeting_date || null) : null,
        body.review_week !== undefined ? (body.review_week || null) : null,
        department_id !== undefined ? parseInt(department_id, 10) : null,
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
