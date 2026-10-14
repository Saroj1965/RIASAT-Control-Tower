"use client";

import React, { useState } from "react";
import { BarChart3, TrendingUp, DollarSign, Activity, PieChart, Layers } from "lucide-react";

interface GraphsProps {
  graphs: {
    readiness: { name: string; code: string; readiness: number; rag: string }[];
    financials: { name: string; code: string; capex: number; revenue: number }[];
    actionsDistribution?: { name: string; code: string; primary: number; supporting: number; total: number }[];
    ragDistribution: { label: string; count: number; color: string; percent: number }[];
    statusBreakdown: { [key: string]: number };
  };
}

export default function DashboardGraphs({ graphs }: GraphsProps) {
  const [activeTab, setActiveTab] = useState<"actions" | "readiness" | "financials">("actions");

  if (!graphs) return null;

  const financials = Array.isArray(graphs.financials) ? graphs.financials : [];
  const readiness = Array.isArray(graphs.readiness) ? graphs.readiness : [];
  const actionsDist = Array.isArray(graphs.actionsDistribution) ? graphs.actionsDistribution : [];

  const maxFinancial = Math.max(
    ...financials.map((f) => Math.max(f.capex || 0, f.revenue || 0)),
    30
  );

  const maxActions = Math.max(
    ...actionsDist.map((a) => a.total || 0),
    6
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-8">
      {/* Header with Switcher Tabs */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Executive Analytics & Performance Insights
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Management review directive allocations, sector readiness benchmarks, and operational health
          </p>
        </div>

        {/* View Switcher Buttons */}
        <div className="flex items-center p-1 bg-slate-200/70 rounded-xl text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveTab("actions")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === "actions"
                ? "bg-white text-indigo-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Action Directives</span>
          </button>
          <button
            onClick={() => setActiveTab("readiness")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === "readiness"
                ? "bg-white text-indigo-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Readiness Benchmark</span>
          </button>
          <button
            onClick={() => setActiveTab("financials")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === "financials"
                ? "bg-white text-indigo-700 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Capex vs Revenue</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* GRAPH 0: ACTION DIRECTIVES BY VERTICAL */}
        {activeTab === "actions" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Management Review Directives per Vertical (Primary vs Supporting)
              </span>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-600" /> Primary Owner
                </span>
                <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Supporting Department
                </span>
                <span className="border-l border-slate-300 pl-3 text-slate-500">
                  Total Directives: <strong>15 Active</strong>
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {actionsDist.map((item) => {
                const total = item.total || 0;
                const primaryPct = maxActions > 0 ? (item.primary / maxActions) * 100 : 0;
                const supportingPct = maxActions > 0 ? (item.supporting / maxActions) * 100 : 0;

                return (
                  <div key={item.code} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{item.name}</span>
                        {item.total > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {item.primary} Lead{item.primary !== 1 ? "s" : ""}
                            {item.supporting > 0 ? ` + ${item.supporting} Support` : ""}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900">
                        {total} {total === 1 ? "item" : "items"}
                      </span>
                    </div>

                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60">
                      {item.primary > 0 && (
                        <div
                          className="bg-indigo-600 h-full transition-all duration-500 flex items-center justify-center text-[9px] text-white font-bold"
                          style={{ width: `${primaryPct}%` }}
                          title={`Primary Owner: ${item.primary}`}
                        >
                          {item.primary > 1 ? item.primary : ""}
                        </div>
                      )}
                      {item.supporting > 0 && (
                        <div
                          className="bg-amber-500 h-full transition-all duration-500 flex items-center justify-center text-[9px] text-amber-950 font-bold"
                          style={{ width: `${supportingPct}%` }}
                          title={`Supporting: ${item.supporting}`}
                        >
                          {item.supporting > 1 ? item.supporting : ""}
                        </div>
                      )}
                      {total === 0 && (
                        <div className="h-full w-full bg-slate-50 flex items-center pl-2 text-[10px] text-slate-400 italic">
                          No active directives assigned
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* GRAPH 1: VERTICAL READINESS COMPARISON */}
        {activeTab === "readiness" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Readiness Score (% by Vertical)
              </span>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Green (≥75%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Amber (50-74%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Red (&lt;50%)
                </span>
                <span className="border-l border-slate-300 pl-3 text-slate-400">
                  Target: <strong>75%</strong>
                </span>
              </div>
            </div>

            {/* Bars container */}
            <div className="space-y-3.5 pt-2">
              {readiness.map((d) => {
                const barColor =
                  d.rag === "GREEN"
                    ? "bg-emerald-500"
                    : d.rag === "AMBER"
                    ? "bg-amber-500"
                    : d.rag === "RED"
                    ? "bg-rose-500"
                    : "bg-slate-400";

                return (
                  <div key={d.code} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">{d.name}</span>
                      <span className="font-extrabold text-slate-900">{d.readiness}%</span>
                    </div>
                    <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                      {/* Target marker line at 75% */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-400/80 z-10"
                        style={{ left: "75%" }}
                        title="Target 75%"
                      />
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${Math.min(100, Math.max(0, d.readiness))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GRAPH 2: CAPEX VS REVENUE PIPELINE COMPARISON */}
        {activeTab === "financials" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Capital Outlay (Capex) vs Expected Revenue Pipeline (₹ Cr)
              </span>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
                  <span className="w-3 h-3 rounded bg-indigo-600" /> Capex Outlay
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span className="w-3 h-3 rounded bg-emerald-500" /> Revenue Pipeline
                </span>
              </div>
            </div>

            {/* Comparative Columns Chart */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 items-end h-56 pt-6 border-b border-slate-200 pb-2">
              {financials.map((f) => {
                const capexHeight = Math.max(12, Math.round((f.capex / maxFinancial) * 160));
                const revHeight = Math.max(12, Math.round((f.revenue / maxFinancial) * 160));

                return (
                  <div key={f.code} className="flex flex-col items-center justify-end h-full group">
                    <div className="text-[10px] text-slate-500 font-semibold mb-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      ₹{f.revenue} Cr
                    </div>
                    <div className="flex items-end gap-1 w-full justify-center">
                      {/* Capex Bar */}
                      <div
                        className="w-3.5 bg-indigo-600 rounded-t-sm transition-all duration-500 hover:bg-indigo-700"
                        style={{ height: `${capexHeight}px` }}
                        title={`Capex: ₹${f.capex} Cr`}
                      />
                      {/* Revenue Bar */}
                      <div
                        className="w-3.5 bg-emerald-500 rounded-t-sm transition-all duration-500 hover:bg-emerald-600"
                        style={{ height: `${revHeight}px` }}
                        title={`Revenue: ₹${f.revenue} Cr`}
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <div className="text-[11px] font-bold text-slate-800 truncate max-w-[85px]">
                        {f.name.split(" ")[0]}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium">
                        ₹{f.capex} / ₹{f.revenue}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BOTTOM METRIC PILLS & DISTRIBUTION GAUGES */}
        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* RAG Distribution Bar */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-indigo-500" />
                RAG Composition
              </span>
              <span className="text-[11px] text-slate-500">9 Strategic Verticals</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              {graphs.ragDistribution.map((r) =>
                r.count > 0 ? (
                  <div
                    key={r.label}
                    style={{ width: `${r.percent}%`, backgroundColor: r.color }}
                    title={`${r.label}: ${r.count} (${r.percent}%)`}
                    className="h-full transition-all duration-500"
                  />
                ) : null
              )}
            </div>
            <div className="flex justify-between mt-2 text-[11px] text-slate-600 font-medium">
              {graphs.ragDistribution.map((r) => (
                <span key={r.label} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.label}: <strong>{r.count}</strong>
                </span>
              ))}
            </div>
          </div>

          {/* Workstream Execution Health */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Operational Status Mix
              </span>
              <span className="text-[11px] text-slate-500">Across All Departments</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(graphs.statusBreakdown).map(([status, count]) => {
                let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                if (status === "Completed") badgeClass = "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold";
                else if (status === "On Track") badgeClass = "bg-blue-50 text-blue-800 border-blue-200 font-semibold";
                else if (status === "In Progress") badgeClass = "bg-indigo-50 text-indigo-800 border-indigo-200 font-medium";
                else if (status === "Delayed") badgeClass = "bg-amber-50 text-amber-800 border-amber-300 font-bold";
                else if (status === "Blocked") badgeClass = "bg-rose-50 text-rose-800 border-rose-300 font-bold";

                return (
                  <span
                    key={status}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border ${badgeClass}`}
                  >
                    {status}: <strong>{count}</strong>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
