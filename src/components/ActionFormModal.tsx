"use client";

import React, { useState, useEffect } from "react";
import { X, History, CheckCircle2, Clock, AlertTriangle, FileText } from "lucide-react";

export const SUPPORT_OPTIONS = [
  "Venkatesh Valluri",
  "Avinash Ghodgaonkar",
  "Anamika Sahay",
  "Vinila K",
  "Sarojini M",
  "Finance",
] as const;

export const STAFF_DIRECTORY = [
  "Mr. Venkatesh Valluri",
  "Mr. Avinash Ghodgaonkar",
  "Ms. Anamika Sahay",
  "Ms. Vinila Kalive",
  "Ms. Sarojini Mangalam",
  "Venkatesh Valluri",
  "Avinash Ghodgaonkar",
  "Anamika Sahay",
  "Vinila K",
  "Sarojini M",
  "Dr. Arun Kumar",
  "Wg Cdr R. Sharma",
  "Dr. P. Sundaram",
  "Col. K. Menon",
  "Dr. Neha Varma",
  "Prof. Rajesh Iyer",
  "Sumanth Rao",
  "Ananya Sen",
  "Dr. Venkat Raman",
] as const;

export const REVIEW_FREQUENCIES = ["Weekly", "Monthly"] as const;
export const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
export const ACTION_STATUSES = [
  "Open",
  "In Progress",
  "On Track",
  "Delayed",
  "Blocked",
  "On Hold",
  "Completed",
  "Closed",
] as const;

export interface DepartmentOption {
  id: number;
  name: string;
  code?: string;
  head_of_department?: string;
}

export interface ActionFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  action?: any | null;
  departments: DepartmentOption[];
  defaultDepartmentId?: number | null;
  currentUserName?: string;
  nextCodePreview?: string;
  onClose: () => void;
  onSaved: (savedItem?: any) => void;
}

function normalizeIsoDate(raw?: string | null, fallback = ""): string {
  if (!raw) return fallback;
  const trimmed = String(raw).trim();
  const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime()) && trimmed.length >= 8 && /\d{4}/.test(trimmed)) {
    return parsed.toISOString().slice(0, 10);
  }
  return fallback;
}

function normalizeStatusValue(raw?: string | null): string {
  const s = String(raw || "Open").trim();
  const upper = s.toUpperCase();
  if (upper === "OPEN" || upper === "NOT STARTED") return "Open";
  if (upper === "IN PROGRESS") return "In Progress";
  if (upper === "ON TRACK") return "On Track";
  if (upper === "DELAYED") return "Delayed";
  if (upper === "BLOCKED" || upper === "AT RISK") return "Blocked";
  if (upper === "ON HOLD") return "On Hold";
  if (upper === "COMPLETED") return "Completed";
  if (upper === "CLOSED" || upper === "JOINED") return "Closed";
  return ACTION_STATUSES.includes(s as any) ? s : "Open";
}

function parseSupportSelections(rawSupport?: string | null): {
  selected: string[];
  othersText: string;
  othersChecked: boolean;
} {
  if (!rawSupport) {
    return { selected: [], othersText: "", othersChecked: false };
  }
  const parts = String(rawSupport)
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const selected: string[] = [];
  const others: string[] = [];

  for (const part of parts) {
    const matched = SUPPORT_OPTIONS.find((opt) => opt.toLowerCase() === part.toLowerCase());
    if (matched) {
      if (!selected.includes(matched)) selected.push(matched);
    } else {
      others.push(part);
    }
  }

  return {
    selected,
    othersText: others.join(", "),
    othersChecked: others.length > 0,
  };
}

