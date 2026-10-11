import { NextResponse } from "next/server";
import { query, logAudit } from "@/lib/db";
import { getSessionUser, hasFullAccess, canManageForms } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("department_id");

    let sql = `
      SELECT f.*, s.title as section_title, s.section_key, d.name as department_name
      FROM form_fields f
      JOIN form_sections s ON f.section_id = s.id
      JOIN departments d ON f.department_id = d.id
    `;
    const params: any[] = [];

    if (departmentId) {
      sql += " WHERE f.department_id = $1";
      params.push(parseInt(departmentId, 10));
    }

    sql += " ORDER BY f.department_id ASC, f.display_order ASC, f.id ASC";

    const res = await query(sql, params);

    // Fetch options for dropdown fields
    const optRes = await query("SELECT * FROM form_field_options WHERE active = TRUE ORDER BY display_order ASC");
    const optionsByField: Record<number, any[]> = {};
    for (const opt of optRes.rows) {
      if (!optionsByField[opt.field_id]) optionsByField[opt.field_id] = [];
      optionsByField[opt.field_id].push(opt);
    }

    const fields = res.rows.map((f: any) => ({
      ...f,
      options: optionsByField[f.id] || [],
    }));

    return NextResponse.json({ fields });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !canManageForms(user)) {
      return NextResponse.json({ error: "Access Denied: Form Administrator privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { department_id, section_id, label, field_type, required, display_order, help_text } = body;

    if (!department_id || !label) {
      return NextResponse.json({ error: "Department and field label are required." }, { status: 400 });
    }

    // Auto-generate stable internal field_key from label
    const rawKey = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const field_key = `${rawKey}_${Date.now().toString(36)}`;

    // Resolve section_id if not provided
    let targetSectionId = section_id ? parseInt(section_id, 10) : null;
    if (!targetSectionId) {
      const secRes = await query(
        "SELECT id FROM form_sections WHERE department_id = $1 AND section_key = 'sector_overview'",
        [department_id]
      );
      if (secRes.rows.length > 0) {
        targetSectionId = secRes.rows[0].id;
      } else {
        const insSec = await query(
          "INSERT INTO form_sections (department_id, section_key, title, display_order) VALUES ($1, 'sector_overview', 'Sector Overview', 1) RETURNING id",
          [department_id]
        );
        targetSectionId = insSec.rows[0].id;
      }
    }

    const insRes = await query(
      `INSERT INTO form_fields (
        department_id, section_id, field_key, label, field_type, required, active, display_order, help_text
      ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8) RETURNING *`,
      [
        parseInt(department_id, 10),
        targetSectionId,
        field_key,
        label.trim(),
        field_type || "Short Text",
        Boolean(required),
        parseInt(display_order || "10", 10),
        help_text || "",
      ]
    );

    const newField = insRes.rows[0];

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "CREATE_FORM_FIELD",
      departmentId: parseInt(department_id, 10),
      recordId: newField.id,
      details: `${user.name} added new form field "${newField.label}" (${newField.field_type}) to Department ID ${department_id}`,
    });

    return NextResponse.json({ success: true, field: newField });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !canManageForms(user)) {
      return NextResponse.json({ error: "Access Denied: Form Administrator privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, label, field_type, required, active, display_order, help_text } = body;

    if (!id) {
      return NextResponse.json({ error: "Field ID is required." }, { status: 400 });
    }

    const oldFieldRes = await query("SELECT * FROM form_fields WHERE id = $1", [id]);
    if (oldFieldRes.rows.length === 0) {
      return NextResponse.json({ error: "Field not found." }, { status: 404 });
    }
    const oldField = oldFieldRes.rows[0];

    const updateRes = await query(
      `UPDATE form_fields SET
        label = COALESCE($1, label),
        field_type = COALESCE($2, field_type),
        required = COALESCE($3, required),
        active = COALESCE($4, active),
        display_order = COALESCE($5, display_order),
        help_text = COALESCE($6, help_text),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *`,
      [
        label !== undefined ? label.trim() : null,
        field_type !== undefined ? field_type : null,
        required !== undefined ? Boolean(required) : null,
        active !== undefined ? Boolean(active) : null,
        display_order !== undefined ? parseInt(display_order, 10) : null,
        help_text !== undefined ? help_text : null,
        id,
      ]
    );

    const updatedField = updateRes.rows[0];

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "UPDATE_FORM_FIELD",
      departmentId: updatedField.department_id,
      recordId: updatedField.id,
      oldValue: JSON.stringify({ label: oldField.label, active: oldField.active, required: oldField.required }),
      newValue: JSON.stringify({ label: updatedField.label, active: updatedField.active, required: updatedField.required }),
      details: `${user.name} updated form field "${oldField.label}" -> "${updatedField.label}" (Active: ${updatedField.active})`,
    });

    return NextResponse.json({ success: true, field: updatedField });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !canManageForms(user)) {
      return NextResponse.json(
        { error: "Access Denied: Form Administrator privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch (e) {
        // body may be empty
      }
    }

    const fieldId = parseInt(id || "", 10);
    if (isNaN(fieldId)) {
      return NextResponse.json({ error: "Field ID is required." }, { status: 400 });
    }

    const oldFieldRes = await query("SELECT * FROM form_fields WHERE id = $1", [fieldId]);
    if (oldFieldRes.rows.length === 0) {
      return NextResponse.json({ error: "Field not found." }, { status: 404 });
    }
    const oldField = oldFieldRes.rows[0];

    // Safely delete associated values, options and the field itself
    await query("DELETE FROM department_form_values WHERE field_id = $1", [fieldId]);
    await query("DELETE FROM form_field_options WHERE field_id = $1", [fieldId]);
    await query("DELETE FROM form_fields WHERE id = $1", [fieldId]);

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "DELETE_FORM_FIELD",
      departmentId: oldField.department_id,
      recordId: fieldId,
      details: `${user.name} deleted form field "${oldField.label}" (${oldField.field_key}) from department ID ${oldField.department_id}`,
    });

    return NextResponse.json({
      success: true,
      message: `Form field "${oldField.label}" deleted successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

