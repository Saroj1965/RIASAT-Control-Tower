"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  FileText,
  Filter,
  Search,
  Send,
  HelpCircle,
  Check,
  Calendar,
  Layers,
  ChevronDown,
  History,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { WORKSTREAM_STATUSES, RAG_STATUSES, RECRUITMENT_PRIORITIES, RECRUITMENT_STATUSES } from "@/lib/constants";
import { getCurrentReviewMeetingDate, getReviewWeekLabel } from "@/lib/action-helpers";

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return "--";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function DepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const deptId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [deptData, setDeptData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dynamic Form state
  const [formConfig, setFormConfig] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [savingForm, setSavingForm] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string>("SUBMITTED");

  // Fallback Overview Form state
  const [readiness, setReadiness] = useState<number>(0);
  const [rag, setRag] = useState<string>("NOT STARTED");
  const [keyFocus, setKeyFocus] = useState<string>("");

  // Workstream Filter states
  const [wsStatusFilter, setWsStatusFilter] = useState<string>("ALL");
  const [wsRagFilter, setWsRagFilter] = useState<string>("ALL");
  const [wsVcFilter, setWsVcFilter] = useState<string>("ALL");
  const [wsSearch, setWsSearch] = useState<string>("");
  const [wsCycleFilter, setWsCycleFilter] = useState<"ALL" | "CARRIED" | "NEW" | "BLOCKED" | "VC">("ALL");

  // Recruitment Filter states (HR)
  const [recStatusFilter, setRecStatusFilter] = useState<string>("ALL");
  const [recPriorityFilter, setRecPriorityFilter] = useState<string>("ALL");
  const [recVcFilter, setRecVcFilter] = useState<string>("ALL");
  const [recSearch, setRecSearch] = useState<string>("");

  // Action View Tabs & Closure / History modals
  const [actionViewTab, setActionViewTab] = useState<"OPEN" | "CLOSED">("OPEN");
  const [closingAction, setClosingAction] = useState<any | null>(null);
  const [closureRemarks, setClosureRemarks] = useState<string>("");
  const [showHistoryModal, setShowHistoryModal] = useState<any | null>(null);
  const [wsOverdueFilter, setWsOverdueFilter] = useState<boolean>(false);

  // Detailed Filter and Pagination states
  const [wsMeetingDateFilter, setWsMeetingDateFilter] = useState<string>("ALL");
  const [wsOwnerFilter, setWsOwnerFilter] = useState<string>("ALL");
  const [wsPriorityFilter, setWsPriorityFilter] = useState<string>("ALL");
  const [wsDeptFilter, setWsDeptFilter] = useState<string>("ALL");
  const [wsRoleFilter, setWsRoleFilter] = useState<"ALL" | "LEAD" | "SUPPORTING">("ALL");
  const [wsPageSize, setWsPageSize] = useState<number | "ALL">(25);
  const [wsCurrentPage, setWsCurrentPage] = useState<number>(1);

  // Modal state for Action Tracker
  const [showWsModal, setShowWsModal] = useState(false);
  const [editingWs, setEditingWs] = useState<any>(null);
  const [wsForm, setWsForm] = useState({
    item_id: "",
    department_id: deptId,
    category: "Operational Initiative",
    action_point: "",
    ownership: "",
    timeline: "",
    priority: "Medium",
    status: "OPEN",
    rag_status: "AMBER",
    remarks: "",
    vc_decision_required: "No",
    decision_action: "",
    supporting_departments: "",
    supporting_department_ids: "",
    next_followup_date: "",
    closure_remarks: "",
    review_meeting_date: "2026-10-12",
    review_week: "Week 42 (12 Oct 2026)",
  });

  // Modal & inline state for Recruitment Tracker (HR)
  const [showRecModal, setShowRecModal] = useState(false);
  const [showInlineRecForm, setShowInlineRecForm] = useState(true);
  const [editingRec, setEditingRec] = useState<any>(null);
  const [recForm, setRecForm] = useState({
    position_title: "",
    strategic_segment: "Semicon",
    priority: "Critical",
    hiring_lead: "",
    target_date: "",
    status: "Candidate sourced",
    remarks: "",
    vc_decision_required: "No",
  });

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      setError(null);

      const [deptRes, formRes] = await Promise.all([
        fetch(`/api/departments/${deptId}`),
        fetch(`/api/departments/${deptId}/form`),
      ]);

      if (!deptRes.ok) {
        const errJson = await deptRes.json();
        throw new Error(errJson.error || "Failed to load department");
      }
      const data = await deptRes.json();
      setDeptData(data);
      setReadiness(data.overview.readiness_percentage || 0);
      setRag(data.overview.rag_status || "NOT STARTED");
      setKeyFocus(data.overview.key_focus || "");

      if (data.nextItemId && !editingWs) {
        setWsForm((prev) => ({
          ...prev,
          item_id: prev.item_id || data.nextItemId,
          department_id: prev.department_id || deptId,
          ownership: prev.ownership || (data.department?.name ? `${data.department.name} Head` : "Lead Owner"),
        }));
      }

      if (formRes.ok) {
        const formData = await formRes.json();
        setFormConfig(formData);
        setSubmissionStatus(formData.submission_status || "SUBMITTED");

        // Populate initial field values
        const initialVals: Record<string, string> = {};
        if (formData.fields && Array.isArray(formData.fields)) {
          for (const f of formData.fields) {
            const valObj = formData.values?.[f.id];
            if (valObj && valObj.value !== undefined) {
              initialVals[f.id.toString()] = valObj.value;
            } else if (f.field_key === "readiness_score") {
              initialVals[f.id.toString()] = (data.overview.readiness_percentage || 0).toString();
            } else if (f.field_key === "rag_status") {
              initialVals[f.id.toString()] = data.overview.rag_status || "NOT STARTED";
            } else if (f.field_key === "vc_focus_decision") {
              initialVals[f.id.toString()] = data.overview.key_focus || "";
            } else {
              initialVals[f.id.toString()] = "";
            }
          }
        }
        setFormValues(initialVals);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deptId) {
      fetchDepartment();
    }
  }, [deptId]);

  // Handle saving Dynamic Form (Draft or Submit)
  const handleSaveDynamicForm = async (status: "DRAFT" | "SUBMITTED") => {
    if (!deptData?.canEdit) return;

    try {
      setSavingForm(true);
      setError(null);

      const res = await fetch(`/api/departments/${deptId}/form`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: formValues,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save form");

      setSubmissionStatus(status);
      setSuccessMsg(
        status === "SUBMITTED"
          ? "Department updates successfully submitted to Executive Dashboard!"
          : "Draft saved successfully. Updates are preserved and flagged as Draft."
      );
      setTimeout(() => setSuccessMsg(null), 5000);
      fetchDepartment();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingForm(false);
    }
  };

  // Open modal for editing Action Point
  const openEditWsModal = (ws: any) => {
    setEditingWs(ws);
    const rDate = ws.review_meeting_date ? ws.review_meeting_date.substring(0, 10) : (deptData?.currentReviewMeetingDate || "2026-10-12");
    const rWeek = ws.review_week || getReviewWeekLabel(rDate);
    setWsForm({
      item_id: ws.item_id || "",
      department_id: ws.department_id || deptId,
      category: ws.category || "Operational Initiative",
      action_point: ws.action_point || ws.deliverable || "",
      ownership: ws.ownership || ws.owner || "",
      timeline: ws.timeline || ws.target_date || "",
      priority: ws.priority || "Medium",
      status: ws.status || "OPEN",
      rag_status: (ws.rag_status || (["Delayed", "Blocked"].includes(ws.status) ? "AMBER" : "GREEN")).toUpperCase(),
      remarks: ws.remarks || ws.risks_blockers || "",
      vc_decision_required: ws.vc_decision_required === "Yes" ? "Yes" : "No",
      decision_action: ws.decision_action || "",
      supporting_departments: ws.supporting_departments || "",
      supporting_department_ids: ws.supporting_department_ids || "",
      next_followup_date: ws.next_followup_date || "",
      closure_remarks: ws.closure_remarks || "",
      review_meeting_date: rDate,
      review_week: rWeek,
    });
    setShowWsModal(true);
  };

  // Cancel Edit Action and reset form
  const cancelEditWs = () => {
    setEditingWs(null);
    const initialDate = deptData?.currentReviewMeetingDate || getCurrentReviewMeetingDate();
    const initialWeek = deptData?.currentReviewWeek || getReviewWeekLabel(initialDate);
    setWsForm({
      item_id: deptData?.nextItemId || "",
      department_id: deptId,
      category: "Operational Initiative",
      action_point: "",
      ownership: deptData?.department?.name ? `${deptData.department.name} Head` : "Lead Owner",
      timeline: "",
      priority: "Medium",
      status: "OPEN",
      rag_status: "AMBER",
      remarks: "",
      vc_decision_required: "No",
      decision_action: "",
      supporting_departments: "",
      supporting_department_ids: "",
      next_followup_date: "",
      closure_remarks: "",
      review_meeting_date: initialDate,
      review_week: initialWeek,
    });
  };

  // Open modal for creating a new Action Point
  const openNewWsModal = () => {
    cancelEditWs();
    setShowWsModal(true);
  };



  // Toggle Supporting Department in wsForm
  const toggleSupportingDept = (deptName: string) => {
    const current = wsForm.supporting_departments
      ? wsForm.supporting_departments.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];
    const updated = current.includes(deptName)
      ? current.filter((s: string) => s !== deptName)
      : [...current, deptName];
    setWsForm((prev) => ({ ...prev, supporting_departments: updated.join(", ") }));
  };

  // Quick Status change from table row
  const handleQuickStatusChange = async (ws: any, newStatus: string) => {
    if (newStatus === "CLOSED" || newStatus === "COMPLETED") {
      setClosingAction(ws);
      setClosureRemarks("");
      return;
    }
    try {
      const res = await fetch(`/api/workstreams/${ws.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setSuccessMsg(`Status of ${ws.item_id || 'action'} updated to ${newStatus}`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchDepartment();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Confirm Closure of an Action
  const handleConfirmClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingAction) return;

    try {
      const res = await fetch(`/api/workstreams/${closingAction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CLOSED",
          closure_remarks: closureRemarks || "Action formally completed and closed during review",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to close action");

      setSuccessMsg(`Action [${closingAction.item_id || closingAction.id}] has been CLOSED and moved to Closed Actions / History.`);
      setTimeout(() => setSuccessMsg(null), 5000);
      setClosingAction(null);
      setClosureRemarks("");
      fetchDepartment();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Reopen an Action
  const handleReopenAction = async (ws: any) => {
    if (!confirm(`Reopen action [${ws.item_id || ws.id}] back into Open Action Items?`)) return;

    try {
      const res = await fetch(`/api/workstreams/${ws.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "OPEN",
          closure_remarks: "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reopen action");

      setSuccessMsg(`Action [${ws.item_id || ws.id}] reopened successfully and restored to Open Action Items.`);
      setTimeout(() => setSuccessMsg(null), 5000);
      fetchDepartment();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Save Action Point (Create or Update)
  const handleSaveWorkstream = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);

    try {
      const url = editingWs ? `/api/workstreams/${editingWs.id}` : "/api/workstreams";
      const method = editingWs ? "PUT" : "POST";
      const payload = editingWs
        ? wsForm
        : { ...wsForm, department_id: wsForm.department_id || deptId };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save action item");

      setShowWsModal(false);
      const savedItemId = editingWs?.item_id || data.workstream?.item_id || wsForm.item_id;
      setEditingWs(null);

      // Prepare wsForm for the next entry
      setWsForm({
        item_id: "",
        department_id: deptId,
        category: "Operational Initiative",
        action_point: "",
        ownership: deptData?.department?.name ? `${deptData.department.name} Head` : "Lead Owner",
        timeline: "",
        priority: "Medium",
        status: "OPEN",
        rag_status: "AMBER",
        remarks: "",
        vc_decision_required: "No",
        decision_action: "",
        supporting_departments: "",
        supporting_department_ids: "",
        next_followup_date: "",
        closure_remarks: "",
        review_meeting_date: deptData?.currentReviewMeetingDate || getCurrentReviewMeetingDate(),
        review_week: deptData?.currentReviewWeek || getReviewWeekLabel(deptData?.currentReviewMeetingDate || getCurrentReviewMeetingDate()),
      });

      setSuccessMsg(
        editingWs
          ? `Action item ${savedItemId} updated successfully!`
          : `Action item ${savedItemId} saved successfully and added to ${deptData?.department?.name || 'department'}!`
      );
      setTimeout(() => setSuccessMsg(null), 5000);
      await fetchDepartment();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Delete Workstream
  const handleDeleteWorkstream = async (wsId: number) => {
    if (!confirm("Are you sure you want to delete this workstream record?")) return;

    try {
      const res = await fetch(`/api/workstreams/${wsId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete workstream");

      setSuccessMsg("Workstream deleted successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchDepartment();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Recruitment modal handlers (HR)
  const openNewRecModal = () => {
    setEditingRec(null);
    setRecForm({
      position_title: "",
      strategic_segment: "Semicon",
      priority: "Critical",
      hiring_lead: "HR Talent Lead",
      target_date: new Date().toISOString().split("T")[0],
      status: "Candidate sourced",
      remarks: "",
      vc_decision_required: "No",
    });
    setShowRecModal(true);
  };

  const openEditRecModal = (rec: any) => {
    setEditingRec(rec);
    setRecForm({
      position_title: rec.position_title || rec.position_role || "",
      strategic_segment: rec.strategic_segment || rec.department_vertical || "Semicon",
      priority: rec.priority || "Critical",
      hiring_lead: rec.hiring_lead || rec.hiring_owner || "",
      target_date: rec.target_date || rec.target_joining_date || "",
      status: rec.status || rec.recruitment_status || "Candidate sourced",
      remarks: rec.remarks || rec.key_issue || "",
      vc_decision_required: rec.vc_decision_required === "Yes" || rec.vc_attention === true ? "Yes" : "No",
    });
    setShowRecModal(true);
  };

  const handleSaveRecruitment = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);

    try {
      const url = editingRec ? `/api/recruitment/${editingRec.id}` : "/api/recruitment";
      const method = editingRec ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save position");

      setShowRecModal(false);
      setEditingRec(null);
      setRecForm({
        position_title: "",
        strategic_segment: "Semicon",
        priority: "Critical",
        hiring_lead: "HR Talent Lead",
        target_date: new Date().toISOString().split("T")[0],
        status: "Candidate sourced",
        remarks: "",
        vc_decision_required: "No",
      });

      setSuccessMsg(editingRec ? "Position updated successfully!" : "New position created successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchDepartment();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteRecruitment = async (recId: number) => {
    if (!confirm("Are you sure you want to delete this recruitment record?")) return;

    try {
      const res = await fetch(`/api/recruitment/${recId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete position");

      setSuccessMsg("Position record deleted successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchDepartment();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold mt-4">Loading department operational workspace...</p>
      </div>
    );
  }

  if (error && !deptData) {
    return (
      <div className="max-w-lg mx-auto my-12 p-6 bg-white rounded-2xl border border-rose-200 shadow-md text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Access Restricted</h2>
        <p className="text-xs text-rose-600 mt-2">{error}</p>
        <Link
          href="/executive"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Executive Tower</span>
        </Link>
      </div>
    );
  }

  const dept = deptData.department;
  const overview = deptData.overview;
  const items = deptData.items || deptData.workstreams || [];
  const recruitmentItems = deptData.recruitment || [];
  const isHR = dept.code === "HR_REC" || Number(dept.id) === 7;
  const isStrategyOps = dept.code === "STRATEGY_OPS" || Number(dept.id) === 9;
  const isComm = dept.code === "COMM" || Number(dept.id) === 8;
  const isTechnical = !isHR && !isStrategyOps && !isComm;
  const canEdit = deptData.canEdit;

  // Extract distinct categories for workstreams
  const availableCategories = Array.from(new Set(items.map((x: any) => x.category).filter(Boolean))) as string[];

  const isActionOverdue = (ws: any) => {
    if (["CLOSED", "Closed", "Completed"].includes(ws.status)) return false;
    if (ws.is_overdue !== undefined) return ws.is_overdue;
    if (ws.effective_rag === "RED" || ws.rag_status === "RED") return true;
    if (ws.status === "Delayed" || ws.status === "DELAYED") return true;
    if (ws.timeline && ws.timeline.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(ws.timeline).getTime() < Date.now();
    }
    if (ws.target_date && ws.target_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(ws.target_date).getTime() < Date.now();
    }
    return false;
  };

  const openActions = items.filter((ws: any) => !["CLOSED", "Closed"].includes(ws.status));
  const closedActions = items.filter((ws: any) => ["CLOSED", "Closed"].includes(ws.status));

  // Weekly Action Register & Carry-Forward counts
  const carriedForwardCount = openActions.filter(
    (ws: any) => ws.is_carried_forward || (ws.weeks_outstanding && ws.weeks_outstanding > 0)
  ).length;
  const newThisWeekCount = openActions.filter(
    (ws: any) => ws.is_new_this_week || (!ws.weeks_outstanding && !ws.is_carried_forward)
  ).length;
  const overdueCount = openActions.filter((ws: any) => isActionOverdue(ws) || ws.effective_rag === "RED").length;
  const blockedCount = openActions.filter((ws: any) => ws.status === "BLOCKED" || ws.status === "Blocked").length;
  const vcDecisionCount = openActions.filter((ws: any) => ws.vc_decision_required === "Yes").length;

  // Filter Action Points based on active tab, interactive buttons & search
  const displayedActions = actionViewTab === "OPEN" ? openActions : closedActions;

  // Extract distinct filter criteria for Action Register
  const distinctMeetingDates = Array.from(new Set(items.map((x: any) => (x.review_meeting_date || "").slice(0, 10)).filter(Boolean))) as string[];
  const distinctOwners = Array.from(new Set(items.map((x: any) => x.ownership || x.owner).filter(Boolean))) as string[];

  const filteredWorkstreams = displayedActions.filter((ws: any) => {
    if (wsStatusFilter !== "ALL" && ws.status !== wsStatusFilter) return false;
    const itemRag = (ws.effective_rag || ws.rag_status || (["Delayed", "Blocked"].includes(ws.status) ? "AMBER" : "GREEN")).toUpperCase();
    if (wsRagFilter !== "ALL" && itemRag !== wsRagFilter.toUpperCase()) return false;
    if (wsVcFilter === "YES" && ws.vc_decision_required !== "Yes") return false;
    if (wsOverdueFilter && !(isActionOverdue(ws) || itemRag === "RED")) return false;
    if (wsCycleFilter === "CARRIED" && !(ws.is_carried_forward || (ws.weeks_outstanding && ws.weeks_outstanding > 0))) return false;
    if (wsCycleFilter === "NEW" && !(ws.is_new_this_week || (!ws.weeks_outstanding && !ws.is_carried_forward))) return false;
    if (wsCycleFilter === "BLOCKED" && ws.status !== "BLOCKED" && ws.status !== "Blocked") return false;
    if (wsCycleFilter === "VC" && ws.vc_decision_required !== "Yes") return false;
    if (wsPriorityFilter !== "ALL" && (ws.priority || "Medium").toLowerCase() !== wsPriorityFilter.toLowerCase()) return false;
    if (wsMeetingDateFilter !== "ALL" && (ws.review_meeting_date || "").slice(0, 10) !== wsMeetingDateFilter) return false;
    if (wsOwnerFilter !== "ALL" && (ws.ownership || ws.owner || "") !== wsOwnerFilter) return false;
    if (wsDeptFilter !== "ALL" && String(ws.department_id) !== wsDeptFilter) return false;
    if (wsRoleFilter === "LEAD" && ws.department_id && Number(ws.department_id) !== Number(dept.id)) return false;
    if (wsRoleFilter === "SUPPORTING" && (!ws.department_id || Number(ws.department_id) === Number(dept.id))) return false;

    if (wsSearch.trim()) {
      const q = wsSearch.toLowerCase().trim();
      const matchId = (ws.item_id || "").toLowerCase().includes(q);
      const matchAction = (ws.action_point || ws.deliverable || "").toLowerCase().includes(q);
      const matchOwner = (ws.ownership || ws.owner || "").toLowerCase().includes(q);
      const matchRemarks = (ws.remarks || ws.decision_action || ws.risks_blockers || ws.closure_remarks || "").toLowerCase().includes(q);
      const matchTimeline = (ws.timeline || ws.target_date || "").toLowerCase().includes(q);
      const matchSupporting = (ws.supporting_departments || "").toLowerCase().includes(q);
      const matchWeek = (ws.review_week || "").toLowerCase().includes(q);
      if (!matchId && !matchAction && !matchOwner && !matchRemarks && !matchTimeline && !matchSupporting && !matchWeek) return false;
    }
    return true;
  });

  // Pagination calculation
  const totalActionPages = wsPageSize === "ALL" ? 1 : Math.ceil(filteredWorkstreams.length / (wsPageSize as number)) || 1;
  const paginatedWorkstreams = wsPageSize === "ALL"
    ? filteredWorkstreams
    : filteredWorkstreams.slice((wsCurrentPage - 1) * (wsPageSize as number), wsCurrentPage * (wsPageSize as number));

  // Filter Recruitment positions (HR)
  const filteredRecruitment = recruitmentItems.filter((r: any) => {
    if (recStatusFilter !== "ALL" && r.status !== recStatusFilter) return false;
    if (recPriorityFilter !== "ALL" && r.priority !== recPriorityFilter) return false;
    if (recVcFilter === "VC_ONLY" && r.vc_decision_required !== "Yes" && !r.vc_attention) return false;
    if (recSearch.trim()) {
      const q = recSearch.toLowerCase();
      const matchTitle = (r.position_title || "").toLowerCase().includes(q);
      const matchDept = (r.strategic_segment || "").toLowerCase().includes(q);
      const matchLead = (r.hiring_lead || "").toLowerCase().includes(q);
      const matchRemarks = (r.remarks || "").toLowerCase().includes(q);
      const matchDate = (r.target_date || "").toLowerCase().includes(q);
      if (!matchTitle && !matchDept && !matchLead && !matchRemarks && !matchDate) return false;
    }
    return true;
  });

  // Calculate quick metrics
  const openCount = openActions.length;
  const completedCount = closedActions.length;
  const delayedCount = overdueCount;

  // Current dynamic fields list
  const dynamicFields = formConfig?.fields || [];

  // Dynamic tracker labels based on vertical type
  const actionPointLabel = isStrategyOps
    ? "Strategic Initiative / Action Point"
    : isComm
    ? "Deliverable"
    : "Action Point / Deliverable";

  const ownershipLabel = isStrategyOps
    ? "Responsible Person / Department"
    : "Ownership";

  const remarksLabel = isStrategyOps || isComm
    ? "Key Update / Dependency"
    : "Remarks / Key Update";

  const actionPointPlaceholder = isStrategyOps
    ? "e.g. Campus phase-2 expansion roadmap or strategic partnerships"
    : isComm
    ? "e.g. Media kit release & press conference announcement"
    : "e.g. Commissioning of ISO-6 Cleanroom with Laminar Flow HVAC";

  const ownershipPlaceholder = isStrategyOps
    ? "e.g. Strategy & Operations Head"
    : dept?.name ? `${dept.name} Head` : "Lead Owner";

  return (
    <div className="space-y-6 max-w-full">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/executive"
            className="inline-flex items-center gap-1.5 p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition font-medium"
            title="Back to Executive Tower"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Executive Control Tower</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-800">{dept.name}</span>
          <span className="text-slate-300">•</span>
          <span className="font-mono text-slate-400 text-[11px]">{dept.code}</span>
        </div>

        <div className="flex items-center gap-2">
          {!canEdit && (
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              READ-ONLY VIEW
            </span>
          )}
          {canEdit && (deptData.isAdmin || deptData.isViceChairman || deptData.isChairman || deptData.hasFullAccess) && (
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              LEADERSHIP ACCESS
            </span>
          )}
          <span
            className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md border ${
              submissionStatus === "SUBMITTED"
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-amber-100 text-amber-800 border-amber-300"
            }`}
          >
            STATUS: {submissionStatus}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HORIZONTAL ACTION REGISTER (MATCHES SAMPLE IMAGE EXACTLY) */}
      {/* ========================================================================= */}
      <div id="action-register" className="space-y-4">
        {/* Header Block: Title, Subtitle, Count Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {dept.name} — Action Register
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              Weekly Review Meeting • {deptData?.currentReviewMeetingDate ? new Date(deptData.currentReviewMeetingDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "12 October 2026"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: Open Actions vs Closed History */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => setActionViewTab("OPEN")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  actionViewTab === "OPEN" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Open Actions ({openCount})
              </button>
              <button
                type="button"
                onClick={() => setActionViewTab("CLOSED")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  actionViewTab === "CLOSED" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Closed History ({completedCount})
              </button>
            </div>

            <span className="px-3.5 py-1.5 bg-[#e0f2fe] text-[#0369a1] font-bold text-xs rounded-xl shadow-2xs">
              {filteredWorkstreams.length} Actions
            </span>
          </div>
        </div>

        {/* Filter Bar: Review Meeting Date, Department, Status, Priority, Owner, Search, + Add Action Item */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-end gap-3">
          {/* Review Meeting Date */}
          <div className="flex-1 min-w-[130px]">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Review Meeting Date
            </label>
            <div className="relative">
              <select
                value={wsMeetingDateFilter}
                onChange={(e) => {
                  setWsMeetingDateFilter(e.target.value);
                  setWsCurrentPage(1);
                }}
                className="w-full appearance-none pl-8 pr-7 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
              >
                <option value="ALL">12 Oct 2026</option>
                {distinctMeetingDates.map((d: string) => (
                  <option key={d} value={d}>
                    {formatDisplayDate(d)}
                  </option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Department */}
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Department
            </label>
            <div className="relative">
              <select
                value={dept.name}
                onChange={(e) => {
                  const selected = (deptData?.allDepartments || []).find((d: any) => d.name === e.target.value);
                  if (selected && selected.id !== dept.id) {
                    router.push(`/department/${selected.id}`);
                  }
                }}
                className="w-full appearance-none px-3 pr-7 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
              >
                {(deptData?.allDepartments || []).map((d: any) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Role Scope Filter */}
          <div className="w-28 sm:w-32">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Role Scope
            </label>
            <div className="relative">
              <select
                value={wsRoleFilter}
                onChange={(e) => {
                  setWsRoleFilter(e.target.value as any);
                  setWsCurrentPage(1);
                }}
                className="w-full appearance-none px-2.5 pr-6 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
              >
                <option value="ALL">All ({items.length})</option>
                <option value="LEAD">{dept.code || "Dept"} Lead ({items.filter((x: any) => !x.department_id || Number(x.department_id) === Number(dept.id)).length})</option>
                <option value="SUPPORTING">Supporting ({items.filter((x: any) => x.department_id && Number(x.department_id) !== Number(dept.id)).length})</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Status */}
          <div className="w-24">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Status
            </label>
            <div className="relative">
              <select
                value={wsStatusFilter}
                onChange={(e) => {
                  setWsStatusFilter(e.target.value);
                  setWsCurrentPage(1);
                }}
                className="w-full appearance-none px-3 pr-7 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
              >
                <option value="ALL">All</option>
                <option value="OPEN">Open</option>
                <option value="IN PROGRESS">In Progress</option>
                <option value="BLOCKED">Blocked</option>
                <option value="ON HOLD">On Hold</option>
                <option value="CLOSED">Closed</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Priority */}
          <div className="w-24">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Priority
            </label>
            <div className="relative">
              <select
                value={wsPriorityFilter}
                onChange={(e) => {
                  setWsPriorityFilter(e.target.value);
                  setWsCurrentPage(1);
                }}
                className="w-full appearance-none px-3 pr-7 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
              >
                <option value="ALL">All</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Owner */}
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Owner
            </label>
            <div className="relative">
              <select
                value={wsOwnerFilter}
                onChange={(e) => {
                  setWsOwnerFilter(e.target.value);
                  setWsCurrentPage(1);
                }}
                className="w-full appearance-none px-3 pr-7 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white cursor-pointer"
              >
                <option value="ALL">All</option>
                {distinctOwners.map((o: string) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Search action items */}
          <div className="flex-2 min-w-[180px]">
            <label className="sr-only">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search action items..."
                value={wsSearch}
                onChange={(e) => {
                  setWsSearch(e.target.value);
                  setWsCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* + Add Action Item Button */}
          {canEdit && (
            <button
              type="button"
              onClick={openNewWsModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1d63ed] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition whitespace-nowrap self-end"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Action Item</span>
            </button>
          )}
        </div>

        {/* Action Register Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[750px] relative">
            <table className="w-full text-left text-xs table-fixed border-collapse">
              <thead className="sticky top-0 z-10 bg-[#f8fafc] text-slate-700 text-[11px] font-bold border-b border-slate-200 shadow-2xs">
                <tr>
                  <th className="w-[3%] px-1 py-2.5 text-center font-bold text-slate-700 whitespace-nowrap" data-col="1. Sl.No.">
                    Sl.No.
                  </th>
                  <th className="w-[7%] px-1.5 py-2.5 text-left font-bold text-slate-700 whitespace-nowrap" data-col="2. Review Meeting Date">
                    Review Meeting Date
                  </th>
                  <th className="w-[8.5%] px-1.5 py-2.5 text-left font-bold text-slate-700" data-col="3. Department">
                    Department
                  </th>
                  <th className="w-[22%] px-2 py-2.5 text-left font-bold text-slate-700" data-col="4. Action Item / Deliverable">
                    Action Item / Deliverable
                  </th>
                  <th className="w-[9.5%] px-1.5 py-2.5 text-left font-bold text-slate-700" data-col="5. Action Owner">
                    Action Owner
                  </th>
                  <th className="w-[8%] px-1.5 py-2.5 text-left font-bold text-slate-700" data-col="6. Support Required From">
                    Support Required From
                  </th>
                  <th className="w-[6%] px-1 py-2.5 text-center font-bold text-slate-700 whitespace-nowrap" data-col="7. Priority">
                    Priority
                  </th>
                  <th className="w-[7%] px-1.5 py-2.5 text-left font-bold text-slate-700 whitespace-nowrap" data-col="8. Completion Date">
                    Completion Date
                  </th>
                  <th className="w-[7%] px-1 py-2.5 text-center font-bold text-slate-700 whitespace-nowrap" data-col="9. Status">
                    Status
                  </th>
                  <th className="w-[10%] px-1.5 py-2.5 text-left font-bold text-slate-700" data-col="10. Progress Update / Remarks">
                    Progress Update / Remarks
                  </th>
                  <th className="w-[7%] px-1.5 py-2.5 text-left font-bold text-slate-700 whitespace-nowrap" data-col="11. Next Follow-up Date">
                    Next Follow-up Date
                  </th>
                  <th className="w-[4%] px-1 py-2.5 text-center font-bold text-slate-700 whitespace-nowrap" data-col="12. VC Decision Required">
                    VC Decision Required
                  </th>
                  <th className="w-[7%] px-1 py-2.5 text-center font-bold text-slate-700 whitespace-nowrap" data-col="13. Actions">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedWorkstreams.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-12 text-center text-slate-400">
                      <div className="max-w-md mx-auto space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <p className="font-bold text-slate-700 text-sm">No Action Items Found</p>
                        <p className="text-xs text-slate-500">
                          No actions match the active filters. Check other filters, switch to <strong>Closed History</strong>, or click <strong>+ Add Action Item</strong>.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedWorkstreams.map((ws: any, index: number) => {
                    const serialNo = wsPageSize === "ALL" ? index + 1 : (wsCurrentPage - 1) * (wsPageSize as number) + index + 1;
                    const deliverable = ws.action_point || ws.deliverable || "--";
                    const ownership = ws.ownership || ws.owner || "--";
                    const timeline = ws.timeline || ws.target_date || "--";
                    const priority = ws.priority || "Medium";
                    const status = (ws.status || "OPEN").toUpperCase();
                    const remarks = ws.remarks || ws.risks_blockers || "--";
                    const isVcReq = ws.vc_decision_required === "Yes";
                    const deptName = ws.primary_department_name || dept.name;

                    return (
                      <tr
                        key={ws.id}
                        className="hover:bg-slate-50/80 transition border-b border-slate-100 last:border-b-0"
                      >
                        {/* 1. Sl.No. */}
                        <td className="px-1 py-2 text-center whitespace-nowrap text-slate-700 font-bold text-xs align-top">
                          {serialNo}
                        </td>

                        {/* 2. Review Meeting Date */}
                        <td className="px-1.5 py-2 whitespace-nowrap text-left text-slate-800 font-medium text-[11px] align-top">
                          {formatDisplayDate(ws.review_meeting_date || "2026-10-12")}
                        </td>

                        {/* 3. Department */}
                        <td className="px-1.5 py-2 text-left text-slate-800 font-medium text-[11px] align-top break-words">
                          <div className="font-bold text-slate-900 leading-tight">{dept.name}</div>
                          {ws.department_id && Number(ws.department_id) !== Number(dept.id) ? (
                            <span className="inline-block px-1 py-0.2 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mt-0.5 leading-tight" title={"Lead: " + (ws.primary_department_name || "")}>
                              Supporting ({ws.primary_department_name || "Lead"})
                            </span>
                          ) : (
                            <span className="inline-block px-1 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-0.5 leading-tight">
                              Lead Vertical
                            </span>
                          )}
                        </td>

                        {/* 4. Action Item / Deliverable */}
                        <td className="px-2 py-2 text-left align-top">
                          <div className="font-semibold text-slate-900 text-xs leading-snug break-words">
                            {deliverable}
                          </div>
                        </td>

                        {/* 5. Action Owner */}
                        <td className="px-1.5 py-2 text-left text-slate-800 font-medium text-[11px] leading-snug break-words align-top">
                          {ownership}
                        </td>

                        {/* 6. Support Required From */}
                        <td className="px-1.5 py-2 text-left text-slate-700 font-normal text-[10px] leading-snug break-words align-top">
                          {ws.supporting_departments || "--"}
                        </td>

                        {/* 7. Priority */}
                        <td className="px-1 py-2 text-center whitespace-nowrap align-top">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              priority.toLowerCase() === "critical"
                                ? "bg-red-50 text-red-600 border-red-200"
                                : priority.toLowerCase() === "high"
                                ? "bg-rose-50 text-rose-600 border-rose-200"
                                : priority.toLowerCase() === "medium"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {priority}
                          </span>
                        </td>

                        {/* 8. Completion Date */}
                        <td className="px-1.5 py-2 whitespace-nowrap text-left text-slate-800 font-medium text-[11px] align-top">
                          {formatDisplayDate(timeline)}
                        </td>

                        {/* 9. Status */}
                        <td className="px-1 py-2 text-center whitespace-nowrap align-top">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              status === "IN PROGRESS"
                                ? "bg-sky-100 text-sky-700"
                                : status === "OPEN"
                                ? "bg-amber-100 text-amber-800"
                                : status === "ON HOLD"
                                ? "bg-purple-100 text-purple-700"
                                : status === "BLOCKED"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {status === "IN PROGRESS"
                              ? "In Progress"
                              : status === "OPEN"
                              ? "Open"
                              : status === "ON HOLD"
                              ? "On Hold"
                              : status === "BLOCKED"
                              ? "Blocked"
                              : status === "CLOSED"
                              ? "Closed"
                              : status}
                          </span>
                        </td>

                        {/* 10. Progress Update / Remarks */}
                        <td className="px-1.5 py-2 text-left text-slate-700 font-normal text-[10px] leading-snug break-words align-top">
                          {remarks}
                        </td>

                        {/* 11. Next Follow-up Date */}
                        <td className="px-1.5 py-2 whitespace-nowrap text-left text-slate-800 font-medium text-[10px] align-top">
                          {ws.next_followup_date ? formatDisplayDate(ws.next_followup_date) : "--"}
                        </td>

                        {/* 12. VC Decision Required */}
                        <td className="px-1 py-2 text-center whitespace-nowrap align-top">
                          {isVcReq ? (
                            <span className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Yes
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium text-[10px]">
                              No
                            </span>
                          )}
                        </td>

                        {/* 13. Actions */}
                        <td className="px-1 py-2 text-center whitespace-nowrap align-top">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditWsModal(ws)}
                              className="p-1 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded transition"
                              title="Edit Action"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setClosingAction(ws);
                                setClosureRemarks("");
                              }}
                              className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition"
                              title="Close / Complete Action"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => handleDeleteWorkstream(ws.id)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                                title="Delete Action"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <div>
              Showing {filteredWorkstreams.length === 0 ? 0 : 1} to {filteredWorkstreams.length} of {items.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={wsCurrentPage <= 1}
                onClick={() => setWsCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium disabled:opacity-40"
              >
                Previous
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-2xs">
                1
              </button>
              <button
                disabled={wsCurrentPage >= totalActionPages}
                onClick={() => setWsCurrentPage((p) => Math.min(totalActionPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. HR & RECRUITMENT TRACKER (FOR HR DOMAIN ONLY) */}
      {/* ========================================================================= */}
      {isHR && (
        <div id="recruitment-positions" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                HR & Recruitment — Position Roster
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Active strategic hiring requisitions across all 9 verticals
              </p>
            </div>
            {canEdit && (
              <button
                onClick={openNewRecModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Recruitment Role</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] text-slate-700 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="px-4 py-3.5 text-center font-bold text-slate-700">Sl. No.</th>
                  <th className="px-4 py-3.5 text-left font-bold text-slate-700">Position / Role</th>
                  <th className="px-4 py-3.5 text-left font-bold text-slate-700">Department / Vertical</th>
                  <th className="px-4 py-3.5 text-left font-bold text-slate-700">Priority</th>
                  <th className="px-4 py-3.5 text-left font-bold text-slate-700">Hiring Owner</th>
                  <th className="px-4 py-3.5 text-left font-bold text-slate-700">Target Date</th>
                  <th className="px-4 py-3.5 text-left font-bold text-slate-700">Status</th>
                  <th className="px-4 py-3.5 text-left font-bold text-slate-700">Remarks</th>
                  <th className="px-4 py-3.5 text-center font-bold text-slate-700">VC Decision</th>
                  {canEdit && <th className="px-4 py-3.5 text-right font-bold text-slate-700">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecruitment.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 10 : 9} className="px-6 py-8 text-center text-slate-400">
                      No recruitment positions found. Click "+ Add Recruitment Role" to record new hiring requirements.
                    </td>
                  </tr>
                ) : (
                  filteredRecruitment.map((r: any, index: number) => {
                    const posTitle = r.position_title || r.position_role || "--";
                    const deptVertical = r.strategic_segment || r.department_vertical || "--";
                    const priority = r.priority || "Medium";
                    const hiringOwner = r.hiring_lead || r.hiring_owner || "--";
                    const targetJoining = r.target_date || r.target_joining_date || "--";
                    const recStatus = r.status || r.recruitment_status || "Candidate sourced";
                    const remarks = r.remarks || r.key_issue || "--";
                    const isVcReq = r.vc_decision_required === "Yes" || r.vc_attention === true;

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3.5 font-bold text-center text-slate-500 font-mono">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 min-w-[200px]">
                          {posTitle}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                          {deptVertical}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase ${
                              priority === "Critical"
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : priority === "High"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-slate-100 text-slate-700 border-slate-300"
                            }`}
                          >
                            {priority}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                          {hiringOwner}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                          {targetJoining}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border ${
                              recStatus === "Joined"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : recStatus === "Offers released"
                                ? "bg-indigo-50 text-indigo-800 border-indigo-300"
                                : recStatus === "Interview in progress"
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : recStatus === "shortlisted"
                                ? "bg-violet-50 text-violet-800 border-violet-300"
                                : "bg-blue-50 text-blue-800 border-blue-300"
                            }`}
                          >
                            {recStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                          {remarks}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {isVcReq ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-100 text-rose-800 border border-rose-300">
                              VC DECISION
                            </span>
                          ) : (
                            <span className="text-slate-400">--</span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditRecModal(r)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition shadow-2xs"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteRecruitment(r.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition shadow-2xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SECTOR PERFORMANCE & DEPARTMENT FORM CONFIGURATION */}
      {/* ========================================================================= */}
      <div id="sector-indicators" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Sector Performance & Strategic Indicators
              </h2>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200">
                Department Overview
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Readiness score, governance status, and operational targets configured for {dept.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!canEdit && (
              <span className="text-xs text-slate-400 italic font-medium">
                View-only mode • Contact Department Admin to request edit rights
              </span>
            )}
          </div>
        </div>

        {/* SUMMARY KPIS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Readiness
            </span>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{readiness}%</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              RAG Status
            </span>
            <div className="mt-2">
              <span
                className={`px-2.5 py-1 text-xs font-bold rounded-md border tracking-wider uppercase ${
                  rag === "GREEN"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : rag === "AMBER"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : rag === "RED"
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }`}
              >
                {rag}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {isHR ? "Open Roles" : "Open Workstreams"}
            </span>
            <div className="mt-2 text-2xl font-extrabold text-indigo-700">{openCount}</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {isHR ? "Joined / Filled" : "Completed"}
            </span>
            <div className="mt-2 text-2xl font-extrabold text-emerald-700">{completedCount}</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {isHR ? "Critical Roles" : "Delayed / Blocked"}
            </span>
            <div className="mt-2 text-2xl font-extrabold text-rose-700">{delayedCount}</div>
          </div>
        </div>

        {/* Dynamic Fields Grid */}
        {dynamicFields.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {dynamicFields.map((f: any) => {
              const val = formValues[f.id.toString()] ?? "";
              return (
                <div key={f.id} className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {f.label}
                    {f.required && <span className="text-rose-500 ml-1">*</span>}
                  </label>

                  {f.field_type === "Dropdown" ? (
                    canEdit ? (
                      <select
                        value={val}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [f.id.toString()]: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      >
                        <option value="">Select option...</option>
                        {f.options && f.options.length > 0 ? (
                          f.options.map((opt: any) => (
                            <option key={opt.id} value={opt.option_value}>
                              {opt.option_label}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Yes">Yes</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Planned">Planned</option>
                            <option value="No">No</option>
                          </>
                        )}
                      </select>
                    ) : (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        {val || "--"}
                      </div>
                    )
                  ) : f.field_type === "Yes/No" ? (
                    canEdit ? (
                      <select
                        value={val}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [f.id.toString()]: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="In Progress">In Progress</option>
                      </select>
                    ) : (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        {val || "--"}
                      </div>
                    )
                  ) : f.field_type === "Long Text" ? (
                    canEdit ? (
                      <textarea
                        rows={2}
                        value={val}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [f.id.toString()]: e.target.value })
                        }
                        placeholder={f.help_text || `Enter ${f.label}...`}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    ) : (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 whitespace-pre-wrap">
                        {val || "--"}
                      </div>
                    )
                  ) : (
                    canEdit ? (
                      <input
                        type={f.field_type === "Number" ? "number" : "text"}
                        value={val}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [f.id.toString()]: e.target.value })
                        }
                        placeholder={f.help_text || `Enter ${f.label}...`}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    ) : (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                        {val || "--"}
                      </div>
                    )
                  )}

                  {f.help_text && (
                    <p className="text-[11px] text-slate-400 italic">{f.help_text}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                RAG Status
              </label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm">
                {rag}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Readiness %
              </label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm">
                {readiness}%
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Key Strategic Focus
              </label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700">
                {keyFocus || "--"}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Form Submission Buttons */}
        {canEdit && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-500">
              * Note: Saving as <strong>Draft</strong> keeps changes private to your domain until you click <strong>Submit Update</strong>.
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={savingForm}
                onClick={() => handleSaveDynamicForm("DRAFT")}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                disabled={savingForm}
                onClick={() => handleSaveDynamicForm("SUBMITTED")}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition"
              >
                {savingForm ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>SAVE UPDATE</span>
              </button>
            </div>
          </div>
        )}
      </div>
{/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT ACTION POINT */}
      {/* ========================================================================= */}
      {showWsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingWs ? `Update Action Item • ${editingWs.item_id || `ID #${editingWs.id}`}` : "Add New Action Item"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Weekly Management Review Action Register • Vertical: <strong className="text-indigo-900">{dept.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkstream} className="space-y-4 text-xs">
              {/* Deliverable / Action Item */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Deliverable / Action Item <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={wsForm.action_point}
                  onChange={(e) => setWsForm({ ...wsForm, action_point: e.target.value })}
                  required
                  placeholder="Specific deliverable, directive, or milestone committed during review..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Review Meeting Date & Review Cycle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Review Meeting Date</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={wsForm.review_meeting_date}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setWsForm({
                        ...wsForm,
                        review_meeting_date: newDate,
                        review_week: getReviewWeekLabel(newDate),
                      });
                    }}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Week / Review Cycle
                  </label>
                  <input
                    type="text"
                    value={wsForm.review_week}
                    onChange={(e) => setWsForm({ ...wsForm, review_week: e.target.value })}
                    placeholder="e.g. Week 42 (12 Oct 2026)"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Owner & Target Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Action Owner / Lead <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={wsForm.ownership}
                    onChange={(e) => setWsForm({ ...wsForm, ownership: e.target.value })}
                    required
                    placeholder="e.g. Dr. Durga Prakash / RUAS Facilities"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Completion Date / Timeline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={wsForm.timeline}
                    onChange={(e) => setWsForm({ ...wsForm, timeline: e.target.value })}
                    required
                    placeholder="e.g. 2026-11-15 or Urgent; close after clarification"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Supporting Verticals */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Support Required From (Other Verticals)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Click vertical pills to add/remove</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {(deptData?.allDepartments || []).map((d: any) => {
                    const isSelected = (wsForm.supporting_departments || "")
                      .toLowerCase()
                      .includes(d.name.toLowerCase());
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleSupportingDept(d.name)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected ? `✓ ${d.name}` : `+ ${d.name}`}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={wsForm.supporting_departments}
                  onChange={(e) => setWsForm({ ...wsForm, supporting_departments: e.target.value })}
                  placeholder="Supporting strategic verticals..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none font-medium"
                />
              </div>

              {/* Priority, Status & RAG Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Priority <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={wsForm.priority || "Medium"}
                    onChange={(e) => setWsForm({ ...wsForm, priority: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none ${
                      wsForm.priority === "Critical"
                        ? "border-rose-300 text-rose-700 bg-rose-50/50"
                        : wsForm.priority === "High"
                        ? "border-amber-300 text-amber-700 bg-amber-50/50"
                        : "border-slate-300 text-slate-800"
                    }`}
                  >
                    <option value="Critical">🔴 Critical</option>
                    <option value="High">🟠 High</option>
                    <option value="Medium">🔵 Medium</option>
                    <option value="Low">⚪ Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={wsForm.status}
                    onChange={(e) => setWsForm({ ...wsForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN PROGRESS">IN PROGRESS</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="DELAYED">DELAYED</option>
                    <option value="ON HOLD">ON HOLD</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    RAG Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={wsForm.rag_status}
                    onChange={(e) => setWsForm({ ...wsForm, rag_status: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none ${
                      wsForm.rag_status === "GREEN"
                        ? "text-emerald-700 border-emerald-300 bg-emerald-50/40"
                        : wsForm.rag_status === "RED"
                        ? "text-rose-700 border-rose-300 bg-rose-50/40"
                        : "text-amber-700 border-amber-300 bg-amber-50/40"
                    }`}
                  >
                    <option value="GREEN">🟢 GREEN (On Track)</option>
                    <option value="AMBER">🟡 AMBER (Attention)</option>
                    <option value="RED">🔴 RED (Critical / Delay)</option>
                  </select>
                </div>
              </div>

              {/* Next Follow-up Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={wsForm.next_followup_date}
                    onChange={(e) => setWsForm({ ...wsForm, next_followup_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Vice Chairman Decision Required?
                  </label>
                  <select
                    value={wsForm.vc_decision_required}
                    onChange={(e) => setWsForm({ ...wsForm, vc_decision_required: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none ${
                      wsForm.vc_decision_required === "Yes"
                        ? "border-rose-400 text-rose-700 bg-rose-50"
                        : "border-slate-300 text-slate-800"
                    }`}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes — VC Attention Needed</option>
                  </select>
                </div>
              </div>

              {/* VC Decision Action Requested (if Yes) */}
              {wsForm.vc_decision_required === "Yes" && (
                <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 space-y-1">
                  <label className="block font-bold text-rose-900">
                    Specific VC Decision / Action Requested <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={wsForm.decision_action}
                    onChange={(e) => setWsForm({ ...wsForm, decision_action: e.target.value })}
                    required={wsForm.vc_decision_required === "Yes"}
                    placeholder="Specific approval, resource allocation or escalation required..."
                    className="w-full px-3 py-2 bg-white rounded-xl border border-rose-300 font-semibold text-rose-950 focus:ring-2 focus:ring-rose-600 focus:outline-none"
                  />
                </div>
              )}

              {/* Progress Update / Latest Remarks */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Progress Update / Latest Remarks / Blockers
                </label>
                <textarea
                  rows={2}
                  value={wsForm.remarks}
                  onChange={(e) => setWsForm({ ...wsForm, remarks: e.target.value })}
                  placeholder="Record progress updates, meeting notes, vendor status or dependencies..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none leading-relaxed"
                />
              </div>

              {/* If Status is CLOSED, prompt for closure notes */}
              {wsForm.status === "CLOSED" && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 space-y-1">
                  <label className="block font-bold text-emerald-900">
                    Formal Closure Remarks & Evidence <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={wsForm.closure_remarks}
                    onChange={(e) => setWsForm({ ...wsForm, closure_remarks: e.target.value })}
                    required
                    placeholder="Document completion date, final deliverable link or sign-off remarks..."
                    className="w-full px-3 py-2 bg-white rounded-xl border border-emerald-400 font-bold text-emerald-950 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                {editingWs ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete action ${editingWs.item_id || editingWs.id}?`)) {
                        handleDeleteWorkstream(editingWs.id);
                        setShowWsModal(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Action</span>
                  </button>
                ) : <div />}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowWsModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingWs ? "Save Changes" : "+ Add Action Item"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FORMAL ACTION CLOSURE MODAL */}
      {/* ========================================================================= */}
      {closingAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-start gap-3 pb-3 border-b border-slate-100 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Formally Close Action [{closingAction.item_id || closingAction.id}]
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Action items remain active until formally closed. Closing moves this record to <strong>Closed Actions / History</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 mb-4">
              <div className="font-bold text-slate-900">
                {closingAction.action_point || closingAction.deliverable}
              </div>
              <div className="text-slate-500 flex flex-wrap gap-x-4">
                <span>Owner: <strong className="text-slate-700">{closingAction.ownership || closingAction.owner}</strong></span>
                <span>Timeline: <strong className="text-slate-700">{closingAction.timeline || closingAction.target_date}</strong></span>
              </div>
            </div>

            <form onSubmit={handleConfirmClose} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Closure Remarks / Verification Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={closureRemarks}
                  onChange={(e) => setClosureRemarks(e.target.value)}
                  required
                  placeholder="Record verification notes, resolution summary, or approval evidence..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setClosingAction(null);
                    setClosureRemarks("");
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition inline-flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Close Action</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ACTION HISTORY & AUDIT TRAIL MODAL */}
      {/* ========================================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Action History [{showHistoryModal.item_id || showHistoryModal.id}]
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Action Deliverable</span>
                <p className="font-bold text-slate-900 leading-snug">
                  {showHistoryModal.action_point || showHistoryModal.deliverable}
                </p>
                <div className="text-[11px] text-slate-500 mt-2 grid grid-cols-2 gap-2">
                  <div>Owner: <strong className="text-slate-700">{showHistoryModal.ownership || showHistoryModal.owner}</strong></div>
                  <div>Status: <strong className="text-slate-700">{showHistoryModal.status}</strong></div>
                  <div>Review Cycle: <strong className="text-slate-700">{showHistoryModal.review_week || "Week 42 (12 Oct 2026)"}</strong></div>
                  <div>
                    Tracking:{" "}
                    <strong className={showHistoryModal.weeks_outstanding > 0 ? "text-amber-700" : "text-emerald-700"}>
                      {showHistoryModal.weeks_outstanding > 0
                        ? `Carried Forward (${showHistoryModal.weeks_outstanding} wks)`
                        : "New This Week"}
                    </strong>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2">Audit Trail Log & State Transitions</h4>
                <div className="space-y-2">
                  {Array.isArray(showHistoryModal.action_history) && showHistoryModal.action_history.length > 0 ? (
                    showHistoryModal.action_history.map((log: any, i: number) => (
                      <div key={i} className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 text-[11px]">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="font-semibold text-slate-700">{log.action || "Update"}</span>
                          <span>{log.timestamp ? new Date(log.timestamp).toLocaleString("en-IN") : ""}</span>
                        </div>
                        <p className="text-slate-600 font-medium">{log.notes || log.remarks || JSON.stringify(log)}</p>
                        {log.user && (
                          <div className="text-[10px] text-indigo-600 font-semibold mt-1 flex items-center justify-between">
                            <span>User: {log.user} ({log.role || "Lead"})</span>
                            {log.status && <span className="text-slate-500">Status: {log.status}</span>}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-center">
                      <p>Created: {showHistoryModal.created_at ? new Date(showHistoryModal.created_at).toLocaleString("en-IN") : "Initial Seed (Weekly Management Review - 12 Oct 2026)"}</p>
                      <p className="mt-1">Last Updated: {showHistoryModal.updated_at ? new Date(showHistoryModal.updated_at).toLocaleString("en-IN") : "Active"}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT RECRUITMENT POSITION */}
      {showRecModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingRec ? "Update Position" : "+ Add Position"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Talent Acquisition position details for RIASAT
            </p>

            <form onSubmit={handleSaveRecruitment} className="space-y-4 text-xs">
              {/* Row 1: Position / Role, Department / Strategic Vertical */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Position / Role <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recForm.position_title}
                    onChange={(e) => setRecForm({ ...recForm, position_title: e.target.value })}
                    required
                    placeholder="e.g. Director - Cleanroom Operations"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Department / Strategic Vertical <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={recForm.strategic_segment}
                    onChange={(e) => setRecForm({ ...recForm, strategic_segment: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 font-medium"
                  >
                    <option value="Semicon">Semicon</option>
                    <option value="Aerospace & Defence">Aerospace & Defence</option>
                    <option value="Space">Space</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="MedTech">MedTech</option>
                    <option value="Advanced Manufacturing">Advanced Manufacturing</option>
                    <option value="Communications">Communications</option>
                    <option value="Strategy & Operations">Strategy & Operations</option>
                    <option value="HR & Recruitment">HR & Recruitment</option>
                    <option value="Central Leadership">Central Leadership</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Priority, Hiring Owner, Target Joining Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={recForm.priority}
                    onChange={(e) => setRecForm({ ...recForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 font-medium"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hiring Owner</label>
                  <input
                    type="text"
                    value={recForm.hiring_lead}
                    onChange={(e) => setRecForm({ ...recForm, hiring_lead: e.target.value })}
                    placeholder="e.g. Sumanth Rao / HR Lead"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Joining Date</label>
                  <input
                    type="date"
                    value={recForm.target_date}
                    onChange={(e) => setRecForm({ ...recForm, target_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {/* Row 3: Status (Dropdown with 6 bullet entries) & VC Decision Required */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Status</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">(Choose One)</span>
                  </label>
                  <select
                    value={recForm.status}
                    onChange={(e) => setRecForm({ ...recForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="Candidate sourced">• Candidate sourced</option>
                    <option value="shortlisted">• shortlisted</option>
                    <option value="Interview in progress">• Interview in progress</option>
                    <option value="Offers released">• Offers released</option>
                    <option value="Rejected">• Rejected</option>
                    <option value="Joined">• Joined</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>VC Decision Required</span>
                    <span className="text-[10px] text-rose-600 font-bold">YES / NO</span>
                  </label>
                  <select
                    value={recForm.vc_decision_required}
                    onChange={(e) => setRecForm({ ...recForm, vc_decision_required: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-bold focus:ring-2 focus:ring-indigo-600 ${
                      recForm.vc_decision_required === "Yes"
                        ? "border-rose-400 text-rose-700 bg-rose-50"
                        : "border-slate-300 text-slate-800"
                    }`}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Remarks */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Remarks
                </label>
                <textarea
                  rows={3}
                  value={recForm.remarks}
                  onChange={(e) => setRecForm({ ...recForm, remarks: e.target.value })}
                  placeholder="Progress, compensation discussions, bottlenecks, or executive notes..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Footer with Delete and Save */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {editingRec ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteRecruitment(editingRec.id);
                      setShowRecModal(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Position</span>
                  </button>
                ) : <div />}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRecModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    {editingRec ? "Save Changes" : "+ Edit or create new position"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
