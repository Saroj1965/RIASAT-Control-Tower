"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  KeyRound,
  Plus,
  Edit3,
  Search,
  Shield,
  Building2,
  UserCheck,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  History,
  Mail,
  User,
  X,
  Phone,
  Briefcase,
  SlidersHorizontal,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

interface CredentialUser {
  id: number;
  name: string;
  email: string;
  mobile: string;
  designation: string;
  role: string;
  department_id: number | null;
  department_name?: string;
  department_code?: string;
  head_of_department?: string;
  status: string;
  last_login?: string | null;
  created_at?: string;
  updated_at?: string;
  pass?: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
  head_of_department: string;
  active: boolean;
}

interface LoginLogEntry {
  id: number;
  user_id: number | null;
  email: string;
  user_name: string | null;
  role: string | null;
  department_id: number | null;
  status: string;
  timestamp: string;
  details: string;
}

interface AuditLogEntry {
  id: number;
  user_name: string;
  action: string;
  department_name?: string | null;
  timestamp: string;
  details: string;
}

const ROLES_LIST = [
  "Vice Chairman",
  "Admin",
  "Executive",
  "Form Admin",
  "User Admin",
  "Department Admin",
  "Department Head",
];

const DEFAULT_ROLE_PASSWORDS: Record<string, string> = {
  "vicechairman@riasat.ac.in": "ViceChairman@123",
  "admin@riasat.ac.in": "Admin@123",
  "executive@riasat.ac.in": "Exec@123",
  "forms.admin@riasat.ac.in": "Forms@123",
  "users.admin@riasat.ac.in": "Users@123",
  "dept.admin@riasat.ac.in": "Dept@123",
  "semicon.head@riasat.ac.in": "Semicon@123",
  "aero.head@riasat.ac.in": "Aero@123",
  "space.head@riasat.ac.in": "Space@123",
  "cyber.head@riasat.ac.in": "Cyber@123",
  "medtech.head@riasat.ac.in": "MedTech@123",
  "mfg.head@riasat.ac.in": "Mfg@123",
  "hr.head@riasat.ac.in": "Hr@123",
  "comm.head@riasat.ac.in": "Comm@123",
  "ops.head@riasat.ac.in": "Ops@123",
};

