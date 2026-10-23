"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  User,
  Building,
  RefreshCw,
  Download,
  Printer,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Database,
  Upload,
} from "lucide-react";

export default function ReportsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Department Matrix Filters
  const [matrixRagFilter, setMatrixRagFilter] = useState<string>("ALL");
  const [matrixTierFilter, setMatrixTierFilter] = useState<string>("ALL");
  const [matrixSearch, setMatrixSearch] = useState<string>("");

  // Audit Log Filters
  const [logActionFilter, setLogActionFilter] = useState<string>("ALL");
  const [logDeptFilter, setLogDeptFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Database Backup & Import state
  const [importingDb, setImportingDb] = useState(false);
  const [exportingDb, setExportingDb] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logsRes, deptsRes] = await Promise.all([
        fetch("/api/audit-log?limit=150"),
        fetch("/api/departments"),
      ]);

      if (logsRes.ok) {
        const lData = await logsRes.json();
        setLogs(lData.logs || []);
      }

      if (deptsRes.ok) {
        const dData = await deptsRes.json();
        setDepartments(dData.departments || []);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Department Matrix
  const filteredDepartments = departments.filter((d) => {
    if (matrixRagFilter !== "ALL" && d.rag_status?.toUpperCase() !== matrixRagFilter.toUpperCase()) {
      return false;
    }
    if (matrixTierFilter === "TARGET" && (d.readiness_percentage || 0) < 75) {
      return false;
    }
    if (matrixTierFilter === "ATTENTION" && (d.readiness_percentage || 0) >= 75) {
      return false;
    }
    if (matrixSearch.trim()) {
      const q = matrixSearch.toLowerCase();
      const matchName = d.name && d.name.toLowerCase().includes(q);
      const matchFocus = d.key_focus && d.key_focus.toLowerCase().includes(q);
      if (!matchName && !matchFocus) return false;
    }
    return true;
  });

  // Filtered Audit Logs
  const filteredLogs = logs.filter((log) => {
    if (logActionFilter !== "ALL" && !log.action?.toUpperCase().includes(logActionFilter.toUpperCase())) {
      return false;
    }
    if (logDeptFilter !== "ALL") {
      const deptName = (log.department_name || log.department_name_full || "").toLowerCase();
      if (!deptName.includes(logDeptFilter.toLowerCase())) {
        return false;
      }
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        (log.user_name && log.user_name.toLowerCase().includes(q)) ||
        (log.department_name && log.department_name.toLowerCase().includes(q)) ||
        (log.details && log.details.toLowerCase().includes(q)) ||
        (log.action && log.action.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const exportCsv = () => {
    const headers = ["Timestamp", "User", "Department", "Action", "Details"];
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.timestamp).toLocaleString("en-IN")}"`,
      `"${l.user_name || "System"}"`,
      `"${l.department_name || "General"}"`,
      `"${l.action}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RIASAT_Audit_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDatabase = async () => {
    try {
      setExportingDb(true);
      setImportMsg(null);
      setImportError(null);

      const res = await fetch("/api/database/export");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to export database");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RIASAT_Database_Backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setImportMsg("Database backup exported successfully.");
      setTimeout(() => setImportMsg(null), 4000);
    } catch (err: any) {
      setImportError(err.message || "Export failed");
      setTimeout(() => setImportError(null), 5000);
    } finally {
      setExportingDb(false);
    }
  };

  const handleImportDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`Are you sure you want to import "${file.name}" into the database? Existing records will be updated and new records inserted.`)) {
      e.target.value = "";
      return;
    }

    try {
      setImportingDb(true);
      setImportMsg(null);
      setImportError(null);

      const text = await file.text();
      let jsonPayload;
      try {
        jsonPayload = JSON.parse(text);
      } catch {
        throw new Error("Invalid file format: Please select a valid JSON backup file.");
      }

      const res = await fetch("/api/database/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import database");
      }

      setImportMsg(data.message || "Database imported successfully!");
      setTimeout(() => setImportMsg(null), 6000);
      fetchData();
    } catch (err: any) {
      setImportError(err.message || "Import failed");
      setTimeout(() => setImportError(null), 6000);
    } finally {
      setImportingDb(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Institutional Reports & Audit Trail
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            System audit logs, verifiable compliance timeline, and database backup & import controls
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportDatabase}
            disabled={exportingDb}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-xs transition disabled:opacity-50"
            title="Download complete database backup JSON"
          >
            {exportingDb ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            <span>Export Database</span>
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Import / Export Notification Banners */}
      {importMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{importMsg}</span>
        </div>
      )}
      {importError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: CONSOLIDATED DEPARTMENT MATRIX WITH FILTER BUTTONS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Consolidated Departmental Status Matrix ({filteredDepartments.length})
            </h2>
            <p className="text-xs text-slate-500">
              Current readiness ratings and activity health across all domains
            </p>
          </div>
        </div>

        {/* MATRIX FILTER BUTTONS */}
        <div className="px-6 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> RAG Health:
              </span>
              {[
                { id: "ALL", label: `All Verticals (${departments.length})` },
                { id: "GREEN", label: "Green" },
                { id: "AMBER", label: "Amber" },
                { id: "RED", label: "Red" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMatrixRagFilter(item.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    matrixRagFilter === item.id
                      ? item.id === "GREEN"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : item.id === "AMBER"
                        ? "bg-amber-600 text-white shadow-xs"
                        : item.id === "RED"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <span className="text-slate-300 mx-1">|</span>

              {/* Readiness Tier Filter */}
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
                Readiness:
              </span>
              {[
                { id: "ALL", label: "All" },
                { id: "TARGET", label: "≥ 75% Target" },
                { id: "ATTENTION", label: "< 75% Needs Acceleration" },
              ].map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setMatrixTierFilter(tier.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    matrixTierFilter === tier.id
                      ? "bg-slate-800 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>

            {/* Matrix Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search domain or focus..."
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-slate-200">
          <table className="w-full text-left text-xs table-fixed border-collapse">
            <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="w-[17%] px-3 py-2.5">Department</th>
                <th className="w-[10%] px-2.5 py-2.5">Readiness %</th>
                <th className="w-[11%] px-2.5 py-2.5">RAG Status</th>
                <th className="w-[28%] px-3 py-2.5">Key Strategic Focus</th>
                <th className="w-[8%] px-2 py-2.5 text-center">Open Items</th>
                <th className="w-[8%] px-2 py-2.5 text-center">Completed</th>
                <th className="w-[9%] px-2.5 py-2.5">Last Updated</th>
                <th className="w-[9%] px-2.5 py-2.5">Updated By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No departments match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-3 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                      {d.name}
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap">
                      <span className="font-bold text-slate-800">{d.readiness_percentage}%</span>
                    </td>
                    <td className="px-2.5 py-2.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                          d.rag_status === "GREEN"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : d.rag_status === "AMBER"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : d.rag_status === "RED"
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        {d.rag_status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 break-words leading-tight text-[11px]">
                      {d.key_focus || "--"}
                    </td>
                    <td className="px-2 py-2.5 font-semibold text-slate-700 text-center whitespace-nowrap">
                      {d.stats?.open || 0}
                    </td>
                    <td className="px-2 py-2.5 font-semibold text-emerald-700 text-center whitespace-nowrap">
                      {d.stats?.completed || 0}
                    </td>
                    <td className="px-2.5 py-2.5 text-slate-500 whitespace-nowrap text-[11px]">
                      {d.last_updated ? new Date(d.last_updated).toLocaleDateString("en-IN") : "--"}
                    </td>
                    <td className="px-2.5 py-2.5 text-slate-600 whitespace-nowrap font-medium text-[11px]">
                      {d.updated_by || "--"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: AUDIT TRAIL LOG WITH FILTER BUTTONS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>System Audit Trail ({filteredLogs.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Immutable ledger of all user logins, department modifications, and status transitions
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* AUDIT LOG FILTER BUTTONS */}
        <div className="px-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Action:
            </span>
            {[
              { id: "ALL", label: `All Actions (${logs.length})` },
              { id: "LOGIN", label: "Login" },
              { id: "UPDATE", label: "Update" },
              { id: "CREATE", label: "Create" },
              { id: "DELETE", label: "Delete" },
            ].map((act) => (
              <button
                key={act.id}
                onClick={() => setLogActionFilter(act.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  logActionFilter === act.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {act.label}
              </button>
            ))}

            <span className="text-slate-300 mx-1">|</span>

            {/* Department Filter for Audit */}
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
              Domain:
            </span>
            <button
              onClick={() => setLogDeptFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                logDeptFilter === "ALL"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Domains
            </button>
            {departments.slice(0, 5).map((d) => (
              <button
                key={d.id}
                onClick={() => setLogDeptFilter(d.name)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition ${
                  logDeptFilter === d.name
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border-t border-slate-200">
          <table className="w-full text-left text-xs table-fixed border-collapse">
            <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="w-[18%] px-3 py-2.5">Timestamp</th>
                <th className="w-[15%] px-3 py-2.5">User</th>
                <th className="w-[15%] px-3 py-2.5">Department</th>
                <th className="w-[14%] px-3 py-2.5">Action</th>
                <th className="w-[38%] px-3 py-2.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                      {log.user_name || "System"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap font-medium">
                      {log.department_name || log.department_name_full || "--"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-slate-100 text-slate-700 border">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 max-w-md">
                      {log.details || "--"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
