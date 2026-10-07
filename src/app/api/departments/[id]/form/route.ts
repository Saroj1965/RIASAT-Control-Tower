import { NextResponse } from "next/server";
import { query, logAudit } from "@/lib/db";
import { getSessionUser, canEditDepartment, canViewDepartment } from "@/lib/auth";

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deptId = parseInt(params.id, 10);
    if (isNaN(deptId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    if (!canViewDepartment(user, deptId)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    // 1. Fetch active sections
    const sectionsRes = await query(
      "SELECT * FROM form_sections WHERE department_id = $1 AND active = TRUE ORDER BY display_order ASC",
      [deptId]
    );

    // 2. Fetch active fields
    const fieldsRes = await query(
      "SELECT * FROM form_fields WHERE department_id = $1 AND active = TRUE ORDER BY display_order ASC, id ASC",
      [deptId]
    );

    // 3. Fetch existing values
    const valuesRes = await query(
      "SELECT * FROM department_form_values WHERE department_id = $1",
      [deptId]
    );

    const valuesMap: Record<string, { value: string; status: string; updated_at: string; updated_by: string }> = {};
    for (const v of valuesRes.rows) {
      valuesMap[v.field_id] = {
        value: v.text_value || (v.number_value !== null ? String(v.number_value) : ""),
        status: v.status,
        updated_at: v.updated_at,
        updated_by: v.updated_by,
      };
    }

    // 4. Fetch department overview status
    const ovRes = await query("SELECT * FROM department_overview WHERE department_id = $1", [deptId]);
    const overview = ovRes.rows[0] || {};

    return NextResponse.json({
      department_id: deptId,
      sections: sectionsRes.rows,
      fields: fieldsRes.rows,
      values: valuesMap,
      submission_status: overview.submission_status || "SUBMITTED",
      last_updated: overview.last_updated,
      updated_by: overview.updated_by,
      canEdit: canEditDepartment(user, deptId),
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

    const deptId = parseInt(params.id, 10);
    if (isNaN(deptId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    if (!canEditDepartment(user, deptId)) {
      return NextResponse.json({ error: "Access Denied: You cannot update this department." }, { status: 403 });
    }

    const deptRes = await query("SELECT name FROM departments WHERE id = $1", [deptId]);
    if (deptRes.rows.length === 0) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }
    const deptName = deptRes.rows[0].name;

    const body = await req.json();
    const { values, status } = body; // status: 'DRAFT' or 'SUBMITTED'
    const submissionStatus = status === "DRAFT" ? "DRAFT" : "SUBMITTED";

    let readinessScore: number | null = body.readiness_percentage !== undefined ? parseFloat(body.readiness_percentage) : null;
    let ragStatus: string | null = body.rag_status ? String(body.rag_status).toUpperCase() : null;
    let vcDecisionFocus: string | null = body.key_focus !== undefined ? String(body.key_focus) : null;

    // Save dynamic field values
    if (values && typeof values === "object") {
      for (const [fieldIdStr, val] of Object.entries(values)) {
        const fieldId = parseInt(fieldIdStr, 10);
        if (isNaN(fieldId)) continue;

        const stringVal = val !== null && val !== undefined ? String(val).trim() : "";

        // Check field key to extract readiness and RAG for overview sync
        const fInfo = await query("SELECT field_key, field_type FROM form_fields WHERE id = $1", [fieldId]);
        if (fInfo.rows.length > 0) {
          const { field_key } = fInfo.rows[0];
          if (field_key === "readiness_score") {
            const num = parseFloat(stringVal);
            if (!isNaN(num)) readinessScore = Math.max(0, Math.min(100, Math.round(num)));
          } else if (field_key === "rag_status") {
            ragStatus = ["GREEN", "AMBER", "RED", "NOT STARTED"].includes(stringVal.toUpperCase())
              ? stringVal.toUpperCase()
              : "NOT STARTED";
          } else if (field_key === "vc_focus_decision" || field_key === "key_focus") {
            vcDecisionFocus = stringVal;
          }
        }

        const isNum = !isNaN(parseFloat(stringVal)) && isFinite(Number(stringVal));
        const numVal = isNum ? parseFloat(stringVal) : null;

        await query(
          `INSERT INTO department_form_values (department_id, field_id, text_value, number_value, status, updated_at, updated_by)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
           ON CONFLICT (department_id, field_id)
           DO UPDATE SET
             text_value = EXCLUDED.text_value,
             number_value = EXCLUDED.number_value,
             status = EXCLUDED.status,
             updated_at = CURRENT_TIMESTAMP,
             updated_by = EXCLUDED.updated_by`,
          [deptId, fieldId, stringVal, numVal, submissionStatus, user.name]
        );
      }
    }

    // Sync to department_overview table so Executive Tower immediately reflects it
    const existingOv = await query("SELECT * FROM department_overview WHERE department_id = $1", [deptId]);
    const curr = existingOv.rows[0] || {};

    const finalReadiness = readinessScore !== null ? readinessScore : (curr.readiness_percentage ?? 0);
    const finalRag = ragStatus !== null ? ragStatus : (curr.rag_status ?? "NOT STARTED");
    const finalFocus = vcDecisionFocus !== null ? vcDecisionFocus : (curr.key_focus ?? "");

    await query(
      `INSERT INTO department_overview (department_id, readiness_percentage, rag_status, key_focus, submission_status, last_updated, updated_by)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
       ON CONFLICT (department_id)
       DO UPDATE SET
         readiness_percentage = EXCLUDED.readiness_percentage,
         rag_status = EXCLUDED.rag_status,
         key_focus = EXCLUDED.key_focus,
         submission_status = EXCLUDED.submission_status,
         last_updated = CURRENT_TIMESTAMP,
         updated_by = EXCLUDED.updated_by`,
      [deptId, finalReadiness, finalRag, finalFocus, submissionStatus, user.name]
    );

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: submissionStatus === "DRAFT" ? "SAVE_DRAFT_FORM" : "SUBMIT_FORM",
      departmentId: deptId,
      departmentName: deptName,
      details: `${user.name} (${user.role}) saved form update for ${deptName} with status: ${submissionStatus}.`,
    });

    return NextResponse.json({
      success: true,
      status: submissionStatus,
      message: "Update saved successfully.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
