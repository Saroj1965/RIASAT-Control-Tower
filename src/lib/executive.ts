import { getSupabaseClient } from "@/lib/db";
import {
  calculateActionWeekStats,
  getCurrentReviewMeetingDate,
  getReviewWeekLabel,
  isPendingActionStatus,
  sortActionsWithNewAndAlertsOnTop,
  FormattedActionUpdate,
} from "@/lib/action-helpers";

const DEFAULT_HOD_BY_CODE: Record<string, string> = {
  SEMICON: "To be hired",
  AERO_DEFENCE: "To be hired",
  SPACE: "To be hired",
  CYBER: "To be hired",
  MEDTECH: "To be hired",
  ADV_MFG: "To be hired",
  HR_REC: "Ms. Anamika Sahay",
  COMM: "Ms. Vinila Kalive",
  STRATEGY_OPS: "Mr. Avinash Ghodgaonkar",
  STRATEGY_PROCESS: "Mr. Avinash Ghodgaonkar",
  EXEC_ADMIN: "Ms. Sarojini Mangalam",
  VICE_CHAIRMAN: "Mr. Venkatesh Valluri",
};

export function resolveDepartmentHod(
  dept: any,
  overview?: any,
  deptHeadUser?: any
): string {
  if (dept?.head_of_department && String(dept.head_of_department).trim()) {
    return String(dept.head_of_department).trim();
  }
  if (
    overview?.updated_by &&
    String(overview.updated_by).trim() &&
    !["System Administrator", "Executive Secretariat", "System Migration"].includes(
      String(overview.updated_by).trim()
    )
  ) {
    return String(overview.updated_by).trim();
  }
  if (deptHeadUser?.name && String(deptHeadUser.name).trim()) {
    return String(deptHeadUser.name).trim();
  }
  const code = String(dept?.code || "").toUpperCase();
  return DEFAULT_HOD_BY_CODE[code] || "To be hired";
}

export interface ExecutiveSummary {
  overall_readiness: number;
  avgReadiness: number;
  overall_rag: string;
  green_count: number;
  amber_count: number;
  red_count: number;
  not_started_count: number;
  total_capex: number;
  totalCapex: number;
  total_revenue_pipeline: number;
  totalRevenue: number;
  pending_decisions: number;
  critical_openings: number;
  total_actions: number;
  open_actions: number;
  urgent_actions: number;
  closed_actions: number;
  new_actions_this_week: number;
  carried_forward_actions: number;
  overdue_actions: number;
  blocked_actions: number;
  closed_this_week: number;
  current_review_week: string;
  current_review_date: string;
}

export interface DepartmentCard {
  id: number;
  name: string;
  code: string;
  head_of_department: string;
  readiness: number;
  readiness_percentage: number;
  rag: string;
  rag_status: string;
  key_focus: string;
  open_items: number;
  total_items: number;
  completed_items: number;
  in_progress_items?: number;
  blocked_items?: number;
  overdue_items?: number;
  critical_issues: number;
  capex: number;
  capex_total: number;
  revenue: number;
  revenue_total: number;
  pending_vc: number;
  submission_status: string;
  last_updated: string | null;
  updated_by: string;
  is_stale: boolean;
  workstream_stats: {
    total: number;
    open: number;
    completed: number;
    delayed: number;
  };
}

export interface AttentionItem {
  id: number;
  item_id?: string;
  department_id: number;
  department_name: string;
  department_code?: string;
  head_of_department?: string;
  category?: string;
  item: string;
  deliverable: string;
  action_point: string;
  issue: string;
  remarks: string;
  owner: string;
  ownership: string;
  target_date: string;
  timeline: string;
  status: string;
  rag_status?: string;
  priority?: string;
  decision_action?: string;
  vc_decision_required?: string;
  supporting_departments?: string;
  supporting_department_ids?: string;
  next_followup_date?: string;
  meeting_context?: string;
  capex?: string;
  revenue_pipeline?: string;
  review_meeting_date?: string;
  review_frequency?: string;
  review_week?: string;
  closure_date?: string | null;
  closure_remarks?: string;
  weeks_outstanding?: number;
  is_carried_forward?: boolean;
  is_new_this_week?: boolean;
  is_overdue?: boolean;
  is_blocked?: boolean;
  is_red_alert?: boolean;
  is_hr_item?: boolean;
  effective_rag?: "GREEN" | "AMBER" | "RED";
  action_history?: any[];
  updates_list?: FormattedActionUpdate[];
  updated_at?: string;
  updated_by?: string;
}

