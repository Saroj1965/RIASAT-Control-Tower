import { getSupabaseClient } from "@/lib/db";
import { calculateActionWeekStats, getCurrentReviewMeetingDate, getReviewWeekLabel } from "@/lib/action-helpers";

export interface ExecutiveSummary {
  overall_readiness: number;
  overall_rag: string;
  green_count: number;
  amber_count: number;
  red_count: number;
  not_started_count: number;
  total_capex: number;
  total_revenue_pipeline: number;
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
  readiness: number;
  rag: string;
  key_focus: string;
  open_items: number;
  total_items: number;
  in_progress_items?: number;
  blocked_items?: number;
  overdue_items?: number;
  critical_issues: number;
  capex: number;
  revenue: number;
  pending_vc: number;
  submission_status: string;
  last_updated: string | null;
  updated_by: string;
  is_stale: boolean;
}

export interface AttentionItem {
  id: number;
  item_id?: string;
  department_id: number;
  department_name: string;
  item: string;
  issue: string;
  owner: string;
  target_date: string;
  status: string;
  rag_status?: string;
  priority?: string;
  decision_action?: string;
  vc_decision_required?: string;
  supporting_departments?: string;
  next_followup_date?: string;
  meeting_context?: string;
  capex?: string;
  revenue_pipeline?: string;
  review_meeting_date?: string;
  review_week?: string;
  weeks_outstanding?: number;
  is_carried_forward?: boolean;
  is_new_this_week?: boolean;
  is_overdue?: boolean;
  is_blocked?: boolean;
  effective_rag?: "GREEN" | "AMBER" | "RED";
  action_history?: any[];
}

export interface ExecutiveDashboardData {
  summary: ExecutiveSummary;
  departments: DepartmentCard[];
  graphs: {
    readiness: { name: string; code: string; readiness: number; rag: string }[];
    financials: { name: string; code: string; capex: number; revenue: number }[];
    actionsDistribution: { name: string; code: string; primary: number; supporting: number; total: number }[];
    ragDistribution: { label: string; count: number; color: string; percent: number }[];
    statusBreakdown: { [key: string]: number };
  };
  management_attention: AttentionItem[];
}

