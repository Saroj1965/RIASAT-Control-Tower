import { NextResponse } from "next/server";
import { getSupabaseClient, logAudit } from "@/lib/db";
import { getSessionUser, canEditDepartment, canViewDepartment, hasFullAccess } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { calculateActionWeekStats, getCurrentReviewMeetingDate, getReviewWeekLabel } from "@/lib/action-helpers";

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
      return NextResponse.json({ error: "Access Denied: You do not have permission to view this department." }, { status: 403 });
    }

    const sb = getSupabaseClient();

    const [
      { data: department },
      { data: ovData },
      { data: allDeptsData },
      { data: allWsData },
    ] = await Promise.all([
      sb.from("departments").select("*").eq("id", deptId).eq("active", true).maybeSingle(),
      sb.from("department_overview").select("*").eq("department_id", deptId).maybeSingle(),
      sb.from("departments").select("id, name, code").eq("active", true).order("id", { ascending: true }),
      sb.from("workstreams").select("*").order("id", { ascending: true }),
    ]);

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const overview = ovData || {
      readiness_percentage: 0,
      rag_status: "NOT STARTED",
      key_focus: "",
      last_updated: null,
      updated_by: null,
    };

    const allDepartments = allDeptsData || [];
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
          primary_department_name: pd.name || department.name,
          primary_department_code: pd.code || department.code,
          is_primary: Number(w.department_id) === deptId,
        };
      })
      .sort((a: any, b: any) => {
        const aClosed = ["CLOSED", "Closed"].includes(a.status) ? 2 : 1;
        const bClosed = ["CLOSED", "Closed"].includes(b.status) ? 2 : 1;
        if (aClosed !== bClosed) return aClosed - bClosed;
        const aVc = a.vc_decision_required === "Yes" ? 1 : 2;
        const bVc = b.vc_decision_required === "Yes" ? 1 : 2;
        if (aVc !== bVc) return aVc - bVc;
        return Number(a.id) - Number(b.id);
      });

    let recruitment: any[] = [];
    if (department.code === "HR_REC" || department.code === "HR" || Number(deptId) === 7) {
      const { data: recRows } = await sb.from("recruitment").select("*").order("priority", { ascending: true }).order("id", { ascending: true });
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

    const items = filteredWs.map((row: any) => {
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
        effective_rag: stats.effective_rag,
        action_history: stats.history,
      };
    });

    const userCanEdit = canEditDepartment(user, deptId);

    return NextResponse.json({
      department,
      overview,
      items,
      workstreams: items,
      recruitment,
      allDepartments,
      nextItemId,
      currentReviewMeetingDate: currentMeetingDate,
      currentReviewWeek: currentReviewWeek,
      canEdit: userCanEdit,
      isExecutive: user.role === ROLES.EXECUTIVE,
      isAdmin: user.role === ROLES.ADMIN,
      isViceChairman: user.role === ROLES.VICE_CHAIRMAN || user.role === "Vice Chairman" || user.role === "Chairman",
      isChairman: user.role === ROLES.VICE_CHAIRMAN || user.role === "Vice Chairman" || user.role === "Chairman",
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

    if (!canEditDepartment(user, deptId)) {
      return NextResponse.json(
        { error: "Access Denied: You are not authorized to update this department." },
        { status: 403 }
      );
    }

    const sb = getSupabaseClient();
    const { data: deptRow } = await sb.from("departments").select("name").eq("id", deptId).maybeSingle();
    if (!deptRow) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }
    const deptName = deptRow.name;

    const { readiness_percentage, rag_status, key_focus } = await req.json();

    const { data: oldOv } = await sb.from("department_overview").select("*").eq("department_id", deptId).maybeSingle();
    const oldOverview = oldOv || {};

    const readiness = Math.max(0, Math.min(100, parseInt(readiness_percentage || "0", 10)));
    const rag = ["GREEN", "AMBER", "RED", "NOT STARTED"].includes(rag_status) ? rag_status : "NOT STARTED";

    const { data: updatedOverview, error: upError } = await sb
      .from("department_overview")
      .upsert(
        {
          department_id: deptId,
          readiness_percentage: readiness,
          rag_status: rag,
          key_focus: key_focus || "",
          last_updated: new Date().toISOString(),
          updated_by: user.name,
        },
        { onConflict: "department_id" }
      )
      .select("*")
      .single();

    if (upError) {
      return NextResponse.json({ error: upError.message }, { status: 500 });
    }

    await logAudit({
      userId: user.id,
      userName: user.name,
      action: "UPDATE_OVERVIEW",
      departmentId: deptId,
      departmentName: deptName,
      oldValue: JSON.stringify({
        readiness: oldOverview.readiness_percentage,
        rag: oldOverview.rag_status,
      }),
      newValue: JSON.stringify({
        readiness: updatedOverview?.readiness_percentage,
        rag: updatedOverview?.rag_status,
      }),
      details: `${user.name} (${user.role}) updated ${deptName} overview: Readiness=${readiness}%, RAG=${rag}`,
    });

    return NextResponse.json({
      success: true,
      overview: updatedOverview,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    if (!user || !hasFullAccess(user)) {
      return NextResponse.json(
        { error: "Access Denied: Vice Chairman or Admin required to delete departments." },
        { status: 403 }
      );
    }

    const deptId = parseInt(params.id, 10);
    if (isNaN(deptId)) {
      return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });
    }

    if (deptId <= 9) {
      return NextResponse.json(
        { error: "Core RIASAT strategic verticals cannot be deleted." },
        { status: 400 }
      );
    }

    const sb = getSupabaseClient();
    await sb.from("workstreams").delete().eq("department_id", deptId);
    await sb.from("department_overview").delete().eq("department_id", deptId);
    await sb.from("department_form_values").delete().eq("department_id", deptId);
    await sb.from("form_fields").delete().eq("department_id", deptId);
    await sb.from("form_sections").delete().eq("department_id", deptId);
    await sb.from("departments").delete().eq("id", deptId);

    return NextResponse.json({ success: true, message: `Department ${deptId} deleted successfully.` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
