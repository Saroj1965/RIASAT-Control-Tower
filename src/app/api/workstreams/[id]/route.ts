import { NextResponse } from "next/server";
import { getSupabaseClient, logAudit } from "@/lib/db";
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

    const sb = getSupabaseClient();
    const { data: ws } = await sb.from("workstreams").select("*").eq("id", wsId).maybeSingle();

    if (!ws) {
      return NextResponse.json({ error: "Workstream not found" }, { status: 404 });
    }

    const { data: dept } = await sb.from("departments").select("name, code").eq("id", ws.department_id).maybeSingle();

    return NextResponse.json({
      workstream: {
        ...ws,
        department_name: dept?.name || "",
        department_code: dept?.code || "",
      },
    });
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

    const sb = getSupabaseClient();
    const { data: existing } = await sb.from("workstreams").select("*").eq("id", wsId).maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Workstream not found" }, { status: 404 });
    }

    const isSupportingDeptUser =
      user.department_id &&
      existing.supporting_department_ids
        ?.split(",")
        .map((x: string) => x.trim())
        .includes(String(user.department_id));
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

    const targetStatus = status !== undefined ? status : existing.status;
    const isClosing = targetStatus === "CLOSED" || targetStatus === "Closed";
    const wasClosed = existing.status === "CLOSED" || existing.status === "Closed";
    const isReopening = wasClosed && !isClosing;

    let finalClosureDate = existing.closure_date;
    let finalClosureRemarks = existing.closure_remarks;
    let finalClosedBy = existing.closed_by;

    if (isClosing) {
      finalClosureDate = new Date().toISOString();
      finalClosureRemarks = closure_remarks || finalRemarks || "Closed during management review";
      finalClosedBy = user.name;
    } else if (isReopening) {
      finalClosureDate = null;
      finalClosureRemarks = null;
      finalClosedBy = null;
    }

    let history: any[] = [];
    try {
      history =
        typeof existing.action_history === "string"
          ? JSON.parse(existing.action_history || "[]")
          : existing.action_history || [];
      if (!Array.isArray(history)) history = [];
    } catch {
      history = [];
    }

    // Preserve previous remarks in history if history was empty and remarks is being updated
    const prevRemarks = String(existing.remarks || existing.risks_blockers || "").trim();
    if (history.length === 0 && prevRemarks) {
      history.push({
        timestamp: existing.updated_at || existing.review_meeting_date || existing.created_at || "2026-10-12T09:00:00.000Z",
        date: existing.updated_at || existing.review_meeting_date || existing.created_at || "2026-10-12T09:00:00.000Z",
        user: existing.updated_by || existing.owner || existing.ownership || "Department Lead",
        role: "Department Head",
        action: "INITIAL",
        status: existing.status || "OPEN",
        rag_status: existing.rag_status || "GREEN",
        remarks: prevRemarks,
      });
    }

    const historyAction = isClosing ? "CLOSED" : isReopening ? "REOPENED" : "UPDATED";
    const newRemarkText = String(finalClosureRemarks || finalRemarks || existing.remarks || "").trim();
    const targetRag = rag_status !== undefined ? rag_status : existing.rag_status;
    const targetPriority = priority !== undefined ? priority : existing.priority;
    const targetVc = vc_decision_required !== undefined ? vc_decision_required : existing.vc_decision_required;

    if (newRemarkText) {
      // Prepend latest update at the top (datewise, latest first)
      history.unshift({
        timestamp: new Date().toISOString(),
        date: new Date().toISOString(),
        user: user.name,
        role: user.role,
        action: historyAction,
        status: targetStatus,
        rag_status: targetRag,
        priority: targetPriority,
        vc_decision_required: targetVc,
        remarks: newRemarkText,
      });
    }

    const updatePayload: Record<string, any> = {
      item_id: item_id !== undefined && item_id ? item_id : existing.item_id,
      category: category !== undefined ? category : existing.category,
      deliverable: finalActionPoint !== undefined ? finalActionPoint : existing.deliverable,
      action_point: finalActionPoint !== undefined ? finalActionPoint : existing.action_point || existing.deliverable,
      infrastructure_partnership:
        infrastructure_partnership !== undefined ? infrastructure_partnership : existing.infrastructure_partnership,
      target_date: finalTimeline !== undefined ? finalTimeline : existing.target_date,
      timeline: finalTimeline !== undefined ? finalTimeline : existing.timeline || existing.target_date,
      status: status !== undefined ? status : existing.status,
      rag_status: rag_status !== undefined ? rag_status : existing.rag_status,
      capex: capex !== undefined ? capex : existing.capex,
      revenue_pipeline: revenue_pipeline !== undefined ? revenue_pipeline : existing.revenue_pipeline,
      owner: finalOwnership !== undefined ? finalOwnership : existing.owner,
      ownership: finalOwnership !== undefined ? finalOwnership : existing.ownership || existing.owner,
      risks_blockers: risks_blockers !== undefined ? risks_blockers : existing.risks_blockers,
      decision_action: finalDecisionAction !== null ? finalDecisionAction : existing.decision_action,
      remarks: finalRemarks !== undefined ? finalRemarks : existing.remarks,
      vc_decision_required: vc_decision_required !== undefined ? vc_decision_required : existing.vc_decision_required,
      supporting_departments:
        supporting_departments !== undefined ? supporting_departments : existing.supporting_departments,
      supporting_department_ids:
        supporting_department_ids !== undefined ? supporting_department_ids : existing.supporting_department_ids,
      next_followup_date: next_followup_date !== undefined ? next_followup_date : existing.next_followup_date,
      closure_date: finalClosureDate,
      closure_remarks: finalClosureRemarks,
      closed_by: finalClosedBy,
      action_history: JSON.stringify(history),
      priority: priority !== undefined ? priority : existing.priority,
      updated_at: new Date().toISOString(),
      updated_by: user.name,
      review_meeting_date:
        body.review_meeting_date !== undefined && body.review_meeting_date
          ? body.review_meeting_date
          : existing.review_meeting_date,
      review_week: body.review_week !== undefined && body.review_week ? body.review_week : existing.review_week,
      department_id: department_id !== undefined ? parseInt(department_id, 10) : existing.department_id,
    };

    const { data: updated, error: upError } = await sb
      .from("workstreams")
      .update(updatePayload)
      .eq("id", wsId)
      .select("*")
      .single();

    if (upError || !updated) {
      return NextResponse.json({ error: upError?.message || "Failed to update workstream" }, { status: 500 });
    }

    await sb
      .from("department_overview")
      .update({ last_updated: new Date().toISOString(), updated_by: user.name })
      .eq("department_id", existing.department_id);

    const { data: dRow } = await sb.from("departments").select("name").eq("id", existing.department_id).maybeSingle();
    const deptName = dRow?.name || "Department";

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

    const sb = getSupabaseClient();
    const { data: existing } = await sb.from("workstreams").select("*").eq("id", wsId).maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Workstream not found" }, { status: 404 });
    }

    if (!canEditDepartment(user, existing.department_id)) {
      return NextResponse.json({ error: "Access Denied: You cannot delete this record." }, { status: 403 });
    }

    await sb.from("workstreams").delete().eq("id", wsId);

    await sb
      .from("department_overview")
      .update({ last_updated: new Date().toISOString(), updated_by: user.name })
      .eq("department_id", existing.department_id);

    const { data: dRow } = await sb.from("departments").select("name").eq("id", existing.department_id).maybeSingle();
    const deptName = dRow?.name || "Department";

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