export async function getExecutiveSummaryData(): Promise<ExecutiveDashboardData> {
  const sb = getSupabaseClient();

  // Fetch all 4 tables in parallel directly from Supabase REST API
  const [
    { data: deptsData },
    { data: overviewsData },
    { data: wsData },
    { data: recData },
  ] = await Promise.all([
    sb.from("departments").select("*").eq("active", true).order("id", { ascending: true }),
    sb.from("department_overview").select("*"),
    sb.from("workstreams").select("*").order("id", { ascending: true }),
    sb.from("recruitment").select("*").order("id", { ascending: true }),
  ]);

  const rawDepts = deptsData || [];
  const overviewsMap = new Map<number, any>();
  for (const ov of overviewsData || []) {
    overviewsMap.set(Number(ov.department_id), ov);
  }

  const deptRows = rawDepts.map((d: any) => {
    const ov = overviewsMap.get(Number(d.id)) || {};
    return {
      id: d.id,
      name: d.name,
      code: d.code,
      readiness_percentage: ov.readiness_percentage ?? 0,
      rag_status: ov.rag_status || "NOT STARTED",
      key_focus: ov.key_focus || "",
      last_updated: ov.last_updated || null,
      updated_by: ov.updated_by || "",
      submission_status: ov.submission_status || "DRAFT",
    };
  });

  const deptNameById = new Map<number, string>();
  for (const d of rawDepts) {
    deptNameById.set(Number(d.id), d.name);
  }

  const allWsRows = wsData || [];
  const allRecRows = recData || [];

  const parseAmount = (val: string | null | undefined): number => {
    if (!val) return 0;
    const cleaned = String(val).replace(/[^0-9.]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const deptStatsMap: Record<number, {
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
  }> = {};

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
    Completed: 0,
    "On Track": 0,
    "In Progress": 0,
    Delayed: 0,
    Blocked: 0,
    "On Hold": 0,
  };

  for (const ws of allWsRows) {
    const dId = Number(ws.department_id);
    if (!deptStatsMap[dId]) {
      deptStatsMap[dId] = {
        total: 0, open: 0, completed: 0, delayed: 0, blocked: 0,
        on_track: 0, in_progress: 0, on_hold: 0, overdue: 0, carried_forward: 0, new_this_week: 0,
        capex: 0, revenue: 0, pending_vc: 0,
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
    if (stUpper === "IN PROGRESS" || stUpper === "OPEN") deptStatsMap[dId].in_progress++;
    if (stUpper === "ON HOLD") deptStatsMap[dId].on_hold++;

    if (globalStatusCounts[st] !== undefined) {
      globalStatusCounts[st]++;
    }

    const c = parseAmount(ws.capex);
    const r = parseAmount(ws.revenue_pipeline);
    deptStatsMap[dId].capex += c;
    deptStatsMap[dId].revenue += r;
    totalGlobalCapex += c;
    totalGlobalRevenue += r;

    const isVcReq =
      ws.vc_decision_required === "Yes" ||
      (!ws.vc_decision_required && ws.decision_action && ws.decision_action.trim().length > 0 && ws.decision_action.trim() !== "None");
    if (isVcReq && !isClosed) {
      deptStatsMap[dId].pending_vc++;
    }
  }

  // Compute HR recruitment counts
  const hrTotalItems = allRecRows.length;
  const hrOpenItems = allRecRows.filter((r: any) => !["Joined", "Closed"].includes(r.status)).length;
  const hrCriticalIssues = allRecRows.filter((r: any) => r.priority === "Critical" && !["Joined", "Closed"].includes(r.status)).length;
  const hrPendingVc = allRecRows.filter((r: any) => Boolean(r.vc_attention) && !["Joined", "Closed"].includes(r.status)).length;

  let greenCount = 0;
  let amberCount = 0;
  let redCount = 0;
  let notStartedCount = 0;
  let totalReadiness = 0;

  const departmentCards: DepartmentCard[] = deptRows.map((d: any) => {
    const isHR = d.code === "HR_REC" || Number(d.id) === 7;
    const wsStat = deptStatsMap[Number(d.id)] || {
      total: 0, open: 0, in_progress: 0, blocked: 0, overdue: 0, delayed: 0, capex: 0, revenue: 0, pending_vc: 0,
    };
    const hrOpen = isHR ? hrOpenItems : 0;
    const hrCritical = isHR ? hrCriticalIssues : 0;
    const hrPending = isHR ? hrPendingVc : 0;
    const hrTotal = isHR ? hrTotalItems : 0;

    const stats = {
      total: wsStat.total + hrTotal,
      open: wsStat.open + hrOpen,
      in_progress: wsStat.in_progress + hrOpen,
      blocked: wsStat.blocked,
      overdue: (wsStat.overdue || 0) + (isHR ? hrCritical : 0),
      critical: wsStat.delayed + wsStat.blocked + (isHR ? hrCritical : 0),
      capex: isHR ? 0 : Math.round((wsStat.capex || 0) * 10) / 10,
      revenue: isHR ? 0 : Math.round((wsStat.revenue || 0) * 10) / 10,
      pending_vc: wsStat.pending_vc + hrPending,
    };

    const rag = (d.rag_status || "NOT STARTED").toUpperCase();
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
      readiness,
      rag,
      key_focus: d.key_focus || "",
      open_items: stats.open,
      total_items: stats.total,
      in_progress_items: stats.in_progress,
      blocked_items: stats.blocked,
      overdue_items: stats.overdue,
      critical_issues: stats.critical,
      capex: stats.capex,
      revenue: stats.revenue,
      pending_vc: stats.pending_vc,
      submission_status: d.submission_status || "DRAFT",
      last_updated: d.last_updated,
      updated_by: d.updated_by || "",
      is_stale: isStale,
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
    { label: "GREEN", count: greenCount, color: "#10b981", percent: Math.round((greenCount / totalDepts) * 100) },
    { label: "AMBER", count: amberCount, color: "#f59e0b", percent: Math.round((amberCount / totalDepts) * 100) },
    { label: "RED", count: redCount, color: "#ef4444", percent: Math.round((redCount / totalDepts) * 100) },
    { label: "NOT STARTED", count: notStartedCount, color: "#94a3b8", percent: Math.round((notStartedCount / totalDepts) * 100) },
  ];

  let totalPendingDecisions = 0;
  departmentCards.forEach((c) => {
    totalPendingDecisions += c.pending_vc;
  });

  // Filter and sort workstreams for management attention
  const openWsRows = allWsRows
    .filter((w: any) => !["COMPLETED", "CLOSED"].includes(String(w.status || "").toUpperCase()))
    .sort((a: any, b: any) => {
      const aVc = a.vc_decision_required === "Yes" ? 1 : 2;
      const bVc = b.vc_decision_required === "Yes" ? 1 : 2;
      if (aVc !== bVc) return aVc - bVc;

      const ragOrder = (w: any) => {
        const r = String(w.rag_status || "").toUpperCase();
        const s = String(w.status || "").toUpperCase();
        if (r === "RED" || s === "BLOCKED") return 1;
        if (r === "AMBER" || s === "DELAYED") return 2;
        return 3;
      };
      const aRag = ragOrder(a);
      const bRag = ragOrder(b);
      if (aRag !== bRag) return aRag - bRag;
      return Number(a.id) - Number(b.id);
    })
    .slice(0, 150);

  const enrichedAttentionWs: AttentionItem[] = openWsRows.map((w: any) => {
    const stats = calculateActionWeekStats(w);
    const deptName = deptNameById.get(Number(w.department_id)) || "Department";
    return {
      id: w.id,
      item_id: w.item_id,
      department_id: w.department_id,
      department_name: deptName,
      item: w.action_point || w.deliverable,
      issue: w.remarks || w.decision_action || w.risks_blockers || "",
      owner: w.ownership || w.owner || "",
      target_date: w.timeline || w.target_date || "",
      status: w.status,
      rag_status: stats.effective_rag,
      priority: w.priority || "Medium",
      decision_action: w.remarks || w.decision_action || "",
      vc_decision_required: w.vc_decision_required || "No",
      supporting_departments: w.supporting_departments,
      next_followup_date: w.next_followup_date,
      meeting_context: w.meeting_context,
      capex: w.capex,
      revenue_pipeline: w.revenue_pipeline,
      review_meeting_date: stats.review_meeting_date,
      review_week: stats.review_week,
      weeks_outstanding: stats.weeks_outstanding,
      is_carried_forward: stats.is_carried_forward,
      is_new_this_week: stats.is_new_this_week,
      is_overdue: stats.is_overdue,
      is_blocked: stats.is_blocked,
      effective_rag: stats.effective_rag,
      action_history: stats.history,
    };
  });

  const attentionHrRows = allRecRows
    .filter((r: any) => (Boolean(r.vc_attention) || r.priority === "Critical") && !["Joined", "Closed"].includes(r.status))
    .sort((a: any, b: any) => {
      const aVc = a.vc_attention ? 1 : 2;
      const bVc = b.vc_attention ? 1 : 2;
      if (aVc !== bVc) return aVc - bVc;
      return Number(a.id) - Number(b.id);
    })
    .slice(0, 10);

  const enrichedAttentionHr: AttentionItem[] = attentionHrRows.map((r: any) => ({
    id: r.id,
    item_id: `REC-${r.id}`,
    department_id: 7,
    department_name: "HR & Recruitment",
    item: r.position_title,
    issue: r.next_action || "Critical leadership hiring attention",
    owner: r.hiring_lead || "",
    target_date: r.target_date || "",
    status: r.status,
    rag_status: r.priority === "Critical" ? "RED" : "AMBER",
    priority: r.priority || "Critical",
    decision_action: "VC Attention: Key leadership role pending approval",
    vc_decision_required: r.vc_attention ? "Yes" : "No",
    supporting_departments: "",
    next_followup_date: "",
    meeting_context: "Talent Acquisition Pipeline",
    capex: r.budget,
    revenue_pipeline: r.target_ctc,
    review_meeting_date: "2026-10-12",
    review_week: "Week 42 (12 Oct 2026)",
    weeks_outstanding: 1,
    is_carried_forward: true,
    is_new_this_week: false,
    is_overdue: r.priority === "Critical",
    is_blocked: false,
    effective_rag: r.priority === "Critical" ? "RED" : "AMBER",
    action_history: [],
  }));

  const managementAttention: AttentionItem[] = [...enrichedAttentionWs, ...enrichedAttentionHr];

  const actionsDistribution = departmentCards.map((d) => {
    let primary = 0;
    let supporting = 0;
    for (const ws of allWsRows) {
      if (Number(ws.department_id) === Number(d.id)) {
        primary++;
      } else {
        const supp = (ws.supporting_departments || "").toLowerCase();
        const suppIds = (ws.supporting_department_ids || "").split(",").map((s: string) => s.trim());
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

  return {
    summary: {
      overall_readiness: overallReadiness,
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
      total_capex: Math.round(totalGlobalCapex * 10) / 10,
      total_revenue_pipeline: Math.round(totalGlobalRevenue * 10) / 10,
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
