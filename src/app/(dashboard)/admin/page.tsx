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
  Shield,
  KeyRound,
  RefreshCw,
  Sliders,
  Filter,
  Search,
  Check,
  X,
  SlidersHorizontal,
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
  Tag,
  HelpCircle,
  Database,
  Upload,
  Trash2,
} from "lucide-react";
import { ROLES, DEPARTMENTS } from "@/lib/constants";

function AdminPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "departments" | "form_config">("users");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Database Backup & Import state
  const [importingDb, setImportingDb] = useState(false);
  const [exportingDb, setExportingDb] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
  const [deptForm, setDeptForm] = useState({
    name: "",
    code: "",
  });
  const [deptRagFilter, setDeptRagFilter] = useState<string>("ALL");
  const [deptSearch, setDeptSearch] = useState<string>("");

  // Form Configuration state
  const [selectedDeptId, setSelectedDeptId] = useState<string>("1");
  const [formFields, setFormFields] = useState<any[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [fieldStatusFilter, setFieldStatusFilter] = useState<string>("ALL"); // 'ALL', 'ACTIVE', 'INACTIVE'
  const [fieldMandatoryFilter, setFieldMandatoryFilter] = useState<string>("ALL"); // 'ALL', 'REQUIRED', 'OPTIONAL'
  const [fieldTypeFilter, setFieldTypeFilter] = useState<string>("ALL");
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
    field_type: "Short Text",
    required: false,
    display_order: 10,
    help_text: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile first
      let currentRole = "";
      try {
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user) {
            setCurrentUser(meData.user);
            currentRole = meData.user.role;
          }
        }
      } catch (meErr) {
        console.error("Failed to load user info:", meErr);
      }

      // Fetch departments (all admin roles need departments)
      const deptsRes = await fetch("/api/departments");
      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        const deptsList = deptsData.departments || [];
        setDepartments(deptsList);
        if (deptsList.length > 0 && !selectedDeptId) {
          setSelectedDeptId(deptsList[0].id.toString());
        }
      }

      // Only fetch users if current role has user management privileges
      const isNotUserViewer =
        currentRole === ROLES.FORM_ADMIN ||
        currentRole === "Form Admin" ||
        currentRole === "Forms Admin" ||
        currentRole === ROLES.DEPT_ADMIN ||
        currentRole === "Department Admin" ||
        currentRole === "Departments Admin";

      if (!isNotUserViewer) {
        try {
          const usersRes = await fetch("/api/admin/users");
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            setUsers(usersData.users || []);
          }
        } catch (uErr) {
          console.error("Failed to load users list:", uErr);
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
      const res = await fetch(`/api/admin/forms/fields?department_id=${deptId}`);
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

  // Sync activeTab with URL search parameters and user role
  useEffect(() => {
    const tabParam = searchParams ? (searchParams.get("tab") as "users" | "departments" | "form_config" | null) : null;
    const isFormAdmin = currentUser?.role === ROLES.FORM_ADMIN || currentUser?.role === "Form Admin" || currentUser?.role === "Forms Admin";
    const isUserAdmin = currentUser?.role === ROLES.USER_ADMIN || currentUser?.role === "User Admin" || currentUser?.role === "Users Admin";
    const isDeptAdmin = currentUser?.role === ROLES.DEPT_ADMIN || currentUser?.role === "Department Admin" || currentUser?.role === "Departments Admin";

    if (isFormAdmin) {
      setActiveTab("form_config");
    } else if (isUserAdmin) {
      setActiveTab("users");
    } else if (isDeptAdmin) {
      setActiveTab("departments");
    } else if (tabParam && ["users", "departments", "form_config"].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab("users");
    }
  }, [searchParams, currentUser]);

  const handleSwitchTab = (tab: "users" | "departments" | "form_config") => {
    setActiveTab(tab);
    router.push(`/admin?tab=${tab}`);
  };

  useEffect(() => {
    if (activeTab === "form_config" && selectedDeptId) {
      loadFormFields(selectedDeptId);
    }
  }, [activeTab, selectedDeptId]);

  // Open Create User Modal
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

  // Open Edit User Modal
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

  // Toggle user activation
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

  // Submit User form
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
      setSuccess(editingUser ? "User updated successfully!" : "New user created successfully!");
      setTimeout(() => setSuccess(null), 4000);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Submit Department form
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
      setSuccess(`Department "${deptForm.name}" created successfully!`);
      setTimeout(() => setSuccess(null), 4000);
      setDeptForm({ name: "", code: "" });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Database Export & Import Handlers
  const handleExportDatabase = async () => {
    try {
      setExportingDb(true);
      setError(null);

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

      setSuccess("Database backup exported successfully.");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Export failed");
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
      setError(null);

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

      setSuccess(data.message || "Database imported successfully!");
      setTimeout(() => setSuccess(null), 6000);
      loadData();
      if (selectedDeptId) loadFormFields(selectedDeptId);
    } catch (err: any) {
      setError(err.message || "Import failed");
    } finally {
      setImportingDb(false);
      e.target.value = "";
    }
  };

  // Open Add Field Modal
  const openAddFieldModal = () => {
    setNewFieldForm({
      department_id: selectedDeptId,
      label: "",
      field_type: "Short Text",
      required: false,
      display_order: (formFields.length + 1) * 10,
      help_text: "",
    });
    setShowAddFieldModal(true);
  };

  // Submit Create Field
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
      setSuccess(`Form field "${newFieldForm.label}" created successfully!`);
      setTimeout(() => setSuccess(null), 4000);
      loadFormFields(selectedDeptId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Open Edit / Modify Field Modal
  const openEditFieldModal = (f: any) => {
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
    });
    setShowEditFieldModal(true);
  };

  const openModifyFieldModal = (f: any) => {
    openEditFieldModal(f);
  };

  // Delete Form Field
  const handleDeleteField = async (f: any) => {
    if (!f || !f.id) return;
    setIsDeletingField(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/forms/fields?id=${f.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete form field");

      setDeletingField(null);
      setShowEditFieldModal(false);
      setSuccess(`Form field "${f.label}" deleted successfully!`);
      setTimeout(() => setSuccess(null), 4000);
      loadFormFields(selectedDeptId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeletingField(false);
    }
  };

  // Submit Edit Field
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
      setSuccess(`Form field updated successfully!`);
      setTimeout(() => setSuccess(null), 4000);
      loadFormFields(selectedDeptId);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Toggle field active/inactive directly
  const handleToggleFieldActive = async (f: any) => {
    const newActive = !f.active;
    const action = newActive ? "activated" : "deactivated";

    try {
      const res = await fetch("/api/admin/forms/fields", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: f.id,
          active: newActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update field status");

      setSuccess(`Field "${f.label}" ${action}!`);
      setTimeout(() => setSuccess(null), 4000);
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
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    if (userRoleFilter !== "ALL") {
      if (userRoleFilter === "VICE_CHAIRMAN" && !(u.role === ROLES.VICE_CHAIRMAN || u.role === "Vice Chairman" || u.role === "Chairman")) {
        return false;
      }
      if (userRoleFilter === "ADMIN" && u.role !== ROLES.ADMIN) {
        return false;
      }
      if (userRoleFilter === "EXECUTIVE" && u.role !== ROLES.EXECUTIVE) {
        return false;
      }
      if (userRoleFilter === "DEPARTMENT_HEAD" && u.role !== ROLES.DEPARTMENT_HEAD) {
        return false;
      }
    }
    if (userStatusFilter !== "ALL" && u.status !== userStatusFilter) {
      return false;
    }
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      const matchName = u.name && u.name.toLowerCase().includes(q);
      const matchEmail = u.email && u.email.toLowerCase().includes(q);
      const matchDept = u.department_name && u.department_name.toLowerCase().includes(q);
      const matchDesig = u.designation && u.designation.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchDept && !matchDesig) return false;
    }
    return true;
  });

  // Filtered Departments
  const filteredDepartments = departments.filter((d) => {
    if (deptRagFilter !== "ALL" && d.rag_status?.toUpperCase() !== deptRagFilter.toUpperCase()) {
      return false;
    }
    if (deptSearch.trim()) {
      const q = deptSearch.toLowerCase();
      const matchName = d.name && d.name.toLowerCase().includes(q);
      const matchCode = d.code && d.code.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  // Filtered Form Fields
  const filteredFormFields = formFields.filter((f) => {
    if (fieldStatusFilter === "ACTIVE" && !f.active) return false;
    if (fieldStatusFilter === "INACTIVE" && f.active) return false;
    if (fieldMandatoryFilter === "REQUIRED" && !f.required) return false;
    if (fieldMandatoryFilter === "OPTIONAL" && f.required) return false;
    if (fieldTypeFilter !== "ALL" && f.field_type !== fieldTypeFilter) return false;
    if (fieldSearch.trim()) {
      const q = fieldSearch.toLowerCase();
      const matchLabel = f.label && f.label.toLowerCase().includes(q);
      const matchKey = f.field_key && f.field_key.toLowerCase().includes(q);
      const matchHelp = f.help_text && f.help_text.toLowerCase().includes(q);
      if (!matchLabel && !matchKey && !matchHelp) return false;
    }
    return true;
  });

  const selectedDepartmentName = departments.find((d) => d.id.toString() === selectedDeptId)?.name || "Selected Vertical";

  const isFormAdmin = currentUser?.role === ROLES.FORM_ADMIN || currentUser?.role === "Form Admin" || currentUser?.role === "Forms Admin";
  const isUserAdmin = currentUser?.role === ROLES.USER_ADMIN || currentUser?.role === "User Admin" || currentUser?.role === "Users Admin";
  const isDeptAdmin = currentUser?.role === ROLES.DEPT_ADMIN || currentUser?.role === "Department Admin" || currentUser?.role === "Departments Admin";
  const isSuperAdmin = !isFormAdmin && !isUserAdmin && !isDeptAdmin;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isFormAdmin
              ? "Dynamic Form Configuration"
              : isUserAdmin
              ? "User Access & Role Management"
              : isDeptAdmin
              ? "Departments Master Management"
              : "Admin System Management"}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {isFormAdmin
              ? "Dynamic headings, field data types, validations, and custom trackers across all 9 verticals"
              : isUserAdmin
              ? "User provisioning, department assignments, and credential access control"
              : isDeptAdmin
              ? "Vertical domains, codes, organizational master structure, and health status"
              : "User access provisioning, role enforcement, dynamic form headings, and departmental governance"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              loadData();
              if (activeTab === "form_config") loadFormFields(selectedDeptId);
            }}
            disabled={loading || loadingFields}
            className="p-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading || loadingFields ? "animate-spin" : ""}`} />
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleExportDatabase}
              disabled={exportingDb}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
              title="Download complete PostgreSQL database backup JSON"
            >
              {exportingDb ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Database className="w-3.5 h-3.5" />
              )}
              <span>Export Database</span>
            </button>
          )}

          {activeTab === "users" && (isSuperAdmin || isUserAdmin) && (
            <button
              onClick={openCreateUserModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Create User</span>
            </button>
          )}
          {activeTab === "departments" && (isSuperAdmin || isDeptAdmin) && (
            <button
              onClick={() => setShowDeptModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Department</span>
            </button>
          )}
          {activeTab === "form_config" && (isSuperAdmin || isFormAdmin) && (
            <button
              onClick={openAddFieldModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Form Field</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(isSuperAdmin || isUserAdmin) && (
          <button
            onClick={() => handleSwitchTab("users")}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "users"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Management ({users.length})</span>
          </button>
        )}
        {(isSuperAdmin || isDeptAdmin) && (
          <button
            onClick={() => handleSwitchTab("departments")}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "departments"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Departments ({departments.length})</span>
          </button>
        )}
        {(isSuperAdmin || isFormAdmin) && (
          <button
            onClick={() => handleSwitchTab("form_config")}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === "form_config"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Form Configuration ({formFields.length})</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: USER MANAGEMENT WITH FILTER BUTTONS */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* USER FILTER CONTROLS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Role filter buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Role:
                </span>
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      userRoleFilter === item.id
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Status filter buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Status:
                </span>
                {[
                  { id: "ALL", label: "All" },
                  { id: "Active", label: "Active" },
                  { id: "Inactive", label: "Inactive" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setUserStatusFilter(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      userStatusFilter === item.id
                        ? item.id === "Active"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : item.id === "Inactive"
                          ? "bg-rose-600 text-white shadow-xs"
                          : "bg-slate-800 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search users by name, email, designation, or department..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
              />
              {userSearch && (
                <button
                  onClick={() => setUserSearch("")}
                  className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* USERS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  User Accounts ({filteredUsers.length})
                </h2>
                <p className="text-xs text-slate-500">
                  {userRoleFilter !== "ALL" || userStatusFilter !== "ALL" || userSearch
                    ? "Filtered view of active and provisioned accounts"
                    : "Manage roles, department assignments, and login access"}
                </p>
              </div>
              <button
                onClick={openCreateUserModal}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                + Create User
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Last Login</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        No users match the active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                          <div>{u.name}</div>
                          <div className="text-[11px] font-normal text-slate-400">
                            {u.designation || "--"}
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                          {u.email}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-md border ${
                              u.role === ROLES.VICE_CHAIRMAN || u.role === "Vice Chairman" || u.role === "Chairman"
                                ? "bg-indigo-100 text-indigo-900 border-indigo-300 font-extrabold"
                                : u.role === ROLES.ADMIN
                                ? "bg-purple-100 text-purple-800 border-purple-300 font-bold"
                                : u.role === ROLES.EXECUTIVE
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : "bg-slate-100 text-slate-800 border-slate-300"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-700 whitespace-nowrap font-medium">
                          {u.department_name || (u.role === ROLES.ADMIN || u.role === ROLES.VICE_CHAIRMAN || u.role === "Vice Chairman" || u.role === "Chairman" || u.role === ROLES.EXECUTIVE ? "All Departments" : "None")}
                        </td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              u.status === "Active"
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                                : "bg-rose-100 text-rose-700 border border-rose-300"
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                          {formatDate(u.last_login)}
                        </td>
                        <td className="px-6 py-3.5 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => openEditUserModal(u)}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                              u.status === "Active"
                                ? "text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                                : "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                            }`}
                          >
                            {u.status === "Active" ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DEPARTMENTS MASTER TABLE WITH FILTER BUTTONS */}
      {/* ========================================================================= */}
      {activeTab === "departments" && (
        <div className="space-y-4">
          {/* DEPARTMENT FILTER CONTROLS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> RAG Health:
                </span>
                {[
                  { id: "ALL", label: `All (${departments.length})` },
                  { id: "GREEN", label: "Green" },
                  { id: "AMBER", label: "Amber" },
                  { id: "RED", label: "Red" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setDeptRagFilter(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      deptRagFilter === item.id
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
              </div>

              {/* Department Search */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search department name or code..."
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Configured Verticals & Domains ({filteredDepartments.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Add and configure departments dynamically without rebuilding
                </p>
              </div>
              <button
                onClick={() => setShowDeptModal(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                + Add Department
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">ID</th>
                    <th className="px-6 py-3.5">Department Name</th>
                    <th className="px-6 py-3.5">Code</th>
                    <th className="px-6 py-3.5">Readiness</th>
                    <th className="px-6 py-3.5">RAG Status</th>
                    <th className="px-6 py-3.5">Total Workstreams</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDepartments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        No departments match the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-3.5 font-mono text-slate-500">{d.id}</td>
                        <td className="px-6 py-3.5 font-bold text-slate-900">{d.name}</td>
                        <td className="px-6 py-3.5 font-mono text-slate-600 font-semibold">{d.code}</td>
                        <td className="px-6 py-3.5 font-bold text-slate-800">{d.readiness_percentage}%</td>
                        <td className="px-6 py-3.5">
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
                        <td className="px-6 py-3.5 font-semibold text-slate-700">{d.stats?.total || 0}</td>
                        <td className="px-6 py-3.5">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DYNAMIC FORM CONFIGURATION (ADMIN -> FORM CONFIGURATION) */}
      {/* ========================================================================= */}
      {activeTab === "form_config" && (
        <div className="space-y-6">
          {/* VERTICAL SELECTOR & CONTROLS BANNER */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                  Dynamic Form Configuration
                </h2>
                <p className="text-xs text-slate-500">
                  Modify form headings, labels, field types, and add new fields without changing code or database columns
                </p>
              </div>

              {/* Vertical selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Select Vertical:</span>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-indigo-300 bg-indigo-50/50 text-indigo-900 font-bold text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id.toString()}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* FILTER BUTTONS ROW */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              {/* Status filter buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Status:
                </span>
                {[
                  { id: "ALL", label: `All Fields (${formFields.length})` },
                  { id: "ACTIVE", label: "Active" },
                  { id: "INACTIVE", label: "Inactive" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFieldStatusFilter(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      fieldStatusFilter === item.id
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                <span className="text-slate-300 mx-1">|</span>

                {/* Mandatory filter buttons */}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Required:
                </span>
                {[
                  { id: "ALL", label: "All" },
                  { id: "REQUIRED", label: "Mandatory" },
                  { id: "OPTIONAL", label: "Optional" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFieldMandatoryFilter(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      fieldMandatoryFilter === item.id
                        ? "bg-slate-800 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Search Field Input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter fields by heading/label..."
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* FIELDS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Active Web Form Fields for: <span className="text-indigo-600 font-extrabold">{selectedDepartmentName}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Headings and labels appear directly in the Department Head data entry form
                </p>
              </div>

              <button
                onClick={openAddFieldModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add New Field</span>
              </button>
            </div>

            {loadingFields ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs font-semibold">Loading configurable fields...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3 text-center">Order</th>
                      <th className="px-5 py-3">Field Heading / Label</th>
                      <th className="px-5 py-3">Internal Key</th>
                      <th className="px-5 py-3">Field Type</th>
                      <th className="px-5 py-3">Mandatory</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredFormFields.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                          No form fields found matching criteria. Click "+ Add New Field" to configure one.
                        </td>
                      </tr>
                    ) : (
                      filteredFormFields.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-5 py-3 text-center font-mono font-bold text-slate-500">
                            {f.display_order}
                          </td>
                          <td className="px-5 py-3 font-bold text-slate-900">
                            <div>{f.label}</div>
                            {f.help_text && (
                              <div className="text-[11px] font-normal text-slate-400 flex items-center gap-1 mt-0.5">
                                <HelpCircle className="w-3 h-3 text-slate-400 inline" />
                                {f.help_text}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3 font-mono text-[11px] text-slate-500">
                            <span className="px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-700">
                              {f.field_key}
                            </span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                              {f.field_type}
                            </span>
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {f.required ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-300">
                                Required
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">Optional</span>
                            )}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleFieldActive(f)}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition ${
                                f.active
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                              }`}
                              title="Click to toggle active/inactive"
                            >
                              {f.active ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditFieldModal(f)}
                                className="px-2.5 py-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition inline-flex items-center gap-1 shadow-2xs"
                                title="Edit field heading / label"
                              >
                                <Edit2 className="w-3 h-3 text-indigo-600" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => openModifyFieldModal(f)}
                                className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition inline-flex items-center gap-1 shadow-2xs"
                                title="Modify field configuration, type, order and properties"
                              >
                                <Sliders className="w-3 h-3 text-slate-500" />
                                <span>Modify</span>
                              </button>
                              <button
                                onClick={() => setDeletingField(f)}
                                className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition inline-flex items-center gap-1 shadow-2xs"
                                title="Delete this field from web form"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE USER */}
      {/* ========================================================================= */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingUser ? "Edit User Account" : "+ Create User Account"}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Assign roles, credentials, and departmental permissions
            </p>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                  User Information
                </h4>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    required
                    placeholder="e.g. Dr. Ramesh Gupta"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      required
                      placeholder="e.g. user@riasat.ac.in"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Mobile Number</label>
                    <input
                      type="text"
                      value={userForm.mobile}
                      onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Designation</label>
                  <input
                    type="text"
                    value={userForm.designation}
                    onChange={(e) => setUserForm({ ...userForm, designation: e.target.value })}
                    placeholder="e.g. Head of Semiconductor Domain"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                  Access & Permissions
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Role</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 font-semibold"
                    >
                      <option value={ROLES.VICE_CHAIRMAN}>Vice Chairman (Complete Access)</option>
                      <option value={ROLES.ADMIN}>Admin (Complete Access)</option>
                      <option value={ROLES.EXECUTIVE}>Executive Office (Read-Only)</option>
                      <option value={ROLES.DEPARTMENT_HEAD}>Department Head</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Status</label>
                    <select
                      value={userForm.status}
                      onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 font-semibold"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Assigned Department
                  </label>
                  <select
                    value={userForm.department_id}
                    onChange={(e) => setUserForm({ ...userForm, department_id: e.target.value })}
                    disabled={userForm.role === ROLES.ADMIN || userForm.role === ROLES.VICE_CHAIRMAN || userForm.role === "Vice Chairman" || userForm.role === "Chairman" || userForm.role === ROLES.EXECUTIVE}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-100"
                  >
                    {userForm.role === ROLES.ADMIN || userForm.role === ROLES.VICE_CHAIRMAN || userForm.role === "Vice Chairman" || userForm.role === "Chairman" || userForm.role === ROLES.EXECUTIVE ? (
                      <option value="">All Departments (Complete Leadership Oversight)</option>
                    ) : (
                      departments.map((d) => (
                        <option key={d.id} value={d.id.toString()}>
                          {d.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    {editingUser ? "Reset Password (leave blank to keep current)" : "Password"}
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder={editingUser ? "Leave blank to keep unchanged" : "••••••••••••"}
                    required={!editingUser}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition"
                >
                  {editingUser ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD DEPARTMENT */}
      {/* ========================================================================= */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">+ Add New Department</h3>
            <p className="text-xs text-slate-500 mb-5">
              Dynamically add a new strategic domain or school to RIASAT
            </p>

            <form onSubmit={handleCreateDept} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Department Name</label>
                <input
                  type="text"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  required
                  placeholder="e.g. Energy & CleanTech"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Department Code</label>
                <input
                  type="text"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="e.g. CLEAN_TECH"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD FORM FIELD (DYNAMIC FORM CONFIGURATION) */}
      {/* ========================================================================= */}
      {showAddFieldModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">+ Add New Dynamic Form Field</h3>
            <p className="text-xs text-slate-500 mb-5">
              Add a new heading / input field for <strong className="text-indigo-600">{selectedDepartmentName}</strong> without modifying code
            </p>

            <form onSubmit={handleCreateField} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Field Label / Heading</label>
                <input
                  type="text"
                  value={newFieldForm.label}
                  onChange={(e) => setNewFieldForm({ ...newFieldForm, label: e.target.value })}
                  required
                  placeholder="e.g. Cleanroom Facility Readiness or Key Partner"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Field Type</label>
                  <select
                    value={newFieldForm.field_type}
                    onChange={(e) => setNewFieldForm({ ...newFieldForm, field_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 font-medium"
                  >
                    <option value="Short Text">Short Text</option>
                    <option value="Long Text">Long Text</option>
                    <option value="Number">Number</option>
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Currency">Currency (₹ Cr / LPA)</option>
                    <option value="Date">Date</option>
                    <option value="Dropdown">Dropdown</option>
                    <option value="Yes/No">Yes/No</option>
                    <option value="RAG Status">RAG Status (Green/Amber/Red)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={newFieldForm.display_order}
                    onChange={(e) => setNewFieldForm({ ...newFieldForm, display_order: parseInt(e.target.value || "10", 10) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Help Text / Description (Optional)</label>
                <input
                  type="text"
                  value={newFieldForm.help_text}
                  onChange={(e) => setNewFieldForm({ ...newFieldForm, help_text: e.target.value })}
                  placeholder="e.g. Provide the current setup status and validation timeline"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="req_checkbox"
                  checked={newFieldForm.required}
                  onChange={(e) => setNewFieldForm({ ...newFieldForm, required: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="req_checkbox" className="font-semibold text-slate-700">
                  Mandatory field (Department Head must fill before submit)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddFieldModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs transition"
                >
                  Create Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT FORM FIELD HEADING / CONFIGURATION */}
      {/* ========================================================================= */}
      {showEditFieldModal && editingField && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Edit & Modify Field Configuration</h3>
                <p className="text-xs text-slate-500">
                  Modify heading, field type, display order, help text, or delete this field if not needed.
                </p>
              </div>
              {editingField.field_key && (
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md font-mono text-[11px] border border-slate-200">
                  Key: {editingField.field_key}
                </span>
              )}
            </div>

            <form onSubmit={handleSaveEditField} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Field Label / Heading</label>
                <input
                  type="text"
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Field Type</label>
                  <select
                    value={editingField.field_type}
                    onChange={(e) => setEditingField({ ...editingField, field_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 font-medium"
                  >
                    <option value="Short Text">Short Text</option>
                    <option value="Long Text">Long Text</option>
                    <option value="Number">Number</option>
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Currency">Currency (₹ Cr / LPA)</option>
                    <option value="Date">Date</option>
                    <option value="Dropdown">Dropdown</option>
                    <option value="Yes/No">Yes/No</option>
                    <option value="RAG Status">RAG Status (Green/Amber/Red)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingField.display_order}
                    onChange={(e) => setEditingField({ ...editingField, display_order: parseInt(e.target.value || "10", 10) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Help Text / Description</label>
                <input
                  type="text"
                  value={editingField.help_text}
                  onChange={(e) => setEditingField({ ...editingField, help_text: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit_req_checkbox"
                    checked={editingField.required}
                    onChange={(e) => setEditingField({ ...editingField, required: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="edit_req_checkbox" className="font-semibold text-slate-700">
                    Mandatory Field
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit_active_checkbox"
                    checked={editingField.active}
                    onChange={(e) => setEditingField({ ...editingField, active: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <label htmlFor="edit_active_checkbox" className="font-semibold text-slate-700">
                    Active on Form
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingField(editingField)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold text-xs transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Field</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowEditFieldModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition text-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Modify Field</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE FORM FIELD CONFIRMATION */}
      {/* ========================================================================= */}
      {deletingField && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Form Field</h3>
                <p className="text-xs text-slate-500">Confirm deletion of field from web form</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Field Heading / Label:</span>
                <strong className="text-slate-900 font-bold">{deletingField.label}</strong>
              </div>
              {deletingField.field_key && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Internal Storage Key:</span>
                  <code className="text-indigo-600 font-mono font-bold">{deletingField.field_key}</code>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="text-slate-800 font-semibold">{selectedDepartmentName}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this field? If you do not feel this field is right, deleting it will remove it permanently from the Department Head data entry form.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeletingField}
                onClick={() => setDeletingField(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingField}
                onClick={() => handleDeleteField(deletingField)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                {isDeletingField ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Yes, Delete Field</span>
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
        <div className="flex items-center justify-center p-12">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
