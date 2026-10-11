import { NextResponse } from "next/server";
import { query, logAudit } from "@/lib/db";
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

    const existingRes = await query("SELECT * FROM recruitment WHERE id = $1", [recId]);
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }
    const existing = existingRes.rows[0];

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

    const finalVcReq = vc_decision_required !== undefined ? vc_decision_required : (vc_attention !== undefined ? (vc_attention ? "Yes" : "No") : undefined);
    const finalVcAttention = finalVcReq !== undefined ? finalVcReq === "Yes" : undefined;

    const updateRes = await query(
      `UPDATE recruitment SET
        position_id = COALESCE($1, position_id),
        position_title = COALESCE($2, position_title),
        strategic_segment = COALESCE($3, strategic_segment),
        priority = COALESCE($4, priority),
        target_date = COALESCE($5, target_date),
        status = COALESCE($6, status),
        candidates_sourced = COALESCE($7, candidates_sourced),
        interviews = COALESCE($8, interviews),
        offers = COALESCE($9, offers),
        ageing_days = COALESCE($10, ageing_days),
        target_ctc = COALESCE($11, target_ctc),
        budget = COALESCE($12, budget),
        hiring_lead = COALESCE($13, hiring_lead),
        next_action = COALESCE($14, next_action),
        vc_attention = COALESCE($15, vc_attention),
        candidates_shortlisted = COALESCE($16, candidates_shortlisted),
        candidates_joined = COALESCE($17, candidates_joined),
        remarks = COALESCE($18, remarks),
        rag_status = COALESCE($19, rag_status),
        vc_decision_required = COALESCE($20, vc_decision_required),
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $21
      WHERE id = $22
      RETURNING *`,
      [
        position_id !== undefined ? position_id : null,
        position_title !== undefined ? position_title : null,
        strategic_segment !== undefined ? strategic_segment : null,
        priority !== undefined ? priority : null,
        target_date !== undefined ? target_date : null,
        status !== undefined ? status : null,
        candidates_sourced !== undefined ? parseInt(candidates_sourced, 10) : null,
        interviews !== undefined ? parseInt(interviews, 10) : null,
        offers !== undefined ? parseInt(offers, 10) : null,
        ageing_days !== undefined ? parseInt(ageing_days, 10) : null,
        target_ctc !== undefined ? target_ctc : null,
        budget !== undefined ? budget : null,
        hiring_lead !== undefined ? hiring_lead : null,
        next_action !== undefined ? next_action : null,
        finalVcAttention !== undefined ? finalVcAttention : null,
        candidates_shortlisted !== undefined ? parseInt(candidates_shortlisted, 10) : null,
        candidates_joined !== undefined ? parseInt(candidates_joined, 10) : null,
        remarks !== undefined ? remarks : null,
        rag_status !== undefined ? rag_status : null,
        finalVcReq !== undefined ? finalVcReq : null,
        user.name,
        recId,
      ]
    );

    const updated = updateRes.rows[0];

    // Update HR overview timestamp
    await query(
      `UPDATE department_overview 
       SET last_updated = CURRENT_TIMESTAMP, updated_by = $1 
       WHERE department_id = 7`,
      [user.name]
    );

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

    const existingRes = await query("SELECT * FROM recruitment WHERE id = $1", [recId]);
    if (existingRes.rows.length === 0) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 });
    }
    const existing = existingRes.rows[0];

    await query("DELETE FROM recruitment WHERE id = $1", [recId]);

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
