"use client";

import React from "react";
import {
  BarChart3,
  PieChart as PieIcon,
  IndianRupee,
  Layers,
} from "lucide-react";

interface ReadinessData {
  name: string;
  code: string;
  readiness: number;
  rag: string;
}

interface FinancialsData {
  name: string;
  code: string;
  capex: number;
  revenue: number;
}

interface ActionsDistributionData {
  name: string;
  code: string;
  primary: number;
  supporting: number;
  total: number;
}

interface RagDistData {
  label: string;
  count: number;
  color: string;
  percent: number;
}

interface DashboardGraphsProps {
  readiness: ReadinessData[];
  financials: FinancialsData[];
  actionsDistribution?: ActionsDistributionData[];
  ragDistribution: RagDistData[];
  statusBreakdown: { [key: string]: number };
  mode?: "all" | "directives" | "readiness" | "financials";
}

const getRagBarColor = (rag: string) => {
  switch (rag?.toUpperCase()) {
    case "GREEN":
      return "#003B71";
    case "AMBER":
      return "#F37021";
    case "RED":
      return "#D81B60";
    default:
      return "#64748b";
  }
};

export default function DashboardGraphs({
  readiness,
  financials,
  actionsDistribution = [],
  ragDistribution,
  statusBreakdown,
  mode = "all",
}: DashboardGraphsProps) {
  const activeFinancials = financials.filter((f) => f.capex > 0 || f.revenue > 0);
  const financialRows = activeFinancials.length > 0 ? activeFinancials : financials;
  const maxFinancial = Math.max(
    ...financialRows.map((f) => Math.max(f.capex || 0, f.revenue || 0)),
    10
  );
  const maxActionCount = Math.max(...actionsDistribution.map((a) => a.total || 0), 5);
  const totalActionsCount =
    (statusBreakdown?.["Open"] || 0) +
    (statusBreakdown?.["In Progress"] || 0) +
    (statusBreakdown?.["On Track"] || 0) +
    (statusBreakdown?.["On Hold"] || 0) +
    (statusBreakdown?.["Delayed"] || 0) +
    (statusBreakdown?.["Blocked"] || 0) +
    (statusBreakdown?.["Completed"] || statusBreakdown?.["Closed"] || 0);

  const showDirectives = mode === "all" || mode === "directives";
  const showReadiness = mode === "all" || mode === "readiness";
  const showFinancials = mode === "all" || mode === "financials";

  return (
    <div className="space-y-6">
      {/* SECTION 1: Action Directives & RAG Health Analytics */}
      {showDirectives && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Action Directives Distribution Across Verticals */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#003B71]/10 border border-[#003B71]/20 flex items-center justify-center text-[#003B71] shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Action Directives by Strategic Vertical
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Primary ownership vs supporting department collaboration across 9 sectors
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold shrink-0">
                  <span className="flex items-center gap-1.5 text-[#003B71]">
                    <span className="w-3 h-3 rounded-xs bg-[#003B71] inline-block" />
                    Primary Lead
                  </span>
                  <span className="flex items-center gap-1.5 text-[#F37021]">
                    <span className="w-3 h-3 rounded-xs bg-[#F37021] inline-block" />
                    Supporting
                  </span>
                </div>
              </div>

              <div className="space-y-3.5">
                {actionsDistribution.map((item) => {
                  const primaryPct = Math.round((item.primary / maxActionCount) * 100);
                  const supportPct = Math.round((item.supporting / maxActionCount) * 100);
                  return (
                    <div key={item.code} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white shrink-0">
                            {item.code}
                          </span>
                          <span className="font-bold text-slate-900 truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-[11px] font-bold">
                          <span className="text-[#003B71]">Lead: {item.primary}</span>
                          <span className="text-[#F37021]">Support: {item.supporting}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-900 font-black">
                            Total: {item.total}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                        {item.primary > 0 && (
                          <div
                            className="h-full bg-[#003B71] transition-all duration-500"
                            style={{ width: `${primaryPct}%` }}
                            title={`Primary Lead: ${item.primary}`}
                          />
                        )}
                        {item.supporting > 0 && (
                          <div
                            className="h-full bg-[#F37021] transition-all duration-500"
                            style={{ width: `${supportPct}%` }}
                            title={`Supporting: ${item.supporting}`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RAG Status & Execution Breakdown */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-[#D81B60]/10 border border-[#D81B60]/20 flex items-center justify-center text-[#D81B60] shrink-0">
                  <PieIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Vertical Health &amp; Status
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    RAG distribution &amp; directive execution state
                  </p>
                </div>
              </div>

              {/* Stacked Progress Bar */}
              <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex mb-5 p-0.5 gap-0.5">
                {ragDistribution.map(
                  (item) =>
                    item.count > 0 && (
                      <div
                        key={item.label}
                        style={{
                          width: `${item.percent}%`,
                          backgroundColor:
                            item.label === "GREEN"
                              ? "#003B71"
                              : item.label === "AMBER"
                              ? "#F37021"
                              : item.label === "RED"
                              ? "#D81B60"
                              : "#94a3b8",
                        }}
                        className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                        title={`${item.label}: ${item.count} (${item.percent}%)`}
                      />
                    )
                )}
              </div>

              {/* RAG Legend Cards */}
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {ragDistribution.map((item) => {
                  const badgeColor =
                    item.label === "GREEN"
                      ? "#003B71"
                      : item.label === "AMBER"
                      ? "#F37021"
                      : item.label === "RED"
                      ? "#D81B60"
                      : "#64748b";
                  return (
                    <div
                      key={item.label}
                      className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: badgeColor }}
                        />
                        <span className="text-[11px] font-bold text-slate-700 truncate">
                          {item.label === "NOT STARTED" ? "PENDING" : item.label}
                        </span>
                      </div>
                      <span className="text-sm font-black text-slate-900 ml-2">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Status Breakdown */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  Directive Execution Breakdown
                </span>
                <span className="text-[11px] font-black text-[#003B71]">
                  {totalActionsCount} Total
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {[
                  {
                    label: "Open",
                    count: statusBreakdown["Open"] || 0,
                    cls: "bg-sky-50 text-sky-800 border-sky-300",
                  },
                  {
                    label: "In Progress",
                    count: statusBreakdown["In Progress"] || 0,
                    cls: "bg-indigo-50 text-indigo-800 border-indigo-300",
                  },
                  {
                    label: "On Track",
                    count: statusBreakdown["On Track"] || 0,
                    cls: "bg-[#003B71]/10 text-[#003B71] border-[#003B71]/20",
                  },
                  {
                    label: "Delayed",
                    count: statusBreakdown["Delayed"] || 0,
                    cls: "bg-[#F37021]/10 text-[#F37021] border-[#F37021]/25",
                  },
                  {
                    label: "Blocked",
                    count: statusBreakdown["Blocked"] || 0,
                    cls: "bg-[#D81B60]/10 text-[#D81B60] border-[#D81B60]/25",
                  },
                  {
                    label: "On Hold",
                    count: statusBreakdown["On Hold"] || 0,
                    cls: "bg-amber-50 text-amber-800 border-amber-300",
                  },
                  {
                    label: "Completed / Closed",
                    count: (statusBreakdown["Completed"] || 0) + (statusBreakdown["Closed"] || 0),
                    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  },
                ].map((s) => (
                  <div key={s.label} className={`px-2.5 py-2 rounded-xl border text-center ${s.cls}`}>
                    <div className="text-sm font-black leading-tight">{s.count}</div>
                    <div className="text-[10px] font-bold uppercase tracking-tight mt-0.5 truncate">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Vertical Readiness Benchmark (0 - 100%) */}
      {showReadiness && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F37021]/10 border border-[#F37021]/20 flex items-center justify-center text-[#F37021] shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Vertical Readiness Benchmark (%)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Operational milestone completion across all 9 strategic verticals against 100% target
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#003B71]">
                <span className="w-3 h-3 rounded-xs bg-[#003B71] inline-block" /> Green (On Track)
              </span>
              <span className="flex items-center gap-1.5 text-[#F37021]">
                <span className="w-3 h-3 rounded-xs bg-[#F37021] inline-block" /> Amber (Needs Attention)
              </span>
              <span className="flex items-center gap-1.5 text-[#D81B60]">
                <span className="w-3 h-3 rounded-xs bg-[#D81B60] inline-block" /> Red (Critical Alert)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readiness.map((r) => {
              const color = getRagBarColor(r.rag);
              return (
                <div
                  key={r.code}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                        {r.code}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 mt-1 truncate">{r.name}</h4>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black" style={{ color }}>
                        {r.readiness}%
                      </div>
                      <span
                        className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: color }}
                      >
                        {r.rag}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${r.readiness}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: Financial Pipeline (Capex vs 3-Year Revenue) */}
      {showFinancials && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D81B60]/10 border border-[#D81B60]/20 flex items-center justify-center text-[#D81B60] shrink-0">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Capex Investment vs 3-Year Revenue Pipeline (₹ Cr)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Financial outlay comparison and projected revenue return across verticals
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#003B71]">
                <span className="w-3 h-3 rounded-xs bg-[#003B71] inline-block" /> Capex (₹ Cr)
              </span>
              <span className="flex items-center gap-1.5 text-[#D81B60]">
                <span className="w-3 h-3 rounded-xs bg-[#D81B60] inline-block" /> 3-Yr Revenue (₹ Cr)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {financialRows.map((f) => {
              const capexPct = Math.min(100, Math.round((f.capex / maxFinancial) * 100));
              const revPct = Math.min(100, Math.round((f.revenue / maxFinancial) * 100));
              return (
                <div
                  key={f.code}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                        {f.code}
                      </span>
                      <span className="text-xs font-black text-slate-900 ml-2 truncate">
                        {f.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-black shrink-0">
                      <span className="text-[#003B71]">Capex: ₹{f.capex}Cr</span>
                      <span className="text-[#D81B60]">Rev: ₹{f.revenue}Cr</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-[#003B71] rounded-full"
                        style={{ width: `${capexPct}%` }}
                      />
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-[#D81B60] rounded-full"
                        style={{ width: `${revPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