export interface ExecutiveDashboardData {
  summary: ExecutiveSummary;
  departments: DepartmentCard[];
  allActions: AttentionItem[];
  graphs: {
    readiness: { name: string; code: string; readiness: number; rag: string }[];
    financials: { name: string; code: string; capex: number; revenue: number }[];
    actionsDistribution: {
      name: string;
      code: string;
      primary: number;
      supporting: number;
      total: number;
    }[];
    ragDistribution: {
      label: string;
      count: number;
      color: string;
      percent: number;
    }[];
    statusBreakdown: { [key: string]: number };
  };
  management_attention: AttentionItem[];
}

export async function getExecutiveSummaryData(): Promise<ExecutiveDashboardData> {
  const sb = getSupabaseClient();

  const [
    { data: deptsData },
    { data: overviewsData },
    { data: wsData },
    { data: recData },
    { data: usersData },
  ] = await Promise.all([
    sb
      .from("departments")
      .select("*")
      .eq("active", true)
      .order("id", { ascending: true }),
    sb.from("department_overview").select("*"),
    sb.from("workstreams").select("*").order("id", { ascending: true }),
    sb.from("recruitment").select("*").order("id", { ascending: true }),
    sb.from("users").select("id, name, email, role, department_id, designation"),
  ]);

  const rawDepts = deptsData || [];
  const overviewsMap = new Map<number, any>();
  for (const ov of overviewsData || []) {
    overviewsMap.set(Number(ov.department_id), ov);
  }

  const deptHeadByDeptId = new Map<number, any>();
  for (const u of usersData || []) {
    if (u.department_id && !deptHeadByDeptId.has(Number(u.department_id))) {
      deptHeadByDeptId.set(Number(u.department_id), u);
    }
  }

  const deptRows = rawDepts.map((d: any) => {
    const ov = overviewsMap.get(Number(d.id)) || {};
    const hodUser = deptHeadByDeptId.get(Number(d.id));
    const hodName = resolveDepartmentHod(d, ov, hodUser);
    return {
      id: d.id,
      name: d.name,
      code: d.code,
      head_of_department: hodName,
      readiness_percentage: ov.readiness_percentage ?? 0,
      rag_status: ov.rag_status || "AMBER",
      key_focus: ov.key_focus || "",
      last_updated: ov.last_updated || null,
      updated_by: ov.updated_by || hodName,
      submission_status: ov.submission_status || "SUBMITTED",
    };
  });

  const deptById = new Map<number, any>();
  for (const d of deptRows) {
    deptById.set(Number(d.id), d);
  }

  const allWsRows = wsData || [];
  const allRecRows = recData || [];

  const parseAmount = (val: string | null | undefined): number => {
    if (!val) return 0;
    const cleaned = String(val).replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const deptStatsMap: Record<
    number,
    {
      total: number;
      open: number;
      completed: number;
      delayed: number;
      blocked: number;
      on_track: number;
      in_progress: number;
      on_hold: number;
      overdue: number;
      carried_forward: number;
      new_this_week: number;
      capex: number;
      revenue: number;
      pending_vc: number;
    }
  > = {};

  let totalGlobalCapex = 0;
  let totalGlobalRevenue = 0;
  let newActionsThisWeek = 0;
  let carriedForwardActions = 0;
  let overdueActions = 0;
  let blockedActions = 0;
  let closedThisWeek = 0;
  let totalActions = 0;
  let openActions = 0;
  let urgentActions = 0;
  let closedActions = 0;

  const globalStatusCounts: Record<string, number> = {
    Open: 0,
    "In Progress": 0,
    "On Track": 0,
    "On Hold": 0,
    Delayed: 0,
    Blocked: 0,
    Completed: 0,
    Closed: 0,
  };

  const enrichedAllWs: AttentionItem[] = allWsRows.map((ws: any) => {
    const dId = Number(ws.department_id);
    if (!deptStatsMap[dId]) {
      deptStatsMap[dId] = {
        total: 0,
        open: 0,
        completed: 0,
        delayed: 0,
        blocked: 0,
        on_track: 0,
        in_progress: 0,
        on_hold: 0,
        overdue: 0,
        carried_forward: 0,
        new_this_week: 0,
        capex: 0,
        revenue: 0,
        pending_vc: 0,
      };
    }

    const weekStats = calculateActionWeekStats(ws);
    const st = (ws.status || "Open").trim();
    const stUpper = st.toUpperCase();
    const isClosed = weekStats.is_closed;

    deptStatsMap[dId].total++;
    totalActions++;

    if (isClosed) {
      deptStatsMap[dId].completed++;
      closedActions++;
      if (ws.closure_date) {
        const closeTime = new Date(ws.closure_date).getTime();
        const diffDays = (Date.now() - closeTime) / (1000 * 60 * 60 * 24);
        if (diffDays <= 7) closedThisWeek++;
      }
    } else {
      deptStatsMap[dId].open++;
      openActions++;

      if (weekStats.is_new_this_week) {
        deptStatsMap[dId].new_this_week++;
        newActionsThisWeek++;
      }
      if (weekStats.is_carried_forward) {
        deptStatsMap[dId].carried_forward++;
        carriedForwardActions++;
      }
      if (weekStats.is_overdue) {
        deptStatsMap[dId].overdue = (deptStatsMap[dId].overdue || 0) + 1;
        overdueActions++;
      }
      if (weekStats.is_blocked) {
        deptStatsMap[dId].blocked++;
        blockedActions++;
      }

      const timeline = (ws.timeline || ws.target_date || "").toLowerCase();
      if (
        timeline.includes("urgent") ||
        timeline.includes("immediate") ||
        stUpper === "DELAYED" ||
        stUpper === "BLOCKED" ||
        weekStats.is_overdue
      ) {
        urgentActions++;
      }
    }

    if (stUpper === "DELAYED") deptStatsMap[dId].delayed++;
    if (stUpper === "ON TRACK") deptStatsMap[dId].on_track++;
    if (stUpper === "IN PROGRESS" || stUpper === "ON TRACK")
      deptStatsMap[dId].in_progress++;
    if (stUpper === "ON HOLD") deptStatsMap[dId].on_hold++;

    if (stUpper === "OPEN" || stUpper === "NOT STARTED") {
      globalStatusCounts["Open"]++;
    } else if (stUpper === "IN PROGRESS") {
      globalStatusCounts["In Progress"]++;
    } else if (stUpper === "ON TRACK") {
      globalStatusCounts["On Track"]++;
    } else if (stUpper === "ON HOLD") {
      globalStatusCounts["On Hold"]++;
    } else if (stUpper === "DELAYED") {
      globalStatusCounts["Delayed"]++;
    } else if (stUpper === "BLOCKED") {
      globalStatusCounts["Blocked"]++;
    } else if (stUpper === "CLOSED" || stUpper === "COMPLETED" || stUpper === "JOINED") {
      globalStatusCounts["Completed"]++;
      globalStatusCounts["Closed"]++;
    } else {
      globalStatusCounts["Open"]++;
    }

    const c = parseAmount(ws.capex);
    const r = parseAmount(ws.revenue_pipeline);
    deptStatsMap[dId].capex += c;
    deptStatsMap[dId].revenue += r;
    totalGlobalCapex += c;
    totalGlobalRevenue += r;

    const isVcReq =
      ws.vc_decision_required === "Yes" ||
      (!ws.vc_decision_required &&
        ws.decision_action &&
        ws.decision_action.trim().length > 0 &&
        ws.decision_action.trim() !== "None");
    if (isVcReq && !isClosed) {
      deptStatsMap[dId].pending_vc++;
    }

    const deptObj = deptById.get(dId);
    const deptName = deptObj?.name || "Department";
    const deptCode = deptObj?.code || "";
    const deptHod = deptObj?.head_of_department || "To be hired";
    const actionText = ws.action_point || ws.deliverable || "";
    const ownerText = ws.ownership || ws.owner || deptHod;
    const targetText = ws.timeline || ws.target_date || "Immediate";
    const remarksText = ws.remarks || ws.decision_action || ws.risks_blockers || "";

    return {
      id: ws.id,
      item_id: ws.item_id || `ACT-${String(ws.id).padStart(2, "0")}`,
      department_id: dId,
      department_name: deptName,
      department_code: deptCode,
      head_of_department: deptHod,
      category: ws.category || "Operational Directive",
      item: actionText,
      deliverable: actionText,
      action_point: actionText,
      issue: remarksText,
      remarks: remarksText,
      owner: ownerText,
      ownership: ownerText,
      target_date: targetText,
      timeline: targetText,
      status: ws.status || "Open",
      rag_status: weekStats.effective_rag,
      priority: ws.priority || "Medium",
      decision_action: ws.decision_action || ws.remarks || "",
      vc_decision_required: isVcReq ? "Yes" : "No",
      supporting_departments: ws.supporting_departments || "",
      supporting_department_ids: ws.supporting_department_ids || "",
      next_followup_date: ws.next_followup_date || "",
      meeting_context: ws.meeting_context || "",
      capex: ws.capex || "₹ 0.0 Cr",
      revenue_pipeline: ws.revenue_pipeline || "₹ 0.0 Cr",
      review_meeting_date: weekStats.review_meeting_date,
      review_frequency:
        ws.review_frequency ||
        (String(ws.review_week || "").toLowerCase().includes("month")
          ? "Monthly"
          : "Weekly"),
      review_week: weekStats.review_week,
      closure_date: ws.closure_date || null,
      closure_remarks: ws.closure_remarks || "",
      weeks_outstanding: weekStats.weeks_outstanding,
      is_carried_forward: weekStats.is_carried_forward,
      is_new_this_week: weekStats.is_new_this_week,
      is_overdue: weekStats.is_overdue,
      is_blocked: weekStats.is_blocked,
      is_red_alert: weekStats.is_red_alert,
      is_hr_item: false,
      effective_rag: weekStats.effective_rag,
      action_history: weekStats.history,
      updates_list: weekStats.updates_list,
      updated_at: ws.updated_at,
      updated_by: ws.updated_by || ownerText,
    };
  });

  // Compute HR recruitment counts
  const hrCriticalIssues = allRecRows.filter(
    (r: any) =>
      r.priority === "Critical" && !["Joined", "Closed"].includes(r.status)
  ).length;

  let greenCount = 0;
  let amberCount = 0;
  let redCount = 0;
  let notStartedCount = 0;
  let totalReadiness = 0;

  const departmentCards: DepartmentCard[] = deptRows.map((d: any) => {
    const wsStat = deptStatsMap[Number(d.id)] || {
      total: 0,
      open: 0,
      completed: 0,
      in_progress: 0,
      blocked: 0,
      overdue: 0,
      delayed: 0,
      capex: 0,
      revenue: 0,
      pending_vc: 0,
    };

    const capexVal = Math.round((wsStat.capex || 0) * 10) / 10;
    const revVal = Math.round((wsStat.revenue || 0) * 10) / 10;

    const rag = (d.rag_status || "AMBER").toUpperCase();
    if (rag === "GREEN") greenCount++;
    else if (rag === "AMBER") amberCount++;
    else if (rag === "RED") redCount++;
    else notStartedCount++;

    const readiness = parseInt(String(d.readiness_percentage || "0"), 10);
    totalReadiness += readiness;

    let isStale = false;
    if (!d.last_updated) {
      isStale = true;
    } else {
      const lastTime = new Date(d.last_updated).getTime();
      const diffDays = (Date.now() - lastTime) / (1000 * 60 * 60 * 24);
      if (diffDays > 7) isStale = true;
    }

    return {
      id: d.id,
      name: d.name,
      code: d.code,
      head_of_department: d.head_of_department,
      readiness,
      readiness_percentage: readiness,
      rag,
      rag_status: rag,
      key_focus: d.key_focus || "",
      open_items: wsStat.open,
      total_items: wsStat.total,
      completed_items: wsStat.completed,
      in_progress_items: wsStat.in_progress,
      blocked_items: wsStat.blocked,
      overdue_items: wsStat.overdue || 0,
      critical_issues: wsStat.delayed + wsStat.blocked,
      capex: capexVal,
      capex_total: capexVal,
      revenue: revVal,
      revenue_total: revVal,
      pending_vc: wsStat.pending_vc,
      submission_status: d.submission_status || "SUBMITTED",
      last_updated: d.last_updated,
      updated_by: d.updated_by || d.head_of_department,
      is_stale: isStale,
      workstream_stats: {
        total: wsStat.total,
        open: wsStat.open,
        completed: wsStat.completed,
        delayed: wsStat.delayed + wsStat.blocked,
      },
    };
  });

  const totalDepts = departmentCards.length || 1;
  const overallReadiness = Math.round(totalReadiness / totalDepts);

  const readinessGraph = departmentCards.map((d) => ({
    name: d.name,
    code: d.code,
    readiness: d.readiness,
    rag: d.rag,
  }));

  const capexRevenueGraph = departmentCards.map((d) => ({
    name: d.name,
    code: d.code,
    capex: d.capex,
    revenue: d.revenue,
  }));

  const ragDistribution = [
    {
      label: "GREEN",
      count: greenCount,
      color: "#10b981",
      percent: Math.round((greenCount / totalDepts) * 100),
    },
    {
      label: "AMBER",
      count: amberCount,
      color: "#f59e0b",
      percent: Math.round((amberCount / totalDepts) * 100),
    },
    {
      label: "RED",
      count: redCount,
      color: "#ef4444",
      percent: Math.round((redCount / totalDepts) * 100),
    },
    {
      label: "NOT STARTED",
      count: notStartedCount,
      color: "#94a3b8",
      percent: Math.round((notStartedCount / totalDepts) * 100),
    },
  ];

  let totalPendingDecisions = 0;
  departmentCards.forEach((c) => {
    totalPendingDecisions += c.pending_vc;
  });

  const sortedAllActions: AttentionItem[] =
    sortActionsWithNewAndAlertsOnTop(enrichedAllWs);

  const managementAttention: AttentionItem[] = sortedAllActions.filter((a) =>
    isPendingActionStatus(a.status)
  );

  const actionsDistribution = departmentCards.map((d) => {
    let primary = 0;
    let supporting = 0;
    for (const ws of allWsRows) {
      if (Number(ws.department_id) === Number(d.id)) {
        primary++;
      } else {
        const supp = (ws.supporting_departments || "").toLowerCase();
        const suppIds = (ws.supporting_department_ids || "")
          .split(",")
          .map((s: string) => s.trim());
        if (
          supp.includes(d.name.toLowerCase()) ||
          supp.includes(d.code.toLowerCase()) ||
          suppIds.includes(String(d.id))
        ) {
          supporting++;
        }
      }
    }
    return {
      name: d.name,
      code: d.code,
      primary,
      supporting,
      total: primary + supporting,
    };
  });

  const roundedCapex = Math.round(totalGlobalCapex * 10) / 10;
  const roundedRevenue = Math.round(totalGlobalRevenue * 10) / 10;

  return {
    summary: {
      overall_readiness: overallReadiness,
      avgReadiness: overallReadiness,
      overall_rag:
        notStartedCount === totalDepts
          ? "NOT STARTED"
          : overallReadiness >= 75
            ? "GREEN"
            : overallReadiness >= 50
              ? "AMBER"
              : "RED",
      green_count: greenCount,
      amber_count: amberCount,
      red_count: redCount,
      not_started_count: notStartedCount,
      total_capex: roundedCapex,
      totalCapex: roundedCapex,
      total_revenue_pipeline: roundedRevenue,
      totalRevenue: roundedRevenue,
      pending_decisions: totalPendingDecisions,
      critical_openings: hrCriticalIssues,
      total_actions: totalActions,
      open_actions: openActions,
      urgent_actions: urgentActions,
      closed_actions: closedActions,
      new_actions_this_week: newActionsThisWeek,
      carried_forward_actions: carriedForwardActions,
      overdue_actions: overdueActions,
      blocked_actions: blockedActions,
      closed_this_week: closedThisWeek,
      current_review_week: getReviewWeekLabel(getCurrentReviewMeetingDate()),
      current_review_date: getCurrentReviewMeetingDate(),
    },
    departments: departmentCards,
    allActions: sortedAllActions,
    graphs: {
      readiness: readinessGraph,
      financials: capexRevenueGraph,
      actionsDistribution,
      ragDistribution,
      statusBreakdown: globalStatusCounts,
    },
    management_attention: managementAttention,
  };
}
