import { query } from "@/lib/db";

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
  decision_action?: string;
  vc_decision_required?: string;
  supporting_departments?: string;
  next_followup_date?: string;
  meeting_context?: string;
  capex?: string;
  revenue_pipeline?: string;
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
  const allWsRes = await query(`
    SELECT id, department_id, deliverable, category, status, capex, revenue_pipeline, 
           owner, risks_blockers, decision_action, target_date,
           action_point, ownership, timeline, rag_status, remarks, vc_decision_required,
           supporting_departments, supporting_department_ids
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
    capex: number;
    revenue: number;
    pending_vc: number;
  }> = {};

  let totalGlobalCapex = 0;
  let totalGlobalRevenue = 0;
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
        on_track: 0, in_progress: 0, on_hold: 0, overdue: 0, capex: 0, revenue: 0, pending_vc: 0,
      };
    }

    const st = (ws.status || "Open").trim();
    const stUpper = st.toUpperCase();
    const isClosed = stUpper === "COMPLETED" || stUpper === "CLOSED";

    deptStatsMap[dId].total++;
    if (!isClosed) deptStatsMap[dId].open++;
    if (stUpper === "COMPLETED") deptStatsMap[dId].completed++;
    if (stUpper === "DELAYED") deptStatsMap[dId].delayed++;
    if (stUpper === "BLOCKED") deptStatsMap[dId].blocked++;
    if (stUpper === "ON TRACK") deptStatsMap[dId].on_track++;
    if (stUpper === "IN PROGRESS" || stUpper === "OPEN") deptStatsMap[dId].in_progress++;
    if (stUpper === "ON HOLD") deptStatsMap[dId].on_hold++;

    const isOverdue = !isClosed && (
      stUpper === "DELAYED" || 
      (ws.timeline && ws.timeline.match(/^\d{4}-\d{2}-\d{2}$/) && new Date(ws.timeline).getTime() < Date.now()) ||
      (ws.target_date && ws.target_date.match(/^\d{4}-\d{2}-\d{2}$/) && new Date(ws.target_date).getTime() < Date.now())
    );
    if (isOverdue) deptStatsMap[dId].overdue = (deptStatsMap[dId].overdue || 0) + 1;

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
    LIMIT 100
  `);

  const attentionHrRes = await query(`
    SELECT r.id, r.position_title as item, r.status, r.hiring_lead as owner, r.target_date,
           COALESCE(r.next_action, 'Critical leadership hiring attention') as issue,
           'VC Attention: Key leadership role pending approval' as decision_action,
           'HR & Recruitment' as department_name, 7 as department_id,
           CASE WHEN r.priority = 'Critical' THEN 'RED' ELSE 'AMBER' END as rag_status,
           CASE WHEN r.vc_attention = TRUE THEN 'Yes' ELSE 'No' END as vc_decision_required,
           r.budget as capex, r.target_ctc as revenue_pipeline
    FROM recruitment r
    WHERE (r.vc_attention = TRUE OR r.priority = 'Critical')
      AND r.status NOT IN ('Joined', 'Closed')
    ORDER BY 
      CASE WHEN r.vc_attention = TRUE THEN 1 ELSE 2 END,
      r.id ASC
    LIMIT 10
  `);

  const managementAttention: AttentionItem[] = [...attentionWsRes.rows, ...attentionHrRes.rows];

  let totalActions = 0;
  let openActions = 0;
  let urgentActions = 0;
  let closedActions = 0;

  for (const ws of allWsRes.rows) {
    totalActions++;
    const stUpper = (ws.status || "OPEN").trim().toUpperCase();
    const isClosed = stUpper === "COMPLETED" || stUpper === "CLOSED";
    if (isClosed) {
      closedActions++;
    } else {
      openActions++;
      const timeline = (ws.timeline || ws.target_date || "").toLowerCase();
      if (
        timeline.includes("urgent") ||
        timeline.includes("immediate") ||
        stUpper === "DELAYED" ||
        stUpper === "BLOCKED"
      ) {
        urgentActions++;
      }
    }
  }

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
