import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";
import { getSessionUser, hasFullAccess } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canExport = hasFullAccess(user) || user.role === ROLES.EXECUTIVE;
    if (!canExport) {
      return NextResponse.json(
        { error: "Access Denied: Admin or Leadership privileges required to export database." },
        { status: 403 }
      );
    }

    const sb = getSupabaseClient();
    const [
      { data: depts },
      { data: overviews },
      { data: sections },
      { data: fields },
      { data: options },
      { data: formValues },
      { data: workstreams },
      { data: recruitment },
    ] = await Promise.all([
      sb.from("departments").select("*").order("id", { ascending: true }),
      sb.from("department_overview").select("*").order("department_id", { ascending: true }),
      sb.from("form_sections").select("*").order("department_id", { ascending: true }).order("display_order", { ascending: true }),
      sb.from("form_fields").select("*").order("department_id", { ascending: true }).order("display_order", { ascending: true }),
      sb.from("form_field_options").select("*").order("field_id", { ascending: true }).order("display_order", { ascending: true }),
      sb.from("department_form_values").select("*").order("department_id", { ascending: true }).order("field_id", { ascending: true }),
      sb.from("workstreams").select("*").order("department_id", { ascending: true }).order("id", { ascending: true }),
      sb.from("recruitment").select("*").order("id", { ascending: true }),
    ]);

    const backupPayload = {
      version: "1.0",
      app: "RIASAT Executive Dashboard (Supabase)",
      exported_at: new Date().toISOString(),
      exported_by: user.name,
      exported_by_email: user.email,
      counts: {
        departments: (depts || []).length,
        department_overview: (overviews || []).length,
        form_sections: (sections || []).length,
        form_fields: (fields || []).length,
        form_field_options: (options || []).length,
        department_form_values: (formValues || []).length,
        workstreams: (workstreams || []).length,
        recruitment: (recruitment || []).length,
      },
      data: {
        departments: depts || [],
        department_overview: overviews || [],
        form_sections: sections || [],
        form_fields: fields || [],
        form_field_options: options || [],
        department_form_values: formValues || [],
        workstreams: workstreams || [],
        recruitment: recruitment || [],
      },
    };

    const fileName = `RIASAT_Supabase_Backup_${new Date().toISOString().split("T")[0]}.json`;

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
