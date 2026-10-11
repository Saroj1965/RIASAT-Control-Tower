import { NextResponse } from "next/server";
import { query, logAudit } from "@/lib/db";
import { getSessionUser, hasFullAccess, canManageForms } from "@/lib/auth";

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fieldId = parseInt(params.id, 10);
    if (isNaN(fieldId)) {
      return NextResponse.json({ error: "Invalid field ID" }, { status: 400 });
    }

    const res = await query("SELECT * FROM form_fields WHERE id = $1", [fieldId]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    return NextResponse.json({ field: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user || !canManageForms(user)) {
      return NextResponse.json({ error: "Access Denied: Form Administrator privileges required." }, { status: 403 });
    }

    const fieldId = parseInt(params.id, 10);
    if (isNaN(fieldId)) {
      return NextResponse.json({ error: "Invalid field ID" }, { status: 400 });
    }

    const body = await req.json();
    const { label, field_type, required, active, display_order, help_text } = body;

    const oldFieldRes = await query("SELECT * FROM form_fields WHERE id = $1", [fieldId]);
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
        fieldId,
      ]
    );

    const updatedField = updateRes.rows[0];

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "UPDATE_FORM_FIELD",
      departmentId: updatedField.department_id,
      recordId: fieldId,
      oldValue: JSON.stringify(oldField),
      newValue: JSON.stringify(updatedField),
      details: `${user.name} modified form field "${oldField.label}" -> "${updatedField.label}"`,
    });

    return NextResponse.json({ success: true, field: updatedField });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user || !canManageForms(user)) {
      return NextResponse.json({ error: "Access Denied: Form Administrator privileges required." }, { status: 403 });
    }

    const fieldId = parseInt(params.id, 10);
    if (isNaN(fieldId)) {
      return NextResponse.json({ error: "Invalid field ID" }, { status: 400 });
    }

    const oldFieldRes = await query("SELECT * FROM form_fields WHERE id = $1", [fieldId]);
    if (oldFieldRes.rows.length === 0) {
      return NextResponse.json({ error: "Field not found." }, { status: 404 });
    }
    const oldField = oldFieldRes.rows[0];

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

    return NextResponse.json({ success: true, message: `Form field "${oldField.label}" deleted successfully.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
