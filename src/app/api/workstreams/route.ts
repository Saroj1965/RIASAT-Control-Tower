import { NextResponse } from "next/server";
import { getSupabaseClient, logAudit } from "@/lib/db";
import { getSessionUser, canEditDepartment } from "@/lib/auth";
import { getCurrentReviewMeetingDate, getReviewWeekLabel } from "@/lib/action-helpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const deptParam = searchParams.get("department_id");

    const sb = getSupabaseClient();
    const [{ data: wsRows }, { data: deptRows }] = await Promise.all([
      sb.from("workstreams").select("*").order("id", { ascending: true }),
      sb.from("departments").select("id, name, code"),
    ]);

    const deptMap = new Map<number, any>();
    for (const d of deptRows || []) {
      deptMap.set(Number(d.id), d);
    }

    let enriched = (wsRows || []).map((w: any) => {
      const d = deptMap.get(Number(w.department_id)) || {};
      return {
        ...w,
        department_name: d.name || "",
        department_code: d.code || "",
      };
    });

    if (deptParam) {
      const deptId = parseInt(deptParam, 10);
      const targetDept = deptMap.get(deptId);
      const targetNameLower = String(targetDept?.name || "").toLowerCase();
      enriched = enriched.filter((w: any) => {
        if (Number(w.department_id) === deptId) return true;
        const supp = String(w.supporting_departments || "").toLowerCase();
        const suppIds = String(w.supporting_department_ids || "")
          .split(",")
          .map((s) => s.trim());
        return (targetNameLower && supp.includes(targetNameLower)) || suppIds.includes(String(deptId));
      });
    }

    return NextResponse.json({ workstreams: enriched });
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
      meeting_context,
      review_meeting_date,
      review_week,
    } = body;

    const deptId = parseInt(department_id, 10);
    if (isNaN(deptId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    if (!canEditDepartment(user, deptId)) {
      return NextResponse.json(
        { error: "Access Denied: You cannot create workstreams for this department." },
        { status: 403 }
      );
    }

    const finalActionPoint = (action_point || deliverable || "").trim();
    if (!finalActionPoint) {
      return NextResponse.json({ error: "Action Point is required" }, { status: 400 });
    }

    const finalCategory = (category || "General").trim();
    const finalOwnership = (ownership || owner || user.name || "").trim();
    const finalTimeline = (timeline || target_date || "").trim();
    const finalPriority = (priority || "Medium").trim();
    const finalStatus = (status || "OPEN").trim();
    const finalRag = (rag_status || (["Delayed", "Blocked"].includes(finalStatus) ? "AMBER" : "GREEN")).trim().toUpperCase();
    const finalRemarks = (remarks || risks_blockers || "").trim();
    const finalDecisionAction = (decision_action || "").trim();
    let finalVcReq = "No";
    if (vc_decision_required === "Yes" || vc_decision_required === true) {
      finalVcReq = "Yes";
    } else if (vc_decision_required === "No" || vc_decision_required === false) {
      finalVcReq = "No";
    } else if (finalDecisionAction && finalDecisionAction.length > 0 && finalDecisionAction !== "None") {
      finalVcReq = "Yes";
    } else if (finalRemarks && (finalRemarks.toLowerCase().includes("vc approval") || finalRemarks.toLowerCase().includes("vice chairman"))) {
      finalVcReq = "Yes";
    }

    const finalReviewMeetingDate = (review_meeting_date || "").trim() || getCurrentReviewMeetingDate();
    const finalReviewWeek = (review_week || "").trim() || getReviewWeekLabel(finalReviewMeetingDate);

    const initialHistory = [
      {
        date: new Date().toISOString(),
        user: user.name,
        role: user.role,
        status: finalStatus,
        remarks: finalRemarks || "Action registered during weekly review",
        next_followup_date: next_followup_date || "",
        rag_status: finalRag,
        change_summary: `Created during ${finalReviewWeek}`,
      },
    ];

    const sb = getSupabaseClient();

    let finalItemId = (item_id || "").trim();
    if (!finalItemId) {
      const { data: allItems } = await sb.from("workstreams").select("item_id");
      const actNums = (allItems || [])
        .map((w: any) => {
          const m = String(w.item_id || "").match(/^ACT-(\d+)/);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n: number) => n > 0);
      const nextNum = actNums.length > 0 ? Math.max(...actNums) + 1 : 16;
      finalItemId = `ACT-${String(nextNum).padStart(2, "0")}`;
    }

    const { data: newWs, error: insError } = await sb
      .from("workstreams")
      .insert({
        item_id: finalItemId,
        department_id: deptId,
        category: finalCategory,
        deliverable: finalActionPoint,
        infrastructure_partnership: infrastructure_partnership || "",
        target_date: finalTimeline,
        status: finalStatus,
        capex: capex || "",
        revenue_pipeline: revenue_pipeline || "",
        owner: finalOwnership,
        risks_blockers: risks_blockers || "",
        decision_action: finalDecisionAction,
        action_point: finalActionPoint,
        ownership: finalOwnership,
        timeline: finalTimeline,
        rag_status: finalRag,
        remarks: finalRemarks,
        vc_decision_required: finalVcReq,
        supporting_departments: supporting_departments || "",
        supporting_department_ids: supporting_department_ids || "",
        next_followup_date: next_followup_date || "",
        meeting_context: meeting_context || `Weekly Management Review - ${finalReviewMeetingDate}`,
        updated_by: user.name,
        priority: finalPriority,
        review_meeting_date: finalReviewMeetingDate,
        review_week: finalReviewWeek,
        initial_target_date: finalTimeline,
        action_history: JSON.stringify(initialHistory),
      })
      .select("*")
      .single();

    if (insError || !newWs) {
      return NextResponse.json({ error: insError?.message || "Failed to create workstream" }, { status: 500 });
    }

    await sb
      .from("department_overview")
      .update({ last_updated: new Date().toISOString(), updated_by: user.name })
      .eq("department_id", deptId);

    const { data: dRow } = await sb.from("departments").select("name").eq("id", deptId).maybeSingle();
    const deptName = dRow?.name || "Department";

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
