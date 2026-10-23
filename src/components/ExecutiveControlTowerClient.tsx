"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  TrendingUp,
  IndianRupee,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Activity,
  RefreshCw,
  Filter,
  Search,
  Edit3,
  Check,
  X,
  Plus,
  Download,
  Building2,
  BarChart3,
  Layers,
  ListChecks,
  Flame,
  Calendar,
} from "lucide-react";
import DashboardGraphs from "@/components/DashboardGraphs";
import { ExecutiveDashboardData, AttentionItem } from "@/lib/executive";
import {
  isPendingActionStatus,
  isRedAlertItem,
  getActionUpdatesDatewise,
  sortActionsWithNewAndAlertsOnTop,
} from "@/lib/action-helpers";

type ExecViewMode =
  | "actions"
  | "verticals"
  | "analytics_directives"
  | "analytics_readiness"
  | "analytics_financials";

function ExecutiveControlTowerContent({
  initialData,
}: {
  initialData: ExecutiveDashboardData;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const viewParam = searchParams.get("view") as ExecViewMode | null;
  const [activeView, setActiveView] = useState<ExecViewMode>(
    viewParam &&
      [
        "actions",
        "verticals",
        "analytics_directives",
        "analytics_readiness",
        "analytics_financials",
      ].includes(viewParam)
      ? viewParam
      : "actions"
  );

  useEffect(() => {
    if (
      viewParam &&
      [
        "actions",
        "verticals",
        "analytics_directives",
        "analytics_readiness",
        "analytics_financials",
      ].includes(viewParam)
    ) {
      setActiveView(viewParam);
    }
  }, [viewParam]);

  const handleSwitchView = (view: ExecViewMode) => {
    setActiveView(view);
    router.replace(`/executive?view=${view}`, { scroll: false });
  };

  const [data, setData] = useState<ExecutiveDashboardData>(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVertical, setSelectedVertical] = useState<string>("ALL");
  const [selectedAlertFilter, setSelectedAlertFilter] = useState<"ALL" | "RED_ALERT" | "VC_DECISION">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inline Editing State for Action Register
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    item: string;
    owner: string;
    target_date: string;
    status: string;
    rag_status: string;
    priority: string;
    issue: string;
    vc_decision_required: string;
  }>({
    item: "",
    owner: "",
    target_date: "",
    status: "",
    rag_status: "GREEN",
    priority: "Medium",
    issue: "",
    vc_decision_required: "No",
  });
  const [savingId, setSavingId] = useState<number | null>(null);

  // Add New Action Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [creatingAction, setCreatingAction] = useState(false);
  const [newActionForm, setNewActionForm] = useState({
    department_id: "1",
    category: "Strategic Directive",
    action_point: "",
    ownership: "",
    timeline: "",
    status: "OPEN",
    rag_status: "RED",
    priority: "Critical",
    vc_decision_required: "Yes",
    remarks: "",
    supporting_departments: "",
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/executive/summary", { cache: "no-store" });
      if (res.ok) {
        const fresh = await res.json();
        setData(fresh);
      }
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  };

  const startEditing = (att: AttentionItem) => {
    setEditingId(att.id);
    setEditForm({
      item: att.item || "",
      owner: att.owner || "",
      target_date: att.target_date || "",
      status: att.status || "OPEN",
      rag_status: att.effective_rag || att.rag_status || "GREEN",
      priority: att.priority || "Medium",
      issue: "", // Leave empty so user can enter a new dated progress update (or keep existing if unchanged)
      vc_decision_required: att.vc_decision_required || "No",
    });
  };

  const handleInlineSave = async (att: AttentionItem) => {
    setSavingId(att.id);
    try {
      const isRecruitment = String(att.item_id || "").startsWith("REC-");
      if (isRecruitment) {
        const res = await fetch(`/api/recruitment/${att.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            position_title: editForm.item,
            hiring_lead: editForm.owner,
            target_date: editForm.target_date,
            status: editForm.status,
            priority: editForm.priority,
            next_action: editForm.issue.trim() || att.issue,
            vc_attention: editForm.vc_decision_required === "Yes",
          }),
        });
        if (res.ok) {
          setEditingId(null);
          await handleRefresh();
        }
      } else {
        const remarkToSave = editForm.issue.trim() || att.issue;
        const res = await fetch(`/api/workstreams/${att.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action_point: editForm.item,
            deliverable: editForm.item,
            ownership: editForm.owner,
            owner: editForm.owner,
            timeline: editForm.target_date,
            target_date: editForm.target_date,
            status: editForm.status,
            rag_status: editForm.rag_status,
            priority: editForm.priority,
            remarks: remarkToSave,
            decision_action: remarkToSave,
            vc_decision_required: editForm.vc_decision_required,
          }),
        });
        if (res.ok) {
          setEditingId(null);
          await handleRefresh();
        }
      }
    } catch {
      // silent
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionForm.action_point.trim()) return;
    setCreatingAction(true);
    try {
      const res = await fetch("/api/workstreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newActionForm),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewActionForm({
          department_id: "1",
          category: "Strategic Directive",
          action_point: "",
          ownership: "",
          timeline: "",
          status: "OPEN",
          rag_status: "RED",
          priority: "Critical",
          vc_decision_required: "Yes",
          remarks: "",
          supporting_departments: "",
        });
        await handleRefresh();
      }
    } catch {
      // silent
    } finally {
      setCreatingAction(false);
    }
  };

  const { summary, departments, graphs, management_attention } = data;

  // Ensure ONLY pending items are shown in Pending Action Register, sorted with Newly Added & Red Alerts on top
  const pendingAttentionItems = sortActionsWithNewAndAlertsOnTop(
    management_attention.filter((att) => isPendingActionStatus(att.status))
  );

  const filteredAttention = pendingAttentionItems.filter((att) => {
    const matchVertical =
      selectedVertical === "ALL" ||
      String(att.department_id) === selectedVertical ||
      att.department_name === selectedVertical ||
      Boolean(
        att.supporting_departments &&
          att.supporting_departments.toLowerCase().includes(selectedVertical.toLowerCase())
      );

    let matchAlert = true;
    if (selectedAlertFilter === "RED_ALERT") {
      matchAlert = isRedAlertItem(att);
    } else if (selectedAlertFilter === "VC_DECISION") {
      matchAlert = att.vc_decision_required === "Yes";
    }

    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      (att.item || "").toLowerCase().includes(q) ||
      (att.issue || "").toLowerCase().includes(q) ||
      (att.owner || "").toLowerCase().includes(q) ||
      (att.department_name || "").toLowerCase().includes(q) ||
      (att.item_id || "").toLowerCase().includes(q);

    return matchVertical && matchAlert && matchSearch;
  });

  // Reliable Blob-based Export CSV for Pending Action Register
  const handleExportCSV = () => {
    const headers = [
      "Action ID",
      "Primary Vertical",
      "Supporting Depts",
      "Action Directive",
      "Owner / Lead",
      "Target Timeline",
      "Priority",
      "RAG Alert",
      "VC Decision Required",
      "Status",
      "Progress / Updates (Latest First)",
    ];

    const escapeCsv = (val: any) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredAttention.map((att) => {
      const updates = att.updates_list && att.updates_list.length > 0
        ? att.updates_list
        : getActionUpdatesDatewise(att);
      const formattedUpdates = updates
        .map((u) => `[${u.formattedDate}] ${u.text}`)
        .join(" | ");

      return [
        att.item_id || `ACT-${att.id}`,
        att.department_name,
        att.supporting_departments || "None",
        att.item,
        att.owner || "Unassigned",
        att.target_date || "TBD",
        att.priority || "Medium",
        att.effective_rag || att.rag_status || "GREEN",
        att.vc_decision_required || "No",
        att.status || "OPEN",
        formattedUpdates || att.issue || "",
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
      `RIASAT_Pending_Actions_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Brand Header Banner (White + Black/Blue/Pink/Orange Accents) */}
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
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#003B71] text-white">
                  Executive Control Tower
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F37021]/10 text-[#F37021] border border-[#F37021]/25">
                  {summary.current_review_week || "Weekly Review"}
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight truncate">
                RIASAT Strategic Operations &amp; Decision Register
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white text-xs font-black uppercase tracking-wider shadow-sm hover:opacity-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Action Item
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#F37021]" />
              Export CSV
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#003B71] ${refreshing ? "animate-spin" : ""}`} />
              Sync
            </button>
          </div>
        </div>

        {/* Clean 5-Card Executive KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Overall Readiness
              </div>
              <div className="text-xl font-black text-[#003B71] mt-0.5">
                {summary.overall_readiness}%
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#003B71]/10 text-[#003B71] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Pending Actions
              </div>
              <div className="text-xl font-black text-slate-950 mt-0.5">
                {pendingAttentionItems.length}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <ListChecks className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#D81B60]/5 border border-[#D81B60]/20 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#D81B60]">
                Red Alerts / Overdue
              </div>
              <div className="text-xl font-black text-[#D81B60] mt-0.5">
                {pendingAttentionItems.filter((x) => isRedAlertItem(x)).length}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#D81B60]/15 text-[#D81B60] flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F37021]/5 border border-[#F37021]/25 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#F37021]">
                VC Decisions Pending
              </div>
              <div className="text-xl font-black text-[#F37021] mt-0.5">
                {summary.pending_decisions}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#F37021]/15 text-[#F37021] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Capex / 3-Yr Rev
              </div>
              <div className="text-base font-black text-slate-950 mt-0.5">
                ₹{summary.total_capex}Cr <span className="text-slate-400">/</span>{" "}
                <span className="text-[#D81B60]">₹{summary.total_revenue_pipeline}Cr</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#003B71]/10 text-[#003B71] flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Dedicated Sub-Pages Navigation Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            {
              id: "actions" as ExecViewMode,
              label: `Pending Items (${pendingAttentionItems.length})`,
              icon: ListChecks,
            },
            {
              id: "verticals" as ExecViewMode,
              label: `9 Strategic Verticals (${departments.length})`,
              icon: Building2,
            },
            {
              id: "analytics_directives" as ExecViewMode,
              label: "Directives & RAG Analytics",
              icon: Layers,
            },
            {
              id: "analytics_readiness" as ExecViewMode,
              label: "Readiness Benchmark",
              icon: BarChart3,
            },
            {
              id: "analytics_financials" as ExecViewMode,
              label: "Financial Pipeline",
              icon: IndianRupee,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSwitchView(tab.id)}
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

      {/* ================================================================= */}
      {/* SUB-PAGE 1: PENDING ACTION REGISTER (ONLY PENDING ITEMS)          */}
      {/* ================================================================= */}
      {activeView === "actions" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Filter Bar */}
          <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/40">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-black text-slate-950 tracking-tight">
                  Pending Action Items Register
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#003B71] text-white">
                  {filteredAttention.length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Newly added actions &amp; Red Alerts are prioritized at the top. Updates are listed datewise (latest on top).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Quick Alert Filter Pills */}
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  onClick={() => setSelectedAlertFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedAlertFilter === "ALL"
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  All Pending ({pendingAttentionItems.length})
                </button>
                <button
                  onClick={() => setSelectedAlertFilter("RED_ALERT")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedAlertFilter === "RED_ALERT"
                      ? "bg-[#D81B60] text-white"
                      : "text-[#D81B60] hover:bg-[#D81B60]/10"
                  }`}
                >
                  Red Alerts ({pendingAttentionItems.filter((x) => isRedAlertItem(x)).length})
                </button>
                <button
                  onClick={() => setSelectedAlertFilter("VC_DECISION")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedAlertFilter === "VC_DECISION"
                      ? "bg-[#F37021] text-white"
                      : "text-[#F37021] hover:bg-[#F37021]/10"
                  }`}
                >
                  VC Alerts ({pendingAttentionItems.filter((x) => x.vc_decision_required === "Yes").length})
                </button>
              </div>

              {/* Vertical Filter */}
              <div className="relative">
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedVertical}
                  onChange={(e) => setSelectedVertical(e.target.value)}
                  className="pl-8 pr-7 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#003B71]"
                >
                  <option value="ALL">All 9 Verticals</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search action, owner, ID..."
                  className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#003B71] w-48 sm:w-56"
                />
              </div>
            </div>
          </div>

          {/* Responsive Non-Colliding Table */}
          {filteredAttention.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-slate-700">No pending action items match your filter.</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting the filter or add a new action item.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1150px]">
                <thead>
                  <tr className="bg-slate-950 text-white text-[11px] font-black uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-[110px]">ID &amp; Alert</th>
                    <th className="py-3.5 px-4 w-[170px]">Vertical</th>
                    <th className="py-3.5 px-4 w-[260px]">Action Item / Directive</th>
                    <th className="py-3.5 px-4 w-[140px]">Owner &amp; Target</th>
                    <th className="py-3.5 px-4 w-[120px] text-center">Status &amp; RAG</th>
                    <th className="py-3.5 px-4 min-w-[330px]">
                      Progress / Updates (Datewise • Latest on Top)
                    </th>
                    <th className="py-3.5 px-4 w-[90px] text-right">Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 text-xs">
                  {filteredAttention.map((att) => {
                    const isEditing = editingId === att.id;
                    const isRed = isRedAlertItem(att);
                    const isNewlyCreated = Number(att.id) > 15 && !String(att.item_id || "").startsWith("REC-");
                    const updates =
                      att.updates_list && att.updates_list.length > 0
                        ? att.updates_list
                        : getActionUpdatesDatewise(att);

                    return (
                      <tr
                        key={`${att.department_id}-${att.id}-${att.item_id}`}
                        className={`transition align-top ${
                          isRed
                            ? "bg-[#D81B60]/[0.03] hover:bg-[#D81B60]/[0.06]"
                            : isNewlyCreated
                            ? "bg-[#003B71]/[0.03] hover:bg-[#003B71]/[0.06]"
                            : "hover:bg-slate-50/90"
                        }`}
                      >
                        {/* ID & Alert Badges */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col items-start gap-1.5">
                            <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                              {att.item_id || `ACT-${att.id}`}
                            </span>
                            {isNewlyCreated && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#003B71] text-white">
                                NEW ACTION
                              </span>
                            )}
                            {isRed && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#D81B60] text-white shadow-2xs">
                                <Flame className="w-3 h-3" /> RED ALERT
                              </span>
                            )}
                            {att.vc_decision_required === "Yes" && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#F37021] text-white">
                                VC ALERT
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Vertical */}
                        <td className="py-4 px-4">
                          <Link
                            href={`/department/${att.department_id}`}
                            className="font-black text-[#003B71] hover:underline block leading-snug"
                          >
                            {att.department_name}
                          </Link>
                          {att.supporting_departments && (
                            <div className="mt-1.5 text-[11px] text-slate-500 leading-snug">
                              <span className="font-bold text-slate-700">Support:</span>{" "}
                              {att.supporting_departments}
                            </div>
                          )}
                        </td>

                        {/* Action Directive */}
                        <td className="py-4 px-4">
                          {isEditing ? (
                            <textarea
                              rows={3}
                              value={editForm.item}
                              onChange={(e) => setEditForm({ ...editForm, item: e.target.value })}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#003B71]"
                            />
                          ) : (
                            <div className="font-bold text-slate-900 leading-relaxed break-words">
                              {att.item}
                            </div>
                          )}
                        </td>

                        {/* Owner & Target */}
                        <td className="py-4 px-4">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editForm.owner}
                                onChange={(e) => setEditForm({ ...editForm, owner: e.target.value })}
                                placeholder="Owner"
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                              />
                              <input
                                type="text"
                                value={editForm.target_date}
                                onChange={(e) => setEditForm({ ...editForm, target_date: e.target.value })}
                                placeholder="Timeline"
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                              />
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="font-bold text-slate-900 break-words">
                                {att.owner || "Unassigned"}
                              </div>
                              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3 text-[#F37021]" />
                                {att.target_date || "TBD"}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Status & RAG */}
                        <td className="py-4 px-4 text-center">
                          {isEditing ? (
                            <div className="space-y-2">
                              <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                              >
                                <option value="OPEN">OPEN</option>
                                <option value="In Progress">In Progress</option>
                                <option value="On Track">On Track</option>
                                <option value="Delayed">Delayed</option>
                                <option value="Blocked">Blocked</option>
                                <option value="On Hold">On Hold</option>
                                <option value="Completed">Completed</option>
                                <option value="CLOSED">CLOSED</option>
                              </select>
                              <select
                                value={editForm.rag_status}
                                onChange={(e) => setEditForm({ ...editForm, rag_status: e.target.value })}
                                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                              >
                                <option value="RED">RED Alert</option>
                                <option value="AMBER">AMBER</option>
                                <option value="GREEN">GREEN</option>
                              </select>
                              <select
                                value={editForm.vc_decision_required}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, vc_decision_required: e.target.value })
                                }
                                className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                              >
                                <option value="Yes">VC Alert: Yes</option>
                                <option value="No">VC Alert: No</option>
                              </select>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                  isRed
                                    ? "bg-[#D81B60]/10 text-[#D81B60] border-[#D81B60]/30"
                                    : (att.effective_rag || att.rag_status) === "AMBER"
                                    ? "bg-[#F37021]/10 text-[#F37021] border-[#F37021]/30"
                                    : "bg-[#003B71]/10 text-[#003B71] border-[#003B71]/25"
                                }`}
                              >
                                {att.status}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                Priority: <strong className="text-slate-800">{att.priority || "Medium"}</strong>
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Progress / Updates Column (Datewise, Latest on Top) */}
                        <td className="py-4 px-4">
                          {isEditing ? (
                            <div className="space-y-2">
                              <label className="block text-[10px] font-black uppercase text-[#003B71]">
                                Add New Dated Progress Update (Appears on Top):
                              </label>
                              <textarea
                                rows={3}
                                value={editForm.issue}
                                onChange={(e) => setEditForm({ ...editForm, issue: e.target.value })}
                                placeholder="Type new progress update or red alert note..."
                                className="w-full px-3 py-2 text-xs rounded-xl border border-[#003B71] focus:outline-none focus:ring-2 focus:ring-[#003B71]"
                              />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {updates.length === 0 ? (
                                <span className="text-slate-400 italic text-xs">No updates logged yet</span>
                              ) : (
                                updates.slice(0, 6).map((u, idx) => (
                                  <div
                                    key={u.id || idx}
                                    className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                                      idx === 0
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
                                            idx === 0
                                              ? "bg-slate-900 text-white"
                                              : "bg-slate-200 text-slate-700"
                                          }`}
                                        >
                                          <Calendar className="w-2.5 h-2.5 text-[#F37021]" />
                                          {u.formattedDate}
                                        </span>
                                        {idx === 0 && (
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
                          )}
                        </td>

                        {/* Edit / Save Action */}
                        <td className="py-4 px-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleInlineSave(att)}
                                disabled={savingId === att.id}
                                className="p-2 rounded-lg bg-[#003B71] text-white hover:bg-[#002850] transition cursor-pointer"
                                title="Save Update"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditing(att)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-[#003B71] text-slate-700 hover:text-[#003B71] font-bold text-[11px] transition cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              Update
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-PAGE 2: 9 STRATEGIC VERTICALS                                 */}
      {/* ================================================================= */}
      {activeView === "verticals" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div>
              <h2 className="text-base font-black text-slate-950 uppercase tracking-wider">
                9 Strategic Verticals Overview
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select any vertical card to open its dedicated action register, analytics, and sector form
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-[#003B71]/10 text-[#003B71]">
                Green: {summary.green_count}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#F37021]/10 text-[#F37021]">
                Amber: {summary.amber_count}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#D81B60]/10 text-[#D81B60]">
                Red: {summary.red_count}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {departments.map((dept) => {
              const barColor =
                dept.rag === "GREEN"
                  ? "#003B71"
                  : dept.rag === "AMBER"
                  ? "#F37021"
                  : dept.rag === "RED"
                  ? "#D81B60"
                  : "#64748b";

              return (
                <Link
                  key={dept.id}
                  href={`/department/${dept.id}`}
                  className="group bg-white rounded-2xl border border-slate-200/90 hover:border-[#003B71] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {dept.code}
                        </span>
                        <h3 className="text-base font-black text-slate-950 group-hover:text-[#003B71] transition mt-1.5 leading-snug">
                          {dept.name}
                        </h3>
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shrink-0"
                        style={{ backgroundColor: barColor }}
                      >
                        {dept.rag}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-4 min-h-[32px]">
                      {dept.key_focus || "Operational readiness and strategic milestone execution."}
                    </p>

                    {/* Readiness Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-500">Readiness</span>
                        <span className="font-black text-slate-950">{dept.readiness}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${dept.readiness}%`, backgroundColor: barColor }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Clean 3-Box Metrics Footer */}
                  <div className="pt-3.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                      <div className="text-sm font-black text-slate-950">{dept.open_items}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Pending</div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#D81B60]/5 border border-[#D81B60]/20">
                      <div className="text-sm font-black text-[#D81B60]">{dept.overdue_items || 0}</div>
                      <div className="text-[10px] font-bold text-[#D81B60] uppercase">Alerts</div>
                    </div>
                    <div className="p-2 rounded-xl bg-[#F37021]/5 border border-[#F37021]/20">
                      <div className="text-sm font-black text-[#F37021]">{dept.pending_vc}</div>
                      <div className="text-[10px] font-bold text-[#F37021] uppercase">VC Queue</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-PAGE 3: ACTION DIRECTIVES & RAG ANALYTICS                     */}
      {/* ================================================================= */}
      {activeView === "analytics_directives" && (
        <DashboardGraphs
          readiness={graphs.readiness}
          financials={graphs.financials}
          actionsDistribution={graphs.actionsDistribution}
          ragDistribution={graphs.ragDistribution}
          statusBreakdown={graphs.statusBreakdown}
          mode="directives"
        />
      )}

      {/* ================================================================= */}
      {/* SUB-PAGE 4: VERTICAL READINESS BENCHMARK ANALYTICS                */}
      {/* ================================================================= */}
      {activeView === "analytics_readiness" && (
        <DashboardGraphs
          readiness={graphs.readiness}
          financials={graphs.financials}
          actionsDistribution={graphs.actionsDistribution}
          ragDistribution={graphs.ragDistribution}
          statusBreakdown={graphs.statusBreakdown}
          mode="readiness"
        />
      )}

      {/* ================================================================= */}
      {/* SUB-PAGE 5: FINANCIAL PIPELINE ANALYTICS                          */}
      {/* ================================================================= */}
      {activeView === "analytics_financials" && (
        <DashboardGraphs
          readiness={graphs.readiness}
          financials={graphs.financials}
          actionsDistribution={graphs.actionsDistribution}
          ragDistribution={graphs.ragDistribution}
          statusBreakdown={graphs.statusBreakdown}
          mode="financials"
        />
      )}

      {/* ================================================================= */}
      {/* ADD NEW ACTION ITEM MODAL                                         */}
      {/* ================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021]" />
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-950">
                  Add New Action Directive
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Newly added actions immediately appear at the top of the Pending Action Register
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAction} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Strategic Vertical *
                  </label>
                  <select
                    value={newActionForm.department_id}
                    onChange={(e) =>
                      setNewActionForm({ ...newActionForm, department_id: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alert / RAG Level
                  </label>
                  <select
                    value={newActionForm.rag_status}
                    onChange={(e) =>
                      setNewActionForm({ ...newActionForm, rag_status: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="RED">RED ALERT (Top Priority)</option>
                    <option value="AMBER">AMBER (Watch / Attention)</option>
                    <option value="GREEN">GREEN (On Track)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Action Item / Directive Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newActionForm.action_point}
                  onChange={(e) =>
                    setNewActionForm({ ...newActionForm, action_point: e.target.value })
                  }
                  placeholder="Enter the action directive..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Owner / Lead
                  </label>
                  <input
                    type="text"
                    value={newActionForm.ownership}
                    onChange={(e) =>
                      setNewActionForm({ ...newActionForm, ownership: e.target.value })
                    }
                    placeholder="e.g. Dr. Raghavendra"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Date / Timeline
                  </label>
                  <input
                    type="text"
                    value={newActionForm.timeline}
                    onChange={(e) =>
                      setNewActionForm({ ...newActionForm, timeline: e.target.value })
                    }
                    placeholder="e.g. 2026-10-30"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    VC Decision Alert
                  </label>
                  <select
                    value={newActionForm.vc_decision_required}
                    onChange={(e) =>
                      setNewActionForm({
                        ...newActionForm,
                        vc_decision_required: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="Yes">Yes (VC Alert)</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Progress / Update Note
                </label>
                <textarea
                  rows={2}
                  value={newActionForm.remarks}
                  onChange={(e) =>
                    setNewActionForm({ ...newActionForm, remarks: e.target.value })
                  }
                  placeholder="Enter initial progress update or alert details..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAction}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  {creatingAction ? "Adding..." : "Save & Pin to Top"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExecutiveControlTowerClient({
  initialData,
}: {
  initialData: ExecutiveDashboardData;
}) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-slate-500">Loading Executive Control Tower...</div>}>
      <ExecutiveControlTowerContent initialData={initialData} />
    </Suspense>
  );
}
