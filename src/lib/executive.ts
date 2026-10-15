import { query } from "@/lib/db";
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
  // 1. Fetch all departments and their current overview
  const deptRes = await query(`
    SELECT d.id, d.name, d.code,
           COALESCE(o.readiness_percentage, 0) as readiness_percentage,
           COALESCE(o.rag_status, 'NOT STARTED') as rag_status,
           o.key_focus,
           o.last_updated,
           o.updated_by,
           COALESCE(o.submission_status, 'DRAFT') as submission_status
    FROM departments d
    LEFT JOIN department_overview o ON d.id = o.department_id
    WHERE d.active = TRUE
    ORDER BY d.id ASC
  `);

  // 2. Fetch all workstreams for calculations
  // 2. Fetch all workstreams for calculations
  const allWsRes = await query(`
    SELECT id, item_id, department_id, deliverable, category, status, capex, revenue_pipeline, 
           owner, risks_blockers, decision_action, target_date,
           action_point, ownership, timeline, rag_status, remarks, vc_decision_required,
           supporting_departments, supporting_department_ids, next_followup_date, meeting_context,
           review_meeting_date, review_week, priority, closure_date, closure_remarks, created_at, action_history
    FROM workstreams
    ORDER BY id ASC
  `);

  const parseAmount = (val: string | null | undefined): number => {
    if (!val) return 0;
    const cleaned = val.replace(/[^0-9.]/g, "");
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

  for (const ws of allWsRes.rows) {
    const dId = ws.department_id;
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

    const isVcReq = ws.vc_decision_required === "Yes" || 
      (!ws.vc_decision_required && ws.decision_action && ws.decision_action.trim().length > 0 && ws.decision_action.trim() !== "None");
    if (isVcReq && !isClosed) {
      deptStatsMap[dId].pending_vc++;
    }
  }

  // HR counts
  const hrCountsRes = await query(`
    SELECT 
      COUNT(*) as total_items,
      COUNT(CASE WHEN status NOT IN ('Joined', 'Closed') THEN 1 END) as open_items,
      COUNT(CASE WHEN priority = 'Critical' AND status NOT IN ('Joined', 'Closed') THEN 1 END) as critical_issues,
      COUNT(CASE WHEN vc_attention = TRUE AND status NOT IN ('Joined', 'Closed') THEN 1 END) as pending_vc,
      SUM(CASE WHEN budget IS NOT NULL THEN 1 ELSE 0 END) as budget_items
    FROM recruitment
  `);
  const hrCount = hrCountsRes.rows[0];

  let greenCount = 0;
  let amberCount = 0;
  let redCount = 0;
  let notStartedCount = 0;
  let totalReadiness = 0;

  const departmentCards: DepartmentCard[] = deptRes.rows.map((d: any) => {
    const isHR = d.code === "HR_REC" || d.id === 7;
    const wsStat = deptStatsMap[d.id] || { total: 0, open: 0, in_progress: 0, blocked: 0, overdue: 0, delayed: 0, capex: 0, revenue: 0, pending_vc: 0 };
    const hrOpen = isHR ? parseInt(hrCount.open_items || "0", 10) : 0;
    const hrCritical = isHR ? parseInt(hrCount.critical_issues || "0", 10) : 0;
    const hrPendingVc = isHR ? parseInt(hrCount.pending_vc || "0", 10) : 0;
    const hrTotal = isHR ? parseInt(hrCount.total_items || "0", 10) : 0;

    const stats = {
      total: wsStat.total + hrTotal,
      open: wsStat.open + hrOpen,
      in_progress: wsStat.in_progress + hrOpen,
      blocked: wsStat.blocked,
      overdue: (wsStat.overdue || 0) + (isHR ? hrCritical : 0),
      critical: wsStat.delayed + wsStat.blocked + (isHR ? hrCritical : 0),
      capex: isHR ? 0 : Math.round((wsStat.capex || 0) * 10) / 10,
      revenue: isHR ? 0 : Math.round((wsStat.revenue || 0) * 10) / 10,
      pending_vc: wsStat.pending_vc + hrPendingVc,
    };

    const rag = (d.rag_status || "NOT STARTED").toUpperCase();
    if (rag === "GREEN") greenCount++;
    else if (rag === "AMBER") amberCount++;
    else if (rag === "RED") redCount++;
    else notStartedCount++;

    const readiness = parseInt(d.readiness_percentage || "0", 10);
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

  const attentionWsRes = await query(`
    SELECT w.id, 
           w.item_id,
           COALESCE(w.action_point, w.deliverable) as item, 
           w.status, 
           COALESCE(w.ownership, w.owner) as owner, 
           COALESCE(w.timeline, w.target_date) as target_date, 
           COALESCE(w.remarks, w.decision_action, w.risks_blockers) as issue,
           COALESCE(w.remarks, w.decision_action) as decision_action,
           COALESCE(w.rag_status, 'AMBER') as rag_status,
           COALESCE(w.vc_decision_required, 'No') as vc_decision_required,
           w.supporting_departments,
           w.supporting_department_ids,
           w.next_followup_date,
           w.meeting_context,
           w.review_meeting_date,
           w.review_week,
           w.priority,
           w.created_at,
           w.closure_date,
           w.action_history,
           d.name as department_name, d.id as department_id,
           w.capex, w.revenue_pipeline
    FROM workstreams w
    JOIN departments d ON w.department_id = d.id
    WHERE UPPER(w.status) NOT IN ('COMPLETED', 'CLOSED')
    ORDER BY 
      CASE WHEN w.vc_decision_required = 'Yes' THEN 1 ELSE 2 END,
      CASE WHEN UPPER(w.rag_status) = 'RED' OR UPPER(w.status) = 'BLOCKED' THEN 1
           WHEN UPPER(w.rag_status) = 'AMBER' OR UPPER(w.status) = 'DELAYED' THEN 2
           ELSE 3 END,
      w.id ASC
    LIMIT 150
  `);

  const enrichedAttentionWs: AttentionItem[] = attentionWsRes.rows.map((row: any) => {
    const stats = calculateActionWeekStats(row);
    return {
      id: row.id,
      item_id: row.item_id,
      department_id: row.department_id,
      department_name: row.department_name,
      item: row.item,
      issue: row.issue,
      owner: row.owner,
      target_date: row.target_date,
      status: row.status,
      rag_status: stats.effective_rag,
      priority: row.priority || "Medium",
      decision_action: row.decision_action,
      vc_decision_required: row.vc_decision_required,
      supporting_departments: row.supporting_departments,
      next_followup_date: row.next_followup_date,
      meeting_context: row.meeting_context,
      capex: row.capex,
      revenue_pipeline: row.revenue_pipeline,
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

  const attentionHrRes = await query(`
    SELECT r.id, r.position_title as item, r.status, r.hiring_lead as owner, r.target_date,
           COALESCE(r.next_action, 'Critical leadership hiring attention') as issue,
           'VC Attention: Key leadership role pending approval' as decision_action,
           'HR & Recruitment' as department_name, 7 as department_id,
           CASE WHEN r.priority = 'Critical' THEN 'RED' ELSE 'AMBER' END as rag_status,
           CASE WHEN r.vc_attention = TRUE THEN 'Yes' ELSE 'No' END as vc_decision_required,
           r.budget as capex, r.target_ctc as revenue_pipeline,
           r.priority
    FROM recruitment r
    WHERE (r.vc_attention = TRUE OR r.priority = 'Critical')
      AND r.status NOT IN ('Joined', 'Closed')
    ORDER BY 
      CASE WHEN r.vc_attention = TRUE THEN 1 ELSE 2 END,
      r.id ASC
    LIMIT 10
  `);

  const enrichedAttentionHr: AttentionItem[] = attentionHrRes.rows.map((row: any) => ({
    id: row.id,
    item_id: `REC-${row.id}`,
    department_id: row.department_id,
    department_name: row.department_name,
    item: row.item,
    issue: row.issue,
    owner: row.owner,
    target_date: row.target_date,
    status: row.status,
    rag_status: row.rag_status,
    priority: row.priority || "Critical",
    decision_action: row.decision_action,
    vc_decision_required: row.vc_decision_required,
    supporting_departments: "",
    next_followup_date: "",
    meeting_context: "Talent Acquisition Pipeline",
    capex: row.capex,
    revenue_pipeline: row.revenue_pipeline,
    review_meeting_date: "2026-10-12",
    review_week: "Week 42 (12 Oct 2026)",
    weeks_outstanding: 1,
    is_carried_forward: true,
    is_new_this_week: false,
    is_overdue: row.priority === "Critical",
    is_blocked: false,
    effective_rag: row.priority === "Critical" ? "RED" : "AMBER",
    action_history: [],
  }));

  const managementAttention: AttentionItem[] = [...enrichedAttentionWs, ...enrichedAttentionHr];

  const actionsDistribution = departmentCards.map((d) => {
    let primary = 0;
    let supporting = 0;
    for (const ws of allWsRes.rows) {
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
      critical_openings: parseInt(hrCount.critical_issues || "0", 10),
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
