"use client";

import React, { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  Download,
  History,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Calendar,
  Flame,
} from "lucide-react";
import { getActionUpdatesDatewise, isRedAlertItem } from "@/lib/action-helpers";

export default function ReportsAndAuditPage() {
  const [activeTab, setActiveTab] = useState<"workstreams" | "recruitment" | "audit">("workstreams");
  const [loading, setLoading] = useState(true);

  const [workstreams, setWorkstreams] = useState<any[]>([]);
  const [recruitment, setRecruitment] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [vcFilter, setVcFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [wsRes, recRes, auditRes, deptRes] = await Promise.all([
        fetch("/api/workstreams", { cache: "no-store" }),
        fetch("/api/recruitment", { cache: "no-store" }),
        fetch("/api/audit?limit=100", { cache: "no-store" }),
        fetch("/api/departments", { cache: "no-store" }),
      ]);

      if (wsRes.ok) {
        const wsData = await wsRes.json();
        setWorkstreams(wsData.workstreams || []);
      }
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecruitment(recData.recruitment || []);
      }
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.logs || []);
      }
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData.departments || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredWorkstreams = workstreams.filter((w) => {
    if (deptFilter !== "ALL" && w.department_id?.toString() !== deptFilter) return false;
    if (statusFilter !== "ALL" && String(w.status || "").toUpperCase() !== statusFilter.toUpperCase())
      return false;
    if (
      vcFilter &&
      !(w.vc_decision_required === "Yes" || (w.decision_action && w.decision_action.trim().length > 0))
    )
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        w.deliverable?.toLowerCase().includes(q) ||
        w.action_point?.toLowerCase().includes(q) ||
        w.owner?.toLowerCase().includes(q) ||
        w.department_name?.toLowerCase().includes(q) ||
        w.item_id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredRecruitment = recruitment.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (vcFilter && !r.vc_attention) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.position_title?.toLowerCase().includes(q) ||
        r.strategic_segment?.toLowerCase().includes(q) ||
        r.hiring_lead?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredAudit = auditLogs.filter((a) => {
    if (deptFilter !== "ALL" && a.department_id?.toString() !== deptFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.user_name?.toLowerCase().includes(q) ||
        a.action?.toLowerCase().includes(q) ||
        a.details?.toLowerCase().includes(q) ||
        a.department_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Reliable Blob-based Export CSV
  const exportToCSV = () => {
    const escapeCsv = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    let headers: string[] = [];
    let rows: string[] = [];
    let filename = "";

    if (activeTab === "workstreams") {
      headers = [
        "Action ID",
        "Vertical",
        "Supporting Depts",
        "Action Item / Deliverable",
        "Owner",
        "Target Timeline",
        "Priority",
        "Status",
        "RAG Alert",
        "VC Decision Required",
        "Progress / Updates (Datewise • Latest on Top)",
      ];
      rows = filteredWorkstreams.map((w) => {
        const updates = getActionUpdatesDatewise(w);
        const formattedUpdates = updates
          .map((u) => `[${u.formattedDate}] ${u.text}`)
          .join(" | ");
        return [
          w.item_id || `ACT-${w.id}`,
          w.department_name,
          w.supporting_departments || "None",
          w.action_point || w.deliverable,
          w.ownership || w.owner,
          w.timeline || w.target_date,
          w.priority || "Medium",
          w.status,
          w.effective_rag || w.rag_status || "GREEN",
          w.vc_decision_required || "No",
          formattedUpdates || w.remarks || "",
        ]
          .map(escapeCsv)
          .join(",");
      });
      filename = `RIASAT_Action_Register_Report_${new Date().toISOString().split("T")[0]}.csv`;
    } else if (activeTab === "recruitment") {
      headers = [
        "ID",
        "Position Title",
        "Strategic Segment",
        "Priority",
        "Status",
        "Target Date",
        "Hiring Lead",
        "VC Attention",
        "Next Action",
      ];
      rows = filteredRecruitment.map((r) =>
        [
          r.id,
          r.position_title,
          r.strategic_segment,
          r.priority,
          r.status,
          r.target_date,
          r.hiring_lead,
          r.vc_attention ? "Yes" : "No",
          r.next_action || r.remarks || "",
        ]
          .map(escapeCsv)
          .join(",")
      );
      filename = `RIASAT_Recruitment_Report_${new Date().toISOString().split("T")[0]}.csv`;
    } else {
      headers = ["Timestamp", "User", "Action", "Department", "Details"];
      rows = filteredAudit.map((a) =>
        [a.timestamp, a.user_name, a.action, a.department_name || "Global", a.details]
          .map(escapeCsv)
          .join(",")
      );
      filename = `RIASAT_Audit_Log_${new Date().toISOString().split("T")[0]}.csv`;
    }

    const csvContent = "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
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

  return (
    <div className="space-y-6 pb-8">
      {/* Top Brand Header Banner */}
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
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#003B71] text-white">
                  Master Reports &amp; Exports
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight truncate">
                RIASAT Cross-Vertical Reports &amp; Audit Trail
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white text-xs font-black uppercase tracking-wider shadow-xs hover:opacity-95 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-[#003B71] ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Dedicated Sub-Pages Switcher */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            {
              id: "workstreams" as const,
              label: `All Action Directives (${workstreams.length})`,
              icon: FileSpreadsheet,
            },
            {
              id: "recruitment" as const,
              label: `HR Recruitment Pipeline (${recruitment.length})`,
              icon: Clock,
            },
            {
              id: "audit" as const,
              label: `Supabase Audit Trail (${auditLogs.length})`,
              icon: History,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setStatusFilter("ALL");
                }}
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

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actions, owners, verticals, audit logs..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200"
          />
        </div>

        {activeTab !== "recruitment" && (
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white"
          >
            <option value="ALL">All 9 Verticals</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id.toString()}>
                {d.name}
              </option>
            ))}
          </select>
        )}

        {activeTab !== "audit" && (
          <label className="inline-flex items-center gap-2 text-xs font-bold text-[#D81B60] cursor-pointer px-3 py-2 rounded-xl bg-[#D81B60]/5 border border-[#D81B60]/20">
            <input
              type="checkbox"
              checked={vcFilter}
              onChange={(e) => setVcFilter(e.target.checked)}
              className="rounded"
            />
            <span>VC Alerts Only</span>
          </label>
        )}
      </div>

      {/* Main Content Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {activeTab === "workstreams" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1100px]">
              <thead className="bg-slate-950 text-white text-[11px] font-black uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-[105px]">ID &amp; Alert</th>
                  <th className="py-3.5 px-4 w-[160px]">Vertical</th>
                  <th className="py-3.5 px-4 w-[260px]">Action Item / Deliverable</th>
                  <th className="py-3.5 px-4 w-[140px]">Owner &amp; Target</th>
                  <th className="py-3.5 px-4 w-[110px] text-center">Status</th>
                  <th className="py-3.5 px-4 min-w-[330px]">
                    Progress / Updates (Datewise • Latest on Top)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {filteredWorkstreams.map((w) => {
                  const isRed = isRedAlertItem(w);
                  const updates = getActionUpdatesDatewise(w);
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/90 align-top">
                      <td className="py-4 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                            {w.item_id || `ACT-${w.id}`}
                          </span>
                          {isRed && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#D81B60] text-white">
                              <Flame className="w-3 h-3" /> RED ALERT
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-black text-[#003B71]">{w.department_name}</td>
                      <td className="py-4 px-4 font-bold text-slate-900 leading-relaxed">
                        {w.action_point || w.deliverable}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{w.ownership || w.owner}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {w.timeline || w.target_date}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-[#003B71]/10 text-[#003B71]">
                          {w.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          {updates.slice(0, 5).map((u, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded-xl border text-xs ${
                                idx === 0
                                  ? "bg-[#003B71]/5 border-[#003B71]/25 text-slate-900"
                                  : "bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[9px] font-black">
                                  {u.formattedDate}
                                </span>
                                {idx === 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#003B71] text-white text-[9px] font-black">
                                    LATEST
                                  </span>
                                )}
                              </div>
                              <p className="font-medium">{u.text}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "recruitment" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="bg-slate-950 text-white text-[11px] font-black uppercase">
                <tr>
                  <th className="py-3.5 px-4">Position Title</th>
                  <th className="py-3.5 px-4">Segment</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Target Date</th>
                  <th className="py-3.5 px-4">Hiring Lead</th>
                  <th className="py-3.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {filteredRecruitment.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{r.position_title}</td>
                    <td className="py-3.5 px-4 text-slate-700">{r.strategic_segment}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#D81B60]/10 text-[#D81B60]">
                        {r.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#003B71]">{r.status}</td>
                    <td className="py-3.5 px-4 font-mono">{r.target_date}</td>
                    <td className="py-3.5 px-4">{r.hiring_lead}</td>
                    <td className="py-3.5 px-4 text-slate-600">{r.next_action || r.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="bg-slate-950 text-white text-[11px] font-black uppercase">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {filteredAudit.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {new Date(a.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{a.user_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#003B71]/10 text-[#003B71]">
                        {a.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {a.department_name || "Global"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{a.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
