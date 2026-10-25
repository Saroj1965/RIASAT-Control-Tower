// Shared action-item calculations for Weekly Action Register, Carry-Forward, Datewise Progress Updates, and Red Overdue indicators

export interface ActionHistoryEntry {
  date?: string;
  timestamp?: string;
  user?: string;
  role?: string;
  action?: string;
  status?: string;
  remarks?: string;
  next_followup_date?: string;
  rag_status?: string;
  priority?: string;
  vc_decision_required?: string;
  change_summary?: string;
}

export interface FormattedActionUpdate {
  id: string;
  rawDate: string;
  date?: string;
  formattedDate: string;
  text: string;
  remarks?: string;
  user?: string;
  status?: string;
  rag?: string;
  isRedAlert: boolean;
  isImportant: boolean;
  isLatest: boolean;
}

export interface ActionWeekStats {
  review_meeting_date: string;
  review_week: string;
  weeks_outstanding: number;
  is_carried_forward: boolean;
  is_new_this_week: boolean;
  is_overdue: boolean;
  is_approaching: boolean;
  effective_rag: "GREEN" | "AMBER" | "RED";
  is_closed: boolean;
  is_blocked: boolean;
  is_red_alert: boolean;
  history: ActionHistoryEntry[];
  updates_list: FormattedActionUpdate[];
}

/**
 * Returns true ONLY if the action item is still pending (excludes Completed and Closed)
 */
export function isPendingActionStatus(status?: string | null): boolean {
  const norm = String(status || "OPEN").trim().toUpperCase();
  return !["CLOSED", "COMPLETED"].includes(norm);
}

/**
 * Determines whether an action item is a Red Alert / Urgent Alert
 */
export function isRedAlertItem(action: any): boolean {
  const status = String(action.status || "").trim().toUpperCase();
  if (["CLOSED", "COMPLETED"].includes(status)) return false;

  const rag = String(action.effective_rag || action.rag_status || "").trim().toUpperCase();
  const priority = String(action.priority || "").trim().toUpperCase();
  const vcReq = String(action.vc_decision_required || "").trim().toUpperCase();

  return (
    rag === "RED" ||
    status === "BLOCKED" ||
    status === "DELAYED" ||
    priority === "CRITICAL" ||
    vcReq === "YES" ||
    Boolean(action.is_overdue) ||
    Boolean(action.is_blocked)
  );
}

/**
 * Formats a date string into a clean readable date e.g. "23 Oct 2026"
 */
