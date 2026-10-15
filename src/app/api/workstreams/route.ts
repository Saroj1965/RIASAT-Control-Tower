import { NextResponse } from "next/server";
import { query, logAudit } from "@/lib/db";
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

    let sql = `
      SELECT w.*, d.name as department_name, d.code as department_code
      FROM workstreams w
      JOIN departments d ON w.department_id = d.id
    `;
    const params: any[] = [];

    if (deptParam) {
      const deptId = parseInt(deptParam, 10);
      sql += ` WHERE (w.department_id = $1 
               OR w.supporting_departments ILIKE '%' || (SELECT name FROM departments WHERE id = $1) || '%'
               OR w.supporting_department_ids LIKE '%' || $1::text || '%')`;
      params.push(deptId);
    }

    sql += " ORDER BY w.id ASC";

    const res = await query(sql, params);
    return NextResponse.json({ workstreams: res.rows });
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

    // Access control
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

    // Review cycle tracking
    const finalReviewMeetingDate = (review_meeting_date || "").trim() || getCurrentReviewMeetingDate();
    const finalReviewWeek = (review_week || "").trim() || getReviewWeekLabel(finalReviewMeetingDate);

    // Initial audit/action history
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

    // Auto-generate Item_ID if not supplied
    let finalItemId = (item_id || "").trim();
    if (!finalItemId) {
      try {
        const maxRes = await query("SELECT item_id FROM workstreams WHERE item_id ~ '^ACT-[0-9]+' ORDER BY id DESC LIMIT 1");
        let nextNum = 16;
        if (maxRes.rows.length > 0) {
          const match = maxRes.rows[0].item_id.match(/ACT-(\d+)/);
          if (match) nextNum = parseInt(match[1], 10) + 1;
        }
        finalItemId = `ACT-${String(nextNum).padStart(2, "0")}`;
      } catch {
        const countRes = await query("SELECT COUNT(*) as count FROM workstreams");
        finalItemId = `ACT-${String(parseInt(countRes.rows[0]?.count || "15", 10) + 1).padStart(2, "0")}`;
      }
    }

    // Insert workstream
    const insertRes = await query(
      `INSERT INTO workstreams (
        item_id, department_id, category, deliverable, infrastructure_partnership, 
        target_date, status, capex, revenue_pipeline, owner, 
        risks_blockers, decision_action, action_point, ownership, timeline,
        rag_status, remarks, vc_decision_required,
        supporting_departments, supporting_department_ids, next_followup_date, meeting_context, updated_by, priority,
        review_meeting_date, review_week, initial_target_date, action_history
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
      RETURNING *`,
      [
        finalItemId,
        deptId,
        finalCategory,
        finalActionPoint,
        infrastructure_partnership || "",
        finalTimeline,
        finalStatus,
        capex || "",
        revenue_pipeline || "",
        finalOwnership,
        risks_blockers || "",
        finalDecisionAction,
        finalActionPoint,
        finalOwnership,
        finalTimeline,
        finalRag,
        finalRemarks,
        finalVcReq,
        supporting_departments || "",
        supporting_department_ids || "",
        next_followup_date || "",
        meeting_context || `Weekly Management Review - ${finalReviewMeetingDate}`,
        user.name,
        finalPriority,
        finalReviewMeetingDate,
        finalReviewWeek,
        finalTimeline,
        JSON.stringify(initialHistory),
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
