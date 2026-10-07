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
  const [wsCategoryFilter, setWsCategoryFilter] = useState<string>("ALL");
  const [wsSearch, setWsSearch] = useState<string>("");

  // Recruitment Filter states (HR)
  const [recStatusFilter, setRecStatusFilter] = useState<string>("ALL");
  const [recPriorityFilter, setRecPriorityFilter] = useState<string>("ALL");
  const [recVcFilter, setRecVcFilter] = useState<string>("ALL");
  const [recSearch, setRecSearch] = useState<string>("");

  // Modal state for Workstream (Technical / Comm)
  const [showWsModal, setShowWsModal] = useState(false);
  const [editingWs, setEditingWs] = useState<any>(null);
  const [wsForm, setWsForm] = useState({
    category: "",
    deliverable: "",
    infrastructure_partnership: "",
    target_date: "",
    status: "In Progress",
    capex: "",
    revenue_pipeline: "",
    owner: "",
    risks_blockers: "",
    decision_action: "",
  });

  // Modal state for Recruitment (HR)
  const [showRecModal, setShowRecModal] = useState(false);
  const [editingRec, setEditingRec] = useState<any>(null);
  const [recForm, setRecForm] = useState({
    position_id: "",
    position_title: "",
    strategic_segment: "Semicon",
    priority: "High",
    target_date: "",
    status: "Open",
    candidates_sourced: 0,
    interviews: 0,
    offers: 0,
    ageing_days: 0,
    target_ctc: "",
    budget: "",
    hiring_lead: "",
    next_action: "",
    vc_attention: false,
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
          ? "Department updates successfully submitted to Executive Control Tower!"
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

  // Open modal for new Workstream
  const openNewWsModal = () => {
    setEditingWs(null);
    setWsForm({
      category: "Infrastructure",
      deliverable: "",
      infrastructure_partnership: "",
      target_date: new Date().toISOString().split("T")[0],
      status: "In Progress",
      capex: "",
      revenue_pipeline: "",
      owner: "",
      risks_blockers: "",
      decision_action: "",
    });
    setShowWsModal(true);
  };

  // Open modal for editing Workstream
  const openEditWsModal = (ws: any) => {
    setEditingWs(ws);
    setWsForm({
      category: ws.category || "",
      deliverable: ws.deliverable || "",
      infrastructure_partnership: ws.infrastructure_partnership || "",
      target_date: ws.target_date || "",
      status: ws.status || "In Progress",
      capex: ws.capex || "",
      revenue_pipeline: ws.revenue_pipeline || "",
      owner: ws.owner || "",
      risks_blockers: ws.risks_blockers || "",
      decision_action: ws.decision_action || "",
    });
    setShowWsModal(true);
  };

  // Save Workstream (Create or Update)
  const handleSaveWorkstream = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (!res.ok) throw new Error(data.error || "Failed to save workstream");

      setShowWsModal(false);
      setSuccessMsg(editingWs ? "Workstream updated successfully!" : "New workstream added successfully!");
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
      position_id: `POS-${Math.floor(100 + Math.random() * 900)}`,
      position_title: "",
      strategic_segment: "Semicon",
      priority: "Critical",
      target_date: new Date().toISOString().split("T")[0],
      status: "Open",
      candidates_sourced: 0,
      interviews: 0,
      offers: 0,
      ageing_days: 0,
      target_ctc: "",
      budget: "",
      hiring_lead: "",
      next_action: "",
      vc_attention: false,
    });
    setShowRecModal(true);
  };

  const openEditRecModal = (rec: any) => {
    setEditingRec(rec);
    setRecForm({
      position_id: rec.position_id || "",
      position_title: rec.position_title || "",
      strategic_segment: rec.strategic_segment || "Semicon",
      priority: rec.priority || "Medium",
      target_date: rec.target_date || "",
      status: rec.status || "Open",
      candidates_sourced: rec.candidates_sourced || 0,
      interviews: rec.interviews || 0,
      offers: rec.offers || 0,
      ageing_days: rec.ageing_days || 0,
      target_ctc: rec.target_ctc || "",
      budget: rec.budget || "",
      hiring_lead: rec.hiring_lead || "",
      next_action: rec.next_action || "",
      vc_attention: rec.vc_attention || false,
    });
    setShowRecModal(true);
  };

  const handleSaveRecruitment = async (e: React.FormEvent) => {
    e.preventDefault();
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
  const isHR = dept.code === "HR_REC";
  const canEdit = deptData.canEdit;

  // Extract distinct categories for workstreams
  const availableCategories = Array.from(new Set(items.map((x: any) => x.category).filter(Boolean))) as string[];

  // Filter Workstreams based on interactive buttons & search
  const filteredWorkstreams = items.filter((ws: any) => {
    if (wsStatusFilter !== "ALL" && ws.status !== wsStatusFilter) return false;
    if (wsCategoryFilter !== "ALL" && ws.category !== wsCategoryFilter) return false;
    if (wsSearch.trim()) {
      const q = wsSearch.toLowerCase();
      const matchDeliv = ws.deliverable && ws.deliverable.toLowerCase().includes(q);
      const matchOwner = ws.owner && ws.owner.toLowerCase().includes(q);
      const matchPart = ws.infrastructure_partnership && ws.infrastructure_partnership.toLowerCase().includes(q);
      const matchRisk = ws.risks_blockers && ws.risks_blockers.toLowerCase().includes(q);
      const matchAction = ws.decision_action && ws.decision_action.toLowerCase().includes(q);
      if (!matchDeliv && !matchOwner && !matchPart && !matchRisk && !matchAction) return false;
    }
    return true;
  });

  // Filter Recruitment positions (HR)
  const filteredRecruitment = items.filter((r: any) => {
    if (recStatusFilter !== "ALL" && r.status !== recStatusFilter) return false;
    if (recPriorityFilter !== "ALL" && r.priority !== recPriorityFilter) return false;
    if (recVcFilter === "VC_ONLY" && !r.vc_attention) return false;
    if (recSearch.trim()) {
      const q = recSearch.toLowerCase();
      const matchTitle = r.position_title && r.position_title.toLowerCase().includes(q);
      const matchId = r.position_id && r.position_id.toLowerCase().includes(q);
      const matchLead = r.hiring_lead && r.hiring_lead.toLowerCase().includes(q);
      const matchNext = r.next_action && r.next_action.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchLead && !matchNext) return false;
    }
    return true;
  });

  // Calculate quick metrics
  let openCount = 0;
  let completedCount = 0;
  let delayedCount = 0;

  if (isHR) {
    openCount = items.filter((x: any) => !["Joined", "Closed"].includes(x.status)).length;
    completedCount = items.filter((x: any) => x.status === "Joined").length;
    delayedCount = items.filter((x: any) => x.priority === "Critical" && !["Joined", "Closed"].includes(x.status)).length;
  } else {
    openCount = items.filter((x: any) => !["Completed", "On Hold"].includes(x.status)).length;
    completedCount = items.filter((x: any) => x.status === "Completed").length;
    delayedCount = items.filter((x: any) => ["Delayed", "Blocked"].includes(x.status)).length;
  }

  // Current dynamic fields list
  const dynamicFields = formConfig?.fields || [];

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
              <span>{isHR ? "+ Add Position" : "+ Add Workstream"}</span>
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
              {isHR ? "RECRUITMENT TRACKER" : "WORKSTREAMS"}
            </h2>
            <p className="text-xs text-slate-500">
              {isHR
                ? "Manage positions, sourcing pipelines, offers, and VC review items"
                : "Milestones, Capex, Revenue Pipeline, Risks, and Decisions"}
            </p>
          </div>
          {canEdit && (
            <button
              onClick={isHR ? openNewRecModal : openNewWsModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isHR ? "+ ADD POSITION" : "+ ADD WORKSTREAM"}</span>
            </button>
          )}
        </div>

        {/* FILTER BUTTONS CONTROLS */}
        {!isHR ? (
          /* WORKSTREAM FILTER CONTROLS */
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
              </div>

              {/* Workstream Search */}
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search deliverable, owner, risks..."
                  value={wsSearch}
                  onChange={(e) => setWsSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Category Filter Buttons (if categories available) */}
            {availableCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Category:
                </span>
                <button
                  onClick={() => setWsCategoryFilter("ALL")}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition ${
                    wsCategoryFilter === "ALL"
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Categories
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setWsCategoryFilter(cat)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition ${
                      wsCategoryFilter === cat
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
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
                { id: "Open", label: "Open" },
                { id: "In Interview", label: "In Interview" },
                { id: "Offered", label: "Offered" },
                { id: "Joined", label: "Joined" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setRecStatusFilter(s.id)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition ${
                    recStatusFilter === s.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Technical / Comm Workstream Table */}
        {!isHR ? (
          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="px-3 py-3">Item_ID</th>
                  <th className="px-4 py-3">Workstream_Category</th>
                  <th className="px-4 py-3">Deliverable_Milestone</th>
                  <th className="px-4 py-3">Key_Assets_Partnerships_Infrastructure</th>
                  <th className="px-4 py-3">Target_Date</th>
                  <th className="px-4 py-3">Status and Actions</th>
                  <th className="px-4 py-3">Capex_Budget_Cr</th>
                  <th className="px-4 py-3">Revenue_Pipeline_Cr</th>
                  <th className="px-4 py-3">Lead_Owner</th>
                  <th className="px-4 py-3">Risks_Operational_Blockers</th>
                  <th className="px-4 py-3">Vice_Chairman_Decision_Action</th>
                  {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredWorkstreams.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 12 : 11} className="px-6 py-8 text-center text-slate-400">
                      No workstreams match the active filters. Click "+ Add Workstream" or clear filters.
                    </td>
                  </tr>
                ) : (
                  filteredWorkstreams.map((ws: any) => (
                    <tr key={ws.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-3 py-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        WS-{String(ws.id).padStart(2, "0")}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {ws.category}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 min-w-[200px]">
                        {ws.deliverable}
                      </td>
                      <td className="px-4 py-3 text-slate-600 min-w-[160px]">
                        {ws.infrastructure_partnership || "--"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {ws.target_date || "--"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${
                            ws.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ws.status === "Delayed"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : ws.status === "Blocked"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {ws.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                        {ws.capex || "--"}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                        {ws.revenue_pipeline || "--"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {ws.owner || "--"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 min-w-[180px]">
                        {ws.risks_blockers ? (
                          <span className="text-rose-600 font-medium">{ws.risks_blockers}</span>
                        ) : (
                          "--"
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 min-w-[180px]">
                        {ws.decision_action ? (
                          <span className="text-indigo-600 font-medium">{ws.decision_action}</span>
                        ) : (
                          "--"
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => openEditWsModal(ws)}
                            title="Edit"
                            className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteWorkstream(ws.id)}
                            title="Delete"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* HR & RECRUITMENT TABLE */
          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="px-4 py-3">Position ID</th>
                  <th className="px-4 py-3">Position Title</th>
                  <th className="px-4 py-3">Strategic Segment</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Target Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Sourced</th>
                  <th className="px-4 py-3 text-center">Interviews</th>
                  <th className="px-4 py-3 text-center">Offers</th>
                  <th className="px-4 py-3 text-center">Ageing</th>
                  <th className="px-4 py-3">Target CTC</th>
                  <th className="px-4 py-3">Hiring Lead</th>
                  <th className="px-4 py-3">VC Attention</th>
                  {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRecruitment.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 14 : 13} className="px-6 py-8 text-center text-slate-400">
                      No recruitment positions match the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredRecruitment.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {r.position_id}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 min-w-[200px]">
                        <div>{r.position_title}</div>
                        {r.next_action && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            <strong>Next:</strong> {r.next_action}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-medium">
                        {r.strategic_segment}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase ${
                            r.priority === "Critical"
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : r.priority === "High"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          }`}
                        >
                          {r.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {r.target_date || "--"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md border bg-blue-50 text-blue-700 border-blue-200">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {r.candidates_sourced}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {r.interviews}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {r.offers}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {r.ageing_days}d
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {r.target_ctc || "--"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {r.hiring_lead || "--"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.vc_attention ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-700 border border-rose-300">
                            YES
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                          <button
                            onClick={() => openEditRecModal(r)}
                            title="Edit"
                            className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecruitment(r.id)}
                            title="Delete"
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD/EDIT WORKSTREAM */}
      {showWsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingWs ? "Update Workstream" : "+ Add Workstream"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Target deliverables and milestone tracking for {dept.name}
            </p>

            <form onSubmit={handleSaveWorkstream} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Workstream_Category</label>
                  <input
                    type="text"
                    value={wsForm.category}
                    onChange={(e) => setWsForm({ ...wsForm, category: e.target.value })}
                    required
                    placeholder="e.g. Infrastructure, Curriculum, Lab"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status and Actions</label>
                  <select
                    value={wsForm.status}
                    onChange={(e) => setWsForm({ ...wsForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 font-medium"
                  >
                    {WORKSTREAM_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deliverable_Milestone</label>
                <input
                  type="text"
                  value={wsForm.deliverable}
                  onChange={(e) => setWsForm({ ...wsForm, deliverable: e.target.value })}
                  required
                  placeholder="e.g. Cleanroom HVAC certification and clean bench setup"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Key_Assets_Partnerships_Infrastructure
                  </label>
                  <input
                    type="text"
                    value={wsForm.infrastructure_partnership}
                    onChange={(e) =>
                      setWsForm({ ...wsForm, infrastructure_partnership: e.target.value })
                    }
                    placeholder="e.g. Applied Materials / Cadence"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target_Date</label>
                  <input
                    type="date"
                    value={wsForm.target_date}
                    onChange={(e) => setWsForm({ ...wsForm, target_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capex_Budget_Cr</label>
                  <input
                    type="text"
                    value={wsForm.capex}
                    onChange={(e) => setWsForm({ ...wsForm, capex: e.target.value })}
                    placeholder="e.g. ₹ 14.5 Cr"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Revenue_Pipeline_Cr</label>
                  <input
                    type="text"
                    value={wsForm.revenue_pipeline}
                    onChange={(e) => setWsForm({ ...wsForm, revenue_pipeline: e.target.value })}
                    placeholder="e.g. ₹ 28.0 Cr"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead_Owner</label>
                  <input
                    type="text"
                    value={wsForm.owner}
                    onChange={(e) => setWsForm({ ...wsForm, owner: e.target.value })}
                    placeholder="e.g. Semicon Head"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Risks_Operational_Blockers
                </label>
                <input
                  type="text"
                  value={wsForm.risks_blockers}
                  onChange={(e) => setWsForm({ ...wsForm, risks_blockers: e.target.value })}
                  placeholder="e.g. HVAC filtration vendor delivery delayed by 3 weeks"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vice_Chairman_Decision_Action
                </label>
                <input
                  type="text"
                  value={wsForm.decision_action}
                  onChange={(e) => setWsForm({ ...wsForm, decision_action: e.target.value })}
                  placeholder="e.g. VC approval required for vendor penalty waiver"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWsModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition"
                >
                  Save Workstream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT RECRUITMENT POSITION */}
      {showRecModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingRec ? "Update Position" : "+ Add Position"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Talent Acquisition position details for RIASAT
            </p>

            <form onSubmit={handleSaveRecruitment} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Position ID</label>
                  <input
                    type="text"
                    value={recForm.position_id}
                    onChange={(e) => setRecForm({ ...recForm, position_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-600 mb-1">Position Title</label>
                  <input
                    type="text"
                    value={recForm.position_title}
                    onChange={(e) => setRecForm({ ...recForm, position_title: e.target.value })}
                    required
                    placeholder="e.g. Semiconductor SME Head & Programme Director"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Strategic Segment</label>
                  <input
                    type="text"
                    value={recForm.strategic_segment}
                    onChange={(e) => setRecForm({ ...recForm, strategic_segment: e.target.value })}
                    placeholder="e.g. Semicon, Aerospace"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Priority</label>
                  <select
                    value={recForm.priority}
                    onChange={(e) => setRecForm({ ...recForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  >
                    {RECRUITMENT_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Status</label>
                  <select
                    value={recForm.status}
                    onChange={(e) => setRecForm({ ...recForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  >
                    {RECRUITMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Candidates Sourced</label>
                  <input
                    type="number"
                    min="0"
                    value={recForm.candidates_sourced}
                    onChange={(e) =>
                      setRecForm({ ...recForm, candidates_sourced: parseInt(e.target.value || "0", 10) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Interviews</label>
                  <input
                    type="number"
                    min="0"
                    value={recForm.interviews}
                    onChange={(e) =>
                      setRecForm({ ...recForm, interviews: parseInt(e.target.value || "0", 10) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Offers</label>
                  <input
                    type="number"
                    min="0"
                    value={recForm.offers}
                    onChange={(e) =>
                      setRecForm({ ...recForm, offers: parseInt(e.target.value || "0", 10) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Ageing (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={recForm.ageing_days}
                    onChange={(e) =>
                      setRecForm({ ...recForm, ageing_days: parseInt(e.target.value || "0", 10) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Target CTC</label>
                  <input
                    type="text"
                    value={recForm.target_ctc}
                    onChange={(e) => setRecForm({ ...recForm, target_ctc: e.target.value })}
                    placeholder="e.g. ₹ 45-55 LPA"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Budget</label>
                  <input
                    type="text"
                    value={recForm.budget}
                    onChange={(e) => setRecForm({ ...recForm, budget: e.target.value })}
                    placeholder="e.g. ₹ 55 LPA"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Hiring Lead</label>
                  <input
                    type="text"
                    value={recForm.hiring_lead}
                    onChange={(e) => setRecForm({ ...recForm, hiring_lead: e.target.value })}
                    placeholder="e.g. Sumanth Rao"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Next Action</label>
                <input
                  type="text"
                  value={recForm.next_action}
                  onChange={(e) => setRecForm({ ...recForm, next_action: e.target.value })}
                  placeholder="e.g. Final interview with Vice Chairman scheduled"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="vc_att"
                  checked={recForm.vc_attention}
                  onChange={(e) => setRecForm({ ...recForm, vc_attention: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="vc_att" className="font-semibold text-slate-700">
                  Escalate to Vice Chairman / Executive attention
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRecModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition"
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
