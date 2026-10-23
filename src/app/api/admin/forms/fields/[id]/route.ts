import { NextResponse } from "next/server";
import { getSupabaseClient, logAudit } from "@/lib/db";
import { getSessionUser, canManageForms } from "@/lib/auth";

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

    const fieldId = parseInt(params.id, 10);
    if (isNaN(fieldId)) {
      return NextResponse.json({ error: "Invalid field ID" }, { status: 400 });
    }

    const sb = getSupabaseClient();
    const { data: field } = await sb.from("form_fields").select("*").eq("id", fieldId).maybeSingle();
    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    return NextResponse.json({ field });
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

    const sb = getSupabaseClient();
    const { data: oldField } = await sb.from("form_fields").select("*").eq("id", fieldId).maybeSingle();
    if (!oldField) {
      return NextResponse.json({ error: "Field not found." }, { status: 404 });
    }

    const { data: updatedField, error: upError } = await sb
      .from("form_fields")
      .update({
        label: label !== undefined ? label.trim() : oldField.label,
        field_type: field_type !== undefined ? field_type : oldField.field_type,
        required: required !== undefined ? Boolean(required) : oldField.required,
        active: active !== undefined ? Boolean(active) : oldField.active,
        display_order: display_order !== undefined ? parseInt(display_order, 10) : oldField.display_order,
        help_text: help_text !== undefined ? help_text : oldField.help_text,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fieldId)
      .select("*")
      .single();

    if (upError || !updatedField) {
      return NextResponse.json({ error: upError?.message || "Failed to update field" }, { status: 500 });
    }

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

    const sb = getSupabaseClient();
    const { data: oldField } = await sb.from("form_fields").select("*").eq("id", fieldId).maybeSingle();
    if (!oldField) {
      return NextResponse.json({ error: "Field not found." }, { status: 404 });
    }

    await sb.from("department_form_values").delete().eq("field_id", fieldId);
    await sb.from("form_field_options").delete().eq("field_id", fieldId);
    await sb.from("form_fields").delete().eq("id", fieldId);

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
