import { NextResponse } from "next/server";
import { getSupabaseClient, logAudit } from "@/lib/db";
import { getSessionUser, hasFullAccess } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !hasFullAccess(user)) {
      return NextResponse.json(
        { error: "Access Denied: Admin or Vice Chairman privileges required to import database." },
        { status: 403 }
      );
    }

    const payload = await req.json();
    const data = payload.data || payload;

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid backup format: 'data' property missing or malformed." }, { status: 400 });
    }

    const sb = getSupabaseClient();
    const counts: Record<string, number> = {
      departments: 0,
      department_overview: 0,
      form_sections: 0,
      form_fields: 0,
      form_field_options: 0,
      department_form_values: 0,
      workstreams: 0,
      recruitment: 0,
    };

    if (Array.isArray(data.departments)) {
      for (const d of data.departments) {
        if (!d.name || !d.code) continue;
        await sb.from("departments").upsert(
          {
            ...(d.id ? { id: d.id } : {}),
            name: d.name,
            code: d.code,
            active: d.active ?? true,
          },
          { onConflict: d.id ? "id" : "code" }
        );
        counts.departments++;
      }
    }

    if (Array.isArray(data.form_sections)) {
      for (const s of data.form_sections) {
        if (!s.department_id || !s.section_key) continue;
        await sb.from("form_sections").upsert(
          {
            ...(s.id ? { id: s.id } : {}),
            department_id: s.department_id,
            section_key: s.section_key,
            title: s.title || s.section_key,
            display_order: s.display_order || 1,
            active: s.active ?? true,
          },
          { onConflict: s.id ? "id" : "department_id,section_key" }
        );
        counts.form_sections++;
      }
    }

    if (Array.isArray(data.form_fields)) {
      for (const f of data.form_fields) {
        if (!f.department_id || !f.field_key) continue;
        await sb.from("form_fields").upsert(
          {
            ...(f.id ? { id: f.id } : {}),
            department_id: f.department_id,
            section_id: f.section_id || 1,
            field_key: f.field_key,
            label: f.label || f.field_key,
            field_type: f.field_type || "Short Text",
            required: Boolean(f.required),
            active: f.active ?? true,
            display_order: f.display_order || 1,
            help_text: f.help_text || "",
            default_value: f.default_value || "",
          },
          { onConflict: f.id ? "id" : "department_id,field_key" }
        );
        counts.form_fields++;
      }
    }

    if (Array.isArray(data.form_field_options)) {
      for (const opt of data.form_field_options) {
        if (!opt.field_id || !opt.label) continue;
        await sb.from("form_field_options").upsert(
          {
            ...(opt.id ? { id: opt.id } : {}),
            field_id: opt.field_id,
            label: opt.label,
            value: opt.value || opt.label,
            display_order: opt.display_order || 1,
            active: opt.active ?? true,
          },
          { onConflict: "id" }
        );
        counts.form_field_options++;
      }
    }

    if (Array.isArray(data.department_form_values)) {
      for (const v of data.department_form_values) {
        if (!v.department_id || !v.field_id) continue;
        await sb.from("department_form_values").upsert(
          {
            department_id: v.department_id,
            field_id: v.field_id,
            text_value: v.text_value || "",
            number_value: v.number_value ?? null,
            status: v.status || "SUBMITTED",
            updated_at: new Date().toISOString(),
            updated_by: v.updated_by || user.name,
          },
          { onConflict: "department_id,field_id" }
        );
        counts.department_form_values++;
      }
    }

    if (Array.isArray(data.department_overview)) {
      for (const ov of data.department_overview) {
        if (!ov.department_id) continue;
        await sb.from("department_overview").upsert(
          {
            department_id: ov.department_id,
            readiness_percentage: ov.readiness_percentage ?? 0,
            rag_status: ov.rag_status || "NOT STARTED",
            key_focus: ov.key_focus || "",
            submission_status: ov.submission_status || "SUBMITTED",
            last_updated: new Date().toISOString(),
            updated_by: ov.updated_by || user.name,
          },
          { onConflict: "department_id" }
        );
        counts.department_overview++;
      }
    }

    if (Array.isArray(data.workstreams)) {
      for (const ws of data.workstreams) {
        if (!ws.department_id || !ws.deliverable) continue;
        await sb.from("workstreams").upsert(
          {
            ...(ws.id ? { id: ws.id } : {}),
            department_id: ws.department_id,
            category: ws.category || "General",
            deliverable: ws.deliverable,
            infrastructure_partnership: ws.infrastructure_partnership || "",
            target_date: ws.target_date || "",
            status: ws.status || "Not Started",
            capex: ws.capex || "",
            revenue_pipeline: ws.revenue_pipeline || "",
            owner: ws.owner || "",
            risks_blockers: ws.risks_blockers || "",
            decision_action: ws.decision_action || "",
            updated_by: ws.updated_by || user.name,
          },
          { onConflict: "id" }
        );
        counts.workstreams++;
      }
    }

    if (Array.isArray(data.recruitment)) {
      for (const r of data.recruitment) {
        if (!r.position_title) continue;
        await sb.from("recruitment").upsert(
          {
            ...(r.id ? { id: r.id } : {}),
            position_id: r.position_id || "",
            position_title: r.position_title,
            strategic_segment: r.strategic_segment || "Semicon",
            priority: r.priority || "Medium",
            target_date: r.target_date || "",
            status: r.status || "Open",
            candidates_sourced: r.candidates_sourced ?? 0,
            interviews: r.interviews ?? 0,
            offers: r.offers ?? 0,
            ageing_days: r.ageing_days ?? 0,
            target_ctc: r.target_ctc || "",
            budget: r.budget || "",
            hiring_lead: r.hiring_lead || "",
            next_action: r.next_action || "",
            vc_attention: Boolean(r.vc_attention),
            updated_by: r.updated_by || user.name,
          },
          { onConflict: "id" }
        );
        counts.recruitment++;
      }
    }

    const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "DATABASE_IMPORT",
      details: `${user.name} (${user.role}) imported Supabase backup: ${totalRecords} total records processed.`,
    });

    return NextResponse.json({
      success: true,
      message: `Database imported into Supabase successfully! Total ${totalRecords} records updated.`,
      counts,
    });
  } catch (err: any) {
    console.error("Database import error:", err);
    return NextResponse.json({ error: err.message || "Failed to import database" }, { status: 500 });
  }
}
