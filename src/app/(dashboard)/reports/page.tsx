"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Printer,
  Filter,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Plus,
  History,
  FileBarChart,
  Calendar,
  Layers,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { ActionFormModal, ActionHistorySheet } from "@/components/ActionFormModal";
import MeetingDateTabs from "@/components/MeetingDateTabs";
import {
  buildMeetingDateGroups,
  getActionMeetingDate,
  formatMeetingDateLabel,
} from "@/lib/action-helpers";
import { DEPARTMENTS } from "@/lib/constants";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [workstreams, setWorkstreams] = useState<any[]>([]);
  const [recruitment, setRecruitment] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Filter states
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedMeetingDate, setSelectedMeetingDate] = useState<string>("ALL");
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>("ALL_PENDING");
  const [selectedRag, setSelectedRag] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Shared Edit / Add Action Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("edit");
  const [editingAction, setEditingAction] = useState<any | null>(null);
  const [historyAction, setHistoryAction] = useState<any | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      // Resilient fetching: fetch each API independently so one failure never blocks the others
      const [execResult, wsResult, recResult] = await Promise.allSettled([
        fetch("/api/executive", { cache: "no-store" }).then(async (r) => {
          if (!r.ok) throw new Error(`Executive API error: ${r.status}`);
          return r.json();
        }),
        fetch("/api/workstreams", { cache: "no-store" }).then(async (r) => {
          if (!r.ok) throw new Error(`Workstreams API error: ${r.status}`);
          return r.json();
        }),
        fetch("/api/recruitment", { cache: "no-store" }).then(async (r) => {
          if (!r.ok) throw new Error(`Recruitment API error: ${r.status}`);
          return r.json();
        }),
      ]);

      if (execResult.status === "fulfilled" && execResult.value) {
        setSummary(execResult.value.summary || {});
        if (Array.isArray(execResult.value.departments) && execResult.value.departments.length > 0) {
          setDepartments(execResult.value.departments);
        } else {
          setDepartments(DEPARTMENTS.map((d) => ({ ...d, readiness_percentage: 0, rag_status: "AMBER" })));
        }
      } else {
        setDepartments(DEPARTMENTS.map((d) => ({ ...d, readiness_percentage: 0, rag_status: "AMBER" })));
      }

      if (wsResult.status === "fulfilled" && wsResult.value) {
        setWorkstreams(wsResult.value.workstreams || []);
      }

      if (recResult.status === "fulfilled" && recResult.value) {
        setRecruitment(recResult.value.positions || []);
      }
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Unified workstreams list
  const unifiedWorkstreams = useMemo(() => {
    return (workstreams || []).map((w: any) => ({
      ...w,
      is_hr_item: false,
    }));
  }, [workstreams]);

  // Dynamic meeting date groups (12 Oct, 19 Oct, 26 Oct, ... auto-detected from Supabase)
  const meetingGroups = useMemo(() => buildMeetingDateGroups(unifiedWorkstreams), [unifiedWorkstreams]);

  // Overall counts across meeting dates and statuses
  const counts = useMemo(() => {
    let all = unifiedWorkstreams.length;
    let pending = 0;
    let openOnly = 0;
    let inProgress = 0;
    let delayed = 0;
    let closed = 0;

    for (const w of unifiedWorkstreams) {
      const st = String(w.status || "Open").toUpperCase().trim();
      const isClosed = st === "CLOSED" || st === "COMPLETED" || st === "JOINED";

      if (isClosed) {
        closed++;
      } else {
        pending++;
        if (st === "OPEN" || st === "NOT STARTED") {
          openOnly++;
        } else if (st === "IN PROGRESS" || st === "ON TRACK") {
          inProgress++;
        } else if (st === "DELAYED" || st === "BLOCKED" || st === "ON HOLD") {
          delayed++;
        }
      }
    }

    return {
      all,
      pending,
      openOnly,
      inProgress,
      delayed,
      closed,
    };
  }, [unifiedWorkstreams]);

  // Filtered workstreams according to current meeting date, status tab, and department filters
  const filteredWorkstreams = useMemo(() => {
    return unifiedWorkstreams.filter((w) => {
      // Department filter
      if (selectedDept !== "ALL" && String(w.department_id) !== String(selectedDept)) {
        return false;
      }

      // Meeting Date filter
      if (selectedMeetingDate !== "ALL") {
        const d = getActionMeetingDate(w);
        if (d !== selectedMeetingDate) return false;
      }

      // Status Tab filter
      const st = String(w.status || "Open").toUpperCase().trim();
      const isClosed = st === "CLOSED" || st === "COMPLETED" || st === "JOINED";

      if (selectedStatusTab === "ALL_PENDING") {
        if (isClosed) return false;
      } else if (selectedStatusTab === "OPEN") {
        if (st !== "OPEN" && st !== "NOT STARTED") return false;
      } else if (selectedStatusTab === "IN_PROGRESS") {
        if (st !== "IN PROGRESS" && st !== "ON TRACK") return false;
      } else if (selectedStatusTab === "DELAYED") {
        if (st !== "DELAYED" && st !== "BLOCKED" && st !== "ON HOLD") return false;
      } else if (selectedStatusTab === "CLOSED") {
        if (!isClosed) return false;
      } // "ALL" shows all

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const hay = [
          w.item_id,
          w.action_point,
          w.deliverable,
          w.department_name,
          w.ownership,
          w.owner,
          w.remarks,
          w.decision_action,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [unifiedWorkstreams, selectedDept, selectedMeetingDate, selectedStatusTab, searchQuery]);

  // Filtered departments to display
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      if (selectedDept !== "ALL" && String(d.id) !== String(selectedDept)) return false;
      if (selectedRag !== "ALL" && String(d.rag_status).toUpperCase() !== selectedRag) return false;
      return true;
    });
  }, [departments, selectedDept, selectedRag]);

  // Dynamic KPI calculations based on current view
  const dynamicKpis = useMemo(() => {
    const totalActions = filteredWorkstreams.length;

    // Active verticals represented in current filtered actions
    const activeDeptIds = new Set(filteredWorkstreams.map((w) => Number(w.department_id)));
    const matchingDepts = filteredDepartments.filter((d) =>
      selectedDept === "ALL" ? activeDeptIds.has(Number(d.id)) || totalActions === 0 : true
    );

    const verticalsCount = selectedDept === "ALL" ? (filteredDepartments.length || 9) : 1;

    let totalReadiness = 0;
    let totalCapex = 0;
    let totalRevenue = 0;

    const listToCalc = filteredDepartments.length > 0 ? filteredDepartments : departments;
    for (const d of listToCalc) {
      totalReadiness += Number(d.readiness_percentage || 0);
      const capexVal = parseFloat(String(d.capex_cr || d.capex_total || d.capex || "0").replace(/[^0-9.]/g, ""));
      const revVal = parseFloat(String(d.revenue_pipeline_cr || d.revenue_total || d.revenue || "0").replace(/[^0-9.]/g, ""));
      if (!isNaN(capexVal)) totalCapex += capexVal;
      if (!isNaN(revVal)) totalRevenue += revVal;
    }

    const avgReadiness =
      listToCalc.length > 0 ? Math.round(totalReadiness / listToCalc.length) : (summary?.avgReadiness || 0);

    return {
      verticalsInReport: verticalsCount,
      avgReadiness: avgReadiness,
      totalActionsInReport: totalActions,
      totalCapex: totalCapex > 0 ? totalCapex.toFixed(1) : (summary?.totalCapex || "30.0"),
      totalRevenue: totalRevenue > 0 ? totalRevenue.toFixed(1) : (summary?.totalRevenue || "42.0"),
    };
  }, [filteredWorkstreams, filteredDepartments, departments, selectedDept, summary]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setSelectedDept("ALL");
    setSelectedMeetingDate("ALL");
    setSelectedStatusTab("ALL");
    setSelectedRag("ALL");
    setSearchQuery("");
  };

  const handlePrint = () => {
    window.print();
  };

  const escapeCsvCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, " | ");
    return `"${str}"`;
  };

  const downloadCsvFile = (filename: string, rows: any[][]) => {
    const csvContent = "\uFEFF" + rows.map((r) => r.map(escapeCsvCell).join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportUnifiedCSV = () => {
    const headers = [
      "1, 2, 3...",
      "Action ID",
      "Review Meeting Date",
      "Review Frequency",
      "Department",
      "Category / Theme",
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
    const rows = filteredWorkstreams.map((w, idx) => {
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
        `${idx + 1}`,
        w.item_id || `ACT-${idx + 1}`,
        getActionMeetingDate(w),
        w.review_frequency || "Weekly",
        w.department_name || "",
        w.category || "",
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
      ];
    });
    downloadCsvFile(
      `RIASAT_Executive_Dashboard_Unified_Report_${new Date().toISOString().slice(0, 10)}.csv`,
      [headers, ...rows]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#003B71] animate-spin" />
          <p className="text-sm text-slate-500 font-medium">
            Compiling Unified Departmental Reports from Supabase...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-pink-100 selection:text-pink-900">
      {/* Top Banner (Theme: Black, Blue, Orange, Pink) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021]" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/ramaiah_logo.png"
              alt="Ramaiah Logo"
              className="h-11 w-auto object-contain hidden sm:block"
            />
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#003B71] text-white">
                  Riasat Executive Dashboard
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Unified Format Across All 9 Verticals
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">
                RIASAT Executive Dashboard — Unified Departmental Reports
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Standardised executive reports across all departments with live meeting dates, interactive status tabs, and inline Edit Action
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <button
              type="button"
              onClick={() => {
                setModalMode("create");
                setEditingAction(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white text-xs font-black uppercase tracking-wider shadow-sm hover:opacity-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Action
            </button>
            <button
              type="button"
              onClick={handleExportUnifiedCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Unified CSV ({filteredWorkstreams.length})
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          1. REVIEW MEETING DATE TABS (Dynamic tabs for every meeting — 12 Oct, 19 Oct, 26 Oct, ...)
      ====================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3.5 print:hidden">
        <div className="pb-3 border-b border-slate-100">
          <MeetingDateTabs
            groups={meetingGroups}
            totalCount={counts.all}
            totalPending={counts.pending}
            selectedDate={selectedMeetingDate}
            allValue="ALL"
            onSelectDate={setSelectedMeetingDate}
            onSelectPendingOnly={(date) => {
              setSelectedMeetingDate(date);
              setSelectedStatusTab("ALL_PENDING");
            }}
            pendingOnlyActive={selectedStatusTab === "ALL_PENDING"}
          />
        </div>

        {/* =====================================================================
            2. ACTION STATUS TABS / FILTER PILLS
        ====================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 mr-1">
              Status Tabs:
            </span>

            <button
              type="button"
              onClick={() => setSelectedStatusTab("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatusTab === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All Actions ({counts.all})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatusTab("ALL_PENDING")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatusTab === "ALL_PENDING"
                  ? "bg-[#F37021] text-white shadow-xs font-black"
                  : "bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100"
              }`}
            >
              All Pending ({counts.pending})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatusTab("OPEN")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatusTab === "OPEN"
                  ? "bg-[#003B71] text-white shadow-xs"
                  : "bg-blue-50 text-[#003B71] border border-blue-200 hover:bg-blue-100"
              }`}
            >
              Open ({counts.openOnly})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatusTab("IN_PROGRESS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatusTab === "IN_PROGRESS"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
              }`}
            >
              In Progress ({counts.inProgress})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatusTab("DELAYED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatusTab === "DELAYED"
                  ? "bg-red-600 text-white shadow-xs"
                  : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
              }`}
            >
              Delayed / Blocked ({counts.delayed})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatusTab("CLOSED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatusTab === "CLOSED"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              Closed / Completed ({counts.closed})
            </button>
          </div>

          {/* Quick Clear / Reset */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Tabs
          </button>
        </div>

        {/* =====================================================================
            3. DEPARTMENT PILLS & SEARCH
        ====================================================================== */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedDept("ALL")}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
                selectedDept === "ALL"
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All 9 Verticals (Unified)
            </button>

            {departments.map((dept) => {
              const deptActionsCount = unifiedWorkstreams.filter(
                (w) => Number(w.department_id) === Number(dept.id)
              ).length;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedDept(String(dept.id))}
                  className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer ${
                    selectedDept === String(dept.id)
                      ? "bg-[#003B71] text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{dept.code}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15 font-mono">
                    {deptActionsCount}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deliverable, owner..."
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#003B71] w-full md:w-56"
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          4. DYNAMIC SUMMARY KPI STRIP
      ====================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Verticals in Report
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {dynamicKpis.verticalsInReport}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {selectedDept === "ALL" ? "All standard strategic verticals" : "Specific vertical selected"}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Avg Readiness
          </div>
          <div className="text-2xl font-black text-[#003B71] mt-1">
            {dynamicKpis.avgReadiness}%
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Institutional launch preparedness
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Actions in Report
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {dynamicKpis.totalActionsInReport}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Matching current date &amp; status tabs
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Capex / Pipeline
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-700 mt-1 truncate">
            ₹ {dynamicKpis.totalCapex} Cr / ₹ {dynamicKpis.totalRevenue} Cr
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Active financial allocation
          </p>
        </div>
      </div>

      {/* =====================================================================
          5. EMPTY STATE NOTICE (If no actions match current filter combination)
      ====================================================================== */}
      {filteredWorkstreams.length === 0 && (
        <div className="bg-gradient-to-r from-blue-50/70 via-pink-50/50 to-orange-50/70 border border-slate-200 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Filter className="w-6 h-6 text-[#003B71]" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No action items match the selected tabs
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Currently filtered by meeting date{" "}
            <strong>
              {selectedMeetingDate === "ALL" ? "All Dates" : selectedMeetingDate}
            </strong>{" "}
            and status <strong>{selectedStatusTab}</strong>. You can switch to All Actions or reset filters to view all entries.
          </p>
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedStatusTab("ALL")}
              className="px-4 py-2 rounded-xl bg-[#003B71] text-white text-xs font-bold cursor-pointer hover:bg-blue-900 transition"
            >
              Show All Actions ({counts.all})
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-50 transition"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. DEPARTMENT-BY-DEPARTMENT UNIFIED REPORTS
      ====================================================================== */}
      <div className="space-y-6">
        {filteredDepartments.map((dept, deptIdx) => {
          const deptItems = filteredWorkstreams.filter(
            (w) => Number(w.department_id) === Number(dept.id)
          );

          // If filtering by specific department or if there are items, display the card
          if (deptItems.length === 0 && selectedDept === "ALL" && filteredWorkstreams.length > 0) {
            // In All view with actions elsewhere, render a compact vertical summary card
            return (
              <div
                key={dept.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden opacity-90"
              >
                <div className="px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-[#003B71] text-white font-mono text-xs font-bold flex items-center justify-center">
                      {deptIdx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {dept.name} ({dept.code})
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {dept.head_of_department || "To be hired"} · {dept.key_focus || "Strategic Vertical"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 italic">
                      0 items matching current filter
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDept(String(dept.id));
                        setSelectedStatusTab("ALL");
                      }}
                      className="text-[11px] font-bold text-orange-400 hover:underline ml-2"
                    >
                      View All Vertical Actions
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
            >
              {/* Department Header */}
              <div className="px-6 py-4 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-[#003B71] text-white font-mono text-xs font-black">
                    {deptIdx + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{dept.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                        {dept.code}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      <strong className="text-orange-300">HOD:</strong> {dept.head_of_department || "To be hired"} · {dept.key_focus || "Strategic Vertical Action Register"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">
                      Readiness
                    </div>
                    <div className="text-base font-black text-[#F37021]">
                      {dept.readiness_percentage}%
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      dept.rag_status === "GREEN"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : dept.rag_status === "RED"
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {dept.rag_status}
                  </span>
                </div>
              </div>

              {/* Department Actions Table */}
              <div className="p-5 overflow-x-auto">
                {deptItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No action items match the selected filter tabs for this vertical.
                  </p>
                ) : (
                  <table className="w-full text-left border-collapse text-xs min-w-[1050px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-16">1, 2, 3...</th>
                        <th className="py-2.5 px-3 w-24">Action ID</th>
                        <th className="py-2.5 px-3 w-28">Review Date</th>
                        <th className="py-2.5 px-3 min-w-[240px]">
                          Action Item &amp; Action Taken
                        </th>
                        <th className="py-2.5 px-3 w-40">Owner &amp; Support</th>
                        <th className="py-2.5 px-3 w-28">Priority &amp; Status</th>
                        <th className="py-2.5 px-3 w-28">Target Date</th>
                        <th className="py-2.5 px-3 min-w-[240px]">
                          Latest Progress / Update
                        </th>
                        <th className="py-2.5 px-3 w-20 text-center">VC</th>
                        <th className="py-2.5 px-3 w-24 text-right print:hidden">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {deptItems.map((w: any, idx: number) => {
                        const actionTaken =
                          w.closure_remarks ||
                          w.decision_action ||
                          w.remarks ||
                          "Action registered and under weekly tracking.";
                        const latestUpdate =
                          Array.isArray(w.updates_list) && w.updates_list[0]
                            ? w.updates_list[0]
                            : null;

                        return (
                          <tr key={`${w.item_id || w.id}-${idx}`} className="hover:bg-slate-50/80 align-top">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#003B71]">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {w.item_id || `ACT-${idx + 1}`}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              <div>
                                {getActionMeetingDate(w)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {w.review_frequency || "Weekly"}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900">
                                {w.action_point || w.deliverable}
                              </div>
                              <div className="mt-1 text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded px-2 py-1">
                                <span className="font-bold text-slate-800">
                                  Action Taken ({w.status || "Open"}):{" "}
                                </span>
                                {actionTaken}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-800">
                                {w.ownership || w.owner || dept.head_of_department || "Vertical Lead"}
                              </div>
                              {w.supporting_departments && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Support: {w.supporting_departments}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-col gap-1 items-start">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    w.priority === "Critical"
                                      ? "bg-red-100 text-red-800"
                                      : w.priority === "High"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-slate-100 text-slate-800"
                                  }`}
                                >
                                  {w.priority || "Medium"}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    String(w.status).toUpperCase() === "CLOSED" || String(w.status).toUpperCase() === "COMPLETED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : String(w.status).toUpperCase() === "IN PROGRESS"
                                      ? "bg-indigo-100 text-indigo-800"
                                      : "bg-blue-100 text-[#003B71]"
                                  }`}
                                >
                                  {w.status || "Open"}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-700">
                              {w.target_date || w.timeline || "Immediate"}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              {latestUpdate ? (
                                <div>
                                  <div className="text-[10px] font-mono text-slate-500">
                                    {String(latestUpdate.date || "").slice(0, 10)} · {latestUpdate.user}
                                  </div>
                                  <div className="mt-0.5">{latestUpdate.remarks}</div>
                                </div>
                              ) : (
                                w.remarks || "—"
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {w.vc_decision_required === "Yes" ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#D81B60] text-white">
                                  Yes
                                </span>
                              ) : (
                                <span className="text-slate-400">No</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right print:hidden whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModalMode("edit");
                                    setEditingAction(w);
                                    setModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3 text-[#003B71]" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setHistoryAction(w)}
                                  className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-[11px] text-slate-600 hover:bg-slate-100 cursor-pointer"
                                  title="View History"
                                >
                                  <History className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shared Edit / Create Action Modal */}
      <ActionFormModal
        open={modalOpen}
        mode={modalMode}
        action={editingAction}
        departments={departments}
        onClose={() => setModalOpen(false)}
        onSaved={() => fetchAllData()}
      />

      <ActionHistorySheet
        action={historyAction}
        onClose={() => setHistoryAction(null)}
        onEdit={(act) => {
          setModalMode("edit");
          setEditingAction(act);
          setModalOpen(true);
        }}
      />
    </div>
  );
}
