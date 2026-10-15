"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Shield,
  RefreshCw,
  Filter,
  Search,
  ChevronRight,
  ArrowRight,
  Zap,
  Check,
  Layers,
} from "lucide-react";
import DashboardGraphs from "@/components/DashboardGraphs";
import {
  ExecutiveDashboardData,
  ExecutiveSummary,
  DepartmentCard,
  AttentionItem,
} from "@/lib/executive";

export default function ExecutiveControlTowerClient({
  initialData,
}: {
  initialData: ExecutiveDashboardData;
}) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ExecutiveSummary>(initialData.summary);
  const [departments, setDepartments] = useState<DepartmentCard[]>(initialData.departments);
  const [graphsData, setGraphsData] = useState<any>(initialData.graphs);
  const [attentionList, setAttentionList] = useState<AttentionItem[]>(initialData.management_attention);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // FILTER BUTTON STATES FOR VERTICAL CARDS
  const [ragFilter, setRagFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // 'ALL', 'SUBMITTED', 'DRAFT', 'CRITICAL'
  const [deptSearch, setDeptSearch] = useState<string>("");

  // FILTER BUTTON STATES FOR MANAGEMENT ATTENTION TABLE
  const [attentionDeptFilter, setAttentionDeptFilter] = useState<string>("ALL");
  const [attentionStatusFilter, setAttentionStatusFilter] = useState<string>("ALL");
  const [attentionSearch, setAttentionSearch] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/executive/summary");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to load executive summary (HTTP ${res.status})`);
      }
      const data: ExecutiveDashboardData = await res.json();
      setSummary(data.summary);
      setDepartments(data.departments);
      setGraphsData(data.graphs);
      setAttentionList(data.management_attention);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error("Error fetching summary:", err);
      setError(err.message || "Failed to load executive summary");
    } finally {
      setLoading(false);
    }
  };

  // Filter vertical cards based on selected filter buttons & search
  const filteredDepartments = departments.filter((d) => {
    if (ragFilter !== "ALL" && d.rag.toUpperCase() !== ragFilter.toUpperCase()) {
      return false;
    }
    if (statusFilter === "SUBMITTED" && d.submission_status !== "SUBMITTED") {
      return false;
    }
    if (statusFilter === "DRAFT" && d.submission_status !== "DRAFT") {
      return false;
    }
    if (statusFilter === "CRITICAL" && d.critical_issues === 0 && d.rag !== "RED") {
      return false;
    }
    if (deptSearch.trim() && !d.name.toLowerCase().includes(deptSearch.toLowerCase().trim())) {
      return false;
    }
    return true;
  });

  // Filter attention items based on selected filter buttons & search
  const filteredAttention = attentionList.filter((item) => {
    if (attentionDeptFilter !== "ALL" && item.department_name !== attentionDeptFilter) {
      return false;
    }
    const isClosed = item.status === "Completed" || item.status === "Closed";
    if (attentionStatusFilter === "PENDING" && isClosed) {
      return false;
    }
    if (attentionStatusFilter === "CARRIED" && (isClosed || !(item.is_carried_forward || (item.weeks_outstanding && item.weeks_outstanding > 0)))) {
      return false;
    }
    if (attentionStatusFilter === "NEW" && (isClosed || !(item.is_new_this_week || (!item.weeks_outstanding && !item.is_carried_forward)))) {
      return false;
    }
    if (attentionStatusFilter === "OVERDUE" && (isClosed || !(item.is_overdue || item.effective_rag === "RED" || item.status === "Delayed"))) {
      return false;
    }
    if (attentionStatusFilter === "BLOCKED" && (isClosed || (item.status !== "Blocked" && !item.is_blocked))) {
      return false;
    }
    if (attentionStatusFilter === "VC_DECISION" && (isClosed || item.vc_decision_required !== "Yes")) {
      return false;
    }
    if (attentionSearch.trim()) {
      const q = attentionSearch.toLowerCase().trim();
      const match =
        (item.item && item.item.toLowerCase().includes(q)) ||
        (item.owner && item.owner.toLowerCase().includes(q)) ||
        (item.issue && item.issue.toLowerCase().includes(q)) ||
        (item.decision_action && item.decision_action.toLowerCase().includes(q)) ||
        (item.review_week && item.review_week.toLowerCase().includes(q)) ||
        (item.item_id && item.item_id.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const getRagBadge = (rag: string) => {
    switch (rag.toUpperCase()) {
      case "GREEN":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "AMBER":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "RED":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
      case "Joined":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold";
      case "On Track":
      case "Interview":
      case "Offer":
        return "bg-blue-50 text-blue-700 border-blue-200 font-semibold";
      case "In Progress":
      case "Sourcing":
      case "Screening":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Delayed":
        return "bg-amber-50 text-amber-700 border-amber-300 font-bold";
      case "Blocked":
        return "bg-rose-50 text-rose-700 border-rose-300 font-bold";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. TOP HEADER & HIGH-LEVEL KPIS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              RIASAT Executive Dashboard
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              Live Dashboard
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time management oversight across all 9 strategic verticals • Single Source of Truth
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated: {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-rose-900">{error}</p>
            <p className="text-slate-600 mt-1">
              If you are logged in as a Department Head, please use the sidebar to open your specific department tracker.
            </p>
          </div>
        </div>
      )}

      {/* EXECUTIVE REVIEW CYCLE STRIP */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
            <Zap className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                Weekly Executive Action Register & Oversight Tower
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {summary.current_review_week || "Week 42 (12 Oct 2026)"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracking <strong className="text-slate-800 font-semibold">{summary.open_actions ?? 15} open deliverables</strong> across all 9 strategic verticals with continuous carry-forward and executive follow-up
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setAttentionStatusFilter("PENDING");
            const el = document.getElementById("management-attention-table");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-2 justify-center self-stretch sm:self-auto"
        >
          <span>View Pending Directives</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI CARDS: 6 CORE MANAGEMENT ACTION METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Tile 1: Total Pending Actions */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Active Directives
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
            {summary.open_actions ?? 15}
          </div>
          <div className="mt-2 text-[10px] font-semibold text-indigo-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Open & Tracked</span>
          </div>
        </div>

        {/* Tile 2: Carried Forward Actions */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/15 shadow-xs hover:border-amber-300 transition">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Carried Forward
          </div>
          <div className="text-2xl font-black text-amber-800 mt-1 flex items-baseline gap-1">
            {summary.carried_forward_actions ?? 0}
          </div>
          <div className="mt-2 text-[10px] font-semibold text-amber-800 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Prior Review Cycles</span>
          </div>
        </div>

        {/* Tile 3: New Actions This Week */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/15 shadow-xs hover:border-emerald-300 transition">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            New This Week
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            {summary.new_actions_this_week ?? 15}
          </div>
          <div className="mt-2 text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Current Review</span>
          </div>
        </div>

        {/* Tile 4: Overdue Actions in RED */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs hover:border-rose-300 transition">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
            Overdue (Red Alert)
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {summary.overdue_actions ?? 0}
          </div>
          <div className="mt-2 text-[10px] text-rose-700 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-rose-600" />
            <span>Requires Follow-up</span>
          </div>
        </div>

        {/* Tile 5: Blocked Actions */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Blocked Items
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {summary.blocked_actions ?? 0}
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-semibold flex items-center gap-1">
            <Shield className="w-3 h-3 text-slate-400" />
            <span>Pending Resolution</span>
          </div>
        </div>

        {/* Tile 6: VC Decisions Required */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 bg-indigo-50/15 shadow-xs hover:border-indigo-300 transition">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">
            VC Decisions Needed
          </div>
          <div className="text-2xl font-black text-indigo-900 mt-1">
            {summary.pending_decisions ?? 8}
          </div>
          <div className="mt-2 text-[10px] text-indigo-700 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-indigo-600" />
            <span>Leadership Focus</span>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE DASHBOARD GRAPHS */}
      {graphsData && <DashboardGraphs graphs={graphsData} />}

      {/* 3. 9 STRATEGIC VERTICAL CARDS (WITH FILTER BUTTONS) */}
      <div id="departments" className="space-y-4">
        {/* FILTER BAR FOR VERTICALS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                9 Strategic Verticals Overview
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredDepartments.length} of {departments.length} verticals
            </p>
          </div>

          {/* Filter Buttons & Search Input */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search vertical..."
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* RAG Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
              <button
                onClick={() => setRagFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  ragFilter === "ALL" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600"
                }`}
              >
                All RAG
              </button>
              <button
                onClick={() => setRagFilter("GREEN")}
                className={`px-2 py-1 rounded-lg transition flex items-center gap-1 ${
                  ragFilter === "GREEN" ? "bg-emerald-600 text-white shadow-xs font-bold" : "text-slate-600 hover:text-emerald-700"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Green
              </button>
              <button
                onClick={() => setRagFilter("AMBER")}
                className={`px-2 py-1 rounded-lg transition flex items-center gap-1 ${
                  ragFilter === "AMBER" ? "bg-amber-500 text-white shadow-xs font-bold" : "text-slate-600 hover:text-amber-700"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300" /> Amber
              </button>
              <button
                onClick={() => setRagFilter("RED")}
                className={`px-2 py-1 rounded-lg transition flex items-center gap-1 ${
                  ragFilter === "RED" ? "bg-rose-600 text-white shadow-xs font-bold" : "text-slate-600 hover:text-rose-700"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-300" /> Red
              </button>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600"
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter("SUBMITTED")}
                className={`px-2 py-1 rounded-lg transition ${
                  statusFilter === "SUBMITTED" ? "bg-indigo-600 text-white shadow-xs font-bold" : "text-slate-600"
                }`}
              >
                Submitted
              </button>
              <button
                onClick={() => setStatusFilter("DRAFT")}
                className={`px-2 py-1 rounded-lg transition ${
                  statusFilter === "DRAFT" ? "bg-amber-600 text-white shadow-xs font-bold" : "text-slate-600"
                }`}
              >
                Draft
              </button>
              <button
                onClick={() => setStatusFilter("CRITICAL")}
                className={`px-2 py-1 rounded-lg transition ${
                  statusFilter === "CRITICAL" ? "bg-rose-600 text-white shadow-xs font-bold" : "text-slate-600 text-rose-700"
                }`}
              >
                Critical
              </button>
            </div>
          </div>
        </div>

        {/* 9 STRATEGIC VERTICAL CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => (
            <Link
              key={dept.id}
              href={`/department/${dept.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-indigo-400 transition flex flex-col justify-between group"
            >
              <div>
                {/* Header: Title + RAG Badge + Draft/Submitted Pill */}
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition tracking-tight">
                    {dept.name}
                  </h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border tracking-wider ${getRagBadge(
                        dept.rag
                      )}`}
                      title={`RAG Status: ${dept.rag}`}
                    >
                      {dept.rag}
                    </span>
                  </div>
                </div>

                {/* Submission Status Pill */}
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      dept.submission_status === "DRAFT"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {dept.submission_status || "SUBMITTED"}
                  </span>
                  <span className="text-[10px] text-slate-400">Code: {dept.code}</span>
                  <span className="text-[10px] text-slate-400">| RAG Status: {dept.rag}</span>
                </div>

                {/* Readiness Percentage Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500">Readiness Score</span>
                    <span className="font-extrabold text-slate-900">{dept.readiness}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        dept.rag === "GREEN"
                          ? "bg-emerald-500"
                          : dept.rag === "AMBER"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, dept.readiness))}%` }}
                    />
                  </div>
                </div>

                {/* Key Metrics: Open Action Points, Delayed/Red Action Points, VC Decisions Required, Workstreams */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Open Action Points</span>
                    <span className="font-bold text-indigo-700">{dept.open_items} Open</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Delayed / Red Action Points</span>
                    <span className={`font-bold ${dept.critical_issues > 0 ? "text-rose-600" : "text-slate-600"}`}>
                      {dept.critical_issues} Items
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">VC Decisions Required</span>
                    <span className={`font-black ${dept.pending_vc > 0 ? "text-rose-600" : "text-slate-600"}`}>
                      {dept.pending_vc > 0 ? `⚠️ ${dept.pending_vc} Required` : "0 Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Workstreams</span>
                    <span className="font-bold text-slate-800">{dept.total_items} Total</span>
                  </div>
                </div>

                {/* Key Focus Snippet */}
                {dept.key_focus && (
                  <div className="mt-3 p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    <strong className="text-slate-700">Focus:</strong> {dept.key_focus}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span className="truncate">
                  Last Updated: {dept.last_updated
                    ? new Date(dept.last_updated).toLocaleDateString("en-IN")
                    : "Not updated yet"}
                </span>
                <span className="font-semibold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                  Drill Down <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. VICE CHAIRMAN / MANAGEMENT ATTENTION (WITH FILTER BUTTONS) */}
      <div id="management-attention-table" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Executive Action Register & Directives
              </h2>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-800 text-[11px] font-bold rounded-full border border-indigo-200">
                {attentionList.filter((x) => x.status !== "Completed" && x.status !== "Closed").length} Active Items
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Weekly deliverables, owners, target timelines, and leadership interventions across all verticals
            </p>
          </div>

          {/* Filter Controls for Attention Table */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search action, owner..."
                value={attentionSearch}
                onChange={(e) => setAttentionSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
              />
            </div>

            {/* Department Filter Dropdown */}
            <select
              value={attentionDeptFilter}
              onChange={(e) => setAttentionDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="ALL">All Verticals</option>
              {departments.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Weekly Register Filter Buttons */}
            <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
              <button
                onClick={() => setAttentionStatusFilter("PENDING")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  attentionStatusFilter === "PENDING" ? "bg-indigo-600 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Active ({attentionList.filter((x) => x.status !== "Completed" && x.status !== "Closed").length})
              </button>

              <button
                onClick={() => setAttentionStatusFilter("CARRIED")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  attentionStatusFilter === "CARRIED" ? "bg-amber-600 text-white shadow-xs font-bold" : "text-slate-600 hover:text-amber-800"
                }`}
              >
                Carried ({attentionList.filter((x) => (x.status !== "Completed" && x.status !== "Closed") && (x.is_carried_forward || (x.weeks_outstanding && x.weeks_outstanding > 0))).length})
              </button>

              <button
                onClick={() => setAttentionStatusFilter("NEW")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  attentionStatusFilter === "NEW" ? "bg-emerald-600 text-white shadow-xs font-bold" : "text-slate-600 hover:text-emerald-800"
                }`}
              >
                New ({attentionList.filter((x) => (x.status !== "Completed" && x.status !== "Closed") && (x.is_new_this_week || (!x.weeks_outstanding && !x.is_carried_forward))).length})
              </button>

              <button
                onClick={() => setAttentionStatusFilter("OVERDUE")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  attentionStatusFilter === "OVERDUE" ? "bg-rose-600 text-white shadow-xs font-bold" : "text-slate-600 hover:text-rose-700"
                }`}
              >
                Overdue ({attentionList.filter((x) => (x.status !== "Completed" && x.status !== "Closed") && (x.is_overdue || x.effective_rag === "RED" || x.status === "Delayed")).length})
              </button>

              <button
                onClick={() => setAttentionStatusFilter("BLOCKED")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  attentionStatusFilter === "BLOCKED" ? "bg-slate-800 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Blocked ({attentionList.filter((x) => (x.status !== "Completed" && x.status !== "Closed") && (x.status === "Blocked" || x.is_blocked)).length})
              </button>

              <button
                onClick={() => setAttentionStatusFilter("VC_DECISION")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  attentionStatusFilter === "VC_DECISION" ? "bg-purple-700 text-white shadow-xs font-bold" : "text-slate-600 hover:text-purple-700"
                }`}
              >
                VC Decisions ({attentionList.filter((x) => (x.status !== "Completed" && x.status !== "Closed") && x.vc_decision_required === "Yes").length})
              </button>

              <button
                onClick={() => setAttentionStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  attentionStatusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>

        {/* Table of Attention Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1329] text-white uppercase text-[10px] font-bold tracking-wider border-b border-slate-800 whitespace-nowrap">
              <tr>
                <th className="px-3 py-3.5 text-center font-bold text-slate-100">ID</th>
                <th className="px-4 py-3.5 text-left font-bold text-slate-100 min-w-[140px]">Review Cycle</th>
                <th className="px-5 py-3.5 text-left font-bold text-slate-100 min-w-[220px]">Action item</th>
                <th className="px-5 py-3.5 text-left font-bold text-slate-100">Owner / support</th>
                <th className="px-5 py-3.5 text-left font-bold text-slate-100">Timeline</th>
                <th className="px-5 py-3.5 text-left font-bold text-slate-100">Status & RAG</th>
                <th className="px-5 py-3.5 text-left font-bold text-slate-100">Department</th>
                <th className="px-5 py-3.5 text-left font-bold text-slate-100">Remarks / Key Update</th>
                <th className="px-4 py-3.5 text-center font-bold text-slate-100">VC Decision Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAttention.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-400">
                    No action items match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAttention.map((item) => {
                  const isVcReq = item.vc_decision_required === "Yes";
                  const isOverdue = item.is_overdue || item.effective_rag === "RED" || item.rag_status === "RED";
                  const isBlocked = item.status === "Blocked" || item.is_blocked;
                  const weeksOutstanding = item.weeks_outstanding ?? 0;
                  const isCarried = item.is_carried_forward || weeksOutstanding > 0;
                  const ragStatus = (isOverdue ? "RED" : (item.rag_status || (["Delayed", "Blocked"].includes(item.status) ? "AMBER" : "GREEN"))).toUpperCase();

                  return (
                    <tr
                      key={`${item.department_id}-${item.id}`}
                      className={`transition ${
                        isOverdue
                          ? "bg-rose-50/85 hover:bg-rose-100/75 border-l-4 border-l-rose-600"
                          : isBlocked
                          ? "bg-rose-50/30 hover:bg-rose-50/60 border-l-4 border-l-rose-400"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {/* ID */}
                      <td className="px-3 py-4 text-center whitespace-nowrap font-mono">
                        <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-extrabold text-[11px] border border-indigo-200">
                          {item.item_id || `ID #${item.id}`}
                        </span>
                      </td>

                      {/* Review Cycle & Carry-Forward Status */}
                      <td className="px-4 py-4 whitespace-nowrap text-left">
                        <div className="text-[11px] font-bold text-slate-800">
                          {item.review_week || "Week 42 (12 Oct 2026)"}
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          {isCarried ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                              🔄 Carried (+{weeksOutstanding}w)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              ⚡ New This Week
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action item */}
                      <td className="px-5 py-4 font-bold text-slate-900 max-w-sm leading-relaxed">
                        <div className={isOverdue ? "text-rose-950 font-black" : "text-slate-900"}>{item.item}</div>
                        {item.supporting_departments && (
                          <div className="text-[10px] text-slate-500 font-normal mt-1 flex items-center gap-1">
                            <span className="font-semibold text-slate-600">Supporting:</span>
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                              {item.supporting_departments}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Owner */}
                      <td className="px-5 py-4 text-slate-700 font-medium max-w-xs">
                        {item.owner || "--"}
                      </td>

                      {/* Timeline */}
                      <td className="px-5 py-4 whitespace-nowrap font-semibold text-[11px]">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-2 py-1 rounded-md border ${
                            isOverdue ? "bg-rose-100 text-rose-800 border-rose-300 font-extrabold" : "bg-slate-100 border-slate-200 text-slate-700"
                          }`}>
                            {item.target_date || "--"}
                          </span>
                          {isOverdue && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white shadow-xs animate-pulse">
                              🚨 OVERDUE {weeksOutstanding > 0 ? `• ${weeksOutstanding}w open` : ""}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status & RAG */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md border ${
                            isBlocked ? "bg-rose-600 text-white font-black border-rose-700 shadow-xs" : getStatusBadge(item.status)
                          }`}>
                            {isBlocked ? "⛔ BLOCKED" : item.status}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                              ragStatus === "GREEN"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : ragStatus === "AMBER"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-rose-600 text-white shadow-xs font-black animate-pulse"
                            }`}
                          >
                            {ragStatus}
                          </span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link
                          href={`/department/${item.department_id}`}
                          className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          {item.department_name}
                        </Link>
                      </td>

                      {/* Remarks */}
                      <td className="px-5 py-4 text-slate-600 max-w-xs text-[11px] leading-relaxed">
                        {item.decision_action || item.issue || "--"}
                      </td>

                      {/* VC Decision */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. INFORMATIONAL CARD: WEEKLY REVIEW PROTOCOL & EMAIL NOTIFICATION ARCHITECTURE */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10px] uppercase">
              Follow-Up Engine
            </span>
            <span>
              Unfinished actions automatically carry forward every review cycle until formally <strong>Closed</strong>. Overdue items trigger high-priority red reminders.
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Email & Telegram Reminders: Configured for automated weekly dispatch via Neon PostgreSQL audit trail.
          </div>
        </div>
      </div>
    </div>
  );
}
