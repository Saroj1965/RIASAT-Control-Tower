import { NextResponse } from "next/server";
import { query, logAudit } from "@/lib/db";
import { getSessionUser, canEditDepartment } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // HR department ID is 7
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
    } = body;

    if (!position_title) {
      return NextResponse.json({ error: "Position Title is required" }, { status: 400 });
    }

    const posId = position_id || `POS-${Date.now().toString().slice(-4)}`;

    const insertRes = await query(
      `INSERT INTO recruitment (
        position_id, position_title, strategic_segment, priority, target_date, status,
        candidates_sourced, interviews, offers, ageing_days, target_ctc, budget,
        hiring_lead, next_action, vc_attention, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        posId,
        position_title.trim(),
        strategic_segment || "General",
        priority || "Medium",
        target_date || "",
        status || "Open",
        parseInt(candidates_sourced || "0", 10),
        parseInt(interviews || "0", 10),
        parseInt(offers || "0", 10),
        parseInt(ageing_days || "0", 10),
        target_ctc || "",
        budget || "",
        hiring_lead || user.name,
        next_action || "",
        Boolean(vc_attention),
        user.name,
      ]
    );

    const newRec = insertRes.rows[0];

    // Update HR overview timestamp
    await query(
      `UPDATE department_overview 
       SET last_updated = CURRENT_TIMESTAMP, updated_by = $1 
       WHERE department_id = 7`,
      [user.name]
    );

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
