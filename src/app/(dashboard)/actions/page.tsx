"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ListChecks,
  Plus,
  Search,
  RefreshCw,
  Download,
  Edit3,
  History,
  Trash2,
  Building2,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { ActionFormModal, ActionHistorySheet } from "@/components/ActionFormModal";
import MeetingDateTabs from "@/components/MeetingDateTabs";
import {
  sortActionsWithAlertsAndNewFirst,
  isPendingAction,
  formatActionUpdatesDatewise,
  isActionRedAlert,
  buildMeetingDateGroups,
  getActionMeetingDate,
  isActionInMeetingAgenda,
} from "@/lib/action-helpers";

export default function AllActionsPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusTab, setStatusTab] = useState<
    "all" | "pending" | "open" | "in_progress" | "closed" | "updated" | "alerts"
  >("all");
  const [selectedMeetingDate, setSelectedMeetingDate] = useState<string>("all");
  const [selectedAgenda, setSelectedAgenda] = useState<string>("all");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [selectedOwner, setSelectedOwner] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingAction, setEditingAction] = useState<any | null>(null);
  const [historyAction, setHistoryAction] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [wsRes, deptRes] = await Promise.all([
        fetch("/api/workstreams", { cache: "no-store" }),
        fetch("/api/departments", { cache: "no-store" }),
      ]);
      if (wsRes.ok) {
        const wsJson = await wsRes.json();
        const wsList = Array.isArray(wsJson) ? wsJson : wsJson.workstreams || [];
        setActions(wsList);
      }
      if (deptRes.ok) {
        const deptJson = await deptRes.json();
        const deptList = Array.isArray(deptJson) ? deptJson : deptJson.departments || [];
        setDepartments(deptList);
      }
    } catch (err) {
      console.error("Failed to fetch actions data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Map department_id -> department info (including head_of_department)
  const deptMap = useMemo(() => {
    const map = new Map<number, any>();
    for (const d of departments) {
      map.set(Number(d.id), d);
    }
    return map;
  }, [departments]);

  const enrichedActions = useMemo(() => {
    const mapped = actions.map((a) => {
      const dept = deptMap.get(Number(a.department_id));
      const updates = formatActionUpdatesDatewise(a);
      return {
        ...a,
        department_name: a.department_name || dept?.name || "General",
        department_code: a.department_code || dept?.code || "",
        head_of_department:
          a.head_of_department || dept?.head_of_department || "To be hired",
        updates_list: updates,
      };
    });
    return sortActionsWithAlertsAndNewFirst(mapped);
  }, [actions, deptMap]);

  // Unique owners list for filter
  const ownerOptions = useMemo(() => {
    const set = new Set<string>();
    for (const a of enrichedActions) {
      const o = (a.ownership || a.owner || "").trim();
      if (o) set.add(o);
    }
    for (const d of departments) {
      if (d.head_of_department && d.head_of_department.toLowerCase() !== "to be hired") {
        set.add(d.head_of_department);
      }
    }
    return Array.from(set).sort();
  }, [enrichedActions, departments]);

  // KPI counts
  const counts = useMemo(() => {
    let pending = 0;
    let openOnly = 0;
    let inProgress = 0;
    let closed = 0;
    let updated = 0;
    let alerts = 0;

    for (const a of enrichedActions) {
      const st = String(a.status || "Open").toUpperCase();
      const isClosed = st === "CLOSED" || st === "COMPLETED" || st === "JOINED";

      if (isClosed) {
        closed++;
      } else {
        pending++;
        if (st === "OPEN" || st === "NOT STARTED") {
          openOnly++;
        } else if (st === "IN PROGRESS" || st === "ON TRACK") {
          inProgress++;
        }
      }
      if ((a.updates_list && a.updates_list.length > 0) || a.remarks || a.decision_action) {
        updated++;
      }
      if (isActionRedAlert(a)) {
        alerts++;
      }
    }
    return {
      all: enrichedActions.length,
      pending,
      openOnly,
      inProgress,
      closed,
      updated,
      alerts,
    };
  }, [enrichedActions]);

  // Dynamic meeting date groups (12 Oct, 19 Oct, 26 Oct, ... auto-detected from Supabase)
  const meetingGroups = useMemo(() => buildMeetingDateGroups(enrichedActions), [enrichedActions]);

  const filteredActions = useMemo(() => {
    return enrichedActions.filter((a) => {
      const st = String(a.status || "Open").toUpperCase();
      const isClosed = st === "CLOSED" || st === "COMPLETED" || st === "JOINED";
      const mtgDate = getActionMeetingDate(a);

      if (selectedMeetingDate !== "all" && mtgDate !== selectedMeetingDate) return false;
      if (selectedAgenda !== "all" && !isActionInMeetingAgenda(a, selectedAgenda)) {
        return false;
      }

      if (statusTab === "pending" && !isPendingAction(a)) return false;
      if (statusTab === "open" && !(st === "OPEN" || st === "NOT STARTED")) return false;
      if (statusTab === "in_progress" && !(st === "IN PROGRESS" || st === "ON TRACK"))
        return false;
      if (statusTab === "closed" && !isClosed) return false;
      if (
        statusTab === "updated" &&
        !((a.updates_list && a.updates_list.length > 0) || a.remarks || a.decision_action)
      )
        return false;
      if (statusTab === "alerts" && !isActionRedAlert(a)) return false;

      if (selectedDeptId !== "all" && String(a.department_id) !== selectedDeptId) {
        return false;
      }

      if (selectedOwner !== "all") {
        const ownerVal = String(a.ownership || a.owner || "").toLowerCase();
        const hodVal = String(a.head_of_department || "").toLowerCase();
        const target = selectedOwner.toLowerCase();
        if (!ownerVal.includes(target) && !hodVal.includes(target)) return false;
      }

      if (
        selectedPriority !== "all" &&
        String(a.priority || "").toLowerCase() !== selectedPriority.toLowerCase()
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = [
          a.item_id,
          a.deliverable,
          a.action_point,
          a.department_name,
          a.head_of_department,
          a.owner,
          a.ownership,
          a.supporting_departments,
          a.remarks,
          a.decision_action,
          a.closure_remarks,
          a.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [
    enrichedActions,
    statusTab,
    selectedMeetingDate,
    selectedAgenda,
    selectedDeptId,
    selectedOwner,
    selectedPriority,
    searchQuery,
  ]);

  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingAction(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (action: any) => {
    setModalMode("edit");
    setEditingAction(action);
    setModalOpen(true);
  };

  const handleDeleteAction = async (action: any) => {
    if (
      !window.confirm(
        `Delete action "${action.item_id || action.id}: ${
          action.deliverable || action.action_point
        }"?`
      )
    ) {
      return;
    }
    setDeletingId(action.id);
    try {
      const res = await fetch(`/api/workstreams/${action.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (e) {
      console.error("Failed to delete action:", e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "S.No.",
      "Action Code",
      "Department",
      "Head of Department (HOD)",
      "Action Item / Deliverable",
      "Action Owner",
      "Priority",
      "Status",
      "Target Date",
      "Support Required From",
      "VC Decision Required",
      "Action Taken / Latest Update",
    ];
    const rows = filteredActions.map((a, idx) => [
      idx + 1,
      a.item_id || `ACT-${String(a.id).padStart(2, "0")}`,
      a.department_name || "",
      a.head_of_department || "",
      (a.deliverable || a.action_point || "").replace(/"/g, '""'),
      (a.ownership || a.owner || "").replace(/"/g, '""'),
      a.priority || "Medium",
      a.status || "Open",
      a.target_date || a.timeline || "",
      (a.supporting_departments || "").replace(/"/g, '""'),
      a.vc_decision_required || "No",
      (a.closure_remarks || a.decision_action || a.remarks || "").replace(/"/g, '""'),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `RIASAT_All_Actions_Register_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Top Hero Header */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-pink-500 to-orange-500" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Link
                href="/executive"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-bold transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Executive Dashboard
              </Link>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-black uppercase tracking-widest">
                <ListChecks className="w-3.5 h-3.5 text-orange-400" />
                Complete Master Action Register • Live Supabase Sync
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              All Actions & History Directory ({counts.all} Total Actions)
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              View, search, filter, and edit <strong className="text-white">every single action item</strong> across all departments — including newly worked-on actions, pending items, in-progress deliverables, and closed actions, linked directly to each <strong className="text-orange-400">Head of Department (HOD)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/departments-master"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-orange-400 border border-slate-700 text-xs font-black transition-all"
            >
              <Building2 className="w-3.5 h-3.5" />
              Manage Departments & HODs
            </Link>
            <button
              type="button"
              onClick={fetchAllData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
              Refresh Live Data
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
            >
              <Download className="w-3.5 h-3.5 text-pink-400" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-pink-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              + Add Action Item
            </button>
          </div>
        </div>

        {/* Status Filter Tabs inside Hero (Open has distinct Sky-Blue color) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-6 pt-5 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setStatusTab("all")}
            className={`text-left p-3 rounded-xl border transition-all ${
              statusTab === "all"
                ? "bg-blue-600 text-white border-blue-400 shadow-md"
                : "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">
              All Actions
            </div>
            <div className="text-xl font-black mt-0.5">{counts.all}</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab("pending")}
            className={`text-left p-3 rounded-xl border transition-all ${
              statusTab === "pending"
                ? "bg-orange-500 text-white border-orange-300 shadow-md"
                : "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">
              All Pending
            </div>
            <div className="text-xl font-black mt-0.5">{counts.pending}</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab("open")}
            className={`text-left p-3 rounded-xl border transition-all ${
              statusTab === "open"
                ? "bg-sky-500 text-white border-sky-300 shadow-md"
                : "bg-sky-950/70 text-sky-300 border-sky-800 hover:border-sky-600"
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-widest opacity-90">
              Open Status
            </div>
            <div className="text-xl font-black mt-0.5">{counts.openOnly}</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab("in_progress")}
            className={`text-left p-3 rounded-xl border transition-all ${
              statusTab === "in_progress"
                ? "bg-indigo-600 text-white border-indigo-400 shadow-md"
                : "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">
              In Progress
            </div>
            <div className="text-xl font-black mt-0.5">{counts.inProgress}</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab("closed")}
            className={`text-left p-3 rounded-xl border transition-all ${
              statusTab === "closed"
                ? "bg-emerald-600 text-white border-emerald-400 shadow-md"
                : "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">
              Completed / Closed
            </div>
            <div className="text-xl font-black mt-0.5">{counts.closed}</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab("updated")}
            className={`text-left p-3 rounded-xl border transition-all ${
              statusTab === "updated"
                ? "bg-pink-600 text-white border-pink-400 shadow-md"
                : "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">
              With Updates
            </div>
            <div className="text-xl font-black mt-0.5">{counts.updated}</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusTab("alerts")}
            className={`text-left p-3 rounded-xl border transition-all ${
              statusTab === "alerts"
                ? "bg-red-600 text-white border-red-400 shadow-md"
                : "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="text-[10px] font-black uppercase tracking-widest opacity-80">
              Red Alerts / VC
            </div>
            <div className="text-xl font-black mt-0.5">{counts.alerts}</div>
          </button>
        </div>
      </div>

      {/* Filter Bar + Dynamic Meeting Date Tabs (one tab per review meeting, auto-created from Supabase) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3.5">
        <div className="pb-3 border-b border-slate-100">
          <MeetingDateTabs
            groups={meetingGroups}
            totalCount={counts.all}
            totalPending={counts.pending}
            selectedDate={selectedMeetingDate}
            allValue="all"
            onSelectDate={(value) => {
              setSelectedMeetingDate(value);
              setSelectedAgenda("all");
            }}
            onSelectPendingOnly={(date) => {
              setSelectedMeetingDate(date);
              setSelectedAgenda("all");
              setStatusTab("pending");
            }}
            pendingOnlyActive={statusTab === "pending"}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search action code, deliverable, owner, HOD..."
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Original Meeting Date Dropdown */}
          <div>
            <select
              value={selectedMeetingDate}
              onChange={(e) => setSelectedMeetingDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Meeting Dates ({counts.all})</option>
              {[...meetingGroups].reverse().map((g) => (
                <option key={g.date} value={g.date}>
                  Raised {g.mediumLabel} ({g.total})
                </option>
              ))}
            </select>
          </div>

          {/* Meeting Agenda Dropdown */}
          <div>
            <select
              value={selectedAgenda}
              onChange={(e) => setSelectedAgenda(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Any Meeting Agenda</option>
              {[...meetingGroups].reverse().map((g) => (
                <option key={g.date} value={g.date}>
                  {g.mediumLabel} Agenda ({g.agendaTotal})
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name} ({d.head_of_department || "To be hired"})
                </option>
              ))}
            </select>
          </div>

          {/* HOD / Action Owner Filter */}
          <div>
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Action Owners & HODs</option>
              {ownerOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {(statusTab !== "all" ||
              selectedMeetingDate !== "all" ||
              selectedAgenda !== "all" ||
              selectedDeptId !== "all" ||
              selectedOwner !== "all" ||
              selectedPriority !== "all" ||
              searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStatusTab("all");
                  setSelectedMeetingDate("all");
                  setSelectedAgenda("all");
                  setSelectedDeptId("all");
                  setSelectedOwner("all");
                  setSelectedPriority("all");
                  setSearchQuery("");
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Actions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-orange-400" />
            <h2 className="text-xs font-black uppercase tracking-widest">
              Showing {filteredActions.length} of {counts.all} Action Items (Newest & Red Alerts First)
            </h2>
          </div>
          <span className="text-[11px] text-slate-300">
            Every action has <strong className="text-blue-400">Edit</strong> & <strong className="text-orange-400">History</strong> available
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-3 w-14">No.</th>
                <th className="py-3.5 px-3 w-28">Code & Date</th>
                <th className="py-3.5 px-3 w-48">Department & HOD</th>
                <th className="py-3.5 px-3 min-w-[260px]">Action Item / Deliverable</th>
                <th className="py-3.5 px-3 w-40">Action Owner</th>
                <th className="py-3.5 px-3 w-28">Target Date</th>
                <th className="py-3.5 px-3 w-32">Status</th>
                <th className="py-3.5 px-3 min-w-[260px]">
                  Progress / Updates & Action Taken (Latest on Top)
                </th>
                <th className="py-3.5 px-3 text-right w-40">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {loading && actions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-500 font-semibold">
                    Loading all actions from Supabase...
                  </td>
                </tr>
              ) : filteredActions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-500 font-semibold">
                    No actions match your current filter. Click &ldquo;Reset&rdquo; to view all {counts.all} actions.
                  </td>
                </tr>
              ) : (
                filteredActions.map((action, idx) => {
                  const isRed = isActionRedAlert(action);
                  const st = String(action.status || "Open").toUpperCase();
                  const isClosed = st === "CLOSED" || st === "COMPLETED" || st === "JOINED";
                  const isOpen = st === "OPEN" || st === "NOT STARTED";
                  const isInProg = st === "IN PROGRESS" || st === "ON TRACK";
                  const updates = action.updates_list || [];
                  const actionCode =
                    action.item_id || `ACT-${String(action.id).padStart(2, "0")}`;
                  const mtgDate = getActionMeetingDate(action);

                  return (
                    <tr
                      key={action.id}
                      className={`transition-colors ${
                        isRed
                          ? "bg-red-50/40 hover:bg-red-50/70"
                          : isClosed
                          ? "bg-emerald-50/20 hover:bg-emerald-50/40"
                          : "hover:bg-blue-50/30"
                      }`}
                    >
                      {/* Number 1, 2, 3... */}
                      <td className="py-3.5 px-3 align-top">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 text-white text-[11px] font-black">
                          {idx + 1}
                        </span>
                      </td>

                      {/* Code & Review Date */}
                      <td className="py-3.5 px-3 align-top">
                        <span className="font-mono font-black text-slate-900 text-xs block">
                          {actionCode}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-slate-500 block mt-0.5">
                          {mtgDate}
                        </span>
                        {isRed && (
                          <span className="mt-1 block px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-wider w-fit">
                            Red Alert
                          </span>
                        )}
                      </td>

                      {/* Department & HOD */}
                      <td className="py-3.5 px-3 align-top">
                        <Link
                          href={`/department/${action.department_id}`}
                          className="font-black text-slate-900 hover:text-blue-600 block leading-snug"
                        >
                          {action.department_name}
                        </Link>
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          <UserCheck className="w-3 h-3 text-orange-500 shrink-0" />
                          <span>HOD: {action.head_of_department || "To be hired"}</span>
                        </div>
                      </td>

                      {/* Deliverable */}
                      <td className="py-3.5 px-3 align-top">
                        <div className="font-bold text-slate-900 leading-relaxed">
                          {action.deliverable || action.action_point}
                        </div>
                        {action.supporting_departments && (
                          <div className="mt-1 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">Support: </span>
                            {action.supporting_departments}
                          </div>
                        )}
                      </td>

                      {/* Action Owner */}
                      <td className="py-3.5 px-3 align-top">
                        <div className="font-bold text-slate-800">
                          {action.ownership || action.owner || action.head_of_department || "—"}
                        </div>
                        <span
                          className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            action.priority === "Critical"
                              ? "bg-red-100 text-red-800"
                              : action.priority === "High"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {action.priority || "Medium"}
                        </span>
                      </td>

                      {/* Target Date */}
                      <td className="py-3.5 px-3 align-top font-semibold text-slate-700">
                        {action.target_date || action.timeline || "—"}
                        {action.next_followup_date && (
                          <div className="text-[10px] text-blue-600 font-bold mt-1">
                            Follow-up: {action.next_followup_date}
                          </div>
                        )}
                      </td>

                      {/* Status (Open has distinct Sky-Blue color) */}
                      <td className="py-3.5 px-3 align-top">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isClosed
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isOpen
                              ? "bg-sky-50 text-sky-800 border-sky-300"
                              : isInProg
                              ? "bg-indigo-50 text-indigo-800 border-indigo-300"
                              : isRed
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {isClosed ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : isRed ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {action.status || "Open"}
                        </span>
                      </td>

                      {/* Progress / Updates & Action Taken */}
                      <td className="py-3.5 px-3 align-top">
                        {(action.closure_remarks || action.decision_action) && (
                          <div className="mb-1.5 p-2 rounded-lg bg-slate-900 text-white text-[11px]">
                            <span className="font-black text-orange-400 uppercase tracking-wider text-[10px] block">
                              Action Taken ({action.status || "Open"}):
                            </span>
                            <span>{action.closure_remarks || action.decision_action}</span>
                          </div>
                        )}
                        {updates.length > 0 ? (
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            {updates.slice(0, 3).map((u: any, uIdx: number) => (
                              <div
                                key={uIdx}
                                className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px]"
                              >
                                <div className="flex items-center justify-between text-[10px] font-bold text-blue-700">
                                  <span>{u.formattedDate || u.date}</span>
                                  <span>{u.user || "Update"}</span>
                                </div>
                                <div className="text-slate-700 mt-0.5 leading-snug">
                                  {u.text || u.remarks}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            No weekly remarks logged yet
                          </span>
                        )}
                      </td>

                      {/* Manage */}
                      <td className="py-3.5 px-3 align-top text-right">
                        <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(action)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black shadow-sm transition-all"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryAction(action)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-bold transition-all"
                          >
                            <History className="w-3 h-3" />
                            History
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === action.id}
                            onClick={() => handleDeleteAction(action)}
                            className="inline-flex items-center p-1.5 rounded-lg bg-pink-50 hover:bg-pink-600 text-pink-700 hover:text-white border border-pink-200 text-[11px] font-bold transition-all"
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

      {/* Unified Add / Edit Action Modal */}
      <ActionFormModal
        open={modalOpen}
        mode={modalMode}
        action={editingAction}
        departments={departments}
        nextCodePreview={`ACT-${String(counts.all + 1).padStart(2, "0")}`}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          fetchAllData();
        }}
      />

      {/* Action History Sheet */}
      <ActionHistorySheet
        action={historyAction}
        onClose={() => setHistoryAction(null)}
        onEdit={(act) => {
          setHistoryAction(null);
          handleOpenEdit(act);
        }}
      />
    </div>
  );
}
