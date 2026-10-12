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
} from "lucide-react";
import { WORKSTREAM_STATUSES, RAG_STATUSES, RECRUITMENT_PRIORITIES, RECRUITMENT_STATUSES } from "@/lib/constants";

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

  // Recruitment Filter states (HR)
  const [recStatusFilter, setRecStatusFilter] = useState<string>("ALL");
  const [recPriorityFilter, setRecPriorityFilter] = useState<string>("ALL");
  const [recVcFilter, setRecVcFilter] = useState<string>("ALL");
  const [recSearch, setRecSearch] = useState<string>("");

  // Modal & inline state for Action Tracker
  const [showWsModal, setShowWsModal] = useState(false);
  const [showInlineWsForm, setShowInlineWsForm] = useState(true);
  const [editingWs, setEditingWs] = useState<any>(null);
  const [wsForm, setWsForm] = useState({
    category: "",
    action_point: "",
    ownership: "",
    timeline: "",
    status: "In Progress",
    rag_status: "GREEN",
    remarks: "",
    vc_decision_required: "No",
    decision_action: "",
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

  // Open modal for new Action Point
  const openNewWsModal = () => {
    setEditingWs(null);
    setWsForm({
      category: "",
      action_point: "",
      ownership: deptData?.department?.name ? `${deptData.department.name} Head` : "Lead Owner",
      timeline: new Date().toISOString().split("T")[0],
      status: "In Progress",
      rag_status: "GREEN",
      remarks: "",
      vc_decision_required: "No",
      decision_action: "",
    });
    setShowWsModal(true);
  };

  // Open modal for editing Action Point
  const openEditWsModal = (ws: any) => {
    setEditingWs(ws);
    setWsForm({
      category: ws.category || "",
      action_point: ws.action_point || ws.deliverable || "",
      ownership: ws.ownership || ws.owner || "",
      timeline: ws.timeline || ws.target_date || "",
      status: ws.status || "In Progress",
      rag_status: (ws.rag_status || (["Delayed", "Blocked"].includes(ws.status) ? "AMBER" : "GREEN")).toUpperCase(),
      remarks: ws.remarks || ws.risks_blockers || "",
      vc_decision_required: ws.vc_decision_required === "Yes" ? "Yes" : "No",
      decision_action: ws.decision_action || "",
    });
    setShowWsModal(true);
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
        : { ...wsForm, department_id: deptId };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save action point");

      setShowWsModal(false);
      setEditingWs(null);

      // Prepare wsForm for the next entry
      setWsForm({
        category: "",
        action_point: "",
        ownership: deptData?.department?.name ? `${deptData.department.name} Head` : "Lead Owner",
        timeline: new Date().toISOString().split("T")[0],
        status: "In Progress",
        rag_status: "GREEN",
        remarks: "",
        vc_decision_required: "No",
        decision_action: "",
      });

      setSuccessMsg(editingWs ? "Action point updated successfully!" : "New action point added successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchDepartment();
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
        <p className="text-xs font-semibold mt-4">Loading department web form from PostgreSQL...</p>
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
  const items = deptData.items || [];
  const isHR = dept.code === "HR_REC" || Number(dept.id) === 7;
  const isStrategyOps = dept.code === "STRATEGY_OPS" || Number(dept.id) === 9;
  const isComm = dept.code === "COMM" || Number(dept.id) === 8;
  const isTechnical = !isHR && !isStrategyOps && !isComm;
  const canEdit = deptData.canEdit;

  // Extract distinct categories for workstreams
  const availableCategories = Array.from(new Set(items.map((x: any) => x.category).filter(Boolean))) as string[];

  // Filter Action Points based on interactive buttons & search
  const filteredWorkstreams = items.filter((ws: any) => {
    if (wsStatusFilter !== "ALL" && ws.status !== wsStatusFilter) return false;
    const itemRag = (ws.rag_status || (["Delayed", "Blocked"].includes(ws.status) ? "AMBER" : "GREEN")).toUpperCase();
    if (wsRagFilter !== "ALL" && itemRag !== wsRagFilter.toUpperCase()) return false;
    if (wsVcFilter === "YES" && ws.vc_decision_required !== "Yes") return false;
    if (wsSearch.trim()) {
      const q = wsSearch.toLowerCase().trim();
      const matchAction = (ws.action_point || ws.deliverable || "").toLowerCase().includes(q);
      const matchOwner = (ws.ownership || ws.owner || "").toLowerCase().includes(q);
      const matchRemarks = (ws.remarks || ws.decision_action || ws.risks_blockers || "").toLowerCase().includes(q);
      const matchTimeline = (ws.timeline || ws.target_date || "").toLowerCase().includes(q);
      if (!matchAction && !matchOwner && !matchRemarks && !matchTimeline) return false;
    }
    return true;
  });

  // Filter Recruitment positions (HR)
  const filteredRecruitment = items.filter((r: any) => {
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
  let openCount = 0;
  let completedCount = 0;
  let delayedCount = 0;

  if (isHR) {
    openCount = items.filter((x: any) => !["Joined", "Rejected"].includes(x.status)).length;
    completedCount = items.filter((x: any) => x.status === "Joined").length;
    delayedCount = items.filter((x: any) => x.priority === "Critical" && !["Joined", "Rejected"].includes(x.status)).length;
  } else {
    openCount = items.filter((x: any) => !["Completed", "On Hold"].includes(x.status)).length;
    completedCount = items.filter((x: any) => x.status === "Completed").length;
    delayedCount = items.filter((x: any) => ["Delayed", "Blocked"].includes(x.status)).length;
  }

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
    <div className="space-y-8">
      {/* Back button & Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/executive"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition"
            title="Back to Executive Tower"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {dept.name.toUpperCase()}
                </h1>
                <div className="text-xs font-bold text-indigo-700 tracking-wider uppercase mt-0.5">
                  DEPARTMENT UPDATE FORM
                </div>
              </div>
              {!canEdit && (
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  READ-ONLY VIEW
                </span>
              )}
              {canEdit && (deptData.isAdmin || deptData.isViceChairman || deptData.isChairman || deptData.hasFullAccess) && (
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md bg-indigo-100 text-indigo-800 border border-indigo-300">
                  COMPLETE ACCESS (VICE CHAIRMAN & ADMIN)
                </span>
              )}
              <span
                className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md border ${
                  submissionStatus === "SUBMITTED"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}
              >
                STATUS: {submissionStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Domain Code: <code>{dept.code}</code> • Last updated:{" "}
              {overview.last_updated ? new Date(overview.last_updated).toLocaleString("en-IN") : "Not yet"} by{" "}
              <strong className="text-slate-700">{overview.updated_by || "System"}</strong>
            </p>
          </div>
        </div>

        {/* Action Button */}
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={isHR ? openNewRecModal : openNewWsModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>{isHR ? "+ Edit or create new position" : "+ Edit or create new action"}</span>
            </button>
          </div>
        )}
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

      {/* SUMMARY KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Readiness
          </span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{readiness}%</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
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

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {isHR ? "Open Roles" : "Open Workstreams"}
          </span>
          <div className="mt-2 text-2xl font-extrabold text-indigo-700">{openCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {isHR ? "Joined / Filled" : "Completed"}
          </span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">{completedCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {isHR ? "Critical Roles" : "Delayed / Blocked"}
          </span>
          <div className="mt-2 text-2xl font-extrabold text-rose-700">{delayedCount}</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DYNAMIC FORM SECTION: SECTOR OVERVIEW & CONFIGURABLE HEADINGS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight uppercase">
                SECTOR OVERVIEW
              </h2>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200">
                DYNAMIC FORM
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Form headings and fields are dynamically configured by System Administrator.
              Changes update PostgreSQL and reflect immediately on the Executive Dashboard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!canEdit && (
              <span className="text-xs text-slate-400 italic font-medium">
                Read-only for Executive
              </span>
            )}
            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={savingForm}
                  onClick={() => handleSaveDynamicForm("DRAFT")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                  <span>Save Draft</span>
                </button>
                <button
                  type="button"
                  disabled={savingForm}
                  onClick={() => handleSaveDynamicForm("SUBMITTED")}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition"
                >
                  {savingForm ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>SAVE UPDATE</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Fields Grid */}
        {dynamicFields.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dynamicFields.map((f: any) => {
              const val = formValues[f.id.toString()] || "";

              return (
                <div
                  key={f.id}
                  className={`space-y-1.5 ${
                    f.field_type === "Long Text" ? "md:col-span-2 lg:col-span-3" : ""
                  }`}
                >
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      {f.label}
                      {f.required && <span className="text-rose-500">*</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">
                      {f.field_type}
                    </span>
                  </label>

                  {/* Render based on field_type */}
                  {f.field_type === "RAG Status" ? (
                    canEdit ? (
                      <select
                        value={(val || "NOT STARTED").toUpperCase()}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [f.id.toString()]: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      >
                        <option value="GREEN">GREEN - On Track</option>
                        <option value="AMBER">AMBER - Needs Attention</option>
                        <option value="RED">RED - Critical / Escalated</option>
                        <option value="NOT STARTED">NOT STARTED</option>
                      </select>
                    ) : (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                        {val || "--"}
                      </div>
                    )
                  ) : f.field_type === "Percentage" ? (
                    canEdit ? (
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={val}
                          onChange={(e) =>
                            setFormValues({ ...formValues, [f.id.toString()]: e.target.value })
                          }
                          placeholder="0 - 100"
                          className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                          %
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                        {val ? `${val}%` : "--"}
                      </div>
                    )
                  ) : f.field_type === "Currency" ? (
                    canEdit ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={val}
                          onChange={(e) =>
                            setFormValues({ ...formValues, [f.id.toString()]: e.target.value })
                          }
                          placeholder="e.g. ₹ 14.5 Cr or ₹ 45 LPA"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        {val || "--"}
                      </div>
                    )
                  ) : f.field_type === "Date" ? (
                    canEdit ? (
                      <input
                        type="date"
                        value={val}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [f.id.toString()]: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      />
                    ) : (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        {val || "--"}
                      </div>
                    )
                  ) : f.field_type === "Dropdown" ? (
                    canEdit ? (
                      <select
                        value={val}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [f.id.toString()]: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                      >
                        <option value="">-- Select --</option>
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
                    /* Default: Short Text or Number */
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
          /* Fallback if no dynamic fields configured */
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
      {/* TRACKER TABLE WITH FILTER BUTTONS */}
      {/* ========================================================================= */}
      <div id="workstreams" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight uppercase">
              {isHR ? "RECRUITMENT TRACKER" : "ACTION TRACKER"}
            </h2>
            <p className="text-xs text-slate-500">
              {isHR
                ? "Manage positions, sourcing pipelines, offers, and VC review items"
                : "Action Points, Ownership, Timelines, Status, RAG Status, Remarks, and VC Decisions"}
            </p>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => (isHR ? setShowInlineRecForm(!showInlineRecForm) : setShowInlineWsForm(!showInlineWsForm))}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition"
              >
                <span>
                  {isHR
                    ? (showInlineRecForm ? "Hide Recruitment Web Form" : "Show Recruitment Web Form")
                    : (showInlineWsForm ? "Hide Action Web Form" : "Show Action Web Form")}
                </span>
              </button>
              <button
                onClick={isHR ? openNewRecModal : openNewWsModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isHR ? "+ Edit or create new position" : "+ Edit or create new action"}</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* INLINE ACTION TRACKER DATA ENTRY FORM */}
        {/* ========================================================================= */}
        {!isHR && canEdit && showInlineWsForm && (
          <div className="mx-6 p-5 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 rounded-2xl border border-indigo-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  ACTION TRACKER WEB FORM
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                  8 Tracked Columns
                </span>
              </div>
              <span className="text-[11px] text-slate-500 italic">
                Enter action point details below to add directly to {dept.name}
              </span>
            </div>

            <form onSubmit={handleSaveWorkstream} className="space-y-3.5 text-xs">
              {/* Row 1: Initiative / Event / Campaign, Deliverable, Ownership, Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Initiative / Event / Campaign <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={wsForm.category}
                    onChange={(e) => setWsForm({ ...wsForm, category: e.target.value })}
                    required
                    placeholder="e.g. Cleanroom ISO-6 Upgrade / Strategic Partnership"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Deliverable <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={wsForm.action_point}
                    onChange={(e) => setWsForm({ ...wsForm, action_point: e.target.value })}
                    required
                    placeholder="e.g. Installation of Laminar Flow Units and Exhaust Ducts"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Ownership <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={wsForm.ownership}
                    onChange={(e) => setWsForm({ ...wsForm, ownership: e.target.value })}
                    required
                    placeholder={deptData?.department?.name ? `${deptData.department.name} Head` : "Lead Owner"}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Timeline
                  </label>
                  <input
                    type="date"
                    value={wsForm.timeline}
                    onChange={(e) => setWsForm({ ...wsForm, timeline: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Status, RAG Status, Vice Chairman Decision Required */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={wsForm.status}
                    onChange={(e) => setWsForm({ ...wsForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    RAG Status
                  </label>
                  <select
                    value={wsForm.rag_status}
                    onChange={(e) => setWsForm({ ...wsForm, rag_status: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="GREEN">Green</option>
                    <option value="AMBER">Amber</option>
                    <option value="RED">Red</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                    <span>Vice Chairman Decision Required</span>
                    <span className="text-[10px] text-rose-600 font-bold">YES / NO</span>
                  </label>
                  <select
                    value={wsForm.vc_decision_required}
                    onChange={(e) => setWsForm({ ...wsForm, vc_decision_required: e.target.value })}
                    className={`w-full px-3 py-2 bg-white rounded-xl border font-black focus:ring-2 focus:ring-indigo-600 focus:outline-none ${
                      wsForm.vc_decision_required === "Yes"
                        ? "border-rose-400 text-rose-700 bg-rose-50/50"
                        : "border-slate-300 text-slate-800"
                    }`}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Key Update / Dependency & VC Decision Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Key Update / Dependency
                  </label>
                  <textarea
                    rows={2}
                    value={wsForm.remarks}
                    onChange={(e) => setWsForm({ ...wsForm, remarks: e.target.value })}
                    placeholder="Progress, risks, blockers and dependencies..."
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Decision / Action Required from VC
                  </label>
                  <textarea
                    rows={2}
                    value={wsForm.decision_action}
                    onChange={(e) => setWsForm({ ...wsForm, decision_action: e.target.value })}
                    placeholder="Exact approval, intervention or decision required from Vice Chairman..."
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setWsForm({
                      category: "",
                      action_point: "",
                      ownership: deptData?.department?.name ? `${deptData.department.name} Head` : "Lead Owner",
                      timeline: new Date().toISOString().split("T")[0],
                      status: "In Progress",
                      rag_status: "GREEN",
                      remarks: "",
                      vc_decision_required: "No",
                      decision_action: "",
                    });
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-white/80 border border-transparent hover:border-slate-300 transition"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Edit or create new action</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* INLINE RECRUITMENT TRACKER DATA ENTRY FORM (HR & RECRUITMENT) */}
        {/* ========================================================================= */}
        {isHR && canEdit && showInlineRecForm && (
          <div className="mx-6 p-5 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 rounded-2xl border border-indigo-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  RECRUITMENT TRACKER WEB FORM
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                  9 Tracked Columns
                </span>
              </div>
              <span className="text-[11px] text-slate-500 italic">
                Enter talent pipeline details below to add directly to HR & Recruitment
              </span>
            </div>

            <form onSubmit={handleSaveRecruitment} className="space-y-3.5 text-xs">
              {/* Row 1: Position / Role, Department / Strategic Vertical, Priority, Hiring Owner */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Position / Role <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recForm.position_title}
                    onChange={(e) => setRecForm({ ...recForm, position_title: e.target.value })}
                    required
                    placeholder="e.g. Director - Cleanroom Operations"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Department / Strategic Vertical <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={recForm.strategic_segment}
                    onChange={(e) => setRecForm({ ...recForm, strategic_segment: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
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

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={recForm.priority}
                    onChange={(e) => setRecForm({ ...recForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Hiring Owner
                  </label>
                  <input
                    type="text"
                    value={recForm.hiring_lead}
                    onChange={(e) => setRecForm({ ...recForm, hiring_lead: e.target.value })}
                    placeholder="e.g. Sumanth Rao / HR Lead"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Target Joining Date, Status (Dropdown with 6 bullet entries), VC Decision Required */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Target Joining Date
                  </label>
                  <input
                    type="date"
                    value={recForm.target_date}
                    onChange={(e) => setRecForm({ ...recForm, target_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                    <span>Status</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">(Choose One)</span>
                  </label>
                  <select
                    value={recForm.status}
                    onChange={(e) => setRecForm({ ...recForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
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
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                    <span>VC Decision Required</span>
                    <span className="text-[10px] text-rose-600 font-bold">YES / NO</span>
                  </label>
                  <select
                    value={recForm.vc_decision_required}
                    onChange={(e) => setRecForm({ ...recForm, vc_decision_required: e.target.value })}
                    className={`w-full px-3 py-2 bg-white rounded-xl border font-black focus:ring-2 focus:ring-indigo-600 focus:outline-none ${
                      recForm.vc_decision_required === "Yes"
                        ? "border-rose-400 text-rose-700 bg-rose-50/50"
                        : "border-slate-300 text-slate-800"
                    }`}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Remarks */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Remarks
                </label>
                <textarea
                  rows={2}
                  value={recForm.remarks}
                  onChange={(e) => setRecForm({ ...recForm, remarks: e.target.value })}
                  placeholder="Progress, compensation discussions, bottlenecks, or leadership notes..."
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
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
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-white/80 border border-transparent hover:border-slate-300 transition"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Edit or create new position</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FILTER BUTTONS CONTROLS */}
        {!isHR ? (
          /* ACTION TRACKER FILTER CONTROLS */
          <div className="px-6 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Status Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Status:
                </span>
                {[
                  { id: "ALL", label: `All (${items.length})` },
                  { id: "In Progress", label: "In Progress" },
                  { id: "On Track", label: "On Track" },
                  { id: "Delayed", label: "Delayed" },
                  { id: "Blocked", label: "Blocked" },
                  { id: "Completed", label: "Completed" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setWsStatusFilter(item.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      wsStatusFilter === item.id
                        ? item.id === "Completed"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : item.id === "Blocked"
                          ? "bg-rose-600 text-white shadow-xs"
                          : item.id === "Delayed"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                <span className="text-slate-300 mx-1">|</span>

                {/* VC Decision Filter Button */}
                <button
                  onClick={() => setWsVcFilter(wsVcFilter === "YES" ? "ALL" : "YES")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    wsVcFilter === "YES"
                      ? "bg-rose-700 text-white shadow-xs"
                      : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                  }`}
                >
                  VC Decision Only
                </button>
              </div>

              {/* Workstream Search */}
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search action point, owner, remarks..."
                  value={wsSearch}
                  onChange={(e) => setWsSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            {/* RAG Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                RAG:
              </span>
              {[
                { id: "ALL", label: "All RAG" },
                { id: "GREEN", label: "GREEN" },
                { id: "AMBER", label: "AMBER" },
                { id: "RED", label: "RED" },
              ].map((ragBtn) => (
                <button
                  key={ragBtn.id}
                  onClick={() => setWsRagFilter(ragBtn.id)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition ${
                    wsRagFilter === ragBtn.id
                      ? ragBtn.id === "GREEN"
                        ? "bg-emerald-600 text-white"
                        : ragBtn.id === "AMBER"
                        ? "bg-amber-600 text-white"
                        : ragBtn.id === "RED"
                        ? "bg-rose-600 text-white"
                        : "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {ragBtn.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* HR RECRUITMENT FILTER CONTROLS */
          <div className="px-6 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Priority:
                </span>
                {[
                  { id: "ALL", label: `All (${items.length})` },
                  { id: "Critical", label: "Critical" },
                  { id: "High", label: "High" },
                  { id: "Medium", label: "Medium" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setRecPriorityFilter(item.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      recPriorityFilter === item.id
                        ? item.id === "Critical"
                          ? "bg-rose-600 text-white shadow-xs"
                          : item.id === "High"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                <span className="text-slate-300 mx-1">|</span>

                {/* VC Attention Filter Button */}
                <button
                  onClick={() => setRecVcFilter(recVcFilter === "VC_ONLY" ? "ALL" : "VC_ONLY")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    recVcFilter === "VC_ONLY"
                      ? "bg-rose-700 text-white shadow-xs"
                      : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                  }`}
                >
                  VC Attention Only
                </button>
              </div>

              {/* Recruitment Search */}
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search position, ID, lead..."
                  value={recSearch}
                  onChange={(e) => setRecSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Status:
              </span>
              {[
                { id: "ALL", label: "All Statuses" },
                { id: "Candidate sourced", label: "Candidate sourced" },
                { id: "shortlisted", label: "shortlisted" },
                { id: "Interview in progress", label: "Interview in progress" },
                { id: "Offers released", label: "Offers released" },
                { id: "Rejected", label: "Rejected" },
                { id: "Joined", label: "Joined" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setRecStatusFilter(s.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    recStatusFilter === s.id
                      ? s.id === "Joined"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : s.id === "Rejected"
                        ? "bg-rose-600 text-white shadow-xs"
                        : s.id === "Offers released"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : s.id === "Interview in progress"
                        ? "bg-amber-600 text-white shadow-xs"
                        : s.id === "shortlisted"
                        ? "bg-violet-600 text-white shadow-xs"
                        : "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Technical / Strategy & Ops / Comm Action Tracker Table */}
        {!isHR ? (
          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1329] text-white uppercase text-[11px] font-bold tracking-wider border-b border-slate-800 whitespace-nowrap">
                <tr>
                  <th className="px-3 py-3.5 text-center font-bold tracking-wider text-slate-100">Sl. No.</th>
                  <th className="px-4 py-3.5 text-left font-bold tracking-wider text-slate-100">Initiative / Event / Campaign</th>
                  <th className="px-4 py-3.5 text-left font-bold tracking-wider text-slate-100">Deliverable</th>
                  <th className="px-4 py-3.5 text-left font-bold tracking-wider text-slate-100">Ownership</th>
                  <th className="px-4 py-3.5 text-left font-bold tracking-wider text-slate-100">Timeline</th>
                  <th className="px-4 py-3.5 text-left font-bold tracking-wider text-slate-100">Status</th>
                  <th className="px-4 py-3.5 text-left font-bold tracking-wider text-slate-100">Key Update / Dependency</th>
                  <th className="px-4 py-3.5 text-center font-bold tracking-wider text-slate-100">Vice Chairman Decision Required</th>
                  {canEdit && <th className="px-4 py-3.5 text-right font-bold tracking-wider text-slate-100">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredWorkstreams.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 9 : 8} className="px-6 py-8 text-center text-slate-400">
                      No action points match the active filters. Click "+ Edit or create new action" or clear filters.
                    </td>
                  </tr>
                ) : (
                  filteredWorkstreams.map((ws: any, index: number) => {
                    const initiative = ws.category || "--";
                    const deliverable = ws.action_point || ws.deliverable || "--";
                    const ownership = ws.ownership || ws.owner || "--";
                    const timeline = ws.timeline || ws.target_date || "--";
                    const status = ws.status || "In Progress";
                    const ragStatus = (ws.rag_status || (["Delayed", "Blocked"].includes(status) ? "AMBER" : "GREEN")).toUpperCase();
                    const remarks = ws.remarks || ws.risks_blockers || "--";
                    const isVcReq = ws.vc_decision_required === "Yes";
                    const decisionAction = ws.decision_action || "";

                    return (
                      <tr key={ws.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-3 py-3.5 font-bold text-center text-slate-500 font-mono">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800 min-w-[180px]">
                          {initiative}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 min-w-[220px]">
                          {deliverable}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                          {ownership}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                          {timeline}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${
                                status === "Completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : status === "Delayed"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : status === "Blocked"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : status === "On Hold"
                                  ? "bg-slate-100 text-slate-700 border-slate-300"
                                  : status === "On Track"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-indigo-50 text-indigo-700 border-indigo-200"
                              }`}
                            >
                              {status}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                                ragStatus === "GREEN"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : ragStatus === "AMBER"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {ragStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 min-w-[200px] leading-relaxed">
                          {remarks}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {isVcReq ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black rounded-lg bg-rose-600 text-white shadow-xs">
                                YES
                              </span>
                              {decisionAction && (
                                <span className="text-[10px] text-rose-700 max-w-[160px] truncate" title={decisionAction}>
                                  {decisionAction}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                              No
                            </span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditWsModal(ws)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition shadow-2xs"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteWorkstream(ws.id)}
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
        ) : (
          /* HR & RECRUITMENT TABLE */
          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1329] text-white uppercase text-[11px] font-bold tracking-wider border-b border-slate-800 whitespace-nowrap">
                <tr>
                  <th className="px-3 py-3.5 text-center font-bold tracking-wider text-slate-100">Sl. No.</th>
                  <th className="px-4 py-3.5 text-left font-bold tracking-wider text-slate-100">Position / Role</th>
                  <th className="px-4 py-3.5 text-left font-bold tracking-wider text-slate-100">Department / Strategic Vertical</th>
                  <th className="px-4 py-3.5 text-left font-bold tracking-wider text-slate-100">Priority</th>
                  <th className="px-4 py-3.5 text-left font-bold tracking-wider text-slate-100">Hiring Owner</th>
                  <th className="px-4 py-3.5 text-left font-bold tracking-wider text-slate-100">Target Joining Date</th>
                  <th className="px-4 py-3.5 text-left font-bold tracking-wider text-slate-100">Status</th>
                  <th className="px-4 py-3.5 text-left font-bold tracking-wider text-slate-100">Remarks</th>
                  <th className="px-4 py-3.5 text-center font-bold tracking-wider text-slate-100">VC Decision Required</th>
                  {canEdit && <th className="px-4 py-3.5 text-right font-bold tracking-wider text-slate-100">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecruitment.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 10 : 9} className="px-6 py-8 text-center text-slate-400">
                      No recruitment positions match the active filters. Click "+ Edit or create new position" or clear filters.
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
                        <td className="px-3 py-3.5 font-bold text-center text-slate-500 font-mono">
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
                                : recStatus === "Rejected"
                                ? "bg-rose-50 text-rose-800 border-rose-300"
                                : "bg-blue-50 text-blue-800 border-blue-300"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              recStatus === "Joined"
                                ? "bg-emerald-500"
                                : recStatus === "Offers released"
                                ? "bg-indigo-500"
                                : recStatus === "Interview in progress"
                                ? "bg-amber-500"
                                : recStatus === "shortlisted"
                                ? "bg-violet-500"
                                : recStatus === "Rejected"
                                ? "bg-rose-500"
                                : "bg-blue-500"
                            }`} />
                            {recStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 min-w-[200px] leading-relaxed">
                          {remarks}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {isVcReq ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black rounded-lg bg-rose-600 text-white shadow-xs">
                              YES
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                              No
                            </span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
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
        )}
      </div>

      {/* MODAL: ADD/EDIT ACTION POINT */}
      {showWsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingWs ? "Update Action Point" : "+ Add Action Point"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {isStrategyOps
                ? `Strategy & Operations Specialised Tracker for ${dept.name}`
                : isComm
                ? `Communications Specialised Tracker for ${dept.name}`
                : `Action Tracker for ${dept.name}`}
            </p>

            <form onSubmit={handleSaveWorkstream} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Initiative / Event / Campaign <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={wsForm.category}
                  onChange={(e) => setWsForm({ ...wsForm, category: e.target.value })}
                  required
                  placeholder="e.g. Cleanroom ISO-6 Upgrade / Strategic Initiative / Event"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deliverable <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={wsForm.action_point}
                  onChange={(e) => setWsForm({ ...wsForm, action_point: e.target.value })}
                  required
                  placeholder="e.g. Commissioning of ISO-6 Cleanroom with Laminar Flow HVAC"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ownership <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={wsForm.ownership}
                    onChange={(e) => setWsForm({ ...wsForm, ownership: e.target.value })}
                    required
                    placeholder={deptData?.department?.name ? `${deptData.department.name} Head` : "Lead Owner"}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Timeline
                  </label>
                  <input
                    type="date"
                    value={wsForm.timeline}
                    onChange={(e) => setWsForm({ ...wsForm, timeline: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={wsForm.status}
                    onChange={(e) => setWsForm({ ...wsForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 font-medium"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">RAG Status</label>
                  <select
                    value={wsForm.rag_status}
                    onChange={(e) => setWsForm({ ...wsForm, rag_status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 font-medium"
                  >
                    <option value="GREEN">Green</option>
                    <option value="AMBER">Amber</option>
                    <option value="RED">Red</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vice Chairman Decision Required
                  </label>
                  <select
                    value={wsForm.vc_decision_required}
                    onChange={(e) => setWsForm({ ...wsForm, vc_decision_required: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-bold focus:ring-2 focus:ring-indigo-600 ${
                      wsForm.vc_decision_required === "Yes"
                        ? "border-rose-400 text-rose-700 bg-rose-50"
                        : "border-slate-300 text-slate-800"
                    }`}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Key Update / Dependency
                </label>
                <textarea
                  rows={3}
                  value={wsForm.remarks}
                  onChange={(e) => setWsForm({ ...wsForm, remarks: e.target.value })}
                  placeholder="Progress, risks, blockers and dependencies..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Decision / Action Required from VC
                </label>
                <textarea
                  rows={3}
                  value={wsForm.decision_action}
                  onChange={(e) => setWsForm({ ...wsForm, decision_action: e.target.value })}
                  placeholder="Exact approval, intervention or decision required from Vice Chairman (optional if No)..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {editingWs ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteWorkstream(editingWs.id);
                      setShowWsModal(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Action</span>
                  </button>
                ) : <div />}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowWsModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    {editingWs ? "Save Changes" : "+ Edit or create new action"}
                  </button>
                </div>
              </div>
            </form>
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
