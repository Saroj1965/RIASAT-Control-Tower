import { NextResponse } from "next/server";
import { getSupabaseClient, logAudit } from "@/lib/db";
import { getSessionUser, canManageForms } from "@/lib/auth";

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

    const sb = getSupabaseClient();
    let fieldsQuery = sb
      .from("form_fields")
      .select("*")
      .order("department_id", { ascending: true })
      .order("display_order", { ascending: true })
      .order("id", { ascending: true });

    if (departmentId) {
      fieldsQuery = fieldsQuery.eq("department_id", parseInt(departmentId, 10));
    }

    const [{ data: fieldsRows }, { data: sectionsRows }, { data: deptsRows }, { data: optRows }] = await Promise.all([
      fieldsQuery,
      sb.from("form_sections").select("id, title, section_key"),
      sb.from("departments").select("id, name"),
      sb.from("form_field_options").select("*").eq("active", true).order("display_order", { ascending: true }),
    ]);

    const secMap = new Map<number, any>();
    for (const s of sectionsRows || []) {
      secMap.set(Number(s.id), s);
    }

    const deptMap = new Map<number, string>();
    for (const d of deptsRows || []) {
      deptMap.set(Number(d.id), d.name);
    }

    const optionsByField: Record<number, any[]> = {};
    for (const opt of optRows || []) {
      if (!optionsByField[opt.field_id]) optionsByField[opt.field_id] = [];
      optionsByField[opt.field_id].push(opt);
    }

    const fields = (fieldsRows || []).map((f: any) => {
      const s = secMap.get(Number(f.section_id)) || {};
      return {
        ...f,
        section_title: s.title || "",
        section_key: s.section_key || "",
        department_name: deptMap.get(Number(f.department_id)) || "",
        options: optionsByField[f.id] || [],
      };
    });

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
    const { department_id, section_id, label, field_key, field_type, required, active, display_order, help_text, options } = body;

    if (!department_id || !label) {
      return NextResponse.json({ error: "Department and field label are required." }, { status: 400 });
    }

    const sb = getSupabaseClient();
    const deptIdNum = parseInt(department_id, 10);

    let finalKey = field_key ? field_key.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "") : "";
    if (finalKey) {
      const { data: dupCheck } = await sb
        .from("form_fields")
        .select("id")
        .eq("department_id", deptIdNum)
        .eq("field_key", finalKey)
        .maybeSingle();
      if (dupCheck) {
        return NextResponse.json(
          { error: `A field with internal key '${finalKey}' already exists in this department.` },
          { status: 400 }
        );
      }
    } else {
      const rawKey = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      finalKey = `${rawKey}_${Date.now().toString(36)}`;
    }

    let targetSectionId = section_id ? parseInt(section_id, 10) : null;
    if (!targetSectionId) {
      const { data: secRow } = await sb
        .from("form_sections")
        .select("id")
        .eq("department_id", deptIdNum)
        .order("display_order", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (secRow) {
        targetSectionId = secRow.id;
      } else {
        const { data: insSec } = await sb
          .from("form_sections")
          .insert({
            department_id: deptIdNum,
            section_key: "sector_overview",
            title: "Sector Overview",
            display_order: 1,
            active: true,
          })
          .select("id")
          .single();
        targetSectionId = insSec?.id || 1;
      }
    }

    const { data: newField, error: insError } = await sb
      .from("form_fields")
      .insert({
        department_id: deptIdNum,
        section_id: targetSectionId,
        field_key: finalKey,
        label: label.trim(),
        field_type: field_type || "Short Text",
        required: Boolean(required),
        active: active !== undefined ? Boolean(active) : true,
        display_order: parseInt(display_order || "10", 10),
        help_text: help_text || "",
      })
      .select("*")
      .single();

    if (insError || !newField) {
      return NextResponse.json({ error: insError?.message || "Failed to create form field" }, { status: 500 });
    }

    if ((field_type === "Dropdown" || field_type === "Select") && options) {
      let optList: string[] = [];
      if (Array.isArray(options)) {
        optList = options.map((o: any) => (typeof o === "string" ? o.trim() : (o.value || o.label || "").trim()));
      } else if (typeof options === "string") {
        optList = options.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);
      }

      for (let i = 0; i < optList.length; i++) {
        const optVal = optList[i];
        if (optVal) {
          await sb.from("form_field_options").insert({
            field_id: newField.id,
            label: optVal,
            value: optVal,
            display_order: (i + 1) * 10,
            active: true,
          });
        }
      }
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "CREATE_FORM_FIELD",
      departmentId: deptIdNum,
      recordId: newField.id,
      details: `${user.name} added new form field "${newField.label}" [${newField.field_key}] (${newField.field_type}) to Department ID ${department_id}`,
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
    const { id, label, field_key, field_type, required, active, display_order, help_text, options } = body;

    if (!id) {
      return NextResponse.json({ error: "Field ID is required." }, { status: 400 });
    }

    const sb = getSupabaseClient();
    const { data: oldField } = await sb.from("form_fields").select("*").eq("id", id).maybeSingle();
    if (!oldField) {
      return NextResponse.json({ error: "Field not found." }, { status: 404 });
    }

    let finalKey = oldField.field_key;
    if (field_key !== undefined) {
      const sanitizedKey = field_key.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
      if (sanitizedKey && sanitizedKey !== oldField.field_key) {
        const { data: dupCheck } = await sb
          .from("form_fields")
          .select("id")
          .eq("department_id", oldField.department_id)
          .eq("field_key", sanitizedKey)
          .neq("id", id)
          .maybeSingle();
        if (dupCheck) {
          return NextResponse.json(
            { error: `Internal key '${sanitizedKey}' is already used by another field in this department.` },
            { status: 400 }
          );
        }
        finalKey = sanitizedKey;
      }
    }

    const { data: updatedField, error: upError } = await sb
      .from("form_fields")
      .update({
        label: label !== undefined ? label.trim() : oldField.label,
        field_key: finalKey,
        field_type: field_type !== undefined ? field_type : oldField.field_type,
        required: required !== undefined ? Boolean(required) : oldField.required,
        active: active !== undefined ? Boolean(active) : oldField.active,
        display_order: display_order !== undefined ? parseInt(display_order, 10) : oldField.display_order,
        help_text: help_text !== undefined ? help_text : oldField.help_text,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (upError || !updatedField) {
      return NextResponse.json({ error: upError?.message || "Failed to update field" }, { status: 500 });
    }

    if (options !== undefined) {
      let optList: string[] = [];
      if (Array.isArray(options)) {
        optList = options.map((o: any) => (typeof o === "string" ? o.trim() : (o.value || o.label || "").trim()));
      } else if (typeof options === "string") {
        optList = options.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);
      }

      await sb.from("form_field_options").delete().eq("field_id", id);
      for (let i = 0; i < optList.length; i++) {
        const optVal = optList[i];
        if (optVal) {
          await sb.from("form_field_options").insert({
            field_id: id,
            label: optVal,
            value: optVal,
            display_order: (i + 1) * 10,
            active: true,
          });
        }
      }
    }

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
    let force = searchParams.get("force") === "true";
    let retire = searchParams.get("retire") === "true";

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
        if (body?.force) force = Boolean(body.force);
        if (body?.retire) retire = Boolean(body.retire);
      } catch {
        // body may be empty
      }
    }

    const fieldId = parseInt(id || "", 10);
    if (isNaN(fieldId)) {
      return NextResponse.json({ error: "Field ID is required." }, { status: 400 });
    }

    const sb = getSupabaseClient();
    const { data: oldField } = await sb.from("form_fields").select("*").eq("id", fieldId).maybeSingle();
    if (!oldField) {
      return NextResponse.json({ error: "Field not found." }, { status: 404 });
    }

    const PROTECTED_KEYS = ["readiness_score", "rag_status", "key_focus", "sl_no", "item_id", "status", "action_item"];
    if (PROTECTED_KEYS.includes(oldField.field_key)) {
      return NextResponse.json(
        {
          error: `Field "${oldField.label}" [${oldField.field_key}] is a protected core system field essential to existing records and cannot be deleted. You can deactivate it instead.`,
        },
        { status: 400 }
      );
    }

    const { data: valRows } = await sb
      .from("department_form_values")
      .select("id, text_value")
      .eq("field_id", fieldId);
    const hasValues = (valRows || []).some((r: any) => r.text_value !== null && r.text_value !== "");

    if (retire || (hasValues && !force)) {
      await sb.from("form_fields").update({ active: false }).eq("id", fieldId);
      await logAudit({
        userId: user.id,
        userName: user.name,
        action: "RETIRE_FORM_FIELD",
        departmentId: oldField.department_id,
        recordId: fieldId,
        details: `${user.name} safely retired/deactivated form field "${oldField.label}" (${oldField.field_key}) because historical records depend on it.`,
      });

      return NextResponse.json({
        success: true,
        retired: true,
        message: `Form field "${oldField.label}" has existing historical records and has been safely deactivated/retired rather than permanently deleted.`,
      });
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
      details: `${user.name} permanently deleted form field "${oldField.label}" (${oldField.field_key}) from department ID ${oldField.department_id}`,
    });

    return NextResponse.json({
      success: true,
      message: `Form field "${oldField.label}" deleted successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
