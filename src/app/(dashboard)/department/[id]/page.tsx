"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  TrendingUp,
  AlertTriangle,
  FileText,
  Search,
  Calendar,
  ChevronDown,
  History,
  RotateCcw,
  X,
  Download,
  ListChecks,
  BarChart3,
  PieChart as PieIcon,
  Sliders,
  Flame,
  Users,
  IndianRupee,
} from "lucide-react";
import {
  getCurrentReviewMeetingDate,
  getReviewWeekLabel,
  isPendingActionStatus,
  isRedAlertItem,
  getActionUpdatesDatewise,
  sortActionsWithNewAndAlertsOnTop,
} from "@/lib/action-helpers";

type DeptSubPage =
  | "pending_actions"
  | "analytics_status"
  | "analytics_priority"
  | "closed_actions"
  | "sector_form"
  | "recruitment";

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return "--";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function DepartmentPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deptId = params.id as string;

  const tabParam = searchParams.get("tab") as DeptSubPage | null;
  const [activeSubPage, setActiveSubPage] = useState<DeptSubPage>(
    tabParam &&
      [
        "pending_actions",
        "analytics_status",
        "analytics_priority",
        "closed_actions",
        "sector_form",
        "recruitment",
      ].includes(tabParam)
      ? tabParam
      : "pending_actions"
  );

  useEffect(() => {
    if (
      tabParam &&
      [
        "pending_actions",
        "analytics_status",
        "analytics_priority",
        "closed_actions",
        "sector_form",
        "recruitment",
      ].includes(tabParam)
    ) {
      setActiveSubPage(tabParam);
    }
  }, [tabParam]);

  const handleSwitchSubPage = (page: DeptSubPage) => {
    setActiveSubPage(page);
    router.replace(`/department/${deptId}?tab=${page}`, { scroll: false });
  };

  const [loading, setLoading] = useState(true);
  const [deptData, setDeptData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dynamic Form state
  const [formConfig, setFormConfig] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [savingForm, setSavingForm] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<string>("SUBMITTED");

  // Overview state
  const [readiness, setReadiness] = useState<number>(0);
  const [rag, setRag] = useState<string>("NOT STARTED");
  const [keyFocus, setKeyFocus] = useState<string>("");

  // Action Filters
  const [wsStatusFilter, setWsStatusFilter] = useState<string>("ALL");
  const [wsPriorityFilter, setWsPriorityFilter] = useState<string>("ALL");
  const [wsOwnerFilter, setWsOwnerFilter] = useState<string>("ALL");
  const [wsRoleFilter, setWsRoleFilter] = useState<"ALL" | "LEAD" | "SUPPORTING">("ALL");
  const [wsAlertFilter, setWsAlertFilter] = useState<"ALL" | "RED_ALERT" | "VC_DECISION">("ALL");
  const [wsSearch, setWsSearch] = useState<string>("");

  // Modals
  const [closingAction, setClosingAction] = useState<any | null>(null);
  const [closureRemarks, setClosureRemarks] = useState<string>("");
  const [showHistoryModal, setShowHistoryModal] = useState<any | null>(null);

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

  // Recruitment state (HR)
  const [showRecModal, setShowRecModal] = useState(false);
  const [editingRec, setEditingRec] = useState<any>(null);
  const [recSearch, setRecSearch] = useState<string>("");
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
        fetch(`/api/departments/${deptId}`, { cache: "no-store" }),
        fetch(`/api/departments/${deptId}/form`, { cache: "no-store" }),
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
          ownership:
            prev.ownership ||
            (data.department?.name ? `${data.department.name} Head` : "Lead Owner"),
        }));
      }

      if (formRes.ok) {
        const formData = await formRes.json();
        setFormConfig(formData);
        setSubmissionStatus(formData.submission_status || "SUBMITTED");

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

  const handleSaveDynamicForm = async (status: "DRAFT" | "SUBMITTED") => {
    if (!deptData?.canEdit) return;
    try {
      setSavingForm(true);
      setError(null);
      const res = await fetch(`/api/departments/${deptId}/form`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: formValues, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save form");
      setSubmissionStatus(status);
      setSuccessMsg(
        status === "SUBMITTED"
          ? "Department updates submitted to Executive Control Tower!"
          : "Draft saved successfully."
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchDepartment();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingForm(false);
    }
  };

  const openEditWsModal = (ws: any) => {
    setEditingWs(ws);
    const rDate = ws.review_meeting_date
      ? ws.review_meeting_date.substring(0, 10)
      : deptData?.currentReviewMeetingDate || "2026-10-12";
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
      rag_status: (
        ws.effective_rag ||
        ws.rag_status ||
        (["Delayed", "Blocked"].includes(ws.status) ? "AMBER" : "GREEN")
      ).toUpperCase(),
      remarks: "", // Empty by default so user can type a new dated update to prepend on top
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

  const openNewWsModal = () => {
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
      priority: "Critical",
      status: "OPEN",
      rag_status: "RED",
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
    setShowWsModal(true);
  };

  const toggleSupportingDept = (deptName: string) => {
    const current = wsForm.supporting_departments
      ? wsForm.supporting_departments
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];
    const updated = current.includes(deptName)
      ? current.filter((s: string) => s !== deptName)
      : [...current, deptName];
    setWsForm((prev) => ({ ...prev, supporting_departments: updated.join(", ") }));
  };

  const handleConfirmClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingAction) return;
    try {
      const res = await fetch(`/api/workstreams/${closingAction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CLOSED",
          closure_remarks: closureRemarks || "Action completed and closed during review",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to close action");
      setSuccessMsg(`Action [${closingAction.item_id || closingAction.id}] moved to Completed / Closed History.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setClosingAction(null);
      setClosureRemarks("");
      fetchDepartment();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReopenAction = async (ws: any) => {
    try {
      const res = await fetch(`/api/workstreams/${ws.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OPEN", closure_remarks: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reopen action");
      setSuccessMsg(`Action [${ws.item_id || ws.id}] reopened and restored to Pending Items.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchDepartment();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveWorkstream = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);
    try {
      const url = editingWs ? `/api/workstreams/${editingWs.id}` : "/api/workstreams";
      const method = editingWs ? "PUT" : "POST";
      const payload = editingWs
        ? {
            ...wsForm,
            remarks: wsForm.remarks.trim() || editingWs.remarks || "",
          }
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
      setActiveSubPage("pending_actions");
      setSuccessMsg(
        editingWs
          ? `Action ${savedItemId} updated with latest dated progress on top!`
          : `New Action ${savedItemId} added and pinned to the top of Pending Items!`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchDepartment();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteWorkstream = async (wsId: number) => {
    if (!confirm("Delete this action item permanently?")) return;
    try {
      const res = await fetch(`/api/workstreams/${wsId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete workstream");
      setSuccessMsg("Action item deleted.");
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchDepartment();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Recruitment modal handlers
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
      vc_decision_required:
        rec.vc_decision_required === "Yes" || rec.vc_attention === true ? "Yes" : "No",
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
      setSuccessMsg(editingRec ? "Position updated!" : "New position added!");
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchDepartment();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteRecruitment = async (recId: number) => {
    if (!confirm("Delete this recruitment position?")) return;
    try {
      const res = await fetch(`/api/recruitment/${recId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete position");
      fetchDepartment();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-8 h-8 border-3 border-[#003B71] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold mt-4 text-slate-700">Loading vertical command workspace...</p>
      </div>
    );
  }

  if (error && !deptData) {
    return (
      <div className="max-w-lg mx-auto my-12 p-6 bg-white rounded-2xl border border-[#D81B60]/30 shadow-md text-center">
        <AlertCircle className="w-10 h-10 text-[#D81B60] mx-auto mb-3" />
        <h2 className="text-base font-black text-slate-900">Access Restricted</h2>
        <p className="text-xs text-[#D81B60] mt-2">{error}</p>
        <Link
          href="/executive"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#003B71] text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Executive Control Tower</span>
        </Link>
      </div>
    );
  }

  const dept = deptData.department;
  const items: any[] = deptData.items || deptData.workstreams || [];
  const recruitmentItems: any[] = deptData.recruitment || [];
  const isHR = dept.code === "HR_REC" || Number(dept.id) === 7;
  const canEdit = deptData.canEdit;
  const dynamicFields = formConfig?.fields || [];

  // Strictly separate Pending Items vs Completed/Closed Items
  // Pending Items tab ONLY shows pending items (excludes Completed and Closed)
  const pendingActions = sortActionsWithNewAndAlertsOnTop(
    items.filter((ws: any) => isPendingActionStatus(ws.status))
  );
  const closedActions = items.filter((ws: any) => !isPendingActionStatus(ws.status));

  const redAlertCount = pendingActions.filter((ws: any) => isRedAlertItem(ws)).length;
  const vcAlertCount = pendingActions.filter((ws: any) => ws.vc_decision_required === "Yes").length;

  const distinctOwners = Array.from(
    new Set(items.map((x: any) => x.ownership || x.owner).filter(Boolean))
  ) as string[];

  const filterActionList = (sourceList: any[]) => {
    return sourceList.filter((ws: any) => {
      if (wsStatusFilter !== "ALL" && String(ws.status || "").toUpperCase() !== wsStatusFilter.toUpperCase())
        return false;
      if (wsPriorityFilter !== "ALL" && String(ws.priority || "Medium").toLowerCase() !== wsPriorityFilter.toLowerCase())
        return false;
      if (wsOwnerFilter !== "ALL" && (ws.ownership || ws.owner || "") !== wsOwnerFilter)
        return false;
      if (wsRoleFilter === "LEAD" && ws.department_id && Number(ws.department_id) !== Number(dept.id))
        return false;
      if (wsRoleFilter === "SUPPORTING" && (!ws.department_id || Number(ws.department_id) === Number(dept.id)))
        return false;
      if (wsAlertFilter === "RED_ALERT" && !isRedAlertItem(ws)) return false;
      if (wsAlertFilter === "VC_DECISION" && ws.vc_decision_required !== "Yes") return false;

      if (wsSearch.trim()) {
        const q = wsSearch.toLowerCase().trim();
        const matchId = (ws.item_id || "").toLowerCase().includes(q);
        const matchAction = (ws.action_point || ws.deliverable || "").toLowerCase().includes(q);
        const matchOwner = (ws.ownership || ws.owner || "").toLowerCase().includes(q);
        const matchRemarks = (ws.remarks || ws.decision_action || ws.risks_blockers || "").toLowerCase().includes(q);
        if (!matchId && !matchAction && !matchOwner && !matchRemarks) return false;
      }
      return true;
    });
  };

  const filteredPendingActions = filterActionList(pendingActions);
  const filteredClosedActions = filterActionList(closedActions);

  // Analytics Data for Sub-Page 2 (Status & RAG Analytics) and Sub-Page 3 (Priority & Financials)
  const statusChartData = [
    { name: "Open", count: pendingActions.filter((x) => String(x.status).toUpperCase() === "OPEN").length, color: "#003B71" },
    { name: "In Progress", count: pendingActions.filter((x) => String(x.status).toUpperCase() === "IN PROGRESS").length, color: "#0f172a" },
    { name: "On Track", count: pendingActions.filter((x) => String(x.status).toUpperCase() === "ON TRACK").length, color: "#0284c7" },
    { name: "Delayed", count: pendingActions.filter((x) => String(x.status).toUpperCase() === "DELAYED").length, color: "#F37021" },
    { name: "Blocked", count: pendingActions.filter((x) => String(x.status).toUpperCase() === "BLOCKED").length, color: "#D81B60" },
    { name: "Completed", count: closedActions.length, color: "#10b981" },
  ];

  const priorityChartData = [
    { name: "Critical", count: pendingActions.filter((x) => String(x.priority).toLowerCase() === "critical").length, color: "#D81B60" },
    { name: "High", count: pendingActions.filter((x) => String(x.priority).toLowerCase() === "high").length, color: "#F37021" },
    { name: "Medium", count: pendingActions.filter((x) => String(x.priority || "Medium").toLowerCase() === "medium").length, color: "#003B71" },
    { name: "Low", count: pendingActions.filter((x) => String(x.priority).toLowerCase() === "low").length, color: "#64748b" },
  ];

  // Export CSV Handler (Works reliably via Blob + UTF-8 BOM)
  const handleExportCSV = (listToExport: any[], suffix: string) => {
    const headers = [
      "Sl.No.",
      "Action ID",
      "Review Meeting Date",
      "Department",
      "Role",
      "Action Item / Deliverable",
      "Action Owner",
      "Supporting Verticals",
      "Priority",
      "Target Completion",
      "Status",
      "RAG Alert",
      "VC Decision Required",
      "Progress / Updates (Datewise • Latest on Top)",
    ];

    const escapeCsv = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;

    const rows = listToExport.map((ws: any, idx: number) => {
      const updates =
        ws.updates_list && ws.updates_list.length > 0
          ? ws.updates_list
          : getActionUpdatesDatewise(ws);
      const formattedUpdates = updates
        .map((u: any) => `[${u.formattedDate}] ${u.text}`)
        .join(" | ");

      const isSupport = ws.department_id && Number(ws.department_id) !== Number(dept.id);

      return [
        idx + 1,
        ws.item_id || `ACT-${ws.id}`,
        ws.review_meeting_date || "2026-10-12",
        dept.name,
        isSupport ? `Supporting (${ws.primary_department_name || "Lead"})` : "Primary Lead",
        ws.action_point || ws.deliverable || "",
        ws.ownership || ws.owner || "",
        ws.supporting_departments || "None",
        ws.priority || "Medium",
        ws.timeline || ws.target_date || "",
        ws.status || "OPEN",
        ws.effective_rag || ws.rag_status || "GREEN",
        ws.vc_decision_required || "No",
        formattedUpdates || ws.remarks || "",
      ]
        .map(escapeCsv)
        .join(",");
    });

    const csvContent = "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `RIASAT_${dept.code}_${suffix}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-8 max-w-full">
      {/* Top Brand Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <img
              src="/ramaiah_logo.png"
              alt="Ramaiah Logo"
              className="h-11 w-auto object-contain shrink-0 hidden sm:block"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Link
                  href="/executive"
                  className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#003B71] hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Executive Tower
                </Link>
                <span className="text-slate-300">/</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-slate-900 text-white">
                  {dept.code}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase text-white ${
                    rag === "GREEN"
                      ? "bg-[#003B71]"
                      : rag === "AMBER"
                      ? "bg-[#F37021]"
                      : rag === "RED"
                      ? "bg-[#D81B60]"
                      : "bg-slate-600"
                  }`}
                >
                  RAG: {rag} ({readiness}%)
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight truncate">
                {dept.name} — Vertical Command Center
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Quick Department Switcher */}
            <select
              value={dept.id}
              onChange={(e) => router.push(`/department/${e.target.value}`)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 cursor-pointer"
            >
              {(deptData?.allDepartments || []).map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {canEdit && (
              <button
                type="button"
                onClick={openNewWsModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white text-xs font-black uppercase tracking-wider shadow-xs hover:opacity-95 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Action Item
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                handleExportCSV(
                  activeSubPage === "closed_actions" ? filteredClosedActions : filteredPendingActions,
                  activeSubPage === "closed_actions" ? "Closed_Actions" : "Pending_Actions"
                )
              }
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#F37021]" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Clean 4-Card KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Pending Actions
              </div>
              <div className="text-xl font-black text-[#003B71] mt-0.5">
                {pendingActions.length}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#003B71]/10 text-[#003B71] flex items-center justify-center">
              <ListChecks className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#D81B60]/5 border border-[#D81B60]/20 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#D81B60]">
                Red Alerts / Overdue
              </div>
              <div className="text-xl font-black text-[#D81B60] mt-0.5">
                {redAlertCount}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#D81B60]/15 text-[#D81B60] flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F37021]/5 border border-[#F37021]/25 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#F37021]">
                VC Decisions Needed
              </div>
              <div className="text-xl font-black text-[#F37021] mt-0.5">
                {vcAlertCount}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#F37021]/15 text-[#F37021] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Completed / Closed
              </div>
              <div className="text-xl font-black text-slate-900 mt-0.5">
                {closedActions.length}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Dedicated Sub-Pages Navigation Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            {
              id: "pending_actions" as DeptSubPage,
              label: `Pending Items (${pendingActions.length})`,
              icon: ListChecks,
            },
            {
              id: "analytics_status" as DeptSubPage,
              label: "Status & RAG Analytics",
              icon: BarChart3,
            },
            {
              id: "analytics_priority" as DeptSubPage,
              label: "Priority & Financial Analytics",
              icon: PieIcon,
            },
            {
              id: "closed_actions" as DeptSubPage,
              label: `Closed History (${closedActions.length})`,
              icon: History,
            },
            {
              id: "sector_form" as DeptSubPage,
              label: "Sector Indicators & Form",
              icon: Sliders,
            },
            ...(isHR
              ? [
                  {
                    id: "recruitment" as DeptSubPage,
                    label: `HR Position Roster (${recruitmentItems.length})`,
                    icon: Users,
                  },
                ]
              : []),
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubPage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSwitchSubPage(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#003B71] text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/70"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#F37021]" : "text-slate-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Banner */}
      {successMsg && (
        <div className="p-3.5 bg-[#003B71]/5 border border-[#003B71]/25 rounded-xl text-[#003B71] text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-[#D81B60]/10 border border-[#D81B60]/30 rounded-xl text-[#D81B60] text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-PAGE 1 & 4: PENDING ITEMS TAB / CLOSED HISTORY TAB            */}
      {/* ================================================================= */}
      {(activeSubPage === "pending_actions" || activeSubPage === "closed_actions") && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Clean Filter Header */}
          <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/40">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-black text-slate-950">
                  {activeSubPage === "pending_actions"
                    ? `${dept.name} — Pending Items Register`
                    : `${dept.name} — Completed & Closed Action History`}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#003B71] text-white">
                  {activeSubPage === "pending_actions"
                    ? `${filteredPendingActions.length} Pending`
                    : `${filteredClosedActions.length} Closed`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeSubPage === "pending_actions"
                  ? "Showing ONLY pending action items. Newly added items and Red Alerts are pinned to the top."
                  : "Historical archive of completed and formally closed action items."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {activeSubPage === "pending_actions" && (
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setWsAlertFilter("ALL")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      wsAlertFilter === "ALL"
                        ? "bg-slate-950 text-white"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    All Pending ({pendingActions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWsAlertFilter("RED_ALERT")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      wsAlertFilter === "RED_ALERT"
                        ? "bg-[#D81B60] text-white"
                        : "text-[#D81B60] hover:bg-[#D81B60]/10"
                    }`}
                  >
                    Red Alerts ({redAlertCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWsAlertFilter("VC_DECISION")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      wsAlertFilter === "VC_DECISION"
                        ? "bg-[#F37021] text-white"
                        : "text-[#F37021] hover:bg-[#F37021]/10"
                    }`}
                  >
                    VC Alerts ({vcAlertCount})
                  </button>
                </div>
              )}

              <select
                value={wsRoleFilter}
                onChange={(e) => setWsRoleFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="ALL">All Roles</option>
                <option value="LEAD">Lead Vertical Only</option>
                <option value="SUPPORTING">Supporting Only</option>
              </select>

              <select
                value={wsPriorityFilter}
                onChange={(e) => setWsPriorityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="ALL">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                value={wsOwnerFilter}
                onChange={(e) => setWsOwnerFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white max-w-[160px]"
              >
                <option value="ALL">All Owners</option>
                {distinctOwners.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search actions..."
                  value={wsSearch}
                  onChange={(e) => setWsSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white w-44 sm:w-52"
                />
              </div>
            </div>
          </div>

          {/* Non-Colliding Responsive Action Register Table */}
          {(() => {
            const listToRender =
              activeSubPage === "pending_actions" ? filteredPendingActions : filteredClosedActions;

            if (listToRender.length === 0) {
              return (
                <div className="p-12 text-center">
                  <CheckCircle2 className="w-8 h-8 text-[#003B71] mx-auto mb-2" />
                  <p className="text-sm font-black text-slate-800">No Action Items Found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeSubPage === "pending_actions"
                      ? "No pending action items match the selected filter."
                      : "No completed or closed action items yet."}
                  </p>
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1180px]">
                  <thead>
                    <tr className="bg-slate-950 text-white text-[11px] font-black uppercase tracking-wider">
                      <th className="py-3.5 px-4 w-[105px]">ID &amp; Alert</th>
                      <th className="py-3.5 px-4 w-[150px]">Vertical Role</th>
                      <th className="py-3.5 px-4 w-[250px]">Action Item / Deliverable</th>
                      <th className="py-3.5 px-4 w-[150px]">Owner &amp; Target</th>
                      <th className="py-3.5 px-4 w-[125px] text-center">Priority &amp; Status</th>
                      <th className="py-3.5 px-4 min-w-[330px]">
                        Progress / Updates (Datewise • Latest on Top)
                      </th>
                      <th className="py-3.5 px-4 w-[110px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 text-xs">
                    {listToRender.map((ws: any, idx: number) => {
                      const isRed = isRedAlertItem(ws);
                      const isNewlyAdded = Number(ws.id) > 15 && isPendingActionStatus(ws.status);
                      const isSupport =
                        ws.department_id && Number(ws.department_id) !== Number(dept.id);
                      const updates =
                        ws.updates_list && ws.updates_list.length > 0
                          ? ws.updates_list
                          : getActionUpdatesDatewise(ws);

                      return (
                        <tr
                          key={ws.id}
                          className={`transition align-top ${
                            isRed
                              ? "bg-[#D81B60]/[0.03] hover:bg-[#D81B60]/[0.06]"
                              : isNewlyAdded
                              ? "bg-[#003B71]/[0.03] hover:bg-[#003B71]/[0.06]"
                              : "hover:bg-slate-50/90"
                          }`}
                        >
                          {/* 1. ID & Alert Badges */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col items-start gap-1.5">
                              <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                                {ws.item_id || `ACT-${ws.id}`}
                              </span>
                              {isNewlyAdded && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#003B71] text-white">
                                  NEW ACTION
                                </span>
                              )}
                              {isRed && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#D81B60] text-white">
                                  <Flame className="w-3 h-3" /> RED ALERT
                                </span>
                              )}
                              {ws.vc_decision_required === "Yes" && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#F37021] text-white">
                                  VC ALERT
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. Vertical Role & Support */}
                          <td className="py-4 px-4">
                            <div className="font-black text-slate-900 leading-snug">{dept.name}</div>
                            {isSupport ? (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F37021]/10 text-[#F37021] border border-[#F37021]/25">
                                Supporting ({ws.primary_department_name || "Lead"})
                              </span>
                            ) : (
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#003B71]/10 text-[#003B71] border border-[#003B71]/20">
                                Lead Vertical
                              </span>
                            )}
                            {ws.supporting_departments && (
                              <div className="mt-1.5 text-[11px] text-slate-500 leading-snug">
                                <span className="font-bold text-slate-700">Support:</span>{" "}
                                {ws.supporting_departments}
                              </div>
                            )}
                          </td>

                          {/* 3. Action Item / Deliverable */}
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900 leading-relaxed break-words">
                              {ws.action_point || ws.deliverable || "--"}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium mt-1">
                              Review: {formatDisplayDate(ws.review_meeting_date || "2026-10-12")}
                            </div>
                          </td>

                          {/* 4. Owner & Target */}
                          <td className="py-4 px-4">
                            <div className="space-y-1.5">
                              <div className="font-bold text-slate-900 break-words">
                                {ws.ownership || ws.owner || "--"}
                              </div>
                              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3 text-[#F37021]" />
                                {formatDisplayDate(ws.timeline || ws.target_date)}
                              </div>
                              {ws.next_followup_date && (
                                <div className="text-[10px] font-semibold text-[#003B71]">
                                  Follow-up: {formatDisplayDate(ws.next_followup_date)}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 5. Priority & Status */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                  isRed
                                    ? "bg-[#D81B60]/10 text-[#D81B60] border-[#D81B60]/30"
                                    : (ws.effective_rag || ws.rag_status) === "AMBER"
                                    ? "bg-[#F37021]/10 text-[#F37021] border-[#F37021]/30"
                                    : "bg-[#003B71]/10 text-[#003B71] border-[#003B71]/25"
                                }`}
                              >
                                {ws.status || "OPEN"}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  String(ws.priority).toLowerCase() === "critical"
                                    ? "bg-[#D81B60] text-white"
                                    : String(ws.priority).toLowerCase() === "high"
                                    ? "bg-[#F37021]/15 text-[#F37021]"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {ws.priority || "Medium"} Priority
                              </span>
                            </div>
                          </td>

                          {/* 6. Progress / Updates Column (Datewise • Latest on Top) */}
                          <td className="py-4 px-4">
                            <div className="space-y-2">
                              {updates.length === 0 ? (
                                <span className="text-slate-400 italic text-xs">
                                  No updates recorded yet
                                </span>
                              ) : (
                                updates.slice(0, 6).map((u: any, uIdx: number) => (
                                  <div
                                    key={u.id || uIdx}
                                    className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                                      uIdx === 0
                                        ? u.isRedAlert
                                          ? "bg-[#D81B60]/5 border-[#D81B60]/30 text-slate-900"
                                          : "bg-[#003B71]/5 border-[#003B71]/25 text-slate-900"
                                        : "bg-slate-50 border-slate-200/80 text-slate-600"
                                    }`}
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                      <div className="inline-flex items-center gap-1.5">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black ${
                                            uIdx === 0
                                              ? "bg-slate-900 text-white"
                                              : "bg-slate-200 text-slate-700"
                                          }`}
                                        >
                                          <Calendar className="w-2.5 h-2.5 text-[#F37021]" />
                                          {u.formattedDate}
                                        </span>
                                        {uIdx === 0 && (
                                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#003B71] text-white">
                                            LATEST
                                          </span>
                                        )}
                                        {u.isRedAlert && (
                                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#D81B60] text-white">
                                            ALERT
                                          </span>
                                        )}
                                      </div>
                                      {u.user && (
                                        <span className="text-[10px] font-bold text-slate-400">
                                          {u.user}
                                        </span>
                                      )}
                                    </div>
                                    <p className="font-medium break-words">{u.text}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </td>

                          {/* 7. Actions */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditWsModal(ws)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#003B71] text-white hover:bg-[#002850] font-bold text-[11px] transition cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                Add Update
                              </button>
                              <div className="flex items-center gap-1">
                                {isPendingActionStatus(ws.status) ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setClosingAction(ws);
                                      setClosureRemarks("");
                                    }}
                                    className="p-1.5 rounded-lg border border-slate-200 text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                                    title="Mark Completed / Close"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleReopenAction(ws)}
                                    className="p-1.5 rounded-lg border border-slate-200 text-[#003B71] hover:bg-slate-100 transition cursor-pointer"
                                    title="Reopen Action"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setShowHistoryModal(ws)}
                                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                  title="View Full Audit Log"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteWorkstream(ws.id)}
                                    className="p-1.5 rounded-lg border border-slate-200 text-[#D81B60] hover:bg-[#D81B60]/10 transition cursor-pointer"
                                    title="Delete Action"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-PAGE 2: STATUS & RAG ANALYTICS PAGE                           */}
      {/* ================================================================= */}
      {activeSubPage === "analytics_status" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider">
                  {dept.name} — Execution Status Breakdown
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribution of action items across execution states
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-[#003B71]/10 text-[#003B71] text-xs font-black">
                {items.length} Total Actions
              </span>
            </div>

            <div className="space-y-4">
              {statusChartData.map((s) => {
                const pct = items.length > 0 ? Math.round((s.count / items.length) * 100) : 0;
                return (
                  <div key={s.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{s.name}</span>
                      <span className="font-black text-slate-950">
                        {s.count} <span className="text-slate-400 font-semibold">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider pb-4 mb-5 border-b border-slate-100">
                RAG Health &amp; Weekly Cycle Metrics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {statusChartData.map((s) => (
                  <div
                    key={s.name}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-xs font-bold text-slate-700">{s.name}</span>
                    </div>
                    <span className="text-base font-black text-slate-950">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#003B71]/5 border border-[#003B71]/20">
                <div className="text-[10px] font-black uppercase text-[#003B71]">Readiness Score</div>
                <div className="text-xl font-black text-[#003B71] mt-0.5">{readiness}%</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#D81B60]/5 border border-[#D81B60]/20">
                <div className="text-[10px] font-black uppercase text-[#D81B60]">Red Alerts</div>
                <div className="text-xl font-black text-[#D81B60] mt-0.5">{redAlertCount}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-PAGE 3: PRIORITY & FINANCIAL ANALYTICS PAGE                   */}
      {/* ================================================================= */}
      {activeSubPage === "analytics_priority" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider pb-4 mb-5 border-b border-slate-100">
              Pending Actions by Priority Tier
            </h2>
            <div className="space-y-4">
              {priorityChartData.map((p) => {
                const pct =
                  pendingActions.length > 0
                    ? Math.round((p.count / pendingActions.length) * 100)
                    : 0;
                return (
                  <div key={p.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">{p.name} Priority</span>
                      <span className="font-black text-slate-950">
                        {p.count} <span className="text-slate-400 font-semibold">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: p.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
            <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider pb-4 mb-5 border-b border-slate-100">
              High-Priority &amp; VC Escalation Queue
            </h2>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {pendingActions.filter((x) => isRedAlertItem(x) || x.vc_decision_required === "Yes")
                .length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">
                  No critical or VC escalation items currently open.
                </p>
              ) : (
                pendingActions
                  .filter((x) => isRedAlertItem(x) || x.vc_decision_required === "Yes")
                  .map((x) => (
                    <div
                      key={x.id}
                      className="p-3.5 rounded-xl border border-[#D81B60]/25 bg-[#D81B60]/[0.03] flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                            {x.item_id || `ACT-${x.id}`}
                          </span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#D81B60] text-white">
                            {x.priority || "Critical"}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">{x.action_point || x.deliverable}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Owner: {x.ownership || x.owner} • Target: {x.timeline || x.target_date || "TBD"}
                        </p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-PAGE 5: SECTOR INDICATORS & DYNAMIC FORM                      */}
      {/* ================================================================= */}
      {activeSubPage === "sector_form" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-950">
                {dept.name} — Sector Performance &amp; Governance Form
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure readiness percentage, RAG status, and vertical-specific indicators
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl text-xs font-black uppercase bg-[#003B71]/10 text-[#003B71]">
              Status: {submissionStatus}
            </span>
          </div>

          {dynamicFields.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {dynamicFields.map((f: any) => {
                const val = formValues[f.id.toString()] ?? "";
                return (
                  <div key={f.id} className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      {f.label}
                      {f.required && <span className="text-[#D81B60] ml-1">*</span>}
                    </label>
                    {f.field_type === "Dropdown" || f.field_type === "Yes/No" ? (
                      <select
                        disabled={!canEdit}
                        value={val}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [f.id.toString()]: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-900"
                      >
                        <option value="">Select...</option>
                        {f.options && f.options.length > 0 ? (
                          f.options.map((opt: any) => (
                            <option key={opt.id} value={opt.option_value}>
                              {opt.option_label}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                            <option value="In Progress">In Progress</option>
                          </>
                        )}
                      </select>
                    ) : f.field_type === "Long Text" ? (
                      <textarea
                        disabled={!canEdit}
                        rows={2}
                        value={val}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [f.id.toString()]: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium text-slate-900"
                      />
                    ) : (
                      <input
                        disabled={!canEdit}
                        type={f.field_type === "Number" ? "number" : "text"}
                        value={val}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [f.id.toString()]: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium text-slate-900"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-500">RAG Status</div>
                <div className="text-base font-black text-slate-900 mt-1">{rag}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-500">Readiness %</div>
                <div className="text-base font-black text-[#003B71] mt-1">{readiness}%</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-500">Key Focus</div>
                <div className="text-xs font-semibold text-slate-800 mt-1">{keyFocus || "--"}</div>
              </div>
            </div>
          )}

          {canEdit && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={savingForm}
                onClick={() => handleSaveDynamicForm("DRAFT")}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={savingForm}
                onClick={() => handleSaveDynamicForm("SUBMITTED")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                {savingForm ? "Saving..." : "Submit Update"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-PAGE 6: HR RECRUITMENT ROSTER (HR DEPARTMENT ONLY)            */}
      {/* ================================================================= */}
      {isHR && activeSubPage === "recruitment" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-950">
                HR &amp; Recruitment — Active Position Roster
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Leadership and technical hiring pipeline across all 9 verticals
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                placeholder="Search positions..."
                value={recSearch}
                onChange={(e) => setRecSearch(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
              {canEdit && (
                <button
                  type="button"
                  onClick={openNewRecModal}
                  className="px-4 py-2 rounded-xl bg-[#003B71] text-white text-xs font-black uppercase cursor-pointer"
                >
                  + Add Role
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[950px]">
              <thead className="bg-slate-950 text-white text-[11px] font-black uppercase">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Position / Role</th>
                  <th className="py-3.5 px-4">Vertical</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Hiring Lead</th>
                  <th className="py-3.5 px-4">Target Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Remarks</th>
                  {canEdit && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {recruitmentItems
                  .filter(
                    (r: any) =>
                      !recSearch.trim() ||
                      String(r.position_title || "")
                        .toLowerCase()
                        .includes(recSearch.toLowerCase())
                  )
                  .map((r: any, idx: number) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-bold">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{r.position_title}</td>
                      <td className="py-3.5 px-4 text-slate-700">{r.strategic_segment}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            r.priority === "Critical"
                              ? "bg-[#D81B60] text-white"
                              : "bg-[#F37021]/15 text-[#F37021]"
                          }`}
                        >
                          {r.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{r.hiring_lead}</td>
                      <td className="py-3.5 px-4 font-mono">{r.target_date}</td>
                      <td className="py-3.5 px-4 font-bold text-[#003B71]">{r.status}</td>
                      <td className="py-3.5 px-4 text-slate-600">{r.remarks || r.next_action || "--"}</td>
                      {canEdit && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditRecModal(r)}
                              className="p-1.5 rounded-lg border border-slate-200 text-[#003B71]"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecruitment(r.id)}
                              className="p-1.5 rounded-lg border border-slate-200 text-[#D81B60]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 1: ADD / UPDATE ACTION ITEM (WITH DATEWISE UPDATES)         */}
      {/* ================================================================= */}
      {showWsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden max-h-[92vh] flex flex-col">
            <div className="h-1.5 bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021]" />
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-950">
                  {editingWs
                    ? `Update Action & Log Progress • ${editingWs.item_id || `ID #${editingWs.id}`}`
                    : "Add New Action Item (Pinned to Top)"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vertical: <strong className="text-[#003B71]">{dept.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWsModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkstream} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Action Item / Deliverable <span className="text-[#D81B60]">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={wsForm.action_point}
                  onChange={(e) => setWsForm({ ...wsForm, action_point: e.target.value })}
                  placeholder="Enter specific deliverable or directive..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Owner / Lead *</label>
                  <input
                    type="text"
                    required
                    value={wsForm.ownership}
                    onChange={(e) => setWsForm({ ...wsForm, ownership: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Target Timeline *</label>
                  <input
                    type="text"
                    required
                    value={wsForm.timeline}
                    onChange={(e) => setWsForm({ ...wsForm, timeline: e.target.value })}
                    placeholder="e.g. 2026-11-15"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={wsForm.next_followup_date}
                    onChange={(e) => setWsForm({ ...wsForm, next_followup_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Priority</label>
                  <select
                    value={wsForm.priority}
                    onChange={(e) => setWsForm({ ...wsForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="Critical">Critical (Red Alert)</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Status</label>
                  <select
                    value={wsForm.status}
                    onChange={(e) => setWsForm({ ...wsForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN PROGRESS">IN PROGRESS</option>
                    <option value="ON TRACK">ON TRACK</option>
                    <option value="DELAYED">DELAYED</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="ON HOLD">ON HOLD</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">RAG Alert</label>
                  <select
                    value={wsForm.rag_status}
                    onChange={(e) => setWsForm({ ...wsForm, rag_status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="RED">RED ALERT</option>
                    <option value="AMBER">AMBER</option>
                    <option value="GREEN">GREEN</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">VC Decision Alert</label>
                  <select
                    value={wsForm.vc_decision_required}
                    onChange={(e) => setWsForm({ ...wsForm, vc_decision_required: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes (VC Alert)</option>
                  </select>
                </div>
              </div>

              {/* Supporting Verticals */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Supporting Verticals (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(deptData?.allDepartments || []).map((d: any) => {
                    const isSelected = (wsForm.supporting_departments || "")
                      .toLowerCase()
                      .includes(d.name.toLowerCase());
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleSupportingDept(d.name)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          isSelected
                            ? "bg-[#003B71] text-white border-[#003B71]"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected ? `✓ ${d.name}` : `+ ${d.name}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* New Dated Progress Update Input */}
              <div className="p-3.5 rounded-xl bg-[#003B71]/5 border border-[#003B71]/20 space-y-2">
                <label className="block font-black text-[#003B71] uppercase tracking-wider text-[11px]">
                  {editingWs
                    ? "Add New Progress Update / Red Alert Note (Will appear on top with today's date)"
                    : "Initial Progress Update / Remarks"}
                </label>
                <textarea
                  rows={2}
                  value={wsForm.remarks}
                  onChange={(e) => setWsForm({ ...wsForm, remarks: e.target.value })}
                  placeholder="Enter progress update, milestone note, or red alert..."
                  className="w-full px-3 py-2 rounded-xl border border-[#003B71]/30 bg-white text-xs font-medium text-slate-900"
                />

                {editingWs && (
                  <div className="pt-2">
                    <div className="text-[10px] font-black uppercase text-slate-500 mb-1.5">
                      Existing Updates (Latest on Top):
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {getActionUpdatesDatewise(editingWs).map((u, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] flex items-start gap-2"
                        >
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-black text-[9px] shrink-0">
                            {u.formattedDate}
                          </span>
                          <span className="text-slate-700 font-medium">{u.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWsModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  {editingWs ? "Save Update" : "Add Action Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: FORMAL ACTION CLOSURE                                    */}
      {/* ================================================================= */}
      {closingAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="text-base font-black text-slate-950 mb-1">
              Complete &amp; Close Action [{closingAction.item_id || closingAction.id}]
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Closing this item moves it out of Pending Items into Closed History.
            </p>
            <form onSubmit={handleConfirmClose} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Closure Remarks / Verification Note *
                </label>
                <textarea
                  rows={3}
                  required
                  value={closureRemarks}
                  onChange={(e) => setClosureRemarks(e.target.value)}
                  placeholder="Enter completion summary..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClosingAction(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#003B71] text-white font-black uppercase"
                >
                  Confirm Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: DATEWISE UPDATE HISTORY MODAL                            */}
      {/* ================================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-black text-slate-950">
                Datewise Updates [{showHistoryModal.item_id || showHistoryModal.id}]
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              {getActionUpdatesDatewise(showHistoryModal).map((u, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border ${
                    i === 0
                      ? "bg-[#003B71]/5 border-[#003B71]/25"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-black text-[10px]">
                      {u.formattedDate} {i === 0 ? "• LATEST" : ""}
                    </span>
                    {u.user && <span className="text-[10px] font-bold text-slate-500">{u.user}</span>}
                  </div>
                  <p className="font-medium text-slate-900">{u.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 4: HR RECRUITMENT MODAL                                     */}
      {/* ================================================================= */}
      {showRecModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-base font-black text-slate-950 mb-4">
              {editingRec ? "Update Recruitment Position" : "Add Recruitment Position"}
            </h3>
            <form onSubmit={handleSaveRecruitment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Position Title *</label>
                <input
                  type="text"
                  required
                  value={recForm.position_title}
                  onChange={(e) => setRecForm({ ...recForm, position_title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vertical</label>
                  <input
                    type="text"
                    value={recForm.strategic_segment}
                    onChange={(e) => setRecForm({ ...recForm, strategic_segment: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={recForm.priority}
                    onChange={(e) => setRecForm({ ...recForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hiring Lead</label>
                  <input
                    type="text"
                    value={recForm.hiring_lead}
                    onChange={(e) => setRecForm({ ...recForm, hiring_lead: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={recForm.target_date}
                    onChange={(e) => setRecForm({ ...recForm, target_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks / Next Action</label>
                <textarea
                  rows={2}
                  value={recForm.remarks}
                  onChange={(e) => setRecForm({ ...recForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#003B71] text-white font-black uppercase"
                >
                  Save Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DepartmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-500">Loading Vertical Workspace...</div>}>
      <DepartmentPageContent />
    </Suspense>
  );
}