export function formatUpdateDate(dateStr?: string | null): string {
  if (!dateStr) return "Recent";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Extracts all updates (1 to 5+ updates, including red alerts and important updates)
 * sorted strictly datewise with the LATEST update on top.
 */
export function getActionUpdatesDatewise(action: any): FormattedActionUpdate[] {
  const rawHistory: ActionHistoryEntry[] = [];

  if (action.action_history) {
    try {
      const parsed =
        typeof action.action_history === "string"
          ? JSON.parse(action.action_history)
          : action.action_history;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === "object") {
            rawHistory.push(item);
          }
        }
      }
    } catch {
      // ignore malformed JSON
    }
  }

  const actionRag = String(action.effective_rag || action.rag_status || "GREEN").toUpperCase();
  const actionStatus = String(action.status || "OPEN").trim();
  const actionPriority = String(action.priority || "Medium").trim();
  const actionVc = String(action.vc_decision_required || "No").trim();
  const itemIsRed = isRedAlertItem(action);

  const entries: {
    rawDate: string;
    timestampMs: number;
    text: string;
    user?: string;
    status?: string;
    rag?: string;
    isRedAlert: boolean;
    isImportant: boolean;
  }[] = [];

  // Process history entries
  for (let i = 0; i < rawHistory.length; i++) {
    const h = rawHistory[i];
    const text = String(h.remarks || h.change_summary || "").trim();
    if (!text) continue;

    const rawDate = h.timestamp || h.date || action.updated_at || action.review_meeting_date || action.created_at || "2026-10-12";
    const parsedMs = new Date(rawDate).getTime();
    // Preserve order if timestamps are equal (earlier index in unshifted array is newer)
    const timestampMs = (isNaN(parsedMs) ? Date.now() : parsedMs) - i;

    const hRag = String(h.rag_status || actionRag).toUpperCase();
    const hStatus = String(h.status || actionStatus);
    const isRed =
      hRag === "RED" ||
      hStatus.toUpperCase() === "BLOCKED" ||
      hStatus.toUpperCase() === "DELAYED" ||
      text.toLowerCase().includes("critical") ||
      text.toLowerCase().includes("urgent") ||
      text.toLowerCase().includes("blocked") ||
      text.toLowerCase().includes("delay") ||
      itemIsRed;

    const isImp =
      isRed ||
      hRag === "AMBER" ||
      actionPriority === "High" ||
      actionVc === "Yes" ||
      text.toLowerCase().includes("vc") ||
      text.toLowerCase().includes("approval");

    entries.push({
      rawDate,
      timestampMs,
      text,
      user: h.user,
      status: hStatus,
      rag: hRag,
      isRedAlert: isRed,
      isImportant: isImp,
    });
  }

  // Ensure current primary remarks / issue is included if not already represented
  const currentRemarks = String(action.remarks || action.issue || "").trim();
  if (currentRemarks) {
    // Check if currentRemarks contains multiple semicolon/newline separated dated updates or if it's a single update
    const alreadyExists = entries.some(
      (e) => e.text.toLowerCase() === currentRemarks.toLowerCase()
    );
    if (!alreadyExists) {
      const rawDate = action.updated_at || action.review_meeting_date || action.created_at || new Date().toISOString();
      const parsedMs = new Date(rawDate).getTime();
      entries.unshift({
        rawDate,
        timestampMs: (isNaN(parsedMs) ? Date.now() : parsedMs) + 1000,
        text: currentRemarks,
        user: action.updated_by || action.owner || action.ownership,
        status: actionStatus,
        rag: actionRag,
        isRedAlert: itemIsRed,
        isImportant: itemIsRed || actionVc === "Yes" || actionPriority === "High",
      });
    }
  }

  // Also include decision_action / risks_blockers if distinct and non-empty
  const decisionText = String(action.decision_action || "").trim();
  if (
    decisionText &&
    decisionText !== "None" &&
    !entries.some((e) => e.text.toLowerCase().includes(decisionText.toLowerCase()))
  ) {
    const rawDate = action.review_meeting_date || action.created_at || "2026-10-12";
    const parsedMs = new Date(rawDate).getTime();
    entries.push({
      rawDate,
      timestampMs: (isNaN(parsedMs) ? Date.now() - 86400000 : parsedMs - 1000),
      text: `Directive / Alert: ${decisionText}`,
      user: "Executive Review",
      status: actionStatus,
      rag: actionRag,
      isRedAlert: itemIsRed || actionVc === "Yes",
      isImportant: true,
    });
  }

  const blockerText = String(action.risks_blockers || "").trim();
  if (
    blockerText &&
    blockerText !== "None" &&
    !entries.some((e) => e.text.toLowerCase().includes(blockerText.toLowerCase()))
  ) {
    const rawDate = action.review_meeting_date || action.created_at || "2026-10-10";
    const parsedMs = new Date(rawDate).getTime();
    entries.push({
      rawDate,
      timestampMs: (isNaN(parsedMs) ? Date.now() - 172800000 : parsedMs - 2000),
      text: `Risk / Blocker: ${blockerText}`,
      user: action.owner || action.ownership || "Dept Lead",
      status: actionStatus,
      rag: "RED",
      isRedAlert: true,
      isImportant: true,
    });
  }

  // Sort strictly by timestampMs DESC (latest update on top)
  entries.sort((a, b) => b.timestampMs - a.timestampMs);

  // Deduplicate identical consecutive or duplicate texts while keeping the latest timestamp
  const uniqueEntries: typeof entries = [];
  const seenTexts = new Set<string>();
  for (const entry of entries) {
    const key = entry.text.toLowerCase().trim();
    if (!seenTexts.has(key)) {
      seenTexts.add(key);
      uniqueEntries.push(entry);
    }
  }

  return uniqueEntries.map((e, idx) => ({
    id: `upd-${idx}`,
    rawDate: e.rawDate,
    date: e.rawDate,
    formattedDate: formatUpdateDate(e.rawDate),
    text: e.text,
    remarks: e.text,
    user: e.user,
    status: e.status,
    rag: e.rag,
    isRedAlert: e.isRedAlert,
    isImportant: e.isImportant,
    isLatest: idx === 0,
  }));
}

/**
 * Sorts actions so that:
 * 1. Pending items come before Closed/Completed items
 * 2. Red Alerts / Overdue / Critical items come first at the top
 * 3. VC Decision Required items come next
 * 4. Within each group, order by review_meeting_date DESC (19 Oct before 12 Oct) then action code / ID
 */
export function sortActionsWithNewAndAlertsOnTop<T extends Record<string, any>>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aPending = isPendingActionStatus(a.status) ? 0 : 1;
    const bPending = isPendingActionStatus(b.status) ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;

    // Red Alert / Overdue / Critical items on top
    const aRed = isRedAlertItem(a) ? 0 : 1;
    const bRed = isRedAlertItem(b) ? 0 : 1;
    if (aRed !== bRed) return aRed - bRed;

    // Next: VC decision required
    const aVc = String(a.vc_decision_required || "").toUpperCase() === "YES" ? 0 : 1;
    const bVc = String(b.vc_decision_required || "").toUpperCase() === "YES" ? 0 : 1;
    if (aVc !== bVc) return aVc - bVc;

    // Next: Amber / High Priority
    const aAmber =
      String(a.effective_rag || a.rag_status || "").toUpperCase() === "AMBER" ||
      String(a.priority || "").toUpperCase() === "HIGH"
        ? 0
        : 1;
    const bAmber =
      String(b.effective_rag || b.rag_status || "").toUpperCase() === "AMBER" ||
      String(b.priority || "").toUpperCase() === "HIGH"
        ? 0
        : 1;
    if (aAmber !== bAmber) return aAmber - bAmber;

    // Next: Latest review meeting date first (e.g. 2026-10-19 before 2026-10-12)
    const aDate = String(a.review_meeting_date || "2026-10-12").slice(0, 10);
    const bDate = String(b.review_meeting_date || "2026-10-12").slice(0, 10);
    if (aDate !== bDate) return bDate.localeCompare(aDate);

    // Finally: sort by ACT code number or ID ascending
    const aCodeNum = parseInt(String(a.item_id || "").replace(/\D+/g, ""), 10) || Number(a.id) || 0;
    const bCodeNum = parseInt(String(b.item_id || "").replace(/\D+/g, ""), 10) || Number(b.id) || 0;
    return aCodeNum - bCodeNum;
  });
}

