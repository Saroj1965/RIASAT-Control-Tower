import { NextResponse } from "next/server";
import { getSupabaseClient, logAudit } from "@/lib/db";
import { getSessionUser, canManageDepartments } from "@/lib/auth";
import { resolveDepartmentHod } from "@/lib/executive";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getSupabaseClient();
    const [
      { data: deptsData },
      { data: ovData },
      { data: wsData },
      { data: usersData },
    ] = await Promise.all([
      sb
        .from("departments")
        .select("*")
        .eq("active", true)
        .order("id", { ascending: true }),
      sb.from("department_overview").select("*"),
      sb.from("workstreams").select("department_id, status"),
      sb.from("users").select("id, name, email, role, department_id, designation"),
    ]);

    const ovMap = new Map<number, any>();
    for (const o of ovData || []) {
      ovMap.set(Number(o.department_id), o);
    }

    const hodUserMap = new Map<number, any>();
    for (const u of usersData || []) {
      if (u.department_id && !hodUserMap.has(Number(u.department_id))) {
        hodUserMap.set(Number(u.department_id), u);
      }
    }

    const statsMap: Record<
      number,
      {
        total_count: number;
        open_count: number;
        completed_count: number;
        delayed_count: number;
      }
    > = {};

    for (const w of wsData || []) {
      const dId = Number(w.department_id);
      if (!statsMap[dId]) {
        statsMap[dId] = {
          total_count: 0,
          open_count: 0,
          completed_count: 0,
          delayed_count: 0,
        };
      }
      statsMap[dId].total_count++;
      const stUpper = String(w.status || "OPEN").trim().toUpperCase();
      if (!["COMPLETED", "CLOSED"].includes(stUpper)) {
        statsMap[dId].open_count++;
      } else {
        statsMap[dId].completed_count++;
      }
      if (["DELAYED", "BLOCKED"].includes(stUpper)) {
        statsMap[dId].delayed_count++;
      }
    }

    const departments = (deptsData || []).map((d: any) => {
      const ov = ovMap.get(Number(d.id)) || {};
      const hodUser = hodUserMap.get(Number(d.id));
      const headOfDepartment = resolveDepartmentHod(d, ov, hodUser);
      const stats = statsMap[Number(d.id)] || {
        total_count: 0,
        open_count: 0,
        completed_count: 0,
        delayed_count: 0,
      };

      return {
        ...d,
        head_of_department: headOfDepartment,
        readiness_percentage: ov.readiness_percentage ?? 0,
        rag_status: ov.rag_status ?? "AMBER",
        key_focus: ov.key_focus ?? "",
        last_updated: ov.last_updated ?? null,
        updated_by: ov.updated_by ?? headOfDepartment,
        stats: {
          total: stats.total_count,
          open: stats.open_count,
          completed: stats.completed_count,
          delayed: stats.delayed_count,
        },
      };
    });

    return NextResponse.json({ departments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !canManageDepartments(user)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      code,
      head_of_department,
      readiness_percentage,
      rag_status,
      key_focus,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim();
    const cleanCode = (code ? String(code).trim() : cleanName)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const cleanHod =
      head_of_department && String(head_of_department).trim()
        ? String(head_of_department).trim()
        : "To be hired";

    const sb = getSupabaseClient();

    const { data: maxDept } = await sb
      .from("departments")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);
    const nextId =
      maxDept && maxDept.length > 0 ? Number(maxDept[0].id) + 1 : 12;

    const { data: newDept, error: insError } = await sb
      .from("departments")
      .insert({
        id: nextId,
        name: cleanName,
        code: cleanCode,
        active: true,
      })
      .select("*")
      .single();

    if (insError || !newDept) {
      return NextResponse.json(
        { error: insError?.message || "Failed to create department" },
        { status: 500 }
      );
    }

    await sb.from("department_overview").upsert(
      {
        department_id: newDept.id,
        readiness_percentage: Number(readiness_percentage) || 50,
        rag_status: rag_status || "AMBER",
        key_focus: key_focus || `${cleanName} operational directives and milestones`,
        updated_by: cleanHod,
        submission_status: "SUBMITTED",
        last_updated: new Date().toISOString(),
      },
      { onConflict: "department_id" }
    );

    // Seed unified 14 form fields for the new department
    try {
      const { data: secRow } = await sb
        .from("form_sections")
        .insert({
          department_id: newDept.id,
          section_key: "action_tracker",
          title: "Weekly Departmental Action Register & Progress Form",
          display_order: 1,
          active: true,
        })
        .select("id")
        .single();

      if (secRow) {
        const unifiedFields = [
          { field_key: "sl_no", label: "Sl.No. (assigned automatically)", field_type: "Short Text", required: true, display_order: 1 },
          { field_key: "review_meeting_date", label: "Review Meeting Date", field_type: "Date", required: true, display_order: 2 },
          { field_key: "review_frequency", label: "Review Frequency", field_type: "Dropdown", required: true, display_order: 3 },
          { field_key: "department", label: "Department", field_type: "Dropdown", required: true, display_order: 4 },
          { field_key: "ownership", label: "Action Owner", field_type: "Short Text", required: true, display_order: 5 },
          { field_key: "priority", label: "Priority", field_type: "Dropdown", required: true, display_order: 6 },
          { field_key: "deliverable", label: "Action Item / Deliverable", field_type: "Long Text", required: true, display_order: 7 },
          { field_key: "supporting_departments", label: "Support Required From", field_type: "Short Text", required: false, display_order: 8 },
          { field_key: "timeline", label: "Completion Date / Target Date", field_type: "Date", required: true, display_order: 9 },
          { field_key: "status", label: "Status", field_type: "Dropdown", required: true, display_order: 10 },
          { field_key: "next_followup_date", label: "Next Follow-up Date", field_type: "Date", required: false, display_order: 11 },
          { field_key: "vc_decision_required", label: "Vice Chairman Decision Required", field_type: "Dropdown", required: true, display_order: 12 },
          { field_key: "remarks", label: "Progress Update / Remarks (this week)", field_type: "Long Text", required: false, display_order: 13 },
          { field_key: "decision_action", label: "Action Taken (Closed / Open / In Progress)", field_type: "Long Text", required: false, display_order: 14 },
        ];
        await sb.from("form_fields").insert(
          unifiedFields.map((f) => ({
            department_id: newDept.id,
            section_id: secRow.id,
            active: true,
            ...f,
          }))
        );
      }
    } catch {
      // ignore if form seeding fails
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "CREATE_DEPARTMENT",
      departmentId: newDept.id,
      departmentName: newDept.name,
      recordId: newDept.id,
      details: `${user.name} created department "${newDept.name}" (${newDept.code}) with HOD "${cleanHod}"`,
    });

    return NextResponse.json({
      success: true,
      department: {
        ...newDept,
        head_of_department: cleanHod,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
