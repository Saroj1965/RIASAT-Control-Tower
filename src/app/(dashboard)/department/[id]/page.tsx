"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Plus,
  Edit3,
  Trash2,
  Search,
  RefreshCw,
  FileText,
  Save,
  Download,
  BarChart3,
  Layers,
  ListChecks,
  Flame,
  Sparkles,
  History,
} from "lucide-react";
import { ActionFormModal, ActionHistorySheet } from "@/components/ActionFormModal";

const BRAND = {
  blue: "#003B71",
  pink: "#D81B60",
  orange: "#F37021",
  black: "#0F172A",
};

interface DepartmentInfo {
  id: number;
  name: string;
  code: string;
}

interface OverviewInfo {
  readiness_percentage: number;
  rag_status: string;
  key_focus: string;
  submission_status: string;
  last_updated: string;
  updated_by: string;
}

export default function DepartmentWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const deptId = parseInt(params.id as string, 10);

  const activePage = searchParams?.get("tab") || "pending";
  const setPage = (tabName: string) => {
    router.push(`/department/${deptId}?tab=${tabName}`);
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [department, setDepartment] = useState<DepartmentInfo | null>(null);
  const [allDepartments, setAllDepartments] = useState<DepartmentInfo[]>([]);
  const [overview, setOverview] = useState<OverviewInfo | null>(null);
  const [workstreams, setWorkstreams] = useState<any[]>([]);
  const [recruitment, setRecruitment] = useState<any[]>([]);
  const [formStructure, setFormStructure] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filters
  const [wsSearch, setWsSearch] = useState("");
  const [wsPriorityFilter, setWsPriorityFilter] = useState("ALL");
  const [redAlertOnly, setRedAlertOnly] = useState(false);

  // Dynamic Web Form Values
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [readiness, setReadiness] = useState<number>(0);
  const [ragStatus, setRagStatus] = useState<string>("AMBER");
  const [keyFocus, setKeyFocus] = useState<string>("");
  const [savingForm, setSavingForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Unified Edit / Add Action Modal (Image 1) & History Drawer
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingAction, setEditingAction] = useState<any | null>(null);
  const [historyAction, setHistoryAction] = useState<any | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchDepartmentData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [res, deptsRes] = await Promise.all([
        fetch(`/api/departments/${deptId}`, { cache: "no-store" }),
        fetch("/api/departments", { cache: "no-store" }),
      ]);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load department workspace");
      }

      if (deptsRes.ok) {
        const dJson = await deptsRes.json();
        if (Array.isArray(dJson.departments)) {
          setAllDepartments(dJson.departments);
        }
      }

      setDepartment(data.department);
      setOverview(data.overview);
      setWorkstreams(data.workstreams || []);
      setRecruitment(data.recruitment || []);
      setFormStructure(data.formStructure || []);
      setCurrentUser(data.user);

      setReadiness(data.overview?.readiness_percentage || 0);
      setRagStatus(data.overview?.rag_status || "AMBER");
      setKeyFocus(data.overview?.key_focus || "");

      const initialVals: Record<string, any> = {};
      for (const sec of data.formStructure || []) {
        for (const field of sec.fields || []) {
          initialVals[field.id] =
            field.field_type === "Number"
              ? field.number_value ?? ""
              : field.text_value ?? "";
        }
      }
      setFormValues(initialVals);
    } catch (err: any) {
      setError(err.message || "Error loading workspace");
    } finally {
      setLoading(false);
    }
  }, [deptId]);

  useEffect(() => {
    if (!isNaN(deptId)) {
      fetchDepartmentData();
    }
  }, [deptId, fetchDepartmentData]);

  // Unify all department actions (workstreams + any HR recruitment records mapped to the same schema)
  const unifiedActions = useMemo(() => {
    const wsMapped = (workstreams || []).map((w: any) => ({
      ...w,
      is_hr_item: false,
    }));

    // Map any recruitment positions for Dept 7 into the exact same unified action structure
    const recMapped = (recruitment || []).map((r: any) => {
      const statusNorm =
        r.status === "Joined" || r.status === "Closed" ? "Closed" : r.status || "Open";
      const updates = [
        {
          date: r.updated_at || "2026-10-23T09:00:00Z",
          user: r.hiring_lead || r.updated_by || "Anamika Sahay",
          status: statusNorm,
          remarks:
            r.remarks ||
            r.next_action ||
            `Sourced: ${r.candidates_sourced || 0}, Shortlisted: ${r.candidates_shortlisted || 0}, Interviews: ${r.interviews || 0}`,
        },
      ];
      return {
        id: r.id,
        item_id: r.position_id || `REC-${String(r.id).padStart(2, "0")}`,
        position_id: r.position_id,
        department_id: deptId,
        department_name: department?.name || "HR & Recruitment",
        category: r.strategic_segment || "Talent Acquisition",
        deliverable: r.position_title,
        action_point: r.position_title,
        position_title: r.position_title,
        strategic_segment: r.strategic_segment,
        owner: r.hiring_lead || "Anamika Sahay",
        ownership: r.hiring_lead || "Anamika Sahay",
        hiring_lead: r.hiring_lead || "Anamika Sahay",
        supporting_departments: r.strategic_segment || "",
        priority: r.priority || "High",
        target_date: r.target_date || "Immediate",
        timeline: r.target_date || "Immediate",
        status: statusNorm,
        rag_status: r.rag_status || "GREEN",
        effective_rag: r.rag_status || "GREEN",
        is_red_alert:
          r.rag_status === "RED" || String(r.priority || "").toUpperCase() === "CRITICAL",
        vc_decision_required:
          r.vc_decision_required === "Yes" || r.vc_attention ? "Yes" : "No",
        vc_attention: r.vc_attention,
        remarks: r.remarks || r.next_action || "",
        decision_action: r.next_action || r.remarks || "",
        next_action: r.next_action || "",
        review_meeting_date: "2026-10-12",
        review_frequency: "Weekly",
        updates_list: updates,
        action_history: updates,
        is_hr_item: true,
        updated_at: r.updated_at,
        updated_by: r.updated_by,
      };
    });

    return [...wsMapped, ...recMapped];
  }, [workstreams, recruitment, deptId, department]);

  // Separate Pending vs Closed
  const pendingWorkstreams = useMemo(() => {
    return unifiedActions.filter((w) => {
      const st = String(w.status || "OPEN").trim().toUpperCase();
      return st !== "CLOSED" && st !== "COMPLETED" && st !== "JOINED";
    });
  }, [unifiedActions]);

  const closedWorkstreams = useMemo(() => {
    return unifiedActions.filter((w) => {
      const st = String(w.status || "OPEN").trim().toUpperCase();
      return st === "CLOSED" || st === "COMPLETED" || st === "JOINED";
    });
  }, [unifiedActions]);

  const filterList = useCallback(
    (list: any[]) => {
      return list.filter((w) => {
        if (
          wsPriorityFilter !== "ALL" &&
          String(w.priority || "Medium").toUpperCase() !==
            wsPriorityFilter.toUpperCase()
        ) {
          return false;
        }
        if (redAlertOnly) {
          const isAlert =
            w.is_red_alert ||
            w.effective_rag === "RED" ||
            w.rag_status === "RED" ||
            w.is_overdue ||
            String(w.priority || "").toUpperCase() === "CRITICAL";
          if (!isAlert) return false;
        }
        if (wsSearch.trim()) {
          const q = wsSearch.toLowerCase();
          const text = [
            w.item_id,
            w.deliverable,
            w.action_point,
            w.category,
            w.owner,
            w.ownership,
            w.remarks,
            w.decision_action,
            w.supporting_departments,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!text.includes(q)) return false;
        }
        return true;
      });
    },
    [wsPriorityFilter, redAlertOnly, wsSearch]
  );

  const displayedPending = useMemo(
    () => filterList(pendingWorkstreams),
    [filterList, pendingWorkstreams]
  );
  const displayedClosed = useMemo(
    () => filterList(closedWorkstreams),
    [filterList, closedWorkstreams]
  );

  // CSV Export for Department (Unified Format Across All 9 Departments)
  const handleExportCSV = () => {
    const rows = activePage === "closed" ? displayedClosed : displayedPending;
    const headers = [
      "S.No.",
      "Action ID",
      "Review Meeting Date",
      "Review Frequency",
      "Department",
      "Action Item / Deliverable",
      "Action Owner",
      "Support Required From",
      "Priority",
      "Completion / Target Date",
      "Status",
      "Action Taken (Closed / Open / In Progress)",
      "Progress / Updates (Latest First)",
      "Next Follow-up Date",
      "VC Decision Required",
    ];

    const escapeCsv = (val: any) => {
      const str = String(val ?? "").replace(/\r?\n/g, " | ");
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvLines = [
      headers.map(escapeCsv).join(","),
      ...rows.map((w: any, idx: number) => {
        const updates = Array.isArray(w.updates_list)
          ? w.updates_list
              .map(
                (u: any, uIdx: number) =>
                  `[#${w.updates_list.length - uIdx} ${String(u.date || "").slice(0, 10)} - ${u.user || "User"}]: ${u.remarks}`
              )
              .join(" ;; ")
          : w.remarks || "";

        const actionTaken =
          w.closure_remarks ||
          w.decision_action ||
          w.remarks ||
          "Active operational directive";

        return [
          `S.No. ${idx + 1}`,
          w.item_id || `ACT-${idx + 1}`,
          String(w.review_meeting_date || "2026-10-12").slice(0, 10),
          w.review_frequency || "Weekly",
          department?.name || "",
          w.action_point || w.deliverable || "",
          w.ownership || w.owner || "",
          w.supporting_departments || "",
          w.priority || "Medium",
          w.target_date || w.timeline || "",
          w.status || "Open",
          actionTaken,
          updates,
          w.next_followup_date || "",
          w.vc_decision_required || "No",
        ]
          .map(escapeCsv)
          .join(",");
      }),
    ];

    const csvContent = "\uFEFF" + csvLines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${department?.code || "DEPT"}_Action_Register_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveForm = async (submissionStatus: "DRAFT" | "SUBMITTED") => {
    try {
      setSavingForm(true);
      const fieldsPayload: {
        field_id: number;
        text_value: string | null;
        number_value: number | null;
      }[] = [];

      for (const sec of formStructure) {
        for (const field of sec.fields) {
          const rawVal = formValues[field.id];
          if (field.field_type === "Number") {
            const num =
              rawVal !== "" && rawVal !== null && rawVal !== undefined
                ? Number(rawVal)
                : null;
            fieldsPayload.push({
              field_id: field.id,
              text_value: rawVal !== "" ? String(rawVal) : null,
              number_value: isNaN(num as number) ? null : num,
            });
          } else {
            fieldsPayload.push({
              field_id: field.id,
              text_value:
                rawVal !== undefined && rawVal !== null ? String(rawVal) : "",
              number_value: null,
            });
          }
        }
      }

      const res = await fetch(`/api/departments/${deptId}/form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readiness_percentage: readiness,
          rag_status: ragStatus,
          key_focus: keyFocus,
          submission_status: submissionStatus,
          fields: fieldsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save form");

      showToast("Department form saved successfully to Supabase", "success");
      fetchDepartmentData();
    } catch (err: any) {
      showToast(err.message || "Error saving form", "error");
    } finally {
      setSavingForm(false);
    }
  };

  const openAddWorkstreamModal = () => {
    setModalMode("create");
    setEditingAction(null);
    setModalOpen(true);
  };

  const openEditWorkstreamModal = (ws: any) => {
    setModalMode("edit");
    setEditingAction(ws);
    setModalOpen(true);
  };

  const handleDeleteWorkstream = async (item: any) => {
    const label = item.action_point || item.deliverable;
    if (!confirm(`Delete action item "${label}"?`)) return;
    try {
      const url = item.is_hr_item
        ? `/api/recruitment/${item.id}`
        : `/api/workstreams/${item.id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      showToast("Action item removed", "success");
      fetchDepartmentData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Analytics Data for Department Analytics Sub-Page
  const statusPieData = useMemo(() => {
    const red = pendingWorkstreams.filter(
      (w) => w.is_red_alert || w.effective_rag === "RED" || w.rag_status === "RED"
    ).length;
    const otherPending = Math.max(0, pendingWorkstreams.length - red);
    const closed = closedWorkstreams.length;
    return [
      { name: "Active On-Track (Blue)", value: otherPending, color: BRAND.blue },
      { name: "Red Alerts (Pink)", value: red, color: BRAND.pink },
      { name: "Completed / Closed (Orange)", value: closed, color: BRAND.orange },
    ];
  }, [pendingWorkstreams, closedWorkstreams]);

  const categoryBarData = useMemo(() => {
    const map = new Map<string, { name: string; Pending: number; Closed: number }>();
    for (const w of unifiedActions) {
      const cat = String(w.category || "General").slice(0, 18);
      if (!map.has(cat)) map.set(cat, { name: cat, Pending: 0, Closed: 0 });
      const entry = map.get(cat)!;
      const st = String(w.status || "OPEN").toUpperCase();
      if (st === "CLOSED" || st === "COMPLETED") entry.Closed++;
      else entry.Pending++;
    }
    return Array.from(map.values());
  }, [unifiedActions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#003B71] animate-spin" />
          <p className="text-sm text-slate-600 font-bold">
            Loading Vertical Register...
          </p>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="p-6 bg-white border border-[#D81B60]/30 rounded-2xl text-[#D81B60]">
        <h3 className="font-black text-base mb-1">Workspace Access Error</h3>
        <p className="text-xs">{error || "Department not found"}</p>
      </div>
    );
  }

  const redAlertsCount = pendingWorkstreams.filter(
    (w) => w.is_red_alert || w.effective_rag === "RED" || w.rag_status === "RED"
  ).length;

  const deptOptions =
    allDepartments.length > 0
      ? allDepartments
      : [{ id: department.id, name: department.name, code: department.code }];

  return (
    <div className="space-y-6 pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-xl shadow-xl border text-xs font-bold text-white ${
            toastMessage.type === "success"
              ? "bg-[#003B71] border-blue-800"
              : "bg-[#D81B60] border-pink-700"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Vertical Header Banner */}
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
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#003B71] text-white">
                  {department.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F37021]/15 text-[#F37021]">
                  Readiness: {overview?.readiness_percentage || 0}%
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  Riasat Executive Dashboard
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight truncate">
                {department.name} — Departmental Action Register
              </h1>
              <p className="text-xs text-slate-500 font-medium truncate">
                {overview?.key_focus ||
                  "Unified Departmental Action Register & Weekly Progress Updates"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={openAddWorkstreamModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white text-xs font-black uppercase tracking-wider shadow-sm hover:opacity-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Action Item
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#F37021]" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Sub-Pages Navigation Pills */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            {
              id: "pending",
              label: `Pending Items (${pendingWorkstreams.length})`,
              icon: <Clock className="w-3.5 h-3.5" />,
            },
            {
              id: "closed",
              label: `Closed History (${closedWorkstreams.length})`,
              icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            },
            {
              id: "analytics",
              label: "Vertical Analytics",
              icon: <BarChart3 className="w-3.5 h-3.5" />,
            },
            {
              id: "web_form",
              label: "Unified Department Form",
              icon: <FileText className="w-3.5 h-3.5" />,
            },
          ].map((tab) => {
            const active = activePage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPage(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  active
                    ? "bg-[#003B71] text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                }`}
              >
                <span className={active ? "text-[#F37021]" : "text-slate-500"}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs border-l-4 border-l-[#003B71]">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Pending Items Only
          </div>
          <div className="text-2xl font-black text-slate-950 mt-1">
            {pendingWorkstreams.length}
          </div>
          <div className="text-[11px] text-[#003B71] font-semibold mt-0.5">
            Active open directives
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs border-l-4 border-l-[#D81B60]">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Red Alerts &amp; Critical
          </div>
          <div className="text-2xl font-black text-[#D81B60] mt-1">
            {redAlertsCount}
          </div>
          <div className="text-[11px] text-[#D81B60] font-semibold mt-0.5">
            Prioritized on top
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs border-l-4 border-l-[#F37021]">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Completed / Closed
          </div>
          <div className="text-2xl font-black text-slate-950 mt-1">
            {closedWorkstreams.length}
          </div>
          <div className="text-[11px] text-[#F37021] font-semibold mt-0.5">
            Archived in Closed tab
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs border-l-4 border-l-slate-950">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Readiness Index
          </div>
          <div className="text-2xl font-black text-slate-950 mt-1">
            {overview?.readiness_percentage || 0}%
          </div>
          <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
            RAG: {overview?.rag_status || "AMBER"}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SUB-PAGE 1 & 2: PENDING ITEMS / CLOSED HISTORY TABLE                */}
      {/* =================================================================== */}
      {(activePage === "pending" || activePage === "closed") && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 md:p-5 border-b border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage("pending")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                  activePage === "pending"
                    ? "bg-[#003B71] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-[#F37021]" />
                Pending Items ({pendingWorkstreams.length})
              </button>
              <button
                type="button"
                onClick={() => setPage("closed")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                  activePage === "closed"
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D81B60]" />
                Closed History ({closedWorkstreams.length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={wsSearch}
                  onChange={(e) => setWsSearch(e.target.value)}
                  placeholder="Search action, owner, update..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#003B71]"
                />
              </div>

              <select
                value={wsPriorityFilter}
                onChange={(e) => setWsPriorityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <button
                type="button"
                onClick={() => setRedAlertOnly(!redAlertOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  redAlertOnly
                    ? "bg-[#D81B60] text-white border-[#D81B60]"
                    : "bg-white text-[#D81B60] border-[#D81B60]/30 hover:bg-[#D81B60]/5"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Red Alerts Only
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1150px] text-xs">
              <thead>
                <tr className="bg-slate-950 text-white text-[11px] font-black uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-28">S.No. / Code</th>
                  <th className="py-3.5 px-4 w-28">Review Date</th>
                  <th className="py-3.5 px-4 min-w-[260px]">
                    Action Item &amp; Action Taken
                  </th>
                  <th className="py-3.5 px-4 w-44">Owner &amp; Support</th>
                  <th className="py-3.5 px-4 w-32">Target &amp; Status</th>
                  <th className="py-3.5 px-4 min-w-[320px]">
                    Progress / Updates (Latest on Top)
                  </th>
                  <th className="py-3.5 px-4 w-24 text-center">VC Decision</th>
                  <th className="py-3.5 px-4 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {(activePage === "pending" ? displayedPending : displayedClosed)
                  .length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-12 text-center text-slate-400 font-medium"
                    >
                      No {activePage === "pending" ? "pending" : "closed"} action
                      items found.
                    </td>
                  </tr>
                ) : (
                  (activePage === "pending"
                    ? displayedPending
                    : displayedClosed
                  ).map((w: any, idx: number) => {
                    const isRedAlert =
                      w.is_red_alert ||
                      w.effective_rag === "RED" ||
                      w.rag_status === "RED" ||
                      String(w.priority || "").toUpperCase() === "CRITICAL";
                    const isNew = Number(w.id) > 15 && !w.is_hr_item;
                    const updates = Array.isArray(w.updates_list)
                      ? w.updates_list
                      : [];
                    const statusUpper = String(w.status || "Open").toUpperCase();
                    const isClosedRow =
                      statusUpper === "CLOSED" || statusUpper === "COMPLETED";

                    const actionTakenSummary =
                      w.closure_remarks ||
                      w.decision_action ||
                      w.remarks ||
                      "Action registered and under weekly review.";

                    return (
                      <tr
                        key={`${w.item_id || w.id}-${idx}`}
                        className={`align-top transition ${
                          isRedAlert
                            ? "bg-[#D81B60]/[0.04] hover:bg-[#D81B60]/[0.08]"
                            : isNew
                              ? "bg-[#003B71]/[0.03] hover:bg-[#003B71]/[0.06]"
                              : "hover:bg-slate-50/90"
                        }`}
                      >
                        {/* S.No. 1, 2... + Code */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#003B71]/10 text-[#003B71] font-mono font-black text-[11px] w-fit">
                              S.No. {idx + 1}
                            </span>
                            <span className="font-mono font-black text-slate-950 text-xs">
                              {w.item_id || `ACT-${w.id}`}
                            </span>
                            {isNew && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#003B71] text-white w-fit">
                                <Sparkles className="w-2.5 h-2.5" /> NEW
                              </span>
                            )}
                            {isRedAlert && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#D81B60] text-white w-fit">
                                <Flame className="w-2.5 h-2.5" /> RED ALERT
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Review Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">
                            {String(w.review_meeting_date || "2026-10-12").slice(
                              0,
                              10
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {w.review_frequency || "Weekly"}
                          </div>
                        </td>

                        {/* Action Item & Action Taken */}
                        <td className="py-3.5 px-4">
                          <div className="text-[10px] font-bold uppercase text-[#003B71] mb-0.5">
                            {w.category || "Operational Directive"}
                          </div>
                          <p className="font-semibold text-slate-900 leading-relaxed">
                            {w.action_point || w.deliverable}
                          </p>
                          <div
                            className={`mt-1.5 rounded-md border px-2.5 py-1.5 text-[11px] ${
                              isClosedRow
                                ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                                : statusUpper.includes("PROGRESS") ||
                                    statusUpper.includes("TRACK")
                                  ? "border-blue-200 bg-blue-50/60 text-blue-900"
                                  : "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span className="font-bold">
                              Action Taken ({w.status || "Open"}):{" "}
                            </span>
                            <span>{actionTakenSummary}</span>
                          </div>
                        </td>

                        {/* Owner & Support */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {w.ownership || w.owner || "Unassigned"}
                          </div>
                          {w.supporting_departments && (
                            <div className="text-[11px] text-slate-500 mt-1">
                              Support: {w.supporting_departments}
                            </div>
                          )}
                        </td>

                        {/* Target & Status */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 mb-1">
                            {w.target_date || w.timeline || "Immediate"}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                isRedAlert
                                  ? "bg-[#D81B60] text-white"
                                  : "bg-[#003B71]/10 text-[#003B71]"
                              }`}
                            >
                              {w.status || "OPEN"}
                            </span>
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                              {w.priority || "Medium"}
                            </span>
                          </div>
                        </td>

                        {/* Progress / Updates (Datewise, Latest on Top) */}
                        <td className="py-3.5 px-4">
                          {updates.length > 0 ? (
                            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                              {updates.map((u: any, uIdx: number) => {
                                const isLatest = uIdx === 0;
                                const dateStr = u.date
                                  ? String(u.date).slice(0, 10)
                                  : "2026-10-23";
                                return (
                                  <div
                                    key={uIdx}
                                    className={`p-2 rounded-lg border text-[11px] leading-snug ${
                                      isLatest
                                        ? isRedAlert
                                          ? "bg-white border-[#D81B60]/40 shadow-2xs"
                                          : "bg-white border-[#003B71]/30 shadow-2xs"
                                        : "bg-slate-50/80 border-slate-200/70 text-slate-600"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                      <span className="font-mono font-black text-[10px] text-[#003B71]">
                                        #{updates.length - uIdx} &bull; {dateStr}
                                        {isLatest && (
                                          <span className="ml-1.5 px-1.5 py-0.2 rounded bg-[#F37021]/15 text-[#F37021] text-[9px] uppercase">
                                            Latest
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-500 truncate max-w-[110px]">
                                        {u.user}
                                      </span>
                                    </div>
                                    <p className="text-slate-800 font-medium">
                                      {u.remarks}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">
                              No updates logged
                            </span>
                          )}
                        </td>

                        {/* VC Decision */}
                        <td className="py-3.5 px-4 text-center">
                          {w.vc_decision_required === "Yes" ? (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#D81B60] text-white">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                              No
                            </span>
                          )}
                        </td>

                        {/* Actions Column — Edit & History available to EVERYONE */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditWorkstreamModal(w)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
                              title="Edit Action"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#003B71]" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setHistoryAction(w)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                              title="View History"
                            >
                              <History className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteWorkstream(w)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-[#D81B60]/10 text-[#D81B60] cursor-pointer"
                              title="Delete Action"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-PAGE 3: VERTICAL ANALYTICS                                      */}
      {/* =================================================================== */}
      {activePage === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider mb-1">
              {department.name} — Directives Health Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Breakdown of active on-track, red alerts, and closed actions
            </p>
            <div className="space-y-4 pt-2">
              {statusPieData.map((entry, idx) => {
                const total = Math.max(
                  1,
                  statusPieData.reduce((s, e) => s + e.value, 0)
                );
                const pct = Math.round((entry.value / total) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-2 font-bold text-slate-800">
                        <span
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: entry.color }}
                        />
                        {entry.name}
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {entry.value} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: entry.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider mb-1">
              Category-Wise Pending vs Closed Directives
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Execution progress across functional categories
            </p>
            <div className="space-y-3">
              {categoryBarData.map((cat, idx) => {
                const max = Math.max(1, cat.Pending + cat.Closed);
                const pendPct = Math.round((cat.Pending / max) * 100);
                const closedPct = Math.round((cat.Closed / max) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        S.No. {idx + 1} &bull; {cat.name}
                      </span>
                      <span className="font-mono text-[11px] text-slate-600">
                        Pending:{" "}
                        <strong className="text-[#003B71]">{cat.Pending}</strong>{" "}
                        | Closed:{" "}
                        <strong className="text-[#F37021]">{cat.Closed}</strong>
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                      <div
                        className="h-full bg-[#003B71]"
                        style={{ width: `${pendPct}%` }}
                      />
                      <div
                        className="h-full bg-[#F37021]"
                        style={{ width: `${closedPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-PAGE 4: UNIFIED CONFIGURABLE WEB FORM                           */}
      {/* =================================================================== */}
      {activePage === "web_form" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-black text-slate-950">
                {department.name} — Unified Departmental Action &amp; Readiness Form
              </h2>
              <p className="text-xs text-slate-500">
                Standardised form template across all 9 verticals (including HR &amp; Recruitment) to generate uniform reports
              </p>
            </div>
            <button
              type="button"
              disabled={savingForm}
              onClick={() => handleSaveForm("SUBMITTED")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingForm ? "Saving..." : "Save & Submit Form"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Readiness Percentage (0 - 100%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={readiness}
                onChange={(e) =>
                  setReadiness(parseInt(e.target.value || "0", 10))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Overall Vertical RAG Status
              </label>
              <select
                value={ragStatus}
                onChange={(e) => setRagStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
              >
                <option value="GREEN">GREEN (On Track)</option>
                <option value="AMBER">AMBER (Needs Attention)</option>
                <option value="RED">RED (Critical Alert)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Key Operational Focus
              </label>
              <input
                type="text"
                value={keyFocus}
                onChange={(e) => setKeyFocus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>
          </div>

          {formStructure.map((sec: any) => (
            <div
              key={sec.id}
              className="space-y-4 pt-4 border-t border-slate-100"
            >
              <h3 className="text-xs font-black uppercase tracking-wider text-[#003B71]">
                {sec.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(sec.fields || []).map((f: any, fIdx: number) => (
                  <div
                    key={f.id}
                    className={
                      f.field_type === "Long Text" ? "md:col-span-2" : ""
                    }
                  >
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 mr-1.5 rounded bg-[#003B71]/10 text-[#003B71] font-mono text-[10px] font-black">
                        S.No. {fIdx + 1}
                      </span>
                      {f.label}{" "}
                      {f.required && (
                        <span className="text-[#D81B60]">*</span>
                      )}
                    </label>
                    {f.field_type === "Long Text" ? (
                      <textarea
                        rows={3}
                        value={formValues[f.id] ?? ""}
                        onChange={(e) =>
                          setFormValues({
                            ...formValues,
                            [f.id]: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                      />
                    ) : f.field_type === "Dropdown" &&
                      f.options &&
                      f.options.length > 0 ? (
                      <select
                        value={formValues[f.id] ?? ""}
                        onChange={(e) =>
                          setFormValues({
                            ...formValues,
                            [f.id]: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                      >
                        <option value="">Select {f.label}...</option>
                        {f.options.map((opt: any) => (
                          <option key={opt.id || opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={
                          f.field_type === "Number"
                            ? "number"
                            : f.field_type === "Date"
                              ? "date"
                              : "text"
                        }
                        value={formValues[f.id] ?? ""}
                        onChange={(e) =>
                          setFormValues({
                            ...formValues,
                            [f.id]: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
                      />
                    )}
                    {f.help_text && (
                      <span className="mt-1 block text-[11px] text-slate-400">
                        {f.help_text}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =================================================================== */}
      {/* SHARED EDIT / ADD ACTION MODAL (EXACT IMAGE 1 MATCH)                */}
      {/* =================================================================== */}
      <ActionFormModal
        open={modalOpen}
        mode={modalMode}
        action={editingAction}
        departments={deptOptions}
        defaultDepartmentId={department.id}
        currentUserName={currentUser?.name || "Department Head"}
        onClose={() => setModalOpen(false)}
        onSaved={() => fetchDepartmentData()}
      />

      <ActionHistorySheet
        action={historyAction}
        onClose={() => setHistoryAction(null)}
        onEdit={(act) => openEditWorkstreamModal(act)}
      />
    </div>
  );
}
