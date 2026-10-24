"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { ActionFormModal, ActionHistorySheet } from "@/components/ActionFormModal";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [workstreams, setWorkstreams] = useState<any[]>([]);
  const [recruitment, setRecruitment] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedRag, setSelectedRag] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Shared Edit / Add Action Modal (Image 1)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("edit");
  const [editingAction, setEditingAction] = useState<any | null>(null);
  const [historyAction, setHistoryAction] = useState<any | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [execRes, wsRes, recRes] = await Promise.all([
        fetch("/api/executive", { cache: "no-store" }),
        fetch("/api/workstreams", { cache: "no-store" }),
        fetch("/api/recruitment", { cache: "no-store" }),
      ]);

      const execData = await execRes.json();
      const wsData = await wsRes.json();
      const recData = await recRes.json();

      setSummary(execData.summary || {});
      setDepartments(execData.departments || []);
      setWorkstreams(wsData.workstreams || []);
      setRecruitment(recData.positions || []);
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Unify all workstreams + any recruitment records into identical Action Item rows
  // so HR & Recruitment (#7) and all other 8 departments generate the exact same report format
  const unifiedWorkstreams = React.useMemo(() => {
    const wsMapped = (workstreams || []).map((w: any) => ({
      ...w,
      is_hr_item: false,
    }));

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
        department_id: 7,
        department_name: "HR & Recruitment",
        department_code: "HR_REC",
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
  }, [workstreams, recruitment]);

  const filteredDepartments = departments.filter((d) => {
    if (selectedDept !== "ALL" && d.id.toString() !== selectedDept) return false;
    if (selectedRag !== "ALL" && d.rag_status !== selectedRag) return false;
    return true;
  });

  const filteredWorkstreams = unifiedWorkstreams.filter((w) => {
    if (selectedDept !== "ALL" && w.department_id.toString() !== selectedDept)
      return false;
    if (selectedStatus !== "ALL" && w.status !== selectedStatus) return false;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const escapeCsvCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, " | ");
    return `"${str}"`;
  };

  const downloadCsvFile = (filename: string, rows: any[][]) => {
    const csvContent =
      "\uFEFF" + rows.map((r) => r.map(escapeCsvCell).join(",")).join("\r\n");
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
      "S.No.",
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
        `S.No. ${idx + 1}`,
        w.item_id || `ACT-${idx + 1}`,
        String(w.review_meeting_date || "2026-10-12").slice(0, 10),
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
            Compiling Unified Departmental Reports...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner */}
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
              <div className="flex items-center gap-2 mb-1">
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
                Standardised report output across all 9 departments (including HR &amp; Recruitment) with inline Edit Action support
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
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#003B71] text-white text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Action
            </button>
            <button
              type="button"
              onClick={handleExportUnifiedCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Unified CSV ({filteredWorkstreams.length})
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mr-2">
            <Filter className="w-4 h-4 text-[#003B71]" />
            Report Filters:
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All 9 Verticals (Unified)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id.toString()}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedRag}
            onChange={(e) => setSelectedRag(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All RAG Statuses</option>
            <option value="GREEN">GREEN (On Track)</option>
            <option value="AMBER">AMBER (Needs Attention)</option>
            <option value="RED">RED (Critical Alert)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Action Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="On Track">On Track</option>
            <option value="Delayed">Delayed</option>
            <option value="Blocked">Blocked</option>
            <option value="Completed">Completed</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Verticals in Report
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {filteredDepartments.length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Avg Readiness
          </div>
          <div className="text-2xl font-black text-[#003B71] mt-1">
            {summary?.avgReadiness || 0}%
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Total Actions in Report
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {filteredWorkstreams.length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">
            Total Capex / Pipeline
          </div>
          <div className="text-lg font-black text-emerald-700 mt-1">
            ₹ {summary?.totalCapex || 0} Cr / ₹ {summary?.totalRevenue || 0} Cr
          </div>
        </div>
      </div>

      {/* Department-by-Department Unified Reports (All 9 Verticals have identical format) */}
      <div className="space-y-6">
        {filteredDepartments.map((dept, deptIdx) => {
          const deptItems = filteredWorkstreams.filter(
            (w) => Number(w.department_id) === Number(dept.id)
          );
          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
            >
              <div className="px-6 py-4 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-[#003B71] text-white font-mono text-xs font-black">
                    S.No. {deptIdx + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {dept.name} ({dept.code})
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {dept.key_focus || "Strategic Vertical Action Register"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">
                      Readiness
                    </div>
                    <div className="text-base font-black text-[#F37021]">
                      {dept.readiness_percentage}%
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-white/10 text-white">
                    {dept.rag_status}
                  </span>
                </div>
              </div>

              <div className="p-5 overflow-x-auto">
                {deptItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">
                    No action items match the selected filter for this vertical.
                  </p>
                ) : (
                  <table className="w-full text-left border-collapse text-xs min-w-[1050px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-24">S.No.</th>
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
                          <tr key={`${w.item_id}-${idx}`} className="hover:bg-slate-50/80 align-top">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#003B71]">
                              S.No. {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {w.item_id || `ACT-${idx + 1}`}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              <div>
                                {String(w.review_meeting_date || "2026-10-12").slice(0, 10)}
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
                                {w.ownership || w.owner}
                              </div>
                              {w.supporting_departments && (
                                <div className="text-[10px] text-slate-500 mt-0.5">
                                  Support: {w.supporting_departments}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-col gap-1 items-start">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                                  {w.priority || "Medium"}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#003B71]/10 text-[#003B71]">
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
                                    {String(latestUpdate.date || "").slice(0, 10)} ·{" "}
                                    {latestUpdate.user}
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

      {/* Shared Edit / Create Action Modal (Exact Image 1 Match) */}
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
