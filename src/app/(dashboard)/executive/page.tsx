"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  User,
  Calendar,
  Filter,
  Search,
  CheckCircle,
  FileText,
  DollarSign,
  Layers,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import DashboardGraphs from "@/components/DashboardGraphs";

interface ExecutiveSummary {
  overall_readiness: number;
  overall_rag: string;
  green_count: number;
  amber_count: number;
  red_count: number;
  not_started_count: number;
  total_capex: number;
  total_revenue_pipeline: number;
  pending_decisions: number;
  critical_openings: number;
}

interface DepartmentCard {
  id: number;
  name: string;
  code: string;
  readiness: number;
  rag: string;
  key_focus: string;
  open_items: number;
  total_items: number;
  critical_issues: number;
  capex: number;
  revenue: number;
  pending_vc: number;
  submission_status: string;
  last_updated: string | null;
  updated_by: string;
  is_stale: boolean;
}

interface AttentionItem {
  id: number;
  department_id: number;
  department_name: string;
  item: string;
  issue: string;
  owner: string;
  target_date: string;
  status: string;
  rag_status?: string;
  decision_action?: string;
  vc_decision_required?: string;
  capex?: string;
  revenue_pipeline?: string;
}

export default function ExecutiveControlTowerPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [departments, setDepartments] = useState<DepartmentCard[]>([]);
  const [graphsData, setGraphsData] = useState<any>(null);
  const [attentionList, setAttentionList] = useState<AttentionItem[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

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
      const res = await fetch("/api/executive/summary");
      if (!res.ok) throw new Error("Failed to load executive summary");
      const data = await res.json();
      setSummary(data.summary);
      setDepartments(data.departments);
      setGraphsData(data.graphs);
      setAttentionList(data.management_attention);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Error fetching summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter vertical cards based on selected filter buttons & search
  const filteredDepartments = departments.filter((d) => {
    // 1. RAG Filter
    if (ragFilter !== "ALL" && d.rag.toUpperCase() !== ragFilter.toUpperCase()) {
      return false;
    }
    // 2. Status Filter
    if (statusFilter === "SUBMITTED" && d.submission_status !== "SUBMITTED") {
      return false;
    }
    if (statusFilter === "DRAFT" && d.submission_status !== "DRAFT") {
      return false;
    }
    if (statusFilter === "CRITICAL" && d.critical_issues === 0 && d.rag !== "RED") {
      return false;
    }
    // 3. Search query
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
    if (attentionStatusFilter === "BLOCKED" && item.status !== "Blocked") {
      return false;
    }
    if (attentionStatusFilter === "DELAYED" && item.status !== "Delayed") {
      return false;
    }
    if (
      attentionStatusFilter === "VC_DECISION" &&
      item.vc_decision_required !== "Yes" &&
      (!item.decision_action || !item.decision_action.trim())
    ) {
      return false;
    }
    if (
      attentionSearch.trim() &&
      !item.item.toLowerCase().includes(attentionSearch.toLowerCase().trim()) &&
      !item.issue.toLowerCase().includes(attentionSearch.toLowerCase().trim()) &&
      !item.owner.toLowerCase().includes(attentionSearch.toLowerCase().trim())
    ) {
      return false;
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
              RIASAT Executive Control Tower
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              Live Central Tower
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time management oversight across all 8 strategic segments • Single Source of Truth
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

      {/* KPI CARDS (6 HIGH LEVEL TILES) */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Tile 1: Overall Readiness */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Overall Readiness
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
              {summary.overall_readiness}%
            </div>
            <div className="mt-2 text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Target: 75% Benchmark</span>
            </div>
          </div>

          {/* Tile 2: Overall RAG */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Overall RAG Status
            </div>
            <div className="mt-1">
              <span className={`inline-block px-2.5 py-1 text-xs font-black rounded-lg border ${getRagBadge(summary.overall_rag)}`}>
                {summary.overall_rag}
              </span>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 font-medium">
              G:{summary.green_count} • A:{summary.amber_count} • R:{summary.red_count}
            </div>
          </div>

          {/* Tile 3: Total Capex */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Capex Outlay
            </div>
            <div className="text-2xl font-black text-indigo-700 mt-1">
              ₹ {summary.total_capex} Cr
            </div>
            <div className="mt-2 text-[10px] text-slate-500 font-medium">
              Infrastructure & Lab setup
            </div>
          </div>

          {/* Tile 4: Revenue Pipeline */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Revenue Pipeline
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              ₹ {summary.total_revenue_pipeline} Cr
            </div>
            <div className="mt-2 text-[10px] text-slate-500 font-medium">
              Cohorts, consulting & labs
            </div>
          </div>

          {/* Tile 5: Vice Chairman Decisions Required */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Vice Chairman Decisions Required
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {summary.pending_decisions}
            </div>
            <div className="mt-2 text-[10px] text-rose-700 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              <span>Requires Executive Action</span>
            </div>
          </div>

          {/* Tile 6: Critical Leadership Openings */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Critical Openings
            </div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {summary.critical_openings}
            </div>
            <div className="mt-2 text-[10px] text-rose-700 font-semibold">
              Talent engine priorities
            </div>
          </div>
        </div>
      )}

      {/* 2. INTERACTIVE DASHBOARD GRAPHS */}
      {graphsData && <DashboardGraphs graphs={graphsData} />}

      {/* 3. 8 STRATEGIC VERTICAL CARDS (WITH FILTER BUTTONS) */}
      <div id="departments" className="space-y-4">
        {/* FILTER BAR FOR VERTICALS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                8 Strategic Verticals Overview
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredDepartments.length} of {departments.length} departments
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
                  ragFilter === "ALL" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
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

        {/* 8 DEPARTMENT GRID CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                {/* Key Metrics: Capex, Pipeline, Deliverables */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">CAPEX OUTLAY</span>
                    <span className="font-bold text-indigo-700">₹ {dept.capex} Cr</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">REVENUE PIPELINE</span>
                    <span className="font-bold text-emerald-700">₹ {dept.revenue} Cr</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">DELIVERABLES</span>
                    <span className="font-bold text-slate-800">{dept.total_items} Workstreams</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">CRITICAL ISSUES</span>
                    <span className={`font-bold ${dept.critical_issues > 0 ? "text-rose-600" : "text-slate-600"}`}>
                      {dept.critical_issues} Items
                    </span>
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
                  {dept.last_updated
                    ? `Updated: ${new Date(dept.last_updated).toLocaleDateString("en-IN")}`
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight uppercase">
                VICE CHAIRMAN / MANAGEMENT ATTENTION
              </h2>
              <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-black rounded-full border border-rose-300">
                {attentionList.filter((x) => x.vc_decision_required === "Yes").length} Decisions Required
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Action points where <strong>Vice Chairman Decision Required = YES</strong> or priority operational blockers are active
            </p>
          </div>

          {/* ATTENTION FILTER BUTTONS */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-44">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={attentionSearch}
                onChange={(e) => setAttentionSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Department Filter Dropdown */}
            <select
              value={attentionDeptFilter}
              onChange={(e) => setAttentionDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Issue Filter Buttons */}
            <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold gap-1">
              <button
                onClick={() => setAttentionStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  attentionStatusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-600"
                }`}
              >
                All Items
              </button>
              <button
                onClick={() => setAttentionStatusFilter("VC_DECISION")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  attentionStatusFilter === "VC_DECISION" ? "bg-rose-600 text-white shadow-xs font-bold" : "text-slate-600 hover:text-rose-700"
                }`}
              >
                VC Decisions ({attentionList.filter((x) => x.vc_decision_required === "Yes").length})
              </button>
              <button
                onClick={() => setAttentionStatusFilter("BLOCKED")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  attentionStatusFilter === "BLOCKED" ? "bg-rose-700 text-white shadow-xs font-bold" : "text-slate-600 hover:text-rose-800"
                }`}
              >
                Blocked
              </button>
              <button
                onClick={() => setAttentionStatusFilter("DELAYED")}
                className={`px-2.5 py-1 rounded-lg transition ${
                  attentionStatusFilter === "DELAYED" ? "bg-amber-500 text-white shadow-xs font-bold" : "text-slate-600 hover:text-amber-700"
                }`}
              >
                Delayed
              </button>
            </div>
          </div>
        </div>

        {/* Table of Attention Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1329] text-white uppercase text-[10px] font-bold tracking-wider border-b border-slate-800 whitespace-nowrap">
              <tr>
                <th className="px-5 py-3.5 text-left font-bold text-slate-100">Department</th>
                <th className="px-5 py-3.5 text-left font-bold text-slate-100">Action Point</th>
                <th className="px-5 py-3.5 text-left font-bold text-slate-100">Ownership</th>
                <th className="px-5 py-3.5 text-left font-bold text-slate-100">Timeline</th>
                <th className="px-5 py-3.5 text-left font-bold text-slate-100">Status</th>
                <th className="px-5 py-3.5 text-left font-bold text-slate-100">RAG Status</th>
                <th className="px-5 py-3.5 text-left font-bold text-slate-100">Remarks / Decision Required</th>
                <th className="px-5 py-3.5 text-center font-bold text-slate-100">VC Decision Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAttention.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No critical issues match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAttention.map((item) => {
                  const isVcReq = item.vc_decision_required === "Yes";
                  const ragStatus = (item.rag_status || (["Delayed", "Blocked"].includes(item.status) ? "AMBER" : "GREEN")).toUpperCase();

                  return (
                    <tr key={`${item.department_id}-${item.id}`} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link
                          href={`/department/${item.department_id}`}
                          className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          {item.department_name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900 max-w-xs">
                        {item.item}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600 font-medium">
                        {item.owner || "--"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {item.target_date || "--"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md border ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black rounded-md border uppercase tracking-wider ${
                            ragStatus === "GREEN"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : ragStatus === "AMBER"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-rose-100 text-rose-800 border-rose-300"
                          }`}
                        >
                          {ragStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-800 max-w-sm leading-relaxed">
                        {item.decision_action || item.issue || "--"}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
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
      </div>
    </div>
  );
}
