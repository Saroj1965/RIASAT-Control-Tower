import { NextResponse } from "next/server";
import { getSupabaseClient, logAudit } from "@/lib/db";
import { getSessionUser, canEditDepartment } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Params {
  params: { id: string };
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recId = parseInt(params.id, 10);
    if (isNaN(recId)) {
      return NextResponse.json({ error: "Invalid recruitment ID" }, { status: 400 });
    }

    if (!canEditDepartment(user, 7)) {
      return NextResponse.json(
        { error: "Access Denied: Only HR Department Head and Admin can update recruitment positions." },
        { status: 403 }
      );
    }

    const sb = getSupabaseClient();
    const { data: existing } = await sb.from("recruitment").select("*").eq("id", recId).maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      position_id,
      position_title,
      strategic_segment,
      priority,
      target_date,
      status,
      candidates_sourced,
      interviews,
      offers,
      ageing_days,
      target_ctc,
      budget,
      hiring_lead,
      next_action,
      vc_attention,
      candidates_shortlisted,
      candidates_joined,
      remarks,
      rag_status,
      vc_decision_required,
    } = body;

    const finalVcReq =
      vc_decision_required !== undefined
        ? vc_decision_required
        : vc_attention !== undefined
        ? vc_attention
          ? "Yes"
          : "No"
        : undefined;
    const finalVcAttention = finalVcReq !== undefined ? finalVcReq === "Yes" : undefined;

    const updatePayload: Record<string, any> = {
      position_id: position_id !== undefined ? position_id : existing.position_id,
      position_title: position_title !== undefined ? position_title : existing.position_title,
      strategic_segment: strategic_segment !== undefined ? strategic_segment : existing.strategic_segment,
      priority: priority !== undefined ? priority : existing.priority,
      target_date: target_date !== undefined ? target_date : existing.target_date,
      status: status !== undefined ? status : existing.status,
      candidates_sourced:
        candidates_sourced !== undefined ? parseInt(candidates_sourced, 10) : existing.candidates_sourced,
      interviews: interviews !== undefined ? parseInt(interviews, 10) : existing.interviews,
      offers: offers !== undefined ? parseInt(offers, 10) : existing.offers,
      ageing_days: ageing_days !== undefined ? parseInt(ageing_days, 10) : existing.ageing_days,
      target_ctc: target_ctc !== undefined ? target_ctc : existing.target_ctc,
      budget: budget !== undefined ? budget : existing.budget,
      hiring_lead: hiring_lead !== undefined ? hiring_lead : existing.hiring_lead,
      next_action: next_action !== undefined ? next_action : existing.next_action,
      vc_attention: finalVcAttention !== undefined ? finalVcAttention : existing.vc_attention,
      candidates_shortlisted:
        candidates_shortlisted !== undefined ? parseInt(candidates_shortlisted, 10) : existing.candidates_shortlisted,
      candidates_joined:
        candidates_joined !== undefined ? parseInt(candidates_joined, 10) : existing.candidates_joined,
      remarks: remarks !== undefined ? remarks : existing.remarks,
      rag_status: rag_status !== undefined ? rag_status : existing.rag_status,
      vc_decision_required: finalVcReq !== undefined ? finalVcReq : existing.vc_decision_required,
      updated_at: new Date().toISOString(),
      updated_by: user.name,
    };

    const { data: updated, error: upError } = await sb
      .from("recruitment")
      .update(updatePayload)
      .eq("id", recId)
      .select("*")
      .single();

    if (upError || !updated) {
      return NextResponse.json({ error: upError?.message || "Failed to update position" }, { status: 500 });
    }

    await sb
      .from("department_overview")
      .update({ last_updated: new Date().toISOString(), updated_by: user.name })
      .eq("department_id", 7);

    let detailMsg = `${user.name} updated recruitment position "${updated.position_title}"`;
    if (existing.status !== updated.status) {
      detailMsg = `${user.name} updated "${updated.position_title}" status from "${existing.status}" to "${updated.status}".`;
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "UPDATE_RECRUITMENT",
      departmentId: 7,
      departmentName: "HR & Recruitment",
      recordId: recId,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(updated),
      details: detailMsg,
    });

    return NextResponse.json({ success: true, position: updated });
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

    const recId = parseInt(params.id, 10);
    if (isNaN(recId)) {
      return NextResponse.json({ error: "Invalid recruitment ID" }, { status: 400 });
    }

    if (!canEditDepartment(user, 7)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const sb = getSupabaseClient();
    const { data: existing } = await sb.from("recruitment").select("*").eq("id", recId).maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }

    await sb.from("recruitment").delete().eq("id", recId);

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "DELETE_RECRUITMENT",
      departmentId: 7,
      departmentName: "HR & Recruitment",
      recordId: recId,
      details: `${user.name} removed recruitment position "${existing.position_title}" (${existing.position_id})`,
    });

    return NextResponse.json({ success: true, message: "Position deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