export default function EditCredentialsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<CredentialUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLogEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Show password map (userId -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [logsDrawerOpen, setLogsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CredentialUser | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("Department Head");
  const [formDeptId, setFormDeptId] = useState<string>("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formStatus, setFormStatus] = useState("Active");
  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/credentials", { cache: "no-store" });
      if (!res.ok) {
        // Fallback to public credentials list if admin-restricted or error
        const pubRes = await fetch("/api/auth/credentials", { cache: "no-store" });
        const pubData = await pubRes.json();
        setUsers(pubData.credentials || []);
        setDepartments(pubData.departments || []);
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      setDepartments(data.departments || []);
      setLoginLogs(data.loginLogs || []);
      setAuditLogs(data.auditLogs || []);
    } catch (err) {
      console.error("Failed to load credentials:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const togglePasswordVisibility = (userId: number) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Open Edit Modal
  const handleOpenEdit = (user: CredentialUser) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role);
    setFormDeptId(user.department_id ? String(user.department_id) : "");
    setFormDesignation(user.designation || "");
    setFormMobile(user.mobile || "");
    setFormStatus(user.status || "Active");
    setFormError("");
    setEditModalOpen(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("Department Head");
    setFormDeptId(departments[0]?.id ? String(departments[0].id) : "1");
    setFormDesignation("");
    setFormMobile("");
    setFormStatus("Active");
    setFormError("");
    setCreateModalOpen(true);
  };

  // Auto-generate suggested password when typing email or role in Create Modal
  useEffect(() => {
    if (createModalOpen && !formPassword) {
      const emailPrefix = formEmail.split("@")[0]?.split(".")[0];
      if (emailPrefix) {
        setFormPassword(
          emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) + "@123"
        );
      }
    }
  }, [formEmail, createModalOpen, formPassword]);

  // Handle Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError("");
    setSaving(true);

    try {
      const payload: Record<string, any> = {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        role: formRole,
        department_id: formDeptId ? parseInt(formDeptId, 10) : null,
        designation: formDesignation.trim(),
        mobile: formMobile.trim(),
        status: formStatus,
      };
      if (formPassword.trim()) {
        payload.password = formPassword.trim();
      }

      const res = await fetch(`/api/admin/credentials/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update credential");
      }

      showToast(`Credential for ${formName} updated and saved to Supabase.`);
      setEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  // Handle Create New Credential
  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      if (!formName.trim() || !formEmail.trim()) {
        throw new Error("Name and email are required");
      }

      const payload = {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        password: formPassword.trim() || "Welcome@RIASAT1",
        role: formRole,
        department_id: formDeptId ? parseInt(formDeptId, 10) : null,
        designation: formDesignation.trim(),
        mobile: formMobile.trim(),
        status: formStatus,
      };

      const res = await fetch("/api/admin/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user credential");
      }

      showToast(`New user credential for ${formName} saved into Supabase.`);
      setCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  // Handle Deactivate / Toggle Status
  const handleToggleStatus = async (user: CredentialUser) => {
    const nextStatus = user.status === "Active" ? "Inactive" : "Active";
    if (
      !confirm(
        `Are you sure you want to set ${user.name}'s status to ${nextStatus}?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/credentials/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast(`${user.name} is now ${nextStatus}.`);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (
        deptFilter !== "ALL" &&
        (u.department_id ? String(u.department_id) : "null") !== deptFilter
      ) {
        return false;
      }
      if (statusFilter !== "ALL" && u.status !== statusFilter) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const nameMatch = u.name.toLowerCase().includes(q);
      const emailMatch = u.email.toLowerCase().includes(q);
      const desigMatch = (u.designation || "").toLowerCase().includes(q);
      const deptMatch = (u.department_name || "").toLowerCase().includes(q);
      return nameMatch || emailMatch || desigMatch || deptMatch;
    });
  }, [users, roleFilter, deptFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner with Brand Colors */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 md:p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <img
              src="/ramaiah_logo.png"
              alt="Ramaiah Logo"
              className="h-12 w-auto object-contain hidden sm:block"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#003B71] text-white">
                  Riasat Executive Control
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-50 text-[#D81B60] border border-pink-200">
                  Real-Time Supabase Sync
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">
                User Credentials &amp; Real-Time Department Management
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Add, edit, and assign real-time departments and passwords for all leadership, admins, and department heads
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white text-xs font-black uppercase tracking-wider shadow-md hover:opacity-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Make New Credential
            </button>
            <button
              type="button"
              onClick={() => setLogsDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
            >
              <History className="w-4 h-4 text-orange-400" />
              Supabase Logs
            </button>
            <button
              type="button"
              onClick={fetchData}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
              title="Refresh Real-Time Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#003B71]" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Accounts
          </div>
          <div className="text-2xl font-black text-slate-950 mt-1">
            {users.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Provisioned in Supabase
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Active Credentials
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {users.filter((u) => u.status === "Active").length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Verified login permissions
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Departments Mapped
          </div>
          <div className="text-2xl font-black text-[#003B71] mt-1">
            {departments.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Real-time vertical master
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Authentication Logs
          </div>
          <div className="text-2xl font-black text-[#D81B60] mt-1">
            {loginLogs.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Recorded in database ledger
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user name, email, designation or department..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003B71]/20 focus:border-[#003B71]"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Department Dropdown */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Departments (Real-Time)</option>
              <option value="null">Global / Administration (No Dept)</option>
              {departments.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>

            {/* Role Dropdown */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Roles</option>
              {ROLES_LIST.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Credentials Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-orange-400" />
            <span className="font-bold text-sm">
              Current Credentials Register ({filteredUsers.length} shown of {users.length})
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Directly connected to Supabase Database
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[220px]">User &amp; Email</th>
                <th className="py-3 px-4 w-36">Role</th>
                <th className="py-3 px-4 min-w-[220px]">Real-Time Department</th>
                <th className="py-3 px-4 w-44">Designation</th>
                <th className="py-3 px-4 w-36">Default Password</th>
                <th className="py-3 px-4 w-24 text-center">Status</th>
                <th className="py-3 px-4 w-36 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs italic">
                    No credentials match the current filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => {
                  const defaultPass =
                    DEFAULT_ROLE_PASSWORDS[u.email.toLowerCase()] ||
                    (u.email.split("@")[0].split(".")[0]
                      ? u.email.split("@")[0].split(".")[0].charAt(0).toUpperCase() +
                        u.email.split("@")[0].split(".")[0].slice(1) +
                        "@123"
                      : "Welcome@RIASAT1");

                  const isPwVisible = Boolean(visiblePasswords[u.id]);

                  // Role badge color
                  let roleBadgeClass = "bg-blue-50 text-blue-800 border-blue-200";
                  if (u.role === "Vice Chairman") {
                    roleBadgeClass = "bg-[#003B71] text-white border-transparent";
                  } else if (u.role === "Admin") {
                    roleBadgeClass = "bg-slate-900 text-white border-transparent";
                  } else if (u.role === "Executive") {
                    roleBadgeClass = "bg-pink-50 text-[#D81B60] border-pink-200 font-bold";
                  } else if (u.role === "Form Admin") {
                    roleBadgeClass = "bg-orange-50 text-[#F37021] border-orange-200";
                  } else if (u.role === "User Admin") {
                    roleBadgeClass = "bg-indigo-50 text-indigo-800 border-indigo-200";
                  } else if (u.role === "Department Admin") {
                    roleBadgeClass = "bg-purple-50 text-purple-800 border-purple-200";
                  }

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* # Numbering without S.No. */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* User & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-950 flex items-center gap-2">
                          <span>{u.name}</span>
                          {u.mobile && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({u.mobile})
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px] mt-0.5 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border ${roleBadgeClass}`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Real-Time Department */}
                      <td className="py-3.5 px-4">
                        {u.department_id ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#003B71]" />
                              {u.department_name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Code: {u.department_code} • Head: {u.head_of_department}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                            <Shield className="w-3 h-3 text-slate-400" />
                            Global / Institutional
                          </span>
                        )}
                      </td>

                      {/* Designation */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {u.designation || "—"}
                      </td>

                      {/* Password with Eye Toggle */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs text-slate-800">
                          <span>{isPwVisible ? defaultPass : "••••••••"}</span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                            title={isPwVisible ? "Hide password" : "Show password"}
                          >
                            {isPwVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {u.status || "Active"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold cursor-pointer transition shadow-2xs"
                          >
                            <Edit3 className="w-3 h-3 text-[#003B71]" />
                            Edit &amp; Save
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg border text-[11px] cursor-pointer transition ${
                              u.status === "Active"
                                ? "border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700"
                                : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                            }`}
                            title={u.status === "Active" ? "Deactivate User" : "Activate User"}
                          >
                            <UserCheck className="w-3 h-3" />
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

      {/* =====================================================================
          EDIT CREDENTIAL MODAL
      ====================================================================== */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-sm">
                  Edit Credential &amp; Real-Time Department
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003B71]/20 focus:border-[#003B71]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003B71]/20 focus:border-[#003B71]"
                />
              </div>

              {/* New Password (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Update Password (leave blank to keep current)
                </label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Enter new password to reset (e.g. Dept@123)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003B71]/20 focus:border-[#003B71]"
                />
              </div>

              {/* Real-Time Department Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Real-Time Department (from Supabase Master)
                </label>
                <select
                  value={formDeptId}
                  onChange={(e) => setFormDeptId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003B71]/20 focus:border-[#003B71]"
                >
                  <option value="">Global / Institutional Administration (No Dept)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name} ({d.code}) — Head: {d.head_of_department}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role & Designation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
                  >
                    {ROLES_LIST.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Designation & Mobile */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="e.g. Head - Strategy"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile
                  </label>
                  <input
                    type="text"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    placeholder="+91 98450 11000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#003B71] to-[#D81B60] text-white text-xs font-bold shadow-md hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving to Supabase..." : "Save Credential"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MAKE NEW CREDENTIAL MODAL
      ====================================================================== */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">
                  Make New Credential (Saved to Database Log)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCredential} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003B71]/20 focus:border-[#003B71]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. rajesh.sharma@riasat.ac.in"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003B71]/20 focus:border-[#003B71]"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="e.g. Rajesh@123"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003B71]/20 focus:border-[#003B71]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Password will be hashed with bcrypt and saved into Supabase authentication.
                </span>
              </div>

              {/* Real-Time Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Real-Time Department
                </label>
                <select
                  value={formDeptId}
                  onChange={(e) => setFormDeptId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
                >
                  <option value="">Global / Institutional Administration (No Dept)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
                  >
                    {ROLES_LIST.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Designation & Mobile */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="e.g. Lead Scientist"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile
                  </label>
                  <input
                    type="text"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    placeholder="+91 98450 11000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs font-bold shadow-md hover:opacity-95 transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Creating Credential..." : "Create & Save Credential"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUPABASE LOGS & AUDIT DRAWER
      ====================================================================== */}
      {logsDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-slideLeft">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-sm">
                  Supabase Authentication &amp; Audit Ledger
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLogsDrawerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* Login Logs */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#003B71]" />
                  Recent Login Activity ({loginLogs.length})
                </h4>
                <div className="space-y-2">
                  {loginLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No login records found.</p>
                  ) : (
                    loginLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/80 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">
                            {log.user_name || log.email}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-700"
                                : log.status === "ACCOUNT_CREATED"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{log.details}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          {new Date(log.timestamp).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Audit Log Entries */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#D81B60]" />
                  Credential Audit Trail ({auditLogs.length})
                </h4>
                <div className="space-y-2">
                  {auditLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No audit records found.</p>
                  ) : (
                    auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/80 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">{log.user_name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#003B71]/10 text-[#003B71]">
                            {log.action}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{log.details}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          {new Date(log.timestamp).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
