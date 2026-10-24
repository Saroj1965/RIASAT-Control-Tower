"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Edit2,
  Power,
  Building,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Filter,
  Search,
  X,
  SlidersHorizontal,
  Layers,
  HelpCircle,
  Database,
  Trash2,
  Save,
  BarChart3,
  IndianRupee,
} from "lucide-react";
import { ROLES } from "@/lib/constants";
import DashboardGraphs from "@/components/DashboardGraphs";

type AdminTabType =
  | "users"
  | "departments"
  | "form_config"
  | "analytics_directives"
  | "analytics_readiness"
  | "analytics_financials";

function AdminPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [execSummary, setExecSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTabType>("users");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [exportingDb, setExportingDb] = useState(false);

  // User modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    mobile: "",
    designation: "",
    role: ROLES.DEPARTMENT_HEAD as string,
    department_id: "1",
    status: "Active",
    password: "",
  });

  // User tab filter states
  const [userRoleFilter, setUserRoleFilter] = useState<string>("ALL");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("ALL");
  const [userSearch, setUserSearch] = useState<string>("");

  // Department modal state & filters
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", code: "" });
  const [deptRagFilter, setDeptRagFilter] = useState<string>("ALL");
  const [deptSearch, setDeptSearch] = useState<string>("");

  // Form Configuration state
  const [selectedDeptId, setSelectedDeptId] = useState<string>("1");
  const [formFields, setFormFields] = useState<any[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [fieldStatusFilter, setFieldStatusFilter] = useState<string>("ALL");
  const [fieldMandatoryFilter, setFieldMandatoryFilter] = useState<string>("ALL");
  const [fieldSearch, setFieldSearch] = useState<string>("");

  // Add/Edit Field modal state
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [showEditFieldModal, setShowEditFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [deletingField, setDeletingField] = useState<any>(null);
  const [isDeletingField, setIsDeletingField] = useState(false);
  const [newFieldForm, setNewFieldForm] = useState({
    department_id: "1",
    label: "",
    field_key: "",
    field_type: "Short Text",
    required: false,
    active: true,
    display_order: 10,
    help_text: "",
    options: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      let currentRole = "";
      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user) {
            setCurrentUser(meData.user);
            currentRole = meData.user.role;
          }
        }
      } catch {
        // silent
      }

      const [deptsRes, execRes] = await Promise.all([
        fetch("/api/departments", { cache: "no-store" }),
        fetch("/api/executive/summary", { cache: "no-store" }),
      ]);

      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        const deptsList = deptsData.departments || [];
        setDepartments(deptsList);
        if (deptsList.length > 0 && !selectedDeptId) {
          setSelectedDeptId(deptsList[0].id.toString());
        }
      }

      if (execRes.ok) {
        const execData = await execRes.json();
        setExecSummary(execData);
      }

      const isNotUserViewer =
        currentRole === ROLES.FORM_ADMIN ||
        currentRole === "Form Admin" ||
        currentRole === "Forms Admin" ||
        currentRole === ROLES.DEPT_ADMIN ||
        currentRole === "Department Admin" ||
        currentRole === "Departments Admin";

      if (!isNotUserViewer) {
        try {
          const usersRes = await fetch("/api/admin/users", { cache: "no-store" });
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            setUsers(usersData.users || []);
          }
        } catch {
          // silent
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFormFields = async (deptId: string) => {
    if (!deptId) return;
    try {
      setLoadingFields(true);
      const res = await fetch(`/api/admin/forms/fields?department_id=${deptId}`, { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load form fields");
      }
      const data = await res.json();
      setFormFields(data.fields || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingFields(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const tabParam = searchParams ? (searchParams.get("tab") as AdminTabType | null) : null;
    const isFormAdmin =
      currentUser?.role === ROLES.FORM_ADMIN ||
      currentUser?.role === "Form Admin" ||
      currentUser?.role === "Forms Admin";
    const isUserAdmin =
      currentUser?.role === ROLES.USER_ADMIN ||
      currentUser?.role === "User Admin" ||
      currentUser?.role === "Users Admin";
    const isDeptAdmin =
      currentUser?.role === ROLES.DEPT_ADMIN ||
      currentUser?.role === "Department Admin" ||
      currentUser?.role === "Departments Admin";

    if (
      tabParam &&
      [
        "users",
        "departments",
        "form_config",
        "analytics_directives",
        "analytics_readiness",
        "analytics_financials",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    } else if (isFormAdmin) {
      setActiveTab("form_config");
    } else if (isUserAdmin) {
      setActiveTab("users");
    } else if (isDeptAdmin) {
      setActiveTab("departments");
    } else {
      setActiveTab("users");
    }
  }, [searchParams, currentUser]);

  const handleSwitchTab = (tab: AdminTabType) => {
    setActiveTab(tab);
    router.replace(`/admin?tab=${tab}`, { scroll: false });
  };

  useEffect(() => {
    if (activeTab === "form_config" && selectedDeptId) {
      loadFormFields(selectedDeptId);
    }
  }, [activeTab, selectedDeptId]);

  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserForm({
      name: "",
      email: "",
      mobile: "",
      designation: "",
      role: ROLES.DEPARTMENT_HEAD,
      department_id: departments[0]?.id?.toString() || "1",
      status: "Active",
      password: "Password@123",
    });
    setShowUserModal(true);
  };

  const openEditUserModal = (u: any) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      email: u.email,
      mobile: u.mobile || "",
      designation: u.designation || "",
      role: u.role,
      department_id: u.department_id ? u.department_id.toString() : "",
      status: u.status,
      password: "",
    });
    setShowUserModal(true);
  };

  const handleToggleStatus = async (u: any) => {
    const newStatus = u.status === "Active" ? "Inactive" : "Active";
    const action = newStatus === "Active" ? "activate" : "deactivate";
    if (!confirm(`Are you sure you want to ${action} user "${u.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setSuccess(`User "${u.name}" has been ${action}d.`);
      setTimeout(() => setSuccess(null), 4000);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : "/api/admin/users";
      const method = editingUser ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save user");
      setShowUserModal(false);
      setSuccess(editingUser ? "User updated!" : "New user created!");
      setTimeout(() => setSuccess(null), 4000);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deptForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create department");
      setShowDeptModal(false);
      setSuccess(`Department "${deptForm.name}" created!`);
      setTimeout(() => setSuccess(null), 4000);
      setDeptForm({ name: "", code: "" });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExportDatabase = async () => {
    try {
      setExportingDb(true);
      setError(null);
      const res = await fetch("/api/database/export");
      if (!res.ok) throw new Error("Failed to export database");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RIASAT_Supabase_Backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess("Database backup exported.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Export failed");
    } finally {
      setExportingDb(false);
    }
  };

  const openAddFieldModal = () => {
    setNewFieldForm({
      department_id: selectedDeptId,
      label: "",
      field_key: "",
      field_type: "Short Text",
      required: false,
      active: true,
      display_order: (formFields.length + 1) * 10,
      help_text: "",
      options: "",
    });
    setShowAddFieldModal(true);
  };

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/admin/forms/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFieldForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add field");
      setShowAddFieldModal(false);
      setSuccess(`Form field "${newFieldForm.label}" created!`);
      setTimeout(() => setSuccess(null), 4000);
      loadFormFields(selectedDeptId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEditFieldModal = (f: any) => {
    const optsStr = Array.isArray(f.options)
      ? f.options.map((o: any) => o.option_value || o.value || o.label).join(", ")
      : "";
    setEditingField({
      id: f.id,
      field_key: f.field_key,
      department_id: f.department_id,
      label: f.label,
      field_type: f.field_type,
      required: Boolean(f.required),
      active: Boolean(f.active),
      display_order: f.display_order,
      help_text: f.help_text || "",
      options: optsStr,
    });
    setShowEditFieldModal(true);
  };

  const handleDeleteField = async (f: any, retireOnly = false) => {
    if (!f || !f.id) return;
    setIsDeletingField(true);
    setError(null);
    try {
      const url = retireOnly
        ? `/api/admin/forms/fields?id=${f.id}&retire=true`
        : `/api/admin/forms/fields?id=${f.id}&force=true`;
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete form field");
      setDeletingField(null);
      setShowEditFieldModal(false);
      setSuccess(data.message || `Form field "${f.label}" deleted!`);
      setTimeout(() => setSuccess(null), 4000);
      loadFormFields(selectedDeptId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeletingField(false);
    }
  };

  const handleSaveEditField = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/admin/forms/fields", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingField),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update field");
      setShowEditFieldModal(false);
      setSuccess(`Form field "${editingField.label}" updated!`);
      setTimeout(() => setSuccess(null), 4000);
      loadFormFields(selectedDeptId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleFieldActive = async (f: any) => {
    const newActive = !f.active;
    try {
      const res = await fetch("/api/admin/forms/fields", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: f.id, active: newActive }),
      });
      if (!res.ok) throw new Error("Failed to update field status");
      loadFormFields(selectedDeptId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    try {
      return new Date(dateStr).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const filteredUsers = users.filter((u) => {
    if (userRoleFilter !== "ALL") {
      if (
        userRoleFilter === "VICE_CHAIRMAN" &&
        !(
          u.role === ROLES.VICE_CHAIRMAN ||
          u.role === "Vice Chairman" ||
          u.role === "Chairman"
        )
      )
        return false;
      if (userRoleFilter === "ADMIN" && u.role !== ROLES.ADMIN) return false;
      if (userRoleFilter === "EXECUTIVE" && u.role !== ROLES.EXECUTIVE) return false;
      if (userRoleFilter === "DEPARTMENT_HEAD" && u.role !== ROLES.DEPARTMENT_HEAD)
        return false;
    }
    if (userStatusFilter !== "ALL" && u.status !== userStatusFilter) return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      const matchName = u.name && u.name.toLowerCase().includes(q);
      const matchEmail = u.email && u.email.toLowerCase().includes(q);
      const matchDept = u.department_name && u.department_name.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchDept) return false;
    }
    return true;
  });

  const filteredDepartments = departments.filter((d) => {
    if (deptRagFilter !== "ALL" && d.rag_status?.toUpperCase() !== deptRagFilter.toUpperCase())
      return false;
    if (deptSearch.trim()) {
      const q = deptSearch.toLowerCase();
      const matchName = d.name && d.name.toLowerCase().includes(q);
      const matchCode = d.code && d.code.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  const filteredFormFields = formFields.filter((f) => {
    if (fieldStatusFilter === "ACTIVE" && !f.active) return false;
    if (fieldStatusFilter === "INACTIVE" && f.active) return false;
    if (fieldMandatoryFilter === "REQUIRED" && !f.required) return false;
    if (fieldMandatoryFilter === "OPTIONAL" && f.required) return false;
    if (fieldSearch.trim()) {
      const q = fieldSearch.toLowerCase();
      const matchLabel = f.label && f.label.toLowerCase().includes(q);
      const matchKey = f.field_key && f.field_key.toLowerCase().includes(q);
      if (!matchLabel && !matchKey) return false;
    }
    return true;
  });

  const selectedDepartmentName =
    departments.find((d) => d.id.toString() === selectedDeptId)?.name || "Selected Vertical";

  const isFormAdmin =
    currentUser?.role === ROLES.FORM_ADMIN ||
    currentUser?.role === "Form Admin" ||
    currentUser?.role === "Forms Admin";
  const isUserAdmin =
    currentUser?.role === ROLES.USER_ADMIN ||
    currentUser?.role === "User Admin" ||
    currentUser?.role === "Users Admin";
  const isDeptAdmin =
    currentUser?.role === ROLES.DEPT_ADMIN ||
    currentUser?.role === "Department Admin" ||
    currentUser?.role === "Departments Admin";
  const isSuperAdmin = !isFormAdmin && !isUserAdmin && !isDeptAdmin;

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
                  System Administration
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D81B60]/10 text-[#D81B60]">
                  Governance &amp; Analytics
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight truncate">
                RIASAT Executive Dashboard — Admin &amp; Analytics Suite
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {activeTab === "users" && (isSuperAdmin || isUserAdmin) && (
              <button
                onClick={openCreateUserModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Create User
              </button>
            )}
            {activeTab === "departments" && (isSuperAdmin || isDeptAdmin) && (
              <button
                onClick={() => setShowDeptModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Vertical
              </button>
            )}
            {activeTab === "form_config" && (isSuperAdmin || isFormAdmin) && (
              <button
                onClick={openAddFieldModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Form Field
              </button>
            )}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={handleExportDatabase}
                disabled={exportingDb}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-[#F37021]" />
                Backup JSON
              </button>
            )}
            <button
              onClick={() => {
                loadData();
                if (activeTab === "form_config") loadFormFields(selectedDeptId);
              }}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-[#003B71] ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Dedicated Sub-Pages Navigation Bar (Separate pages for Admin Management + Separate Analytics Pages) */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(isSuperAdmin || isUserAdmin) && (
            <button
              onClick={() => handleSwitchTab("users")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition shrink-0 cursor-pointer ${
                activeTab === "users"
                  ? "bg-[#003B71] text-white shadow-xs"
                  : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/70"
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${activeTab === "users" ? "text-[#F37021]" : "text-slate-500"}`} />
              User Accounts ({users.length})
            </button>
          )}

          {(isSuperAdmin || isDeptAdmin) && (
            <button
              onClick={() => handleSwitchTab("departments")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition shrink-0 cursor-pointer ${
                activeTab === "departments"
                  ? "bg-[#003B71] text-white shadow-xs"
                  : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/70"
              }`}
            >
              <Building className={`w-3.5 h-3.5 ${activeTab === "departments" ? "text-[#F37021]" : "text-slate-500"}`} />
              9 Verticals Master ({departments.length})
            </button>
          )}

          {(isSuperAdmin || isFormAdmin) && (
            <button
              onClick={() => handleSwitchTab("form_config")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition shrink-0 cursor-pointer ${
                activeTab === "form_config"
                  ? "bg-[#003B71] text-white shadow-xs"
                  : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/70"
              }`}
            >
              <SlidersHorizontal className={`w-3.5 h-3.5 ${activeTab === "form_config" ? "text-[#F37021]" : "text-slate-500"}`} />
              Form Configuration
            </button>
          )}

          {/* Separate Analytics Pages in /admin */}
          <button
            onClick={() => handleSwitchTab("analytics_directives")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition shrink-0 cursor-pointer ${
              activeTab === "analytics_directives"
                ? "bg-[#003B71] text-white shadow-xs"
                : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${activeTab === "analytics_directives" ? "text-[#F37021]" : "text-slate-500"}`} />
            Directives &amp; RAG Analytics
          </button>

          <button
            onClick={() => handleSwitchTab("analytics_readiness")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition shrink-0 cursor-pointer ${
              activeTab === "analytics_readiness"
                ? "bg-[#003B71] text-white shadow-xs"
                : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            <BarChart3 className={`w-3.5 h-3.5 ${activeTab === "analytics_readiness" ? "text-[#F37021]" : "text-slate-500"}`} />
            Readiness Benchmark
          </button>

          <button
            onClick={() => handleSwitchTab("analytics_financials")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition shrink-0 cursor-pointer ${
              activeTab === "analytics_financials"
                ? "bg-[#003B71] text-white shadow-xs"
                : "bg-slate-100/80 text-slate-700 hover:bg-slate-200/70"
            }`}
          >
            <IndianRupee className={`w-3.5 h-3.5 ${activeTab === "analytics_financials" ? "text-[#F37021]" : "text-slate-500"}`} />
            Financial Pipeline
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {success && (
        <div className="p-3.5 bg-[#003B71]/5 border border-[#003B71]/25 rounded-xl text-[#003B71] text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-[#D81B60]/10 border border-[#D81B60]/30 rounded-xl text-[#D81B60] text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* SEPARATE ANALYTICS PAGES ON /ADMIN                                */}
      {/* ================================================================= */}
      {activeTab === "analytics_directives" && execSummary?.graphs && (
        <DashboardGraphs
          readiness={execSummary.graphs.readiness}
          financials={execSummary.graphs.financials}
          actionsDistribution={execSummary.graphs.actionsDistribution}
          ragDistribution={execSummary.graphs.ragDistribution}
          statusBreakdown={execSummary.graphs.statusBreakdown}
          mode="directives"
        />
      )}

      {activeTab === "analytics_readiness" && execSummary?.graphs && (
        <DashboardGraphs
          readiness={execSummary.graphs.readiness}
          financials={execSummary.graphs.financials}
          actionsDistribution={execSummary.graphs.actionsDistribution}
          ragDistribution={execSummary.graphs.ragDistribution}
          statusBreakdown={execSummary.graphs.statusBreakdown}
          mode="readiness"
        />
      )}

      {activeTab === "analytics_financials" && execSummary?.graphs && (
        <DashboardGraphs
          readiness={execSummary.graphs.readiness}
          financials={execSummary.graphs.financials}
          actionsDistribution={execSummary.graphs.actionsDistribution}
          ragDistribution={execSummary.graphs.ragDistribution}
          statusBreakdown={execSummary.graphs.statusBreakdown}
          mode="financials"
        />
      )}

      {/* ================================================================= */}
      {/* SUB-PAGE: USER MANAGEMENT                                         */}
      {/* ================================================================= */}
      {activeTab === "users" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/40">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "ALL", label: `All Roles (${users.length})` },
                { id: "VICE_CHAIRMAN", label: "Vice Chairman" },
                { id: "ADMIN", label: "Admin" },
                { id: "EXECUTIVE", label: "Executive" },
                { id: "DEPARTMENT_HEAD", label: "Dept Head" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setUserRoleFilter(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    userRoleFilter === item.id
                      ? "bg-[#003B71] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="ALL">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, email, role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white w-56"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[980px] text-xs">
              <thead>
                <tr className="bg-slate-950 text-white text-[11px] font-black uppercase tracking-wider">
                  <th className="py-3.5 px-4">User &amp; Designation</th>
                  <th className="py-3.5 px-4">Login Email</th>
                  <th className="py-3.5 px-4">System Role</th>
                  <th className="py-3.5 px-4">Assigned Vertical</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/90 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.designation || "--"}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                          u.role === ROLES.VICE_CHAIRMAN || u.role === "Vice Chairman"
                            ? "bg-[#D81B60]/10 text-[#D81B60]"
                            : u.role === ROLES.ADMIN
                            ? "bg-[#003B71]/10 text-[#003B71]"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {u.department_name || "All Verticals (Global)"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          u.status === "Active"
                            ? "bg-[#003B71]/10 text-[#003B71]"
                            : "bg-[#D81B60]/10 text-[#D81B60]"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(u.last_login)}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditUserModal(u)}
                        className="px-3 py-1 rounded-lg border border-slate-200 font-bold text-[#003B71] hover:bg-slate-50 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className="px-3 py-1 rounded-lg border border-slate-200 font-bold text-[#D81B60] hover:bg-[#D81B60]/5 cursor-pointer"
                      >
                        {u.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-PAGE: 9 VERTICALS MASTER                                      */}
      {/* ================================================================= */}
      {activeTab === "departments" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/40">
            <div className="flex flex-wrap items-center gap-2">
              {["ALL", "GREEN", "AMBER", "RED"].map((ragKey) => (
                <button
                  key={ragKey}
                  onClick={() => setDeptRagFilter(ragKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    deptRagFilter === ragKey
                      ? "bg-[#003B71] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {ragKey === "ALL" ? `All Verticals (${departments.length})` : ragKey}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vertical..."
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px] text-xs">
              <thead>
                <tr className="bg-slate-950 text-white text-[11px] font-black uppercase tracking-wider">
                  <th className="py-3.5 px-4">S.No.</th>
                  <th className="py-3.5 px-4">Vertical Name</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Readiness %</th>
                  <th className="py-3.5 px-4">RAG Status</th>
                  <th className="py-3.5 px-4">Total Directives</th>
                  <th className="py-3.5 px-4">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {filteredDepartments.map((d, idx) => (
                  <tr key={d.id} className="hover:bg-slate-50/90 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">S.No. {idx + 1}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">{d.name}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#003B71]">{d.code}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {d.readiness_percentage}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase text-white ${
                          d.rag_status === "GREEN"
                            ? "bg-[#003B71]"
                            : d.rag_status === "AMBER"
                            ? "bg-[#F37021]"
                            : d.rag_status === "RED"
                            ? "bg-[#D81B60]"
                            : "bg-slate-500"
                        }`}
                      >
                        {d.rag_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{d.stats?.total || 0}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#003B71]/10 text-[#003B71]">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-PAGE: DYNAMIC FORM CONFIGURATION                              */}
      {/* ================================================================= */}
      {activeTab === "form_config" && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase text-slate-500">Select Vertical:</span>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-[#003B71]/30 bg-[#003B71]/5 text-[#003B71] font-black text-xs"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id.toString()}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                placeholder="Search field heading..."
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs w-52"
              />
              <button
                onClick={openAddFieldModal}
                className="px-4 py-2 rounded-xl bg-[#003B71] text-white text-xs font-black uppercase cursor-pointer"
              >
                + Add Field
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            {loadingFields ? (
              <div className="py-12 text-center text-xs font-bold text-slate-400">
                Loading configurable fields...
              </div>
            ) : filteredFormFields.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No fields found for {selectedDepartmentName}.
              </div>
            ) : (
              filteredFormFields.map((f, idx) => (
                <div
                  key={f.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-[#003B71]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="px-2.5 h-8 rounded-lg bg-[#003B71]/10 text-[#003B71] font-black text-xs flex items-center justify-center shrink-0 whitespace-nowrap">
                      S.No. {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{f.label}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {f.field_type}
                        </span>
                        {f.required && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F37021]/15 text-[#F37021]">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Key: {f.field_key}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditFieldModal(f)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#003B71] hover:bg-slate-50 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingField(f)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#D81B60] hover:bg-[#D81B60]/5 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALS (CREATE/EDIT USER, ADD DEPT, ADD/EDIT/DELETE FIELD)        */}
      {/* ================================================================= */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-base font-black text-slate-950 mb-4">
              {editingUser ? "Edit User Account" : "Create User Account"}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={userForm.designation}
                    onChange={(e) => setUserForm({ ...userForm, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                  >
                    <option value={ROLES.VICE_CHAIRMAN}>Vice Chairman</option>
                    <option value={ROLES.ADMIN}>Admin</option>
                    <option value={ROLES.EXECUTIVE}>Executive</option>
                    <option value={ROLES.DEPARTMENT_HEAD}>Department Head</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Vertical</label>
                  <select
                    value={userForm.department_id}
                    onChange={(e) => setUserForm({ ...userForm, department_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id.toString()}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {editingUser ? "Reset Password (optional)" : "Password *"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#003B71] text-white font-black uppercase"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="text-base font-black text-slate-950 mb-4">Add Strategic Vertical</h3>
            <form onSubmit={handleCreateDept} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vertical Name *</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vertical Code *</label>
                <input
                  type="text"
                  required
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#003B71] text-white font-black uppercase"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddFieldModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="text-base font-black text-slate-950 mb-4">Add Form Field</h3>
            <form onSubmit={handleCreateField} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Field Label *</label>
                <input
                  type="text"
                  required
                  value={newFieldForm.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoKey = val
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "_")
                      .replace(/^_+|_+$/g, "");
                    setNewFieldForm({ ...newFieldForm, label: val, field_key: autoKey });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Field Type</label>
                  <select
                    value={newFieldForm.field_type}
                    onChange={(e) =>
                      setNewFieldForm({ ...newFieldForm, field_type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Short Text">Short Text</option>
                    <option value="Long Text">Long Text</option>
                    <option value="Number">Number</option>
                    <option value="Dropdown">Dropdown</option>
                    <option value="Yes/No">Yes/No</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={newFieldForm.display_order}
                    onChange={(e) =>
                      setNewFieldForm({
                        ...newFieldForm,
                        display_order: parseInt(e.target.value || "10", 10),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFieldModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#003B71] text-white font-black uppercase"
                >
                  Save Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditFieldModal && editingField && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="text-base font-black text-slate-950 mb-4">Edit Form Field</h3>
            <form onSubmit={handleSaveEditField} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Field Label *</label>
                <input
                  type="text"
                  required
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Field Type</label>
                  <select
                    value={editingField.field_type}
                    onChange={(e) =>
                      setEditingField({ ...editingField, field_type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Short Text">Short Text</option>
                    <option value="Long Text">Long Text</option>
                    <option value="Number">Number</option>
                    <option value="Dropdown">Dropdown</option>
                    <option value="Yes/No">Yes/No</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Order</label>
                  <input
                    type="number"
                    value={editingField.display_order}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        display_order: parseInt(e.target.value || "10", 10),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditFieldModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#003B71] text-white font-black uppercase"
                >
                  Update Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingField && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <h3 className="text-base font-black text-slate-950">
              Delete Field &ldquo;{deletingField.label}&rdquo;?
            </h3>
            <p className="text-slate-600">
              Choose Deactivate to hide from forms while preserving historical data, or Permanently Delete.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingField(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingField}
                onClick={() => handleDeleteField(deletingField, true)}
                className="px-4 py-2 rounded-xl bg-[#F37021] text-white font-bold"
              >
                Deactivate
              </button>
              <button
                type="button"
                disabled={isDeletingField}
                onClick={() => handleDeleteField(deletingField, false)}
                className="px-4 py-2 rounded-xl bg-[#D81B60] text-white font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-bold text-slate-500">
          Loading Admin Suite...
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
