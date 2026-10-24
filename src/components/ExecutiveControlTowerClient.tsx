"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Download,
  Search,
  Building2,
  BarChart3,
  Layers,
  IndianRupee,
  ListChecks,
  ArrowUpRight,
  Flame,
  Sparkles,
  Edit3,
  History,
  LayoutDashboard,
  FileBarChart,
  BookOpen,
} from "lucide-react";
import { ActionFormModal, ActionHistorySheet } from "@/components/ActionFormModal";

const BRAND = {
  blue: "#003B71",
  pink: "#D81B60",
  orange: "#F37021",
  black: "#0F172A",
  slate: "#64748B",
};

interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

function SvgDonutChart({
  data,
  centerLabel,
}: {
  data: DonutDatum[];
  centerLabel: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const size = 148;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={stroke}
          />
          {total > 0 &&
            data.map((d) => {
              const frac = d.value / total;
              const dash = frac * circumference;
              const seg = (
                <circle
                  key={d.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={d.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return seg;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold text-slate-900">{total}</span>
          <span className="text-[10px] uppercase tracking-wide text-slate-500">
            {centerLabel}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-1.5 text-xs w-full">
        {data.map((d) => {
          const pct = total ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={d.label} className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-slate-700">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: d.color }}
                />
                <span className="truncate">{d.label}</span>
              </span>
              <span className="font-mono text-slate-600">
                {d.value} <span className="text-slate-400">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ExecutiveControlTowerClient({
  data: propData,
  initialData,
  currentUser,
}: {
  data?: any;
  initialData?: any;
  currentUser?: {
    id: number;
    name: string;
    email: string;
    role: string;
    department_id: number | null;
  };
}) {
  const data = propData || initialData;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active sub-page route controlled by ?view= query parameter
  const currentView = searchParams?.get("view") || "actions";

  const setView = (viewName: string) => {
    router.push(`/executive?view=${viewName}`);
  };

  // Register filters
  const [actionTab, setActionTab] = useState<"PENDING" | "CLOSED" | "ALL">("PENDING");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [ownerFilter, setOwnerFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("ALL");
  const [vcFilter, setVcFilter] = useState<string>("ALL");
  const [redAlertOnly, setRedAlertOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Shared Edit / Create Action Modal & History Sheet state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingAction, setEditingAction] = useState<any | null>(null);
  const [historyAction, setHistoryAction] = useState<any | null>(null);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingAction(null);
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setModalMode("edit");
    setEditingAction(item);
    setModalOpen(true);
  };

  const departments = data?.departments || [];
  const allActionsRaw = data?.allActions || [];
  const summary = data?.summary || {};

  // Next code preview
  const nextCodePreview = useMemo(() => {
    const nums = allActionsRaw
      .map((a: any) => {
        const m = String(a.item_id || "").match(/^ACT-(\d+)/i);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n: number) => n > 0);
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 16;
    return `ACT-${String(next).padStart(2, "0")}`;
  }, [allActionsRaw]);

  // Distinct owners
  const ownerOptions = useMemo(() => {
    const set = new Set<string>();
    allActionsRaw.forEach((a: any) => {
      const o = String(a.ownership || a.owner || "").trim();
      if (o) set.add(o);
    });
    return Array.from(set).sort();
  }, [allActionsRaw]);

  // Strictly separate Pending vs Closed actions
  const pendingActionsAll = useMemo(() => {
    return allActionsRaw.filter((a: any) => {
      const st = String(a.status || "OPEN").trim().toUpperCase();
      return st !== "CLOSED" && st !== "COMPLETED" && st !== "JOINED";
    });
  }, [allActionsRaw]);

  const closedActionsAll = useMemo(() => {
    return allActionsRaw.filter((a: any) => {
      const st = String(a.status || "OPEN").trim().toUpperCase();
      return st === "CLOSED" || st === "COMPLETED" || st === "JOINED";
    });
  }, [allActionsRaw]);

  // Filtered actions for table display
  const displayedActions = useMemo(() => {
    const sourceList =
      actionTab === "PENDING"
        ? pendingActionsAll
        : actionTab === "CLOSED"
          ? closedActionsAll
          : allActionsRaw;

    return sourceList.filter((item: any) => {
      if (deptFilter !== "ALL" && String(item.department_id) !== deptFilter) {
        return false;
      }
      if (ownerFilter !== "ALL") {
        const o = String(item.ownership || item.owner || "").trim();
        if (o !== ownerFilter) return false;
      }
      if (
        priorityFilter !== "ALL" &&
        String(item.priority || "Medium").toUpperCase() !== priorityFilter.toUpperCase()
      ) {
        return false;
      }
      if (statusFilter !== "ALL") {
        const st = String(item.status || "Open").trim().toUpperCase();
        if (st !== statusFilter.toUpperCase()) return false;
      }
      if (frequencyFilter !== "ALL") {
        const freq = String(
          item.review_frequency ||
            (String(item.review_week || "").toLowerCase().includes("month") ? "Monthly" : "Weekly")
        );
        if (freq.toUpperCase() !== frequencyFilter.toUpperCase()) return false;
      }
      if (vcFilter !== "ALL") {
        const isVc = item.vc_decision_required === "Yes";
        if (vcFilter === "YES" && !isVc) return false;
        if (vcFilter === "NO" && isVc) return false;
      }
      if (redAlertOnly) {
        const isAlert =
          item.is_red_alert ||
          item.effective_rag === "RED" ||
          item.rag_status === "RED" ||
          item.is_overdue ||
          String(item.priority || "").toUpperCase() === "CRITICAL";
        if (!isAlert) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const text = [
          item.item_id,
          item.action_point,
          item.deliverable,
          item.department_name,
          item.ownership,
          item.owner,
          item.remarks,
          item.decision_action,
          item.supporting_departments,
          item.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [
    actionTab,
    pendingActionsAll,
    closedActionsAll,
    allActionsRaw,
    deptFilter,
    ownerFilter,
    priorityFilter,
    statusFilter,
    frequencyFilter,
    vcFilter,
    redAlertOnly,
    searchQuery,
  ]);

  // CSV Export (Working with UTF-8 BOM)
  const handleExportCSV = () => {
    const rowsToExport = displayedActions;
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
      ...rowsToExport.map((item: any, idx: number) => {
        const updatesFormatted = Array.isArray(item.updates_list)
          ? item.updates_list
              .map(
                (u: any, uIdx: number) =>
                  `[#${item.updates_list.length - uIdx} ${String(u.date || "").slice(0, 10)} - ${u.user || "User"}]: ${u.remarks}`
              )
              .join(" ;; ")
          : item.remarks || "";

        const actionTaken =
          item.closure_remarks ||
          item.decision_action ||
          item.remarks ||
          "Active operational directive";

        return [
          `S.No. ${idx + 1}`,
          item.item_id || `ACT-${idx + 1}`,
          String(item.review_meeting_date || "2026-10-12").slice(0, 10),
          item.review_frequency || "Weekly",
          item.department_name || "",
          item.action_point || item.deliverable || "",
          item.ownership || item.owner || "",
          item.supporting_departments || "",
          item.priority || "Medium",
          item.target_date || item.timeline || "",
          item.status || "Open",
          actionTaken,
          updatesFormatted,
          item.next_followup_date || "",
          item.vc_decision_required || "No",
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
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute(
      "download",
      `RIASAT_Executive_Dashboard_${actionTab}_${dateStamp}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Executive Dashboard Metrics (matching Riasat Executive Dashboard)
  const execMetrics = useMemo(() => {
    const total = allActionsRaw.length;
    const pending = pendingActionsAll.length;
    const closed = closedActionsAll.length;
    const completionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    const inProgress = pendingActionsAll.filter((a: any) =>
      ["IN PROGRESS", "ON TRACK", "OPEN"].includes(
        String(a.status || "OPEN").trim().toUpperCase()
      )
    ).length;

    const overdue = pendingActionsAll.filter(
      (a: any) => a.is_overdue || a.is_red_alert || a.effective_rag === "RED"
    ).length;

    const blockedOrDelayed = pendingActionsAll.filter((a: any) =>
      ["BLOCKED", "DELAYED", "ON HOLD"].includes(
        String(a.status || "").trim().toUpperCase()
      )
    ).length;

    const criticalOrHigh = pendingActionsAll.filter((a: any) =>
      ["CRITICAL", "HIGH"].includes(String(a.priority || "").trim().toUpperCase())
    ).length;

    const vcRequired = pendingActionsAll.filter(
      (a: any) => a.vc_decision_required === "Yes"
    ).length;

    const byDepartment = departments.map((d: any, idx: number) => {
      const deptItems = allActionsRaw.filter(
        (a: any) => Number(a.department_id) === Number(d.id)
      );
      const deptPending = deptItems.filter((a: any) => {
        const st = String(a.status || "OPEN").trim().toUpperCase();
        return st !== "CLOSED" && st !== "COMPLETED";
      });
      const deptClosed = deptItems.length - deptPending.length;
      const deptInProg = deptPending.filter((a: any) =>
        ["IN PROGRESS", "ON TRACK"].includes(String(a.status || "").trim().toUpperCase())
      ).length;
      const deptOverdue = deptPending.filter(
        (a: any) => a.is_overdue || a.effective_rag === "RED"
      ).length;
      const deptBlocked = deptPending.filter((a: any) =>
        ["BLOCKED", "DELAYED", "ON HOLD"].includes(String(a.status || "").trim().toUpperCase())
      ).length;
      const deptCritHigh = deptPending.filter((a: any) =>
        ["CRITICAL", "HIGH"].includes(String(a.priority || "").trim().toUpperCase())
      ).length;
      const deptVc = deptPending.filter(
        (a: any) => a.vc_decision_required === "Yes"
      ).length;
      const rate =
        deptItems.length > 0 ? Math.round((deptClosed / deptItems.length) * 100) : 0;

      return {
        sno: idx + 1,
        id: d.id,
        department: d.name,
        code: d.code,
        total: deptItems.length,
        open: deptPending.length,
        inProgress: deptInProg,
        closed: deptClosed,
        overdue: deptOverdue,
        blocked: deptBlocked,
        criticalOrHigh: deptCritHigh,
        vcRequired: deptVc,
        completionRate: rate,
      };
    });

    const priorityDonut: DonutDatum[] = [
      {
        label: "Critical",
        value: pendingActionsAll.filter(
          (a: any) => String(a.priority || "").toUpperCase() === "CRITICAL"
        ).length,
        color: "#e11d48",
      },
      {
        label: "High",
        value: pendingActionsAll.filter(
          (a: any) => String(a.priority || "").toUpperCase() === "HIGH"
        ).length,
        color: "#f59e0b",
      },
      {
        label: "Medium",
        value: pendingActionsAll.filter(
          (a: any) => String(a.priority || "Medium").toUpperCase() === "MEDIUM"
        ).length,
        color: "#0284c7",
      },
      {
        label: "Low",
        value: pendingActionsAll.filter(
          (a: any) => String(a.priority || "").toUpperCase() === "LOW"
        ).length,
        color: "#64748b",
      },
    ];

    const statusDonut: DonutDatum[] = [
      {
        label: "Open",
        value: allActionsRaw.filter((a: any) =>
          ["OPEN", "NOT STARTED"].includes(String(a.status || "OPEN").toUpperCase())
        ).length,
        color: "#475569",
      },
      {
        label: "In Progress / On Track",
        value: allActionsRaw.filter((a: any) =>
          ["IN PROGRESS", "ON TRACK"].includes(String(a.status || "").toUpperCase())
        ).length,
        color: "#0284c7",
      },
      {
        label: "Delayed / Blocked",
        value: allActionsRaw.filter((a: any) =>
          ["DELAYED", "BLOCKED", "ON HOLD"].includes(String(a.status || "").toUpperCase())
        ).length,
        color: "#e11d48",
      },
      {
        label: "Closed / Completed",
        value: closed,
        color: "#059669",
      },
    ];

    const deptColors = [
      "#e11d48",
      "#f97316",
      "#eab308",
      "#0284c7",
      "#7c3aed",
      "#0d9488",
      "#64748b",
      "#003B71",
      "#D81B60",
    ];
    const overdueByDeptDonut: DonutDatum[] = byDepartment
      .filter((d: any) => d.overdue > 0 || d.criticalOrHigh > 0)
      .map((d: any, i: number) => ({
        label: d.department,
        value: d.overdue || d.criticalOrHigh,
        color: deptColors[i % deptColors.length],
      }));

    const attentionList = pendingActionsAll.filter(
      (a: any) =>
        a.is_overdue ||
        a.is_red_alert ||
        a.effective_rag === "RED" ||
        ["BLOCKED", "DELAYED"].includes(String(a.status || "").toUpperCase()) ||
        String(a.priority || "").toUpperCase() === "CRITICAL"
    );

    const vcDecisionList = pendingActionsAll.filter(
      (a: any) => a.vc_decision_required === "Yes"
    );

    return {
      total,
      pending,
      closed,
      completionRate,
      inProgress,
      overdue,
      blockedOrDelayed,
      criticalOrHigh,
      vcRequired,
      byDepartment,
      priorityDonut,
      statusDonut,
      overdueByDeptDonut,
      attentionList,
      vcDecisionList,
    };
  }, [allActionsRaw, pendingActionsAll, closedActionsAll, departments]);

  // Analytics data for sub-pages
  const ragDistributionData = useMemo(() => {
    let green = 0,
      amber = 0,
      red = 0;
    pendingActionsAll.forEach((a: any) => {
      const rag = String(a.effective_rag || a.rag_status || "GREEN").toUpperCase();
      if (rag === "RED") red++;
      else if (rag === "AMBER") amber++;
      else green++;
    });
    return [
      { name: "On Track (Blue)", value: green, color: BRAND.blue },
      { name: "Attention (Orange)", value: amber, color: BRAND.orange },
      { name: "Red Alert (Pink)", value: red, color: BRAND.pink },
    ];
  }, [pendingActionsAll]);

  const verticalDirectivesChart = useMemo(() => {
    return departments.map((d: any) => {
      const deptActs = pendingActionsAll.filter(
        (a: any) => Number(a.department_id) === Number(d.id)
      );
      const redCount = deptActs.filter(
        (a: any) => a.is_red_alert || a.effective_rag === "RED"
      ).length;
      const closedCount = closedActionsAll.filter(
        (a: any) => Number(a.department_id) === Number(d.id)
      ).length;
      return {
        name: d.name.length > 14 ? d.name.slice(0, 12) + "…" : d.name,
        fullName: d.name,
        Pending: deptActs.length,
        "Red Alerts": redCount,
        Closed: closedCount,
        Readiness: d.readiness_percentage || 0,
      };
    });
  }, [departments, pendingActionsAll, closedActionsAll]);

  const financialChartData = useMemo(() => {
    return departments.map((d: any) => ({
      name: d.name.length > 14 ? d.name.slice(0, 12) + "…" : d.name,
      fullName: d.name,
      Capex: Number((d.capex_total || 0).toFixed(2)),
      Revenue: Number((d.revenue_total || 0).toFixed(2)),
    }));
  }, [departments]);

  const redAlertsCount = pendingActionsAll.filter(
    (a: any) => a.is_red_alert || a.effective_rag === "RED" || a.rag_status === "RED"
  ).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Top Executive Header Banner */}
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
                  Riasat Executive Dashboard
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F37021]/15 text-[#F37021]">
                  Weekly Review Register
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight truncate">
                RIASAT Executive Dashboard
              </h1>
              <p className="text-xs text-slate-500 font-medium truncate">
                Single ongoing action register across all 9 verticals — every action editable with full audit history
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={openCreateModal}
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

        {/* Sub-Page Route Navigation Pills */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            {
              id: "actions",
              label: "Action Register (Summary Sheet)",
              icon: <ListChecks className="w-3.5 h-3.5" />,
            },
            {
              id: "executive_dashboard",
              label: "Executive Action Dashboard",
              icon: <LayoutDashboard className="w-3.5 h-3.5" />,
            },
            {
              id: "verticals",
              label: "9 Strategic Verticals",
              icon: <Building2 className="w-3.5 h-3.5" />,
            },
            {
              id: "analytics_directives",
              label: "Directives & RAG Analytics",
              icon: <Layers className="w-3.5 h-3.5" />,
            },
            {
              id: "analytics_readiness",
              label: "Readiness Benchmark",
              icon: <BarChart3 className="w-3.5 h-3.5" />,
            },
            {
              id: "analytics_financials",
              label: "Capex & Revenue Pipeline",
              icon: <IndianRupee className="w-3.5 h-3.5" />,
            },
          ].map((tab) => {
            const active = currentView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setView(tab.id)}
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

      {/* =================================================================== */}
      {/* SUB-PAGE 1: WEEKLY DEPARTMENTAL ACTION REGISTER                     */}
      {/* =================================================================== */}
      {currentView === "actions" && (
        <div className="space-y-4">
          {/* 5 Summary Cards matching Riasat Executive Dashboard */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">
                  Active pending actions
                </span>
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                  Needs VC: {execMetrics.vcRequired}
                </span>
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {pendingActionsAll.length}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                In summary sheet · auto carry-forward
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-rose-800">
                  Overdue / Red Alert
                </span>
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
              <div className="mt-1 text-2xl font-bold text-rose-700">
                {redAlertsCount}
              </div>
              <div className="mt-0.5 text-[11px] text-rose-700/80">
                Highlighted at top of register
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-amber-900">
                  In Progress / Active
                </span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-1 text-2xl font-bold text-amber-800">
                {execMetrics.inProgress}
              </div>
              <div className="mt-0.5 text-[11px] text-amber-800/80">
                Weekly review tracking
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="text-[11px] font-medium text-slate-500">
                Critical / High priority
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {execMetrics.criticalOrHigh}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                Active high-priority items
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-emerald-900">
                  Closed (preserved)
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-800">
                {closedActionsAll.length}
              </div>
              <div className="mt-0.5 text-[11px] text-emerald-800/80">
                Moved to closed view · never deleted
              </div>
            </div>
          </div>

          {/* View Switcher & Filters */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setActionTab("PENDING")}
                  className={`rounded-md px-3 py-1.5 font-semibold transition cursor-pointer ${
                    actionTab === "PENDING"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Summary Sheet · Pending actions
                  <span className="ml-1.5 rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                    {pendingActionsAll.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActionTab("CLOSED")}
                  className={`rounded-md px-3 py-1.5 font-semibold transition cursor-pointer ${
                    actionTab === "CLOSED"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Closed actions
                  <span className="ml-1.5 rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                    {closedActionsAll.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActionTab("ALL")}
                  className={`rounded-md px-3 py-1.5 font-semibold transition cursor-pointer ${
                    actionTab === "ALL"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All actions / History
                  <span className="ml-1.5 rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                    {allActionsRaw.length}
                  </span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV ({displayedActions.length})
                </button>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New Action Item
                </button>
              </div>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-medium text-slate-600">
                  Search
                </label>
                <div className="relative mt-0.5">
                  <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Action, owner, code, remarks…"
                    className="w-full rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-2.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600">
                  Department
                </label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                >
                  <option value="ALL">All departments</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600">
                  Action Owner
                </label>
                <select
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                >
                  <option value="ALL">All owners</option>
                  {ownerOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                >
                  <option value="ALL">All statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Track">On Track</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Blocked">Blocked</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                >
                  <option value="ALL">All priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600">
                  VC Decision
                </label>
                <select
                  value={vcFilter}
                  onChange={(e) => setVcFilter(e.target.value)}
                  className="mt-0.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                >
                  <option value="ALL">All</option>
                  <option value="YES">Required (Yes)</option>
                  <option value="NO">Not required (No)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={redAlertOnly}
                    onChange={(e) => setRedAlertOnly(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-rose-600"
                  />
                  Overdue / Red Alert only
                </label>
                <span className="text-[11px] text-slate-500">
                  Showing{" "}
                  <strong className="text-slate-800">{displayedActions.length}</strong>{" "}
                  action{displayedActions.length === 1 ? "" : "s"} (Newly added &amp; Red Alerts on top)
                </span>
              </div>
            </div>
          </div>

          {/* Action Register Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs min-w-[1250px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-950 text-[11px] font-semibold uppercase tracking-wide text-white">
                    <th className="py-3.5 px-3.5 w-28">S.No. / Code</th>
                    <th className="py-3.5 px-3.5 w-28">Review Date</th>
                    <th className="py-3.5 px-3.5 w-36">Department</th>
                    <th className="py-3.5 px-3.5 min-w-[260px]">
                      Action Item &amp; Action Taken
                    </th>
                    <th className="py-3.5 px-3.5 w-44">Owner &amp; Support</th>
                    <th className="py-3.5 px-3.5 w-28">Priority &amp; Status</th>
                    <th className="py-3.5 px-3.5 w-32">Target &amp; Follow-up</th>
                    <th className="py-3.5 px-3.5 min-w-[310px]">
                      Progress / Updates (Latest on Top)
                    </th>
                    <th className="py-3.5 px-3.5 w-24 text-center">VC Decision</th>
                    <th className="py-3.5 px-3.5 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {displayedActions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        No action items match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    displayedActions.map((item: any, idx: number) => {
                      const isRedAlert =
                        item.is_red_alert ||
                        item.effective_rag === "RED" ||
                        item.rag_status === "RED" ||
                        String(item.priority || "").toUpperCase() === "CRITICAL";
                      const isNew = Number(item.id) > 15 && !item.is_hr_item;
                      const updates = Array.isArray(item.updates_list)
                        ? item.updates_list
                        : [];
                      const statusUpper = String(item.status || "Open").toUpperCase();
                      const isClosedRow =
                        statusUpper === "CLOSED" || statusUpper === "COMPLETED";

                      const actionTakenSummary =
                        item.closure_remarks ||
                        item.decision_action ||
                        item.remarks ||
                        "Action registered and under weekly tracking.";

                      return (
                        <tr
                          key={`${item.item_id}-${idx}`}
                          className={`align-top transition-colors ${
                            isRedAlert
                              ? "bg-[#D81B60]/[0.04] hover:bg-[#D81B60]/[0.08]"
                              : isNew
                                ? "bg-[#003B71]/[0.03] hover:bg-[#003B71]/[0.06]"
                                : "hover:bg-slate-50/90"
                          }`}
                        >
                          {/* S.No. 1, 2... + Code */}
                          <td className="py-3.5 px-3.5">
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#003B71]/10 text-[#003B71] font-mono font-black text-[11px] w-fit">
                                S.No. {idx + 1}
                              </span>
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                {item.item_id || `ACT-${idx + 1}`}
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

                          {/* Review Meeting Date */}
                          <td className="py-3.5 px-3.5 whitespace-nowrap">
                            <div className="font-medium text-slate-900">
                              {String(item.review_meeting_date || "2026-10-12").slice(0, 10)}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.review_frequency || "Weekly"}
                            </div>
                          </td>

                          {/* Department */}
                          <td className="py-3.5 px-3.5">
                            <Link
                              href={`/department/${item.department_id}`}
                              className="inline-flex items-center gap-1 font-bold text-[#003B71] hover:underline"
                            >
                              <span>{item.department_name}</span>
                              <ArrowUpRight className="w-3 h-3 shrink-0" />
                            </Link>
                            {item.category && (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {item.category}
                              </div>
                            )}
                          </td>

                          {/* Action Item / Deliverable + Action Taken */}
                          <td className="py-3.5 px-3.5">
                            <p className="font-semibold text-slate-900 leading-relaxed">
                              {item.action_point || item.deliverable}
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
                                Action Taken ({item.status || "Open"}):{" "}
                              </span>
                              <span>{actionTakenSummary}</span>
                            </div>
                          </td>

                          {/* Owner & Support */}
                          <td className="py-3.5 px-3.5">
                            <div className="font-bold text-slate-900">
                              {item.ownership || item.owner || "Unassigned"}
                            </div>
                            {item.supporting_departments && (
                              <div className="mt-1 text-[11px] text-slate-500">
                                <span className="font-semibold text-slate-700">
                                  Support:{" "}
                                </span>
                                {item.supporting_departments}
                              </div>
                            )}
                          </td>

                          {/* Priority & Status */}
                          <td className="py-3.5 px-3.5">
                            <div className="flex flex-col gap-1.5 items-start">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  String(item.priority).toUpperCase() === "CRITICAL"
                                    ? "bg-[#D81B60] text-white"
                                    : String(item.priority).toUpperCase() === "HIGH"
                                      ? "bg-[#F37021] text-white"
                                      : "bg-slate-200 text-slate-800"
                                }`}
                              >
                                {item.priority || "Medium"}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                  isClosedRow
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : isRedAlert
                                      ? "bg-[#D81B60]/10 text-[#D81B60] border-[#D81B60]/30"
                                      : "bg-[#003B71]/10 text-[#003B71] border-[#003B71]/25"
                                }`}
                              >
                                {item.status || "Open"}
                              </span>
                            </div>
                          </td>

                          {/* Target & Follow-up */}
                          <td className="py-3.5 px-3.5">
                            <div className="font-semibold text-slate-900">
                              {item.target_date || item.timeline || "Immediate"}
                            </div>
                            {item.next_followup_date && (
                              <div className="mt-1 text-[11px] text-[#003B71] font-medium">
                                Follow-up: {item.next_followup_date}
                              </div>
                            )}
                          </td>

                          {/* Progress / Updates (Datewise, Latest on Top) */}
                          <td className="py-3.5 px-3.5">
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
                          <td className="py-3.5 px-3.5 text-center">
                            {item.vc_decision_required === "Yes" ? (
                              <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-[#D81B60] text-white">
                                Yes
                              </span>
                            ) : (
                              <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                                No
                              </span>
                            )}
                          </td>

                          {/* Actions Column — Edit & History available for EVERY action */}
                          <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 shadow-2xs cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3 text-[#003B71]" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setHistoryAction(item)}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                                title="View full update history"
                              >
                                <History className="w-3 h-3 text-slate-500" />
                                ({updates.length})
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
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-PAGE 2: EXECUTIVE ACTION DASHBOARD (FROM RIASAT EXEC DASHBOARD) */}
      {/* =================================================================== */}
      {currentView === "executive_dashboard" && (
        <div className="space-y-6">
          {/* 8 KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="text-[11px] font-medium text-slate-500">
                Total Actions Logged
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {execMetrics.total}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                Active + closed across {departments.length} depts
              </div>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-3.5 shadow-2xs">
              <div className="text-[11px] font-medium text-sky-900">
                Open / In Progress
              </div>
              <div className="mt-1 text-2xl font-bold text-sky-900">
                {execMetrics.pending}
              </div>
              <div className="mt-0.5 text-[11px] text-sky-800/80">
                Active in summary sheet
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-2xs">
              <div className="text-[11px] font-medium text-emerald-900">
                Closed / Completed
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-800">
                {execMetrics.closed}
              </div>
              <div className="mt-0.5 text-[11px] text-emerald-800/80">
                Completion rate {execMetrics.completionRate}%
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 shadow-2xs">
              <div className="text-[11px] font-medium text-rose-900">
                Overdue / Red Alert
              </div>
              <div className="mt-1 text-2xl font-bold text-rose-700">
                {execMetrics.overdue}
              </div>
              <div className="mt-0.5 text-[11px] text-rose-800/80">
                Requires immediate attention
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-2xs">
              <div className="text-[11px] font-medium text-amber-900">
                Blocked / Delayed
              </div>
              <div className="mt-1 text-2xl font-bold text-amber-800">
                {execMetrics.blockedOrDelayed}
              </div>
              <div className="mt-0.5 text-[11px] text-amber-800/80">
                Needs intervention
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="text-[11px] font-medium text-slate-500">
                Critical &amp; High Priority
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {execMetrics.criticalOrHigh}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                Active high-priority items
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-2xs">
              <div className="text-[11px] font-medium text-amber-900">
                VC Decisions Required
              </div>
              <div className="mt-1 text-2xl font-bold text-amber-800">
                {execMetrics.vcRequired}
              </div>
              <div className="mt-0.5 text-[11px] text-amber-800/80">
                Pending escalation to VC
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
              <div className="text-[11px] font-medium text-slate-500">
                Avg Readiness
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {summary.avgReadiness || 48}%
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                Across 9 verticals
              </div>
            </div>
          </div>

          {/* Department-wise Summary Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Department-wise summary
                </h2>
                <p className="text-xs text-slate-500">
                  Click any department to open its register or filter the summary sheet.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Action
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    <th className="px-3 py-2.5">S.No.</th>
                    <th className="px-3 py-2.5">Department</th>
                    <th className="px-3 py-2.5 text-right">Total</th>
                    <th className="px-3 py-2.5 text-right">Pending</th>
                    <th className="px-3 py-2.5 text-right">In Progress</th>
                    <th className="px-3 py-2.5 text-right">Closed</th>
                    <th className="px-3 py-2.5 text-right">Overdue</th>
                    <th className="px-3 py-2.5 text-right">Blocked / Delayed</th>
                    <th className="px-3 py-2.5 text-right">Critical / High</th>
                    <th className="px-3 py-2.5 text-right">VC Decision</th>
                    <th className="px-3 py-2.5">Completion</th>
                    <th className="px-3 py-2.5 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {execMetrics.byDepartment.map((d: any) => (
                    <tr key={d.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-600">
                        S.No. {d.sno}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-900">
                        <Link
                          href={`/department/${d.id}`}
                          className="text-[#003B71] hover:underline"
                        >
                          {d.department}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                        {d.total}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-900">
                        {d.open}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-sky-700">
                        {d.inProgress}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-emerald-700">
                        {d.closed}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {d.overdue > 0 ? (
                          <span className="rounded bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-800">
                            {d.overdue}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {d.blocked > 0 ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">
                            {d.blocked}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                        {d.criticalOrHigh}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">
                        {d.vcRequired > 0 ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">
                            {d.vcRequired}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{ width: `${d.completionRate}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-slate-600">
                            {d.completionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setDeptFilter(String(d.id));
                              setView("actions");
                            }}
                            className="rounded border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100 cursor-pointer"
                          >
                            Filter Register
                          </button>
                          <Link
                            href={`/department/${d.id}`}
                            className="rounded border border-[#003B71]/30 bg-[#003B71]/5 px-2 py-0.5 text-[11px] font-semibold text-[#003B71] hover:bg-[#003B71]/10"
                          >
                            Open Dept
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3 Interactive SVG Donut Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Actions by priority
              </h3>
              <p className="text-[11px] text-slate-500">
                Active pending actions split by priority level
              </p>
              <SvgDonutChart
                data={execMetrics.priorityDonut}
                centerLabel="Pending"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Actions by status
              </h3>
              <p className="text-[11px] text-slate-500">
                All logged actions including closed items
              </p>
              <SvgDonutChart data={execMetrics.statusDonut} centerLabel="Total" />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Critical &amp; overdue by department
              </h3>
              <p className="text-[11px] text-slate-500">
                Departments with overdue or critical actions
              </p>
              <SvgDonutChart
                data={execMetrics.overdueByDeptDonut}
                centerLabel="Alert"
              />
            </div>
          </div>

          {/* Overdue & Risk Table + VC Decisions Required */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Overdue and at-risk actions ({execMetrics.attentionList.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Actions that are overdue, blocked, delayed or critical priority.
                </p>
              </div>
              <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
                {execMetrics.attentionList.map((a: any, idx: number) => (
                  <div
                    key={a.id || idx}
                    className="p-3.5 text-xs hover:bg-slate-50/70 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono font-bold text-[#003B71]">
                          S.No. {idx + 1} ({a.item_id})
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">
                          {a.department_name}
                        </span>
                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
                          {a.priority || "High"}
                        </span>
                      </div>
                      <p className="mt-1 font-medium text-slate-900">
                        {a.action_point || a.deliverable}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Owner: {a.ownership || a.owner} · Target:{" "}
                        {a.target_date || a.timeline}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditModal(a)}
                      className="shrink-0 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-white shadow-2xs">
              <div className="border-b border-amber-200 bg-amber-50/60 px-4 py-3">
                <h2 className="text-sm font-semibold text-amber-950">
                  Vice Chairman decisions required ({execMetrics.vcDecisionList.length})
                </h2>
                <p className="text-xs text-amber-900/80">
                  Open actions flagged for Vice Chairman review or decision.
                </p>
              </div>
              <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
                {execMetrics.vcDecisionList.map((a: any, idx: number) => (
                  <div
                    key={a.id || idx}
                    className="p-3.5 text-xs hover:bg-amber-50/30 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">
                          S.No. {idx + 1} ({a.item_id})
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">
                          {a.department_name}
                        </span>
                      </div>
                      <p className="mt-1 font-medium text-slate-900">
                        {a.action_point || a.deliverable}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-600">
                        Action Taken / Note: {a.decision_action || a.remarks}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditModal(a)}
                      className="shrink-0 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Record / Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-PAGE 3: 9 STRATEGIC VERTICALS READINESS                         */}
      {/* =================================================================== */}
      {currentView === "verticals" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-950">
                9 Strategic Verticals — Operational Readiness &amp; Registers
              </h2>
              <p className="text-xs text-slate-500">
                Click any vertical card to open its dedicated Department Action Register &amp; Unified Form
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {departments.map((d: any, idx: number) => {
              const rag = String(d.rag_status || "AMBER").toUpperCase();
              const badgeStyle =
                rag === "RED"
                  ? "bg-[#D81B60] text-white"
                  : rag === "AMBER"
                    ? "bg-[#F37021] text-white"
                    : "bg-[#003B71] text-white";

              return (
                <Link
                  key={d.id}
                  href={`/department/${d.id}`}
                  className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-[#003B71]/40 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                          S.No. {idx + 1} &bull; {d.code}
                        </span>
                        <h3 className="text-base font-black text-slate-950 group-hover:text-[#003B71] transition">
                          {d.name}
                        </h3>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${badgeStyle}`}
                      >
                        {rag}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-4 min-h-[2.25rem]">
                      {d.key_focus ||
                        "Active operational execution and milestone tracking."}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-600">Readiness</span>
                        <span className="font-black text-[#003B71]">
                          {d.readiness_percentage || 0}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021]"
                          style={{ width: `${d.readiness_percentage || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">
                          Pending
                        </div>
                        <div className="text-sm font-black text-[#003B71]">
                          {(d.workstream_stats?.total || 0) -
                            (d.workstream_stats?.completed || 0)}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">
                          Closed
                        </div>
                        <div className="text-sm font-black text-slate-900">
                          {d.workstream_stats?.completed || 0}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">
                          Delayed
                        </div>
                        <div className="text-sm font-black text-[#D81B60]">
                          {d.workstream_stats?.delayed || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-PAGE 4: DIRECTIVES & RAG ANALYTICS                              */}
      {/* =================================================================== */}
      {currentView === "analytics_directives" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col">
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider mb-1">
              Pending Directives RAG Split
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Distribution of active pending items by RAG health
            </p>
            <SvgDonutChart
              data={ragDistributionData.map((r) => ({
                label: r.name,
                value: r.value,
                color: r.color,
              }))}
              centerLabel="Pending"
            />
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col">
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider mb-1">
              Vertical-Wise Pending vs Red Alerts vs Closed
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Comparative operational workload across all 9 verticals
            </p>
            <div className="space-y-3">
              {verticalDirectivesChart.map((v: any, idx: number) => {
                const maxVal = Math.max(
                  1,
                  (v.Pending || 0) + (v.Closed || 0)
                );
                const pendingPct = Math.round(((v.Pending || 0) / maxVal) * 100);
                const closedPct = Math.round(((v.Closed || 0) / maxVal) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        S.No. {idx + 1} &bull; {v.fullName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-600">
                        Pending: <strong className="text-[#003B71]">{v.Pending}</strong>{" "}
                        | Red Alerts:{" "}
                        <strong className="text-[#D81B60]">{v["Red Alerts"]}</strong>{" "}
                        | Closed:{" "}
                        <strong className="text-[#F37021]">{v.Closed}</strong>
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                      <div
                        className="h-full bg-[#003B71]"
                        style={{ width: `${pendingPct}%` }}
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
      {/* SUB-PAGE 5: READINESS BENCHMARK                                     */}
      {/* =================================================================== */}
      {currentView === "analytics_readiness" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-black text-slate-950">
              Vertical Operational Readiness Benchmark (%)
            </h3>
            <p className="text-xs text-slate-500">
              Readiness index across all 9 RIASAT verticals
            </p>
          </div>
          <div className="space-y-3.5">
            {verticalDirectivesChart.map((v: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    S.No. {idx + 1} &bull; {v.fullName}
                  </span>
                  <span className="font-mono font-black text-[#003B71]">
                    {v.Readiness}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021]"
                    style={{ width: `${v.Readiness}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-PAGE 6: CAPEX & REVENUE PIPELINE                                */}
      {/* =================================================================== */}
      {currentView === "analytics_financials" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-950">
                Capex Allocation vs Revenue Pipeline (₹ Cr)
              </h3>
              <p className="text-xs text-slate-500">
                Financial outlay and projected commercial pipeline across 9 verticals
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-[#003B71]/10 border border-[#003B71]/20">
                <div className="text-[10px] font-bold uppercase text-[#003B71]">
                  Total Capex
                </div>
                <div className="text-sm font-black text-slate-950">
                  ₹ {summary.totalCapex || 0} Cr
                </div>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-[#D81B60]/10 border border-[#D81B60]/20">
                <div className="text-[10px] font-bold uppercase text-[#D81B60]">
                  Revenue Pipeline
                </div>
                <div className="text-sm font-black text-slate-950">
                  ₹ {summary.totalRevenue || 0} Cr
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-white text-[11px] font-black uppercase tracking-wider">
                  <th className="py-3 px-4">S.No.</th>
                  <th className="py-3 px-4">Vertical</th>
                  <th className="py-3 px-4 text-right">Capex (₹ Cr)</th>
                  <th className="py-3 px-4 text-right">Revenue Pipeline (₹ Cr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {financialChartData.map((f: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">
                      S.No. {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {f.fullName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#003B71]">
                      ₹ {f.Capex} Cr
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#D81B60]">
                      ₹ {f.Revenue} Cr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SHARED EDIT / ADD ACTION MODAL (EXACT IMAGE 1 MATCH)                */}
      {/* =================================================================== */}
      <ActionFormModal
        open={modalOpen}
        mode={modalMode}
        action={editingAction}
        departments={departments}
        currentUserName={currentUser?.name || "Executive Secretariat"}
        nextCodePreview={nextCodePreview}
        onClose={() => setModalOpen(false)}
        onSaved={() => router.refresh()}
      />

      <ActionHistorySheet
        action={historyAction}
        onClose={() => setHistoryAction(null)}
        onEdit={(act) => openEditModal(act)}
      />
    </div>
  );
}
