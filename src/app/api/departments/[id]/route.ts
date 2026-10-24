import { NextResponse } from "next/server";
import { getSupabaseClient, logAudit } from "@/lib/db";
import {
  getSessionUser,
  canEditDepartment,
  canViewDepartment,
  canManageDepartments,
  hasFullAccess,
} from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import {
  calculateActionWeekStats,
  getCurrentReviewMeetingDate,
  getReviewWeekLabel,
  sortActionsWithNewAndAlertsOnTop,
} from "@/lib/action-helpers";
import { resolveDepartmentHod } from "@/lib/executive";

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
      return NextResponse.json(
        { error: "Access Denied: You do not have permission to view this department." },
        { status: 403 }
      );
    }

    const sb = getSupabaseClient();

    const [
      { data: department },
      { data: ovData },
      { data: allDeptsData },
      { data: allOvData },
      { data: allWsData },
      { data: usersData },
      { data: sectionsRows },
      { data: fieldsRows },
      { data: optionsRows },
      { data: valuesRows },
    ] = await Promise.all([
      sb
        .from("departments")
        .select("*")
        .eq("id", deptId)
        .eq("active", true)
        .maybeSingle(),
      sb
        .from("department_overview")
        .select("*")
        .eq("department_id", deptId)
        .maybeSingle(),
      sb
        .from("departments")
        .select("id, name, code")
        .eq("active", true)
        .order("id", { ascending: true }),
      sb.from("department_overview").select("department_id, updated_by"),
      sb.from("workstreams").select("*").order("id", { ascending: true }),
      sb.from("users").select("id, name, email, role, department_id, designation"),
      sb
        .from("form_sections")
        .select("*")
        .eq("department_id", deptId)
        .eq("active", true)
        .order("display_order", { ascending: true }),
      sb
        .from("form_fields")
        .select("*")
        .eq("department_id", deptId)
        .eq("active", true)
        .order("display_order", { ascending: true })
        .order("id", { ascending: true }),
      sb.from("form_field_options").select("*").eq("active", true).order("display_order", { ascending: true }),
      sb.from("department_form_values").select("*").eq("department_id", deptId),
    ]);

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const hodUserMap = new Map<number, any>();
    for (const u of usersData || []) {
      if (u.department_id && !hodUserMap.has(Number(u.department_id))) {
        hodUserMap.set(Number(u.department_id), u);
      }
    }

    const allOvMap = new Map<number, any>();
    for (const o of allOvData || []) {
      allOvMap.set(Number(o.department_id), o);
    }

    const hodName = resolveDepartmentHod(
      department,
      ovData,
      hodUserMap.get(deptId)
    );

    const overview = ovData || {
      readiness_percentage: 45,
      rag_status: "AMBER",
      key_focus: "",
      last_updated: null,
      updated_by: hodName,
    };

    const allDepartments = (allDeptsData || []).map((d: any) => ({
      ...d,
      head_of_department: resolveDepartmentHod(
        d,
        allOvMap.get(Number(d.id)),
        hodUserMap.get(Number(d.id))
      ),
    }));

    const deptMap = new Map<number, any>();
    for (const d of allDepartments) {
      deptMap.set(Number(d.id), d);
    }

    const deptNameLower = String(department.name || "").toLowerCase();
    const deptCodeLower = String(department.code || "").toLowerCase();

    const filteredWs = (allWsData || [])
      .filter((w: any) => {
        if (Number(w.department_id) === deptId) return true;
        const suppText = String(w.supporting_departments || "").toLowerCase();
        const suppIds = String(w.supporting_department_ids || "")
          .split(",")
          .map((s) => s.trim());
        return (
          (deptNameLower && suppText.includes(deptNameLower)) ||
          (deptCodeLower && suppText.includes(deptCodeLower)) ||
          suppIds.includes(String(deptId))
        );
      })
      .map((w: any) => {
        const pd = deptMap.get(Number(w.department_id)) || {};
        return {
          ...w,
          department_name: pd.name || department.name,
          department_code: pd.code || department.code,
          head_of_department: pd.head_of_department || hodName,
          primary_department_name: pd.name || department.name,
          primary_department_code: pd.code || department.code,
          is_primary: Number(w.department_id) === deptId,
        };
      });

    let recruitment: any[] = [];
    if (
      department.code === "HR_REC" ||
      department.code === "HR" ||
      Number(deptId) === 7
    ) {
      const { data: recRows } = await sb
        .from("recruitment")
        .select("*")
        .order("id", { ascending: true });
      recruitment = recRows || [];
    }

    let nextItemId = "ACT-16";
    const actNumbers = (allWsData || [])
      .map((w: any) => {
        const m = String(w.item_id || "").match(/^ACT-(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n: number) => n > 0);
    if (actNumbers.length > 0) {
      const maxNum = Math.max(...actNumbers);
      nextItemId = `ACT-${String(maxNum + 1).padStart(2, "0")}`;
    }

    const currentMeetingDate = getCurrentReviewMeetingDate();
    const currentReviewWeek = getReviewWeekLabel(currentMeetingDate);

    const rawItems = filteredWs.map((row: any) => {
      const stats = calculateActionWeekStats(row);
      return {
        ...row,
        review_meeting_date: stats.review_meeting_date,
        review_week: stats.review_week,
        weeks_outstanding: stats.weeks_outstanding,
        is_carried_forward: stats.is_carried_forward,
        is_new_this_week: stats.is_new_this_week,
        is_overdue: stats.is_overdue,
        is_approaching: stats.is_approaching,
        is_red_alert: stats.is_red_alert,
        effective_rag: stats.effective_rag,
        action_history: stats.history,
        updates_list: stats.updates_list,
      };
    });

    const items = sortActionsWithNewAndAlertsOnTop(rawItems);

    // Build formStructure for Unified Department Form tab
    const valuesByFieldId = new Map<number, any>();
    for (const v of valuesRows || []) {
      valuesByFieldId.set(Number(v.field_id), v);
    }

    const optionsByFieldId = new Map<number, any[]>();
    for (const opt of optionsRows || []) {
      const fid = Number(opt.field_id);
      if (!optionsByFieldId.has(fid)) optionsByFieldId.set(fid, []);
      optionsByFieldId.get(fid)!.push(opt);
    }

    const formStructure = (sectionsRows || []).map((sec: any) => {
      const secFields = (fieldsRows || [])
        .filter((f: any) => Number(f.section_id) === Number(sec.id))
        .map((f: any) => {
          const valObj = valuesByFieldId.get(Number(f.id));
          return {
            ...f,
            text_value: valObj?.text_value ?? f.default_value ?? "",
            number_value: valObj?.number_value ?? null,
            options: optionsByFieldId.get(Number(f.id)) || [],
          };
        });
      return {
        ...sec,
        fields: secFields,
      };
    });

    return NextResponse.json({
      department: {
        ...department,
        head_of_department: hodName,
      },
      overview: {
        ...overview,
        head_of_department: hodName,
      },
      items,
      workstreams: items,
      recruitment,
      allDepartments,
      formStructure,
      user,
      nextItemId,
      currentReviewMeetingDate: currentMeetingDate,
      currentReviewWeek: currentReviewWeek,
      canEdit: true,
      isExecutive: user.role === ROLES.EXECUTIVE,
      isAdmin: user.role === ROLES.ADMIN,
      isViceChairman:
        user.role === ROLES.VICE_CHAIRMAN ||
        user.role === "Vice Chairman" ||
        user.role === "Chairman",
      isChairman:
        user.role === ROLES.VICE_CHAIRMAN ||
        user.role === "Vice Chairman" ||
        user.role === "Chairman",
      hasFullAccess: hasFullAccess(user),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
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
    const { data: deptRow } = await sb
      .from("departments")
      .select("*")
      .eq("id", deptId)
      .maybeSingle();
    if (!deptRow) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
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

    // 1. Update department name and code if provided
    let updatedDept = deptRow;
    if (
      (name !== undefined && String(name).trim()) ||
      (code !== undefined && String(code).trim())
    ) {
      const newName =
        name !== undefined && String(name).trim()
          ? String(name).trim()
          : deptRow.name;
      const newCode =
        code !== undefined && String(code).trim()
          ? String(code)
              .trim()
              .toUpperCase()
              .replace(/[^A-Z0-9]+/g, "_")
          : deptRow.code;

      const { data: dUp, error: dErr } = await sb
        .from("departments")
        .update({ name: newName, code: newCode })
        .eq("id", deptId)
        .select("*")
        .single();
      if (dErr) {
        return NextResponse.json({ error: dErr.message }, { status: 500 });
      }
      if (dUp) updatedDept = dUp;
    }

    // 2. Update department_overview (including head_of_department in updated_by)
    const { data: oldOv } = await sb
      .from("department_overview")
      .select("*")
      .eq("department_id", deptId)
      .maybeSingle();
    const oldOverview = oldOv || {};

    const readiness =
      readiness_percentage !== undefined
        ? Math.max(0, Math.min(100, parseInt(String(readiness_percentage), 10) || 0))
        : (oldOverview.readiness_percentage ?? 50);

    const rag =
      rag_status &&
      ["GREEN", "AMBER", "RED", "NOT STARTED"].includes(
        String(rag_status).toUpperCase()
      )
        ? String(rag_status).toUpperCase()
        : (oldOverview.rag_status || "AMBER");

    const focus =
      key_focus !== undefined ? String(key_focus) : (oldOverview.key_focus || "");

    const cleanHod =
      head_of_department !== undefined && String(head_of_department).trim()
        ? String(head_of_department).trim()
        : (oldOverview.updated_by || "To be hired");

    const { data: updatedOverview, error: upError } = await sb
      .from("department_overview")
      .upsert(
        {
          department_id: deptId,
          readiness_percentage: readiness,
          rag_status: rag,
          key_focus: focus,
          last_updated: new Date().toISOString(),
          updated_by: cleanHod,
        },
        { onConflict: "department_id" }
      )
      .select("*")
      .single();

    if (upError) {
      return NextResponse.json({ error: upError.message }, { status: 500 });
    }

    // 3. Also sync Head of Department name to the department's user row in `users`
    if (head_of_department !== undefined && String(head_of_department).trim()) {
      const { data: deptUsers } = await sb
        .from("users")
        .select("id")
        .eq("department_id", deptId);
      if (deptUsers && deptUsers.length > 0) {
        await sb
          .from("users")
          .update({
            name: cleanHod,
            designation: `Head - ${updatedDept.name}`,
          })
          .eq("id", deptUsers[0].id);
      }
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "UPDATE_DEPARTMENT",
      departmentId: deptId,
      departmentName: updatedDept.name,
      details: `${user.name} updated department "${updatedDept.name}" (${updatedDept.code}) — HOD: "${cleanHod}", Readiness: ${readiness}%, RAG: ${rag}`,
    });

    return NextResponse.json({
      success: true,
      department: {
        ...updatedDept,
        head_of_department: cleanHod,
      },
      overview: updatedOverview,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user || !canManageDepartments(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deptId = parseInt(params.id, 10);
    if (isNaN(deptId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    const sb = getSupabaseClient();
    const { data: deptRow } = await sb
      .from("departments")
      .select("*")
      .eq("id", deptId)
      .maybeSingle();

    if (!deptRow) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // Delete or soft-deactivate department
    const { error: delError } = await sb
      .from("departments")
      .delete()
      .eq("id", deptId);

    if (delError) {
      // Fallback to deactivating if foreign key restricts deletion
      await sb.from("departments").update({ active: false }).eq("id", deptId);
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "DELETE_DEPARTMENT",
      departmentId: deptId,
      departmentName: deptRow.name,
      recordId: deptId,
      details: `${user.name} deleted department "${deptRow.name}" (${deptRow.code})`,
    });

    return NextResponse.json({
      success: true,
      message: `Department "${deptRow.name}" removed successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
