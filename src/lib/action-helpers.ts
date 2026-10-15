// Shared action-item calculations for Weekly Action Register, Carry-Forward, and Red Overdue indicators

export interface ActionHistoryEntry {
  date: string;
  user: string;
  status?: string;
  remarks?: string;
  next_followup_date?: string;
  rag_status?: string;
  change_summary?: string;
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
  history: ActionHistoryEntry[];
}

/**
 * Returns the Monday of the current week as the standard review meeting date
 */
export function getCurrentReviewMeetingDate(now: Date = new Date()): string {
  const d = new Date(now);
  const day = d.getDay();
  // In JS, Sunday is 0, Monday is 1, ..., Saturday is 6
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

    // ISO week number
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
 * Parses and computes real-time week stats, carry-forward status, and overdue red alerts for any action
 */
export function calculateActionWeekStats(action: any, referenceDate: Date = new Date()): ActionWeekStats {
  const status = (action.status || "OPEN").trim().toUpperCase();
  const is_closed = status === "COMPLETED" || status === "CLOSED";
  const is_blocked = status === "BLOCKED";

  // Determine review meeting date
  const review_meeting_date =
    action.review_meeting_date ||
    (action.created_at ? new Date(action.created_at).toISOString().split("T")[0] : "2026-10-12");

  const review_week = action.review_week || getReviewWeekLabel(review_meeting_date);

  // Compute weeks outstanding
  let weeks_outstanding = 0;
  const reviewTime = new Date(review_meeting_date).getTime();
  const refTime = is_closed && action.closure_date ? new Date(action.closure_date).getTime() : referenceDate.getTime();

  if (!isNaN(reviewTime) && refTime > reviewTime) {
    const diffMs = refTime - reviewTime;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    weeks_outstanding = Math.max(0, Math.floor(diffDays / 7));
  }

  const is_carried_forward = !is_closed && weeks_outstanding > 0;
  const is_new_this_week = !is_closed && weeks_outstanding === 0;

  // Determine Overdue / Approaching
  // Target date parsing
  const timeline = (action.timeline || action.target_date || "").trim();
  let is_overdue = false;
  let is_approaching = false;

  if (!is_closed) {
    if (status === "DELAYED") {
      is_overdue = true;
    } else {
      // Check if timeline or target_date is formatted as YYYY-MM-DD or contains date
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

    // Explicit Red RAG or Blocked also treats as Red
    if ((action.rag_status || "").toUpperCase() === "RED") {
      is_overdue = true;
    }
  }

  // Determine Effective RAG
  let effective_rag: "GREEN" | "AMBER" | "RED" = "GREEN";
  if (is_closed) {
    effective_rag = "GREEN";
  } else if (is_overdue || is_blocked || (action.rag_status || "").toUpperCase() === "RED") {
    effective_rag = "RED";
  } else if (is_approaching || status === "DELAYED" || (action.rag_status || "").toUpperCase() === "AMBER") {
    effective_rag = "AMBER";
  } else {
    effective_rag = "GREEN";
  }

  // Parse action history
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
    history,
  };
}
