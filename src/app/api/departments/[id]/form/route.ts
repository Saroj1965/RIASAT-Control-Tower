import { NextResponse } from "next/server";
import { getSupabaseClient, logAudit } from "@/lib/db";
import { getSessionUser, canEditDepartment, canViewDepartment } from "@/lib/auth";

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

    const deptId = parseInt(params.id, 10);
    if (isNaN(deptId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    if (!canViewDepartment(user, deptId)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const sb = getSupabaseClient();
    const [
      { data: sectionsRows },
      { data: fieldsRows },
      { data: valuesRows },
      { data: ovRow },
    ] = await Promise.all([
      sb.from("form_sections").select("*").eq("department_id", deptId).eq("active", true).order("display_order", { ascending: true }),
      sb.from("form_fields").select("*").eq("department_id", deptId).eq("active", true).order("display_order", { ascending: true }).order("id", { ascending: true }),
      sb.from("department_form_values").select("*").eq("department_id", deptId),
      sb.from("department_overview").select("*").eq("department_id", deptId).maybeSingle(),
    ]);

    const valuesMap: Record<string, { value: string; status: string; updated_at: string; updated_by: string }> = {};
    for (const v of valuesRows || []) {
      valuesMap[v.field_id] = {
        value: v.text_value || (v.number_value !== null && v.number_value !== undefined ? String(v.number_value) : ""),
        status: v.status,
        updated_at: v.updated_at,
        updated_by: v.updated_by,
      };
    }

    const overview = ovRow || {};

    return NextResponse.json({
      department_id: deptId,
      sections: sectionsRows || [],
      fields: fieldsRows || [],
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

async function handleSaveDepartmentForm(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deptId = parseInt(params.id, 10);
    if (isNaN(deptId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    const sb = getSupabaseClient();
    const { data: deptRow } = await sb.from("departments").select("name").eq("id", deptId).maybeSingle();
    if (!deptRow) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }
    const deptName = deptRow.name;

    const body = await req.json();
    const { values, fields, status, submission_status } = body;
    const rawStatus = submission_status || status;
    const submissionStatus = rawStatus === "DRAFT" ? "DRAFT" : "SUBMITTED";

    let readinessScore: number | null =
      body.readiness_percentage !== undefined
        ? parseFloat(body.readiness_percentage)
        : body.readiness_score !== undefined
        ? parseFloat(body.readiness_score)
        : null;
    let ragStatus: string | null = body.rag_status ? String(body.rag_status).toUpperCase() : null;
    let vcDecisionFocus: string | null =
      body.key_focus !== undefined
        ? String(body.key_focus)
        : body.vc_focus_decision !== undefined
        ? String(body.vc_focus_decision)
        : null;

    // Normalize both `values` (Record<fieldId, val>) and `fields` (Array<{ field_id, value }>)
    const normalizedValues: Record<string, any> = {};
    if (values && typeof values === "object" && !Array.isArray(values)) {
      Object.assign(normalizedValues, values);
    }
    if (Array.isArray(fields)) {
      for (const item of fields) {
        if (item && item.field_id !== undefined) {
          normalizedValues[String(item.field_id)] = item.value ?? "";
        }
      }
    }

    if (Object.keys(normalizedValues).length > 0) {
      const { data: deptFields } = await sb.from("form_fields").select("id, field_key, field_type").eq("department_id", deptId);
      const fieldMap = new Map<number, any>();
      for (const f of deptFields || []) {
        fieldMap.set(Number(f.id), f);
      }

      for (const [fieldIdStr, val] of Object.entries(normalizedValues)) {
        const fieldId = parseInt(fieldIdStr, 10);
        if (isNaN(fieldId)) continue;

        const stringVal = val !== null && val !== undefined ? String(val).trim() : "";
        const fInfo = fieldMap.get(fieldId);
        if (fInfo) {
          const { field_key } = fInfo;
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

        await sb.from("department_form_values").upsert(
          {
            department_id: deptId,
            field_id: fieldId,
            text_value: stringVal,
            number_value: numVal,
            status: submissionStatus,
            updated_at: new Date().toISOString(),
            updated_by: user.name,
          },
          { onConflict: "department_id,field_id" }
        );
      }
    }

    const { data: existingOv } = await sb.from("department_overview").select("*").eq("department_id", deptId).maybeSingle();
    const curr = existingOv || {};

    const finalReadiness = readinessScore !== null && !isNaN(readinessScore) ? readinessScore : (curr.readiness_percentage ?? 0);
    const finalRag = ragStatus !== null ? ragStatus : (curr.rag_status ?? "NOT STARTED");
    const finalFocus = vcDecisionFocus !== null ? vcDecisionFocus : (curr.key_focus ?? "");
    // Preserve curr.updated_by if it stores the Head of Department
    const preservedHod = curr.updated_by || user.name;

    await sb.from("department_overview").upsert(
      {
        department_id: deptId,
        readiness_percentage: finalReadiness,
        rag_status: finalRag,
        key_focus: finalFocus,
        submission_status: submissionStatus,
        last_updated: new Date().toISOString(),
        updated_by: preservedHod,
      },
      { onConflict: "department_id" }
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

export async function PUT(req: Request, ctx: Params) {
  return handleSaveDepartmentForm(req, ctx);
}

export async function POST(req: Request, ctx: Params) {
  return handleSaveDepartmentForm(req, ctx);
}
