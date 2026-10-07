import { NextResponse } from "next/server";
import { query, logAudit } from "@/lib/db";
import { getSessionUser, hasFullAccess } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !hasFullAccess(user)) {
      return NextResponse.json({ error: "Access Denied: Admin or Vice Chairman privileges required to import database." }, { status: 403 });
    }

    const payload = await req.json();
    const data = payload.data || payload;

    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Invalid backup format: 'data' property missing or malformed." }, { status: 400 });
    }

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

    // 1. Import departments
    if (Array.isArray(data.departments)) {
      for (const d of data.departments) {
        if (!d.name || !d.code) continue;
        if (d.id) {
          await query(
            `INSERT INTO departments (id, name, code, active)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               code = EXCLUDED.code,
               active = EXCLUDED.active`,
            [d.id, d.name, d.code, d.active ?? true]
          );
        } else {
          await query(
            `INSERT INTO departments (name, code, active)
             VALUES ($1, $2, $3)
             ON CONFLICT (code) DO UPDATE SET
               name = EXCLUDED.name,
               active = EXCLUDED.active`,
            [d.name, d.code, d.active ?? true]
          );
        }
        counts.departments++;
      }
    }

    // 2. Import form_sections
    if (Array.isArray(data.form_sections)) {
      for (const s of data.form_sections) {
        if (!s.department_id || !s.section_key) continue;
        if (s.id) {
          await query(
            `INSERT INTO form_sections (id, department_id, section_key, title, display_order, active)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO UPDATE SET
               department_id = EXCLUDED.department_id,
               section_key = EXCLUDED.section_key,
               title = EXCLUDED.title,
               display_order = EXCLUDED.display_order,
               active = EXCLUDED.active`,
            [s.id, s.department_id, s.section_key, s.title || s.section_key, s.display_order || 1, s.active ?? true]
          );
        } else {
          await query(
            `INSERT INTO form_sections (department_id, section_key, title, display_order, active)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (department_id, section_key) DO UPDATE SET
               title = EXCLUDED.title,
               display_order = EXCLUDED.display_order,
               active = EXCLUDED.active`,
            [s.department_id, s.section_key, s.title || s.section_key, s.display_order || 1, s.active ?? true]
          );
        }
        counts.form_sections++;
      }
    }

    // 3. Import form_fields
    if (Array.isArray(data.form_fields)) {
      for (const f of data.form_fields) {
        if (!f.department_id || !f.field_key) continue;
        if (f.id) {
          await query(
            `INSERT INTO form_fields (id, department_id, section_id, field_key, label, field_type, required, active, display_order, help_text, default_value)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO UPDATE SET
               department_id = EXCLUDED.department_id,
               section_id = EXCLUDED.section_id,
               field_key = EXCLUDED.field_key,
               label = EXCLUDED.label,
               field_type = EXCLUDED.field_type,
               required = EXCLUDED.required,
               active = EXCLUDED.active,
               display_order = EXCLUDED.display_order,
               help_text = EXCLUDED.help_text,
               default_value = EXCLUDED.default_value`,
            [
              f.id,
              f.department_id,
              f.section_id || 1,
              f.field_key,
              f.label || f.field_key,
              f.field_type || "Short Text",
              Boolean(f.required),
              f.active ?? true,
              f.display_order || 1,
              f.help_text || "",
              f.default_value || "",
            ]
          );
        } else {
          await query(
            `INSERT INTO form_fields (department_id, section_id, field_key, label, field_type, required, active, display_order, help_text, default_value)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (department_id, field_key) DO UPDATE SET
               section_id = EXCLUDED.section_id,
               label = EXCLUDED.label,
               field_type = EXCLUDED.field_type,
               required = EXCLUDED.required,
               active = EXCLUDED.active,
               display_order = EXCLUDED.display_order,
               help_text = EXCLUDED.help_text,
               default_value = EXCLUDED.default_value`,
            [
              f.department_id,
              f.section_id || 1,
              f.field_key,
              f.label || f.field_key,
              f.field_type || "Short Text",
              Boolean(f.required),
              f.active ?? true,
              f.display_order || 1,
              f.help_text || "",
              f.default_value || "",
            ]
          );
        }
        counts.form_fields++;
      }
    }

    // 4. Import form_field_options
    if (Array.isArray(data.form_field_options)) {
      for (const opt of data.form_field_options) {
        if (!opt.field_id || !opt.label) continue;
        if (opt.id) {
          await query(
            `INSERT INTO form_field_options (id, field_id, label, value, display_order, active)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO UPDATE SET
               field_id = EXCLUDED.field_id,
               label = EXCLUDED.label,
               value = EXCLUDED.value,
               display_order = EXCLUDED.display_order,
               active = EXCLUDED.active`,
            [opt.id, opt.field_id, opt.label, opt.value || opt.label, opt.display_order || 1, opt.active ?? true]
          );
        } else {
          await query(
            `INSERT INTO form_field_options (field_id, label, value, display_order, active)
             VALUES ($1, $2, $3, $4, $5)`,
            [opt.field_id, opt.label, opt.value || opt.label, opt.display_order || 1, opt.active ?? true]
          );
        }
        counts.form_field_options++;
      }
    }

    // 5. Import department_form_values
    if (Array.isArray(data.department_form_values)) {
      for (const v of data.department_form_values) {
        if (!v.department_id || !v.field_id) continue;
        await query(
          `INSERT INTO department_form_values (department_id, field_id, text_value, number_value, status, updated_at, updated_by)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
           ON CONFLICT (department_id, field_id) DO UPDATE SET
             text_value = EXCLUDED.text_value,
             number_value = EXCLUDED.number_value,
             status = EXCLUDED.status,
             updated_at = CURRENT_TIMESTAMP,
             updated_by = EXCLUDED.updated_by`,
          [v.department_id, v.field_id, v.text_value || "", v.number_value ?? null, v.status || "SUBMITTED", v.updated_by || user.name]
        );
        counts.department_form_values++;
      }
    }

    // 6. Import department_overview
    if (Array.isArray(data.department_overview)) {
      for (const ov of data.department_overview) {
        if (!ov.department_id) continue;
        await query(
          `INSERT INTO department_overview (department_id, readiness_percentage, rag_status, key_focus, submission_status, last_updated, updated_by)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
           ON CONFLICT (department_id) DO UPDATE SET
             readiness_percentage = EXCLUDED.readiness_percentage,
             rag_status = EXCLUDED.rag_status,
             key_focus = EXCLUDED.key_focus,
             submission_status = EXCLUDED.submission_status,
             last_updated = CURRENT_TIMESTAMP,
             updated_by = EXCLUDED.updated_by`,
          [
            ov.department_id,
            ov.readiness_percentage ?? 0,
            ov.rag_status || "NOT STARTED",
            ov.key_focus || "",
            ov.submission_status || "SUBMITTED",
            ov.updated_by || user.name,
          ]
        );
        counts.department_overview++;
      }
    }

    // 7. Import workstreams
    if (Array.isArray(data.workstreams)) {
      for (const ws of data.workstreams) {
        if (!ws.department_id || !ws.deliverable) continue;
        if (ws.id) {
          await query(
            `INSERT INTO workstreams (id, department_id, category, deliverable, infrastructure_partnership, target_date, status, capex, revenue_pipeline, owner, risks_blockers, decision_action, updated_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (id) DO UPDATE SET
               department_id = EXCLUDED.department_id,
               category = EXCLUDED.category,
               deliverable = EXCLUDED.deliverable,
               infrastructure_partnership = EXCLUDED.infrastructure_partnership,
               target_date = EXCLUDED.target_date,
               status = EXCLUDED.status,
               capex = EXCLUDED.capex,
               revenue_pipeline = EXCLUDED.revenue_pipeline,
               owner = EXCLUDED.owner,
               risks_blockers = EXCLUDED.risks_blockers,
               decision_action = EXCLUDED.decision_action,
               updated_by = EXCLUDED.updated_by`,
            [
              ws.id,
              ws.department_id,
              ws.category || "General",
              ws.deliverable,
              ws.infrastructure_partnership || "",
              ws.target_date || "",
              ws.status || "Not Started",
              ws.capex || "",
              ws.revenue_pipeline || "",
              ws.owner || "",
              ws.risks_blockers || "",
              ws.decision_action || "",
              ws.updated_by || user.name,
            ]
          );
        } else {
          await query(
            `INSERT INTO workstreams (department_id, category, deliverable, infrastructure_partnership, target_date, status, capex, revenue_pipeline, owner, risks_blockers, decision_action, updated_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              ws.department_id,
              ws.category || "General",
              ws.deliverable,
              ws.infrastructure_partnership || "",
              ws.target_date || "",
              ws.status || "Not Started",
              ws.capex || "",
              ws.revenue_pipeline || "",
              ws.owner || "",
              ws.risks_blockers || "",
              ws.decision_action || "",
              user.name,
            ]
          );
        }
        counts.workstreams++;
      }
    }

    // 8. Import recruitment
    if (Array.isArray(data.recruitment)) {
      for (const r of data.recruitment) {
        if (!r.position_title) continue;
        if (r.id) {
          await query(
            `INSERT INTO recruitment (id, position_id, position_title, strategic_segment, priority, target_date, status, candidates_sourced, interviews, offers, ageing_days, target_ctc, budget, hiring_lead, next_action, vc_attention, updated_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
             ON CONFLICT (id) DO UPDATE SET
               position_id = EXCLUDED.position_id,
               position_title = EXCLUDED.position_title,
               strategic_segment = EXCLUDED.strategic_segment,
               priority = EXCLUDED.priority,
               target_date = EXCLUDED.target_date,
               status = EXCLUDED.status,
               candidates_sourced = EXCLUDED.candidates_sourced,
               interviews = EXCLUDED.interviews,
               offers = EXCLUDED.offers,
               ageing_days = EXCLUDED.ageing_days,
               target_ctc = EXCLUDED.target_ctc,
               budget = EXCLUDED.budget,
               hiring_lead = EXCLUDED.hiring_lead,
               next_action = EXCLUDED.next_action,
               vc_attention = EXCLUDED.vc_attention,
               updated_by = EXCLUDED.updated_by`,
            [
              r.id,
              r.position_id || "",
              r.position_title,
              r.strategic_segment || "Semicon",
              r.priority || "Medium",
              r.target_date || "",
              r.status || "Open",
              r.candidates_sourced ?? 0,
              r.interviews ?? 0,
              r.offers ?? 0,
              r.ageing_days ?? 0,
              r.target_ctc || "",
              r.budget || "",
              r.hiring_lead || "",
              r.next_action || "",
              Boolean(r.vc_attention),
              r.updated_by || user.name,
            ]
          );
        } else {
          await query(
            `INSERT INTO recruitment (position_id, position_title, strategic_segment, priority, target_date, status, candidates_sourced, interviews, offers, ageing_days, target_ctc, budget, hiring_lead, next_action, vc_attention, updated_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
            [
              r.position_id || "",
              r.position_title,
              r.strategic_segment || "Semicon",
              r.priority || "Medium",
              r.target_date || "",
              r.status || "Open",
              r.candidates_sourced ?? 0,
              r.interviews ?? 0,
              r.offers ?? 0,
              r.ageing_days ?? 0,
              r.target_ctc || "",
              r.budget || "",
              r.hiring_lead || "",
              r.next_action || "",
              Boolean(r.vc_attention),
              user.name,
            ]
          );
        }
        counts.recruitment++;
      }
    }

    // Safely sync primary key sequences
    const seqTables = ["departments", "form_sections", "form_fields", "form_field_options", "workstreams", "recruitment"];
    for (const t of seqTables) {
      try {
        await query(`SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE(MAX(id), 1)) FROM ${t}`);
      } catch {
        // Ignore sequence sync if not applicable
      }
    }

    const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "DATABASE_IMPORT",
      details: `${user.name} (${user.role}) imported database backup: ${totalRecords} total records processed.`,
    });

    return NextResponse.json({
      success: true,
      message: `Database imported successfully! Total ${totalRecords} records updated.`,
      counts,
    });
  } catch (err: any) {
    console.error("Database import error:", err);
    return NextResponse.json({ error: err.message || "Failed to import database" }, { status: 500 });
  }
}