export function ActionFormModal({
  open,
  mode,
  action,
  departments,
  defaultDepartmentId,
  currentUserName = "Executive Secretariat",
  nextCodePreview = "ACT-16",
  onClose,
  onSaved,
}: ActionFormModalProps) {
  const todayIso = new Date().toISOString().slice(0, 10);

  const existingCode =
    action?.item_id ||
    action?.position_id ||
    (action?.id ? `ACT-${String(action.id).padStart(2, "0")}` : nextCodePreview);

  const existingStatus = normalizeStatusValue(action?.status);
  const wasAlreadyClosed = existingStatus === "Closed" || existingStatus === "Completed";

  const initialSupport = parseSupportSelections(
    action?.supporting_departments || action?.support_from || ""
  );

  // Extract default target date (or fallback to 2026-10-19 if text timeline)
  const rawTimeline = String(action?.target_date || action?.timeline || "").trim();
  const initialTargetIso = normalizeIsoDate(rawTimeline, "");
  const initialTimelineNote = !initialTargetIso && rawTimeline ? rawTimeline : "";

  const [reviewMeetingDate, setReviewMeetingDate] = useState<string>(
    normalizeIsoDate(action?.review_meeting_date, "2026-10-12")
  );
  const [reviewFrequency, setReviewFrequency] = useState<string>(
    action?.review_frequency || (String(action?.review_week || "").toLowerCase().includes("month") ? "Monthly" : "Weekly")
  );
  const [departmentId, setDepartmentId] = useState<number>(
    Number(action?.department_id) || Number(defaultDepartmentId) || (departments[0]?.id ?? 7)
  );
  const [owner, setOwner] = useState<string>(
    action?.ownership || action?.owner || action?.hiring_lead || ""
  );
  const [priority, setPriority] = useState<string>(
    PRIORITIES.includes(action?.priority) ? action.priority : "High"
  );
  const [actionItem, setActionItem] = useState<string>(
    action?.action_point || action?.deliverable || action?.position_title || ""
  );
  const [supportFrom, setSupportFrom] = useState<string[]>(initialSupport.selected);
  const [othersChecked, setOthersChecked] = useState<boolean>(
    initialSupport.othersChecked || (mode === "edit" && !initialSupport.selected.length && Boolean(action?.ownership?.includes("RUAS")))
  );
  const [supportOthers, setSupportOthers] = useState<string>(
    initialSupport.othersText ||
      (mode === "edit" && String(action?.ownership || "").toLowerCase().includes("ruas/hr")
        ? "Relevant RUAS/HR contacts"
        : "")
  );
  const [targetDate, setTargetDate] = useState<string>(initialTargetIso);
  const [targetNote, setTargetNote] = useState<string>(initialTimelineNote);
  const [status, setStatus] = useState<string>(existingStatus);
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>(
    normalizeIsoDate(action?.next_followup_date, "")
  );
  const [vcDecisionRequired, setVcDecisionRequired] = useState<string>(
    action?.vc_decision_required === "Yes" || action?.vc_attention === true ? "Yes" : "No"
  );
  const [progressUpdate, setProgressUpdate] = useState<string>("");
  const [progressDate, setProgressDate] = useState<string>(todayIso);

  // Explicit "Action Taken" field for Open / In Progress / Closed visibility
  const [actionTakenText, setActionTakenText] = useState<string>(
    action?.closure_remarks ||
      action?.decision_action ||
      action?.remarks ||
      action?.next_action ||
      ""
  );

  const [closureDate, setClosureDate] = useState<string>(
    normalizeIsoDate(action?.closure_date, todayIso)
  );
  const [closureRemarks, setClosureRemarks] = useState<string>(
    action?.closure_remarks || action?.decision_action || action?.remarks || ""
  );
  const [reopenReason, setReopenReason] = useState<string>("");
  const [vcDecisionNote, setVcDecisionNote] = useState<string>(
    action?.decision_action || ""
  );
  const [vcDecisionDate, setVcDecisionDate] = useState<string>(todayIso);
  const [author, setAuthor] = useState<string>(currentUserName || "Executive Secretariat");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const supp = parseSupportSelections(
      action?.supporting_departments || action?.support_from || ""
    );
    const rawTl = String(action?.target_date || action?.timeline || "").trim();
    const tlIso = normalizeIsoDate(rawTl, "");
    const st = normalizeStatusValue(action?.status);

    setReviewMeetingDate(normalizeIsoDate(action?.review_meeting_date, "2026-10-12"));
    setReviewFrequency(
      action?.review_frequency ||
        (String(action?.review_week || "").toLowerCase().includes("month") ? "Monthly" : "Weekly")
    );
    setDepartmentId(
      Number(action?.department_id) || Number(defaultDepartmentId) || (departments[0]?.id ?? 7)
    );
    setOwner(action?.ownership || action?.owner || action?.hiring_lead || "");
    setPriority(PRIORITIES.includes(action?.priority) ? action.priority : "High");
    setActionItem(action?.action_point || action?.deliverable || action?.position_title || "");
    setSupportFrom(supp.selected);
    const defaultOthers =
      supp.othersText ||
      (mode === "edit" && String(action?.ownership || "").toLowerCase().includes("ruas/hr")
        ? "Relevant RUAS/HR contacts"
        : "");
    setOthersChecked(supp.othersChecked || Boolean(defaultOthers));
    setSupportOthers(defaultOthers);
    setTargetDate(tlIso);
    setTargetNote(!tlIso && rawTl ? rawTl : "");
    setStatus(st);
    setNextFollowUpDate(normalizeIsoDate(action?.next_followup_date, ""));
    setVcDecisionRequired(
      action?.vc_decision_required === "Yes" || action?.vc_attention === true ? "Yes" : "No"
    );
    setProgressUpdate("");
    setProgressDate(todayIso);
    setActionTakenText(
      action?.closure_remarks ||
        action?.decision_action ||
        action?.remarks ||
        action?.next_action ||
        ""
    );
    setClosureDate(normalizeIsoDate(action?.closure_date, todayIso));
    setClosureRemarks(action?.closure_remarks || action?.decision_action || action?.remarks || "");
    setReopenReason("");
    setVcDecisionNote(action?.decision_action || "");
    setVcDecisionDate(todayIso);
    setAuthor(currentUserName || "Executive Secretariat");
    setError(null);
  }, [open, action, mode, defaultDepartmentId, currentUserName]);

  if (!open) return null;

  const isClosing = status === "Closed" || status === "Completed";
  const isReopening = mode === "edit" && wasAlreadyClosed && !isClosing;

  const toggleSupport = (option: string) => {
    setSupportFrom((prev) =>
      prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option]
    );
  };

  // Parse history
  let historyList: any[] = [];
  if (Array.isArray(action?.updates_list) && action.updates_list.length > 0) {
    historyList = action.updates_list;
  } else if (Array.isArray(action?.action_history)) {
    historyList = action.action_history;
  } else if (typeof action?.action_history === "string") {
    try {
      const parsed = JSON.parse(action.action_history);
      if (Array.isArray(parsed)) historyList = parsed;
    } catch {
      historyList = [];
    }
  }

  const latestRemark =
    historyList[0]?.remarks ||
    action?.remarks ||
    action?.decision_action ||
    action?.closure_remarks ||
    "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!actionItem.trim()) {
      setError("Action Item / Deliverable is required.");
      return;
    }
    if (!owner.trim()) {
      setError("Action Owner is required.");
      return;
    }
    if (!author.trim()) {
      setError("Please enter your name so the change can be recorded in the audit log.");
      return;
    }
    if (isClosing && !(closureRemarks.trim() || progressUpdate.trim() || actionTakenText.trim())) {
      setError("Please add closure remarks / action taken before marking this action as Closed.");
      return;
    }
    if (isReopening && !(reopenReason.trim() || progressUpdate.trim())) {
      setError("Please provide a reason for reopening this closed action.");
      return;
    }

    const combinedSupport = [
      ...supportFrom,
      ...(othersChecked && supportOthers.trim()
        ? supportOthers
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : []),
    ].join(", ");

    // Match supporting department IDs if any department name is in combinedSupport
    const matchedDeptIds = departments
      .filter((d) => combinedSupport.toLowerCase().includes(d.name.toLowerCase()))
      .map((d) => String(d.id))
      .join(",");

    const finalTimeline = targetDate || targetNote || "Immediate";

    // Determine rag_status from status & priority
    let computedRag = action?.rag_status || "GREEN";
    if (status === "Blocked") computedRag = "RED";
    else if (status === "Delayed" || status === "On Hold") computedRag = "AMBER";
    else if (status === "Closed" || status === "Completed" || status === "On Track") computedRag = "GREEN";
    else if (priority === "Critical") computedRag = "RED";
    else if (priority === "High") computedRag = "AMBER";

    const finalRemarks =
      progressUpdate.trim() ||
      (isClosing ? closureRemarks.trim() : "") ||
      (isReopening ? `Reopened: ${reopenReason.trim()}` : "") ||
      actionTakenText.trim() ||
      action?.remarks ||
      "";

    const finalActionTaken = isClosing
      ? closureRemarks.trim() || actionTakenText.trim() || finalRemarks
      : vcDecisionNote.trim() || actionTakenText.trim() || action?.decision_action || finalRemarks;

    setSubmitting(true);
    try {
      // Check if this is an HR recruitment table record without a workstream id
      const isRecruitmentRecord =
        Boolean(action?.is_hr_item || action?.position_id) && !action?.deliverable && action?.id;

      if (mode === "edit" && isRecruitmentRecord) {
        const targetDept = departments.find((d) => Number(d.id) === Number(departmentId));
        const res = await fetch(`/api/recruitment/${action.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            position_title: actionItem.trim(),
            strategic_segment: targetDept?.name || action.strategic_segment || "HR & Recruitment",
            priority,
            hiring_lead: owner.trim(),
            target_date: finalTimeline,
            status,
            remarks: finalRemarks,
            next_action: finalActionTaken,
            rag_status: computedRag,
            vc_decision_required: vcDecisionRequired,
            vc_attention: vcDecisionRequired === "Yes",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update action");
        onSaved(data.position || data);
        onClose();
        return;
      }

      const payload = {
        item_id: mode === "edit" ? action?.item_id : undefined,
        department_id: Number(departmentId),
        category: action?.category || `${reviewFrequency} Review`,
        deliverable: actionItem.trim(),
        action_point: actionItem.trim(),
        owner: owner.trim(),
        ownership: owner.trim(),
        priority,
        target_date: finalTimeline,
        timeline: finalTimeline,
        status,
        rag_status: computedRag,
        supporting_departments: combinedSupport,
        supporting_department_ids: matchedDeptIds,
        next_followup_date: nextFollowUpDate,
        vc_decision_required: vcDecisionRequired,
        remarks: finalRemarks,
        decision_action: finalActionTaken,
        closure_remarks: isClosing
          ? closureRemarks.trim() || actionTakenText.trim() || finalRemarks
          : "",
        closure_date: isClosing ? closureDate || todayIso : null,
        review_meeting_date: reviewMeetingDate || "2026-10-12",
        review_week: `${reviewFrequency} Review (${reviewMeetingDate || "2026-10-12"})`,
        meeting_context: `${reviewFrequency} Management Review - ${reviewMeetingDate || "2026-10-12"}`,
        updated_by: author.trim(),
        progress_date: progressDate,
      };

      const url =
        mode === "edit" && action?.id ? `/api/workstreams/${action.id}` : "/api/workstreams";
      const method = mode === "edit" && action?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save action");
      }
      onSaved(data.workstream || data);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save action.");
    } finally {
      setSubmitting(false);
    }
  };

  // Status banner styling to clearly show what action was taken for Closed, Open, or In Progress
  const statusUpper = status.toUpperCase();
  const isClosedBanner = statusUpper === "CLOSED" || statusUpper === "COMPLETED";
  const isInProgressBanner = statusUpper === "IN PROGRESS" || statusUpper === "ON TRACK";
  const isDelayedOrBlocked = statusUpper === "DELAYED" || statusUpper === "BLOCKED";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 backdrop-blur-[1px] sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative my-auto w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-2xl">
        {/* Header matching Image 1 */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {mode === "create" ? "Add New Action Item" : `Edit action ${existingCode}`}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {mode === "create"
                ? "Add a new action item to the weekly register. A serial code is assigned automatically."
                : "Update this week’s progress, follow-up and status. Earlier updates and the original record are kept in the history."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {error}
            </div>
          )}

          {/* Clear "What Action Was Taken" Status Banner for Closed / Open / In Progress */}
          <div
            className={`rounded-lg border px-4 py-3 ${
              isClosedBanner
                ? "border-emerald-300 bg-emerald-50/70"
                : isInProgressBanner
                  ? "border-blue-200 bg-blue-50/60"
                  : isDelayedOrBlocked
                    ? "border-rose-200 bg-rose-50/60"
                    : "border-amber-200 bg-amber-50/60"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {isClosedBanner ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : isDelayedOrBlocked ? (
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                ) : (
                  <Clock className="h-4 w-4 text-blue-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Current Status:{" "}
                  <span
                    className={
                      isClosedBanner
                        ? "text-emerald-700"
                        : isInProgressBanner
                          ? "text-blue-700"
                          : isDelayedOrBlocked
                            ? "text-rose-700"
                            : "text-amber-800"
                    }
                  >
                    {status}
                  </span>
                </span>
              </div>
              {action?.updated_at && (
                <span className="text-[11px] font-medium text-slate-500">
                  Last updated: {String(action.updated_at).slice(0, 10)}{" "}
                  {action?.updated_by ? `by ${action.updated_by}` : ""}
                </span>
              )}
            </div>
            <div className="mt-1.5 text-xs text-slate-700">
              <span className="font-semibold text-slate-900">
                {isClosedBanner
                  ? "Action Taken (Closed / Completed): "
                  : isInProgressBanner
                    ? "Action Taken (In Progress): "
                    : "Action Taken (Open / Active Directive): "}
              </span>
              <span>
                {isClosedBanner
                  ? closureRemarks ||
                    actionTakenText ||
                    latestRemark ||
                    "Action completed and verified during management review."
                  : actionTakenText ||
                    latestRemark ||
                    "Action registered and assigned to owner for execution."}
              </span>
            </div>
          </div>

          {/* Main Grid matching Image 1 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Row 1: Sl.No., Review Meeting Date, Review Frequency */}
            <div>
              <label className="block text-xs font-medium text-slate-700">Sl.No.</label>
              <input
                disabled
                value={`${existingCode} (assigned automatically)`}
                className="mt-1 w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 font-mono text-sm text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Review Meeting Date *
              </label>
              <input
                type="date"
                value={reviewMeetingDate}
                onChange={(e) => setReviewMeetingDate(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Review Frequency *
              </label>
              <select
                value={reviewFrequency}
                onChange={(e) => setReviewFrequency(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              >
                {REVIEW_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 2: Department, Action Owner, Priority */}
            <div>
              <label className="block text-xs font-medium text-slate-700">Department *</label>
              <select
                value={departmentId}
                onChange={(e) => {
                  const newDeptId = Number(e.target.value);
                  setDepartmentId(newDeptId);
                  const matchedDept = departments.find((d) => Number(d.id) === newDeptId);
                  if (
                    mode === "create" &&
                    matchedDept?.head_of_department &&
                    matchedDept.head_of_department.toLowerCase() !== "to be hired"
                  ) {
                    setOwner(matchedDept.head_of_department);
                  }
                }}
                required
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.head_of_department ? `— HOD: ${d.head_of_department}` : ""}
                  </option>
                ))}
              </select>
              {(() => {
                const selectedDeptObj = departments.find((d) => Number(d.id) === Number(departmentId));
                const deptHod = selectedDeptObj?.head_of_department;
                if (!deptHod) return null;
                return (
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">
                      HOD: <strong className="text-blue-700">{deptHod}</strong>
                    </span>
                    {deptHod.toLowerCase() !== "to be hired" && owner !== deptHod && (
                      <button
                        type="button"
                        onClick={() => setOwner(deptHod)}
                        className="font-bold text-orange-600 hover:text-blue-700 underline"
                      >
                        Assign to HOD
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Action Owner *</label>
              <input
                list="owner-options"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                required
                placeholder="Select HOD or type owner name(s)"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              />
              <datalist id="owner-options">
                {Array.from(
                  new Set([
                    ...departments
                      .map((d) => d.head_of_department)
                      .filter((h): h is string => Boolean(h && h.toLowerCase() !== "to be hired")),
                    ...STAFF_DIRECTORY,
                  ])
                ).map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <span className="mt-1 block text-[11px] text-slate-500">
                Linked to Department HOD & staff list, or type any name.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Priority *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 3: Action Item / Deliverable */}
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-700">
                Action Item / Deliverable *
              </label>
              <textarea
                rows={3}
                value={actionItem}
                onChange={(e) => setActionItem(e.target.value)}
                required
                placeholder="Describe the concrete action or deliverable agreed in the review meeting"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </div>

            {/* Row 4: Support Required From */}
            <div className="md:col-span-3">
              <span className="block text-xs font-medium text-slate-700">
                Support Required From
              </span>
              <div className="mt-1 grid grid-cols-1 gap-x-4 gap-y-2 rounded-md border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-2 md:grid-cols-4">
                {SUPPORT_OPTIONS.map((option) => (
                  <label
                    key={option}
                    className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={supportFrom.includes(option)}
                      onChange={() => toggleSupport(option)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />
                    <span>{option}</span>
                  </label>
                ))}
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={othersChecked}
                    onChange={(e) => setOthersChecked(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                  />
                  <span>Others — enter name</span>
                </label>
              </div>
              {othersChecked && (
                <div className="mt-2">
                  <span className="block text-xs font-medium text-slate-700">
                    Other people or teams
                  </span>
                  <input
                    value={supportOthers}
                    onChange={(e) => setSupportOthers(e.target.value)}
                    placeholder="Type one or more names, separated by commas"
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                  <span className="mt-1 block text-[11px] text-slate-500">
                    Separate several names with commas.
                  </span>
                </div>
              )}
            </div>

            {/* Row 5: Completion Date / Target Date, Status, Next Follow-up Date */}
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Completion Date / Target Date *
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required={!targetNote}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              />
              <span className="mt-1 block text-[11px] text-slate-500">
                Not reset on carry-forward. Changes are logged.
                {targetNote && !targetDate ? ` (Current timeline: ${targetNote})` : ""}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              >
                {ACTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Next Follow-up Date
              </label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </div>

            {/* Row 6: Vice Chairman Decision Required + Progress Update / Remarks (this week) */}
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Vice Chairman Decision Required *
              </label>
              <select
                value={vcDecisionRequired}
                onChange={(e) => setVcDecisionRequired(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700">
                {mode === "create"
                  ? "Initial Progress / Remarks"
                  : "Progress Update / Remarks (this week)"}
              </label>
              <textarea
                rows={3}
                value={progressUpdate}
                onChange={(e) => setProgressUpdate(e.target.value)}
                placeholder={
                  mode === "create"
                    ? "Initial context, dependencies or remarks from the review meeting"
                    : "Progress, blockers and dependencies since the last review"
                }
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              />
              {mode === "edit" && latestRemark && (
                <span className="mt-1 block text-[11px] text-slate-500">
                  Latest: “{latestRemark}”
                </span>
              )}
            </div>

            {/* Row 7: Update for meeting dated + Action Taken (Open / In Progress / Closed) */}
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Update for meeting dated
              </label>
              <input
                type="date"
                value={progressDate}
                onChange={(e) => setProgressDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700">
                Action Taken ({status}) — Summary of Execution / Resolution
              </label>
              <input
                type="text"
                value={actionTakenText}
                onChange={(e) => setActionTakenText(e.target.value)}
                placeholder="State clearly what action was taken (for Open, In Progress, or Closed status)"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
              />
              <span className="mt-1 block text-[11px] text-slate-500">
                Clearly shows what action was taken while this item is {status}.
              </span>
            </div>

            {/* Conditional Close Action Box */}
            {isClosing && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50/60 p-3 md:col-span-3">
                <div className="mb-2 text-xs font-semibold text-emerald-900">
                  Close action — Record Final Action Taken & Delivery
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <span className="block text-xs font-medium text-slate-700">
                      Actual closure date *
                    </span>
                    <input
                      type="date"
                      value={closureDate}
                      onChange={(e) => setClosureDate(e.target.value)}
                      required
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <span className="block text-xs font-medium text-slate-700">
                      Closure remarks / Action taken *
                    </span>
                    <input
                      value={closureRemarks}
                      onChange={(e) => setClosureRemarks(e.target.value)}
                      required
                      placeholder="What was delivered or decided. The target date is kept as it was."
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Reopen Box */}
            {isReopening && (
              <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-3 md:col-span-3">
                <span className="block text-xs font-semibold text-amber-900">
                  Reason for reopening *
                </span>
                <input
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  required
                  placeholder="Why this closed action is being returned to the active register"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            )}

            {/* Conditional Vice Chairman Decision Box */}
            {vcDecisionRequired === "Yes" && (
              <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-3 md:col-span-3">
                <div className="mb-2 text-xs font-semibold text-amber-900">
                  Record Vice Chairman decision (optional)
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <span className="block text-xs font-medium text-slate-700">Decision</span>
                    <input
                      value={vcDecisionNote}
                      onChange={(e) => setVcDecisionNote(e.target.value)}
                      placeholder="Decision, direction or approval recorded by the Vice Chairman"
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-700">
                      Decision date
                    </span>
                    <input
                      type="date"
                      value={vcDecisionDate}
                      onChange={(e) => setVcDecisionDate(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Audit Author & History Section matching Image 1 */}
          <div className="space-y-3 border-t border-slate-200 pt-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="block text-xs font-medium text-slate-700">Your name *</span>
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                  placeholder="Your name or role"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
                />
                <span className="mt-1 block text-[11px] text-slate-500">
                  Recorded in the audit history.
                </span>
              </div>
            </div>

            {mode === "edit" && (
              <details className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <summary className="cursor-pointer text-xs font-medium text-slate-700">
                  Update history ({historyList.length})
                </summary>
                <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
                  {historyList.length === 0 ? (
                    <p className="text-xs text-slate-500">No updates recorded yet.</p>
                  ) : (
                    historyList.map((entry: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-md border border-slate-200 bg-white p-2.5 text-xs shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-800">
                            #{historyList.length - idx} · {entry.action || entry.status || "UPDATE"}{" "}
                            {entry.status ? `(${entry.status})` : ""}
                          </span>
                          <span>
                            {String(entry.date || entry.timestamp || "").slice(0, 10)} ·{" "}
                            {entry.user || entry.author || "System"}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-700">{entry.remarks || entry.note}</p>
                      </div>
                    ))
                  )}
                </div>
              </details>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting
                  ? "Saving…"
                  : mode === "create"
                    ? "Add action"
                    : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ActionHistorySheet({
  action,
  onClose,
  onEdit,
}: {
  action: any | null;
  onClose: () => void;
  onEdit: (action: any) => void;
}) {
  if (!action) return null;

  const code =
    action?.item_id ||
    action?.position_id ||
    `ACT-${String(action?.id || 1).padStart(2, "0")}`;

  let historyList: any[] = [];
  if (Array.isArray(action?.updates_list) && action.updates_list.length > 0) {
    historyList = action.updates_list;
  } else if (Array.isArray(action?.action_history)) {
    historyList = action.action_history;
  } else if (typeof action?.action_history === "string") {
    try {
      const parsed = JSON.parse(action.action_history);
      if (Array.isArray(parsed)) historyList = parsed;
    } catch {
      historyList = [];
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900">{code}</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {action.department_name || action.strategic_segment || "Department"}
              </span>
              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {action.status || "Open"}
              </span>
              <span className="rounded bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">
                {action.priority || "Medium"}
              </span>
            </div>
            <h2 className="mt-1.5 text-sm font-semibold text-slate-900">
              {action.action_point || action.deliverable || action.position_title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(action);
              }}
              className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs sm:grid-cols-3">
            <div>
              <div className="text-slate-500">Owner</div>
              <div className="mt-0.5 font-medium text-slate-900">
                {action.ownership || action.owner || action.hiring_lead || "—"}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Support required from</div>
              <div className="mt-0.5 font-medium text-slate-900">
                {action.supporting_departments || "—"}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Review meeting</div>
              <div className="mt-0.5 font-medium text-slate-900">
                {String(action.review_meeting_date || "2026-10-12").slice(0, 10)} (
                {action.review_frequency || "Weekly"})
              </div>
            </div>
            <div>
              <div className="text-slate-500">Target date</div>
              <div className="mt-0.5 font-medium text-slate-900">
                {action.target_date || action.timeline || "—"}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Next follow-up</div>
              <div className="mt-0.5 font-medium text-slate-900">
                {action.next_followup_date || "—"}
              </div>
            </div>
            <div>
              <div className="text-slate-500">VC decision required</div>
              <div className="mt-0.5 font-medium text-slate-900">
                {action.vc_decision_required || "No"}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-3 border-t border-slate-200 pt-2">
              <div className="text-slate-500 font-semibold">
                Action Taken ({action.status || "Open"})
              </div>
              <div className="mt-0.5 font-medium text-slate-900">
                {action.closure_remarks ||
                  action.decision_action ||
                  action.remarks ||
                  "Action registered and under weekly review."}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Weekly / monthly progress updates ({historyList.length})
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Latest update on top. Previous updates are kept so progress can be followed week by week.
            </p>
            <div className="mt-2 space-y-2">
              {historyList.length === 0 ? (
                <p className="text-xs text-slate-500">No progress updates recorded.</p>
              ) : (
                historyList.map((u: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-800">
                        Update #{historyList.length - idx} · {u.status || action.status}
                      </span>
                      <span>
                        {String(u.date || u.timestamp || "").slice(0, 10)} ·{" "}
                        {u.user || u.author || "System"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-slate-800 leading-relaxed">
                      {u.remarks || u.note}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
