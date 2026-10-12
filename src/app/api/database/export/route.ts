import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser, hasFullAccess } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Vice Chairman, Admin, or Executive Office can export
    const canExport = hasFullAccess(user) || user.role === ROLES.EXECUTIVE;
    if (!canExport) {
      return NextResponse.json({ error: "Access Denied: Admin or Leadership privileges required to export database." }, { status: 403 });
    }

    // Fetch all core tables
    const [
      deptsRes,
      overviewRes,
      sectionsRes,
      fieldsRes,
      optionsRes,
      formValuesRes,
      workstreamsRes,
      recruitmentRes,
    ] = await Promise.all([
      query("SELECT * FROM departments ORDER BY id ASC"),
      query("SELECT * FROM department_overview ORDER BY department_id ASC"),
      query("SELECT * FROM form_sections ORDER BY department_id ASC, display_order ASC"),
      query("SELECT * FROM form_fields ORDER BY department_id ASC, display_order ASC"),
      query("SELECT * FROM form_field_options ORDER BY field_id ASC, display_order ASC"),
      query("SELECT * FROM department_form_values ORDER BY department_id ASC, field_id ASC"),
      query("SELECT * FROM workstreams ORDER BY department_id ASC, id ASC"),
      query("SELECT * FROM recruitment ORDER BY id ASC"),
    ]);

    const backupPayload = {
      version: "1.0",
      app: "RIASAT Executive Dashboard",
      exported_at: new Date().toISOString(),
      exported_by: user.name,
      exported_by_email: user.email,
      counts: {
        departments: deptsRes.rows.length,
        department_overview: overviewRes.rows.length,
        form_sections: sectionsRes.rows.length,
        form_fields: fieldsRes.rows.length,
        form_field_options: optionsRes.rows.length,
        department_form_values: formValuesRes.rows.length,
        workstreams: workstreamsRes.rows.length,
        recruitment: recruitmentRes.rows.length,
      },
      data: {
        departments: deptsRes.rows,
        department_overview: overviewRes.rows,
        form_sections: sectionsRes.rows,
        form_fields: fieldsRes.rows,
        form_field_options: optionsRes.rows,
        department_form_values: formValuesRes.rows,
        workstreams: workstreamsRes.rows,
        recruitment: recruitmentRes.rows,
      },
    };

    const fileName = `RIASAT_Database_Backup_${new Date().toISOString().split("T")[0]}.json`;

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
