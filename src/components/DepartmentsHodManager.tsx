"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  UserCheck,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
} from "lucide-react";

export interface DepartmentHodRecord {
  id: number;
  name: string;
  code: string;
  display_order?: number;
  active?: boolean;
  head_of_department?: string;
  readiness_percentage?: number;
  readiness?: number;
  rag_status?: string;
  rag?: string;
  key_focus?: string;
  total_actions?: number;
  open_actions?: number;
  last_updated?: string;
}

interface DepartmentsHodManagerProps {
  initialDepartments?: DepartmentHodRecord[];
  onChanged?: () => void;
  compactHeader?: boolean;
}

const SUGGESTED_HODS = [
  "To be hired",
  "Ms. Anamika Sahay",
  "Ms. Vinila Kalive",
  "Mr. Avinash Ghodgaonkar",
  "Ms. Sarojini Mangalam",
  "Mr. Venkatesh Valluri",
];

export default function DepartmentsHodManager({
  initialDepartments,
  onChanged,
  compactHeader = false,
}: DepartmentsHodManagerProps) {
  const [departments, setDepartments] = useState<DepartmentHodRecord[]>(initialDepartments || []);
  const [loading, setLoading] = useState<boolean>(!initialDepartments || initialDepartments.length === 0);
  const [searchQuery, setSearchQuery] = useState("");
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptHod, setNewDeptHod] = useState("To be hired");
  const [newDeptOrder, setNewDeptOrder] = useState<number>(12);
  const [adding, setAdding] = useState(false);

  // Edit Modal state
  const [editingDept, setEditingDept] = useState<DepartmentHodRecord | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editHod, setEditHod] = useState("");
  const [editOrder, setEditOrder] = useState<number>(1);
  const [editReadiness, setEditReadiness] = useState<number>(0);
  const [editRag, setEditRag] = useState<string>("NOT STARTED");
  const [editFocus, setEditFocus] = useState<string>("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Inline quick HOD edit state
  const [inlineHodId, setInlineHodId] = useState<number | null>(null);
  const [inlineHodValue, setInlineHodValue] = useState<string>("");
  const [inlineDeptNameValue, setInlineDeptNameValue] = useState<string>("");
  const [savingInlineId, setSavingInlineId] = useState<number | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/departments", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.departments || [];
        setDepartments(list);
        setNewDeptOrder(list.length + 1);
      }
    } catch (e) {
      console.error("Failed to fetch departments:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const showMessage = (type: "success" | "error", text: string) => {
    setBanner({ type, text });
    setTimeout(() => {
      setBanner((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  };

  const handleOpenEdit = (dept: DepartmentHodRecord) => {
    setEditingDept(dept);
    setEditName(dept.name || "");
    setEditCode(dept.code || "");
    setEditHod(dept.head_of_department || "To be hired");
    setEditOrder(dept.display_order || dept.id || 1);
    setEditReadiness(Number(dept.readiness_percentage ?? dept.readiness ?? 0));
    setEditRag(dept.rag_status || dept.rag || "NOT STARTED");
    setEditFocus(dept.key_focus || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    if (!editName.trim()) {
      showMessage("error", "Department name is required.");
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/departments/${editingDept.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          code: editCode.trim().toUpperCase().replace(/\s+/g, "_"),
          head_of_department: editHod.trim() || "To be hired",
          display_order: Number(editOrder) || editingDept.display_order || 1,
          readiness_percentage: Number(editReadiness) || 0,
          rag_status: editRag,
          key_focus: editFocus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update department");
      }
      showMessage(
        "success",
        `Updated "${editName.trim()}" — Head of Department saved as "${editHod.trim() || "To be hired"}".`
      );
      setEditingDept(null);
      await fetchDepartments();
      if (onChanged) onChanged();
    } catch (err: any) {
      showMessage("error", err.message || "Error updating department.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleStartInlineEdit = (dept: DepartmentHodRecord) => {
    setInlineHodId(dept.id);
    setInlineDeptNameValue(dept.name || "");
    setInlineHodValue(dept.head_of_department || "To be hired");
  };

  const handleSaveInlineEdit = async (dept: DepartmentHodRecord) => {
    if (!inlineDeptNameValue.trim()) {
      showMessage("error", "Department Name cannot be empty.");
      return;
    }
    setSavingInlineId(dept.id);
    try {
      const res = await fetch(`/api/departments/${dept.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inlineDeptNameValue.trim(),
          code: dept.code,
          head_of_department: inlineHodValue.trim() || "To be hired",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save changes");
      }
      showMessage(
        "success",
        `Saved "${inlineDeptNameValue.trim()}" (HOD: ${inlineHodValue.trim() || "To be hired"}).`
      );
      setInlineHodId(null);
      await fetchDepartments();
      if (onChanged) onChanged();
    } catch (err: any) {
      showMessage("error", err.message || "Error saving inline edit");
    } finally {
      setSavingInlineId(null);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) {
      showMessage("error", "Department name is required.");
      return;
    }
    const autoCode =
      newDeptCode.trim() ||
      newDeptName
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 20);

    setAdding(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDeptName.trim(),
          code: autoCode,
          head_of_department: newDeptHod.trim() || "To be hired",
          display_order: Number(newDeptOrder) || departments.length + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create department");
      }
      showMessage(
        "success",
        `Created department "${newDeptName.trim()}" (${autoCode}) with HOD "${newDeptHod.trim() || "To be hired"}".`
      );
      setNewDeptName("");
      setNewDeptCode("");
      setNewDeptHod("To be hired");
      setShowAddModal(false);
      await fetchDepartments();
      if (onChanged) onChanged();
    } catch (err: any) {
      showMessage("error", err.message || "Error creating department");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteDepartment = async (dept: DepartmentHodRecord) => {
    if (
      !window.confirm(
        `Are you sure you want to delete department "${dept.name} (${dept.code})"?`
      )
    ) {
      return;
    }
    setDeletingId(dept.id);
    try {
      const res = await fetch(`/api/departments/${dept.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete department");
      }
      showMessage("success", `Deleted department "${dept.name}".`);
      await fetchDepartments();
      if (onChanged) onChanged();
    } catch (err: any) {
      showMessage("error", err.message || "Failed to delete department");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDepartments = departments.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (d.name || "").toLowerCase().includes(q) ||
      (d.code || "").toLowerCase().includes(q) ||
      (d.head_of_department || "").toLowerCase().includes(q)
    );
  });

  const assignedHodsCount = departments.filter(
    (d) =>
      d.head_of_department &&
      d.head_of_department.trim() !== "" &&
      d.head_of_department.trim().toLowerCase() !== "to be hired"
  ).length;

  const toBeHiredCount = departments.length - assignedHodsCount;

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-pink-500 to-orange-500" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-black uppercase tracking-widest mb-2">
              <Building2 className="w-3.5 h-3.5 text-orange-400" />
              Master Directory • Departments & Heads of Department (HOD)
            </div>
            <h2 className={`${compactHeader ? "text-xl" : "text-2xl"} font-black tracking-tight text-white`}>
              Departments & Heads of Departments (Add, Edit & Delete)
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Modify department names, codes, and assign or update the <span className="text-orange-400 font-bold">Head of the Department (HOD)</span> so every action item relates directly to its responsible person across all dashboards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={fetchDepartments}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setNewDeptOrder(departments.length + 1);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-pink-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              + Add Department & HOD
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Total Active Departments
              </div>
              <div className="text-2xl font-black text-white mt-0.5">{departments.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Assigned Heads of Dept
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">{assignedHodsCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                HOD &ldquo;To Be Hired&rdquo;
              </div>
              <div className="text-2xl font-black text-orange-400 mt-0.5">{toBeHiredCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {banner && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-bold ${
            banner.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{banner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Quick Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Department Name, Code (e.g. STRATEGY_PROCESS), or Head of Department (e.g. Avinash, Anamika, Sarojini, Venkatesh)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Showing {filteredDepartments.length} of {departments.length} Departments</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-black uppercase tracking-widest">
              Departments & Heads of the Department (Live Supabase Directory)
            </h3>
          </div>
          <span className="text-[11px] text-slate-300 font-medium">
            Click <strong className="text-orange-400">Quick Edit</strong> or <strong className="text-blue-400">Edit Dept & HOD</strong> on any row to rename or assign HOD
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4 w-16">S.No.</th>
                <th className="py-3.5 px-4">Department / Vertical Name</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Head of the Department (HOD)</th>
                <th className="py-3.5 px-4 text-center">Readiness</th>
                <th className="py-3.5 px-4 text-center">RAG Status</th>
                <th className="py-3.5 px-4 text-right">Manage (Edit / Delete)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {loading && departments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-semibold">
                    Loading departments and Heads of Department from Supabase...
                  </td>
                </tr>
              ) : filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-semibold">
                    No departments match your search filter.
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept, index) => {
                  const hod = dept.head_of_department || "To be hired";
                  const isToBeHired = hod.trim().toLowerCase() === "to be hired";
                  const readiness = Math.round(
                    Number(dept.readiness_percentage ?? dept.readiness ?? 0)
                  );
                  const rag = (dept.rag_status || dept.rag || "NOT STARTED").toUpperCase();
                  const isInlineEditing = inlineHodId === dept.id;

                  return (
                    <tr
                      key={dept.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* S.No. */}
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 text-white text-[11px] font-black">
                          {index + 1}
                        </span>
                      </td>

                      {/* Department Name */}
                      <td className="py-3.5 px-4">
                        {isInlineEditing ? (
                          <input
                            type="text"
                            value={inlineDeptNameValue}
                            onChange={(e) => setInlineDeptNameValue(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs font-bold border-2 border-blue-500 rounded-lg bg-white text-slate-900 focus:outline-none"
                            placeholder="Department Name"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/department/${dept.id}`}
                              className="font-black text-slate-900 hover:text-blue-600 text-sm transition-colors flex items-center gap-1.5"
                            >
                              {dept.name}
                              <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          </div>
                        )}
                      </td>

                      {/* Department Code */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-bold">
                          {dept.code}
                        </span>
                      </td>

                      {/* Head of the Department (HOD) */}
                      <td className="py-3.5 px-4">
                        {isInlineEditing ? (
                          <div className="flex flex-col gap-1">
                            <input
                              type="text"
                              list={`hod-suggestions-${dept.id}`}
                              value={inlineHodValue}
                              onChange={(e) => setInlineHodValue(e.target.value)}
                              className="w-full px-3 py-1.5 text-xs font-bold border-2 border-orange-500 rounded-lg bg-white text-slate-900 focus:outline-none"
                              placeholder="Enter Head of Department name..."
                            />
                            <datalist id={`hod-suggestions-${dept.id}`}>
                              {SUGGESTED_HODS.map((h) => (
                                <option key={h} value={h} />
                              ))}
                            </datalist>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                                isToBeHired
                                  ? "bg-orange-50 text-orange-700 border-orange-200"
                                  : "bg-blue-50 text-blue-800 border-blue-200"
                              }`}
                            >
                              <UserCheck
                                className={`w-3.5 h-3.5 ${
                                  isToBeHired ? "text-orange-500" : "text-blue-600"
                                }`}
                              />
                              {hod}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStartInlineEdit(dept)}
                              title="Quick Edit Department Name & HOD"
                              className="text-[11px] font-bold text-blue-600 hover:text-pink-600 underline decoration-dotted ml-1"
                            >
                              Quick Edit
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Readiness */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className="h-full bg-gradient-to-r from-blue-600 via-pink-500 to-orange-500"
                              style={{ width: `${Math.min(100, Math.max(0, readiness))}%` }}
                            />
                          </div>
                          <span className="font-black text-slate-800 text-xs">{readiness}%</span>
                        </div>
                      </td>

                      {/* RAG Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            rag === "GREEN"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : rag === "AMBER"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : rag === "RED"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {rag}
                        </span>
                      </td>

                      {/* Manage Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        {isInlineEditing ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={savingInlineId === dept.id}
                              onClick={() => handleSaveInlineEdit(dept)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black shadow-sm disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                              {savingInlineId === dept.id ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineHodId(null)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                            >
                              <X className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(dept)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black shadow-sm transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit Dept & HOD
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === dept.id}
                              onClick={() => handleDeleteDepartment(dept)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-600 text-pink-700 hover:text-white border border-pink-200 text-[11px] font-black transition-all disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {deletingId === dept.id ? "..." : "Delete"}
                            </button>
                          </div>
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

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    Add New Department & Head of Department
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Automatically provisions 14 standardized reporting fields in Supabase
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDepartment} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Department / Vertical Name *
                </label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => {
                    setNewDeptName(e.target.value);
                    if (!newDeptCode) {
                      // optional auto preview
                    }
                  }}
                  placeholder="e.g., Strategy & Process, Executive Administration, Vice Chairman"
                  className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                    Department Code (Auto if blank)
                  </label>
                  <input
                    type="text"
                    value={newDeptCode}
                    onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                    placeholder="e.g., STRATEGY_PROCESS"
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                    S.No. / Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newDeptOrder}
                    onChange={(e) => setNewDeptOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Head of the Department (HOD) *
                </label>
                <input
                  type="text"
                  list="new-dept-hod-list"
                  value={newDeptHod}
                  onChange={(e) => setNewDeptHod(e.target.value)}
                  placeholder="e.g., Mr. Avinash Ghodgaonkar or To be hired"
                  className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <datalist id="new-dept-hod-list">
                  {SUGGESTED_HODS.map((h) => (
                    <option key={h} value={h} />
                  ))}
                </datalist>
                <p className="text-[11px] text-slate-500 mt-1">
                  Actions created under this department will automatically link to this Head of Department.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-pink-600 to-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-md disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {adding ? "Creating..." : "Create Department & Save HOD"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department & HOD Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    Edit Department & Head of Department
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Updating ID #{editingDept.id} ({editingDept.name})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Department / Vertical Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                    Department Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                    S.No. / Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editOrder}
                    onChange={(e) => setEditOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-orange-600 mb-1">
                  Head of the Department (HOD) *
                </label>
                <input
                  type="text"
                  list="edit-dept-hod-list"
                  value={editHod}
                  onChange={(e) => setEditHod(e.target.value)}
                  placeholder="Enter HOD Name or To be hired"
                  className="w-full px-3.5 py-2.5 text-xs font-bold border-2 border-orange-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-orange-50/30"
                />
                <datalist id="edit-dept-hod-list">
                  {SUGGESTED_HODS.map((h) => (
                    <option key={h} value={h} />
                  ))}
                </datalist>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SUGGESTED_HODS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditHod(preset)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                        editHod === preset
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                    Readiness % (0 - 100)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editReadiness}
                    onChange={(e) => setEditReadiness(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2 text-xs font-bold border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                    RAG Status
                  </label>
                  <select
                    value={editRag}
                    onChange={(e) => setEditRag(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="GREEN">GREEN</option>
                    <option value="AMBER">AMBER</option>
                    <option value="RED">RED</option>
                    <option value="NOT STARTED">NOT STARTED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingDept;
                    setEditingDept(null);
                    handleDeleteDepartment(target);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-pink-50 hover:bg-pink-600 text-pink-700 hover:text-white border border-pink-200 text-xs font-black transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Dept
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingDept(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-pink-600 to-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-md disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
