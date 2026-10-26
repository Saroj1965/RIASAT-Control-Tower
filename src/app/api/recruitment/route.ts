import { NextResponse } from "next/server";
import { getSupabaseClient, logAudit } from "@/lib/db";
import { getSessionUser, canEditDepartment } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getSupabaseClient();
    const { data: positions, error } = await sb
      .from("recruitment")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ positions: positions || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canEditDepartment(user, 7)) {
      return NextResponse.json(
        { error: "Access Denied: Only HR Department Head and Admin can manage recruitment positions." },
        { status: 403 }
      );
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

    if (!position_title) {
      return NextResponse.json({ error: "Position Title is required" }, { status: 400 });
    }

    const posId = position_id || `POS-${Date.now().toString().slice(-4)}`;
    const finalVcReq = vc_decision_required === "Yes" || vc_attention === true || vc_attention === "Yes" ? "Yes" : "No";
    const finalVcAttention = finalVcReq === "Yes";
    const finalRag = (rag_status || (priority === "Critical" ? "RED" : "GREEN")).toUpperCase();

    const sb = getSupabaseClient();
    const { data: newRec, error: insError } = await sb
      .from("recruitment")
      .insert({
        position_id: posId,
        position_title: position_title.trim(),
        strategic_segment: strategic_segment || "General",
        priority: priority || "Medium",
        target_date: target_date || "",
        status: status || "Open",
        candidates_sourced: parseInt(candidates_sourced || "0", 10),
        candidates_shortlisted: parseInt(candidates_shortlisted || "0", 10),
        interviews: parseInt(interviews || "0", 10),
        offers: parseInt(offers || "0", 10),
        candidates_joined: parseInt(candidates_joined || "0", 10),
        ageing_days: parseInt(ageing_days || "0", 10),
        target_ctc: target_ctc || "",
        budget: budget || "",
        hiring_lead: hiring_lead || user.name,
        next_action: next_action || "",
        remarks: remarks || "",
        rag_status: finalRag,
        vc_attention: finalVcAttention,
        vc_decision_required: finalVcReq,
        updated_by: user.name,
      })
      .select("*")
      .single();

    if (insError || !newRec) {
      return NextResponse.json({ error: insError?.message || "Failed to create recruitment entry" }, { status: 500 });
    }

    await sb
      .from("department_overview")
      .update({ last_updated: new Date().toISOString(), updated_by: user.name })
      .eq("department_id", 7);

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "CREATE_RECRUITMENT",
      departmentId: 7,
      departmentName: "HR & Recruitment",
      recordId: newRec.id,
      details: `${user.name} added position "${newRec.position_title}" (${newRec.position_id}) for ${newRec.strategic_segment}`,
    });

    return NextResponse.json({ success: true, position: newRec });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