/**
 * Returns the Monday of the current week as the standard review meeting date
 */
export function getCurrentReviewMeetingDate(now: Date = new Date()): string {
  const d = new Date(now);
  const day = d.getDay();
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diffToMonday));
  return monday.toISOString().split("T")[0];
}

/**
 * Formats a review week label e.g., "Week 42 (12 Oct 2026)"
 */
export function getReviewWeekLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Current Review Cycle";

    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);

    const formattedDate = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return `Week ${weekNumber} (${formattedDate})`;
  } catch {
    return "Current Review Cycle";
  }
}

/**
 * Parses and computes real-time week stats, carry-forward status, datewise updates, and overdue red alerts for any action
 */
export function calculateActionWeekStats(action: any, referenceDate: Date = new Date()): ActionWeekStats {
  const status = (action.status || "OPEN").trim().toUpperCase();
  const is_closed = status === "COMPLETED" || status === "CLOSED";
  const is_blocked = status === "BLOCKED";

  const review_meeting_date =
    action.review_meeting_date ||
    (action.created_at ? new Date(action.created_at).toISOString().split("T")[0] : "2026-10-12");

  const review_week = action.review_week || getReviewWeekLabel(review_meeting_date);

  let weeks_outstanding = 0;
  const reviewTime = new Date(review_meeting_date).getTime();
  const refTime = is_closed && action.closure_date ? new Date(action.closure_date).getTime() : referenceDate.getTime();

  if (!isNaN(reviewTime) && refTime > reviewTime) {
    const diffMs = refTime - reviewTime;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    weeks_outstanding = Math.max(0, Math.floor(diffDays / 7));
  }

  const is_carried_forward = !is_closed && (review_meeting_date < "2026-10-19" || weeks_outstanding > 0);
  const is_new_this_week = !is_closed && !is_carried_forward;

  const timeline = (action.timeline || action.target_date || "").trim();
  let is_overdue = false;
  let is_approaching = false;

  if (!is_closed) {
    if (status === "DELAYED") {
      is_overdue = true;
    } else {
      const dateMatch = timeline.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      if (dateMatch) {
        const targetTime = new Date(dateMatch[1]).getTime();
        const nowTime = referenceDate.getTime();
        if (targetTime < nowTime) {
          is_overdue = true;
        } else if (targetTime - nowTime <= 7 * 24 * 60 * 60 * 1000) {
          is_approaching = true;
        }
      }
    }

    if ((action.rag_status || "").toUpperCase() === "RED") {
      is_overdue = true;
    }
  }

  let effective_rag: "GREEN" | "AMBER" | "RED" = "GREEN";
  if (is_closed) {
    effective_rag = "GREEN";
  } else if (
    is_overdue ||
    is_blocked ||
    (action.rag_status || "").toUpperCase() === "RED" ||
    String(action.priority || "").toUpperCase() === "CRITICAL"
  ) {
    effective_rag = "RED";
  } else if (is_approaching || status === "DELAYED" || (action.rag_status || "").toUpperCase() === "AMBER") {
    effective_rag = "AMBER";
  } else {
    effective_rag = "GREEN";
  }

  let history: ActionHistoryEntry[] = [];
  if (action.action_history) {
    try {
      if (Array.isArray(action.action_history)) {
        history = action.action_history;
      } else if (typeof action.action_history === "string") {
        history = JSON.parse(action.action_history);
      }
    } catch {
      history = [];
    }
  }

  const enrichedForUpdates = {
    ...action,
    effective_rag,
    is_overdue,
    is_blocked,
  };
  const updates_list = getActionUpdatesDatewise(enrichedForUpdates);
  const is_red_alert = isRedAlertItem(enrichedForUpdates);

  return {
    review_meeting_date,
    review_week,
    weeks_outstanding,
    is_carried_forward,
    is_new_this_week,
    is_overdue,
    is_approaching,
    effective_rag,
    is_closed,
    is_blocked,
    is_red_alert,
    history,
    updates_list,
  };
}

// Convenient aliases
export const sortActionsWithAlertsAndNewFirst = sortActionsWithNewAndAlertsOnTop;
export const formatActionUpdatesDatewise = getActionUpdatesDatewise;
export const isActionRedAlert = isRedAlertItem;
export function isPendingAction(actionOrStatus: any): boolean {
  const st =
    typeof actionOrStatus === "string"
      ? actionOrStatus
      : actionOrStatus?.status || "OPEN";
  return isPendingActionStatus(st);
}
