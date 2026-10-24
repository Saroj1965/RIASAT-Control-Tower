"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileSpreadsheet,
  Settings,
  Cpu,
  Plane,
  Orbit,
  ShieldAlert,
  HeartPulse,
  Factory,
  Users,
  Megaphone,
  Briefcase,
  SlidersHorizontal,
  BarChart3,
  Layers,
  IndianRupee,
  ListChecks,
  Menu,
  X,
  UserCheck,
} from "lucide-react";
import { SessionUser } from "@/lib/auth";
import { ROLES, DEPARTMENTS } from "@/lib/constants";

const deptIcons: Record<string, React.ReactNode> = {
  SEMICON: <Cpu className="w-4 h-4" />,
  AERO_DEF: <Plane className="w-4 h-4" />,
  AERO_DEFENCE: <Plane className="w-4 h-4" />,
  SPACE: <Orbit className="w-4 h-4" />,
  CYBER: <ShieldAlert className="w-4 h-4" />,
  MEDTECH: <HeartPulse className="w-4 h-4" />,
  ADV_MFG: <Factory className="w-4 h-4" />,
  HR_REC: <Users className="w-4 h-4" />,
  COMM: <Megaphone className="w-4 h-4" />,
  STRATEGY_OPS: <Briefcase className="w-4 h-4" />,
  STRATEGY_PROCESS: <Briefcase className="w-4 h-4" />,
  EXEC_ADMIN: <Building2 className="w-4 h-4" />,
  VICE_CHAIRMAN: <UserCheck className="w-4 h-4" />,
};

function SidebarNavContent({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [departmentsList, setDepartmentsList] = useState<
    { id: number; name: string; code: string; head_of_department?: string }[]
  >([...DEPARTMENTS]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isFormAdmin =
    user.role === ROLES.FORM_ADMIN ||
    user.role === "Form Admin" ||
    user.role === "Forms Admin";
  const isUserAdmin =
    user.role === ROLES.USER_ADMIN ||
    user.role === "User Admin" ||
    user.role === "Users Admin";
  const isDeptAdmin =
    user.role === ROLES.DEPT_ADMIN ||
    user.role === "Department Admin" ||
    user.role === "Departments Admin";
  const isAnySpecializedAdmin = isFormAdmin || isUserAdmin || isDeptAdmin;

  const isViceChairmanOrAdmin =
    user.role === ROLES.VICE_CHAIRMAN ||
    user.role === "Vice Chairman" ||
    user.role === "Chairman" ||
    user.role === ROLES.ADMIN;

  const isExecutiveOrAbove =
    isViceChairmanOrAdmin || user.role === ROLES.EXECUTIVE;

  useEffect(() => {
    let isMounted = true;
    fetch("/api/departments")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.departments && Array.isArray(data.departments)) {
          setDepartmentsList(data.departments);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, searchParams]);

  const currentTab = searchParams?.get("tab") || "";
  const currentView = searchParams?.get("view") || "";

  const renderNavContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Top Gradient Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021]" />

      {/* Brand Logo */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <img
            src="/ramaiah_logo.png"
            alt="Ramaiah Logo"
            className="h-10 w-auto object-contain"
          />
          <div className="mt-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D81B60]" />
            <span className="text-[10px] font-black tracking-widest uppercase text-[#003B71]">
              RIASAT EXECUTIVE DASHBOARD
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto text-xs">
        {/* Riasat Executive Dashboard Sub-Pages (Available to all users) */}
        {!isAnySpecializedAdmin && (
          <div>
            <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Riasat Executive Dashboard
            </p>
            <div className="space-y-1">
              {[
                {
                  href: "/executive?view=actions",
                  label: "Action Register (Summary)",
                  icon: <ListChecks className="w-4 h-4" />,
                  active:
                    pathname === "/executive" &&
                    (!currentView || currentView === "actions"),
                },
                {
                  href: "/actions",
                  label: "All Actions Directory",
                  icon: <ListChecks className="w-4 h-4" />,
                  active: pathname.startsWith("/actions"),
                },
                {
                  href: "/departments-master",
                  label: "Departments & HODs (Edit)",
                  icon: <UserCheck className="w-4 h-4" />,
                  active:
                    pathname.startsWith("/departments-master") ||
                    (pathname === "/executive" && currentView === "departments_hod"),
                },
                {
                  href: "/executive?view=executive_dashboard",
                  label: "Executive Action Dashboard",
                  icon: <LayoutDashboard className="w-4 h-4" />,
                  active:
                    pathname === "/executive" &&
                    currentView === "executive_dashboard",
                },
                {
                  href: "/executive?view=verticals",
                  label: "Strategic Verticals",
                  icon: <Building2 className="w-4 h-4" />,
                  active:
                    pathname === "/executive" && currentView === "verticals",
                },
                {
                  href: "/executive?view=analytics_directives",
                  label: "Directives & RAG Analytics",
                  icon: <Layers className="w-4 h-4" />,
                  active:
                    pathname === "/executive" &&
                    currentView === "analytics_directives",
                },
                {
                  href: "/executive?view=analytics_readiness",
                  label: "Readiness Benchmark",
                  icon: <BarChart3 className="w-4 h-4" />,
                  active:
                    pathname === "/executive" &&
                    currentView === "analytics_readiness",
                },
                {
                  href: "/executive?view=analytics_financials",
                  label: "Capex & Revenue Pipeline",
                  icon: <IndianRupee className="w-4 h-4" />,
                  active:
                    pathname === "/executive" &&
                    currentView === "analytics_financials",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                    item.active
                      ? "bg-[#003B71] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#003B71] hover:bg-slate-50"
                  }`}
                >
                  <span className={item.active ? "text-[#F37021]" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Verticals & Departments (Available to all users) */}
        {!isAnySpecializedAdmin && (
          <div>
            <div className="px-3 flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Departments &amp; HODs ({departmentsList.length})
              </p>
              <Link
                href="/departments-master"
                className="text-[10px] font-black text-[#F37021] hover:underline"
              >
                Edit
              </Link>
            </div>
            <div className="space-y-1">
              {departmentsList.map((dept) => {
                const active = pathname === `/department/${dept.id}`;
                return (
                  <Link
                    key={dept.id}
                    href={`/department/${dept.id}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                      active
                        ? "bg-gradient-to-r from-[#003B71] to-[#D81B60] text-white shadow-xs"
                        : "text-slate-600 hover:text-[#003B71] hover:bg-slate-50"
                    }`}
                  >
                    <span className={active ? "text-white" : "text-slate-400"}>
                      {deptIcons[dept.code] || <Building2 className="w-4 h-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{dept.name}</div>
                      {dept.head_of_department && (
                        <div
                          className={`text-[10px] font-medium truncate ${
                            active ? "text-orange-200" : "text-slate-400"
                          }`}
                        >
                          HOD: {dept.head_of_department}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Reports, Guide & Admin Suite */}
        <div>
          <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Reports, Guide &amp; Governance
          </p>
          <div className="space-y-1">
            {!isAnySpecializedAdmin && (
              <>
                <Link
                  href="/reports"
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                    pathname.startsWith("/reports")
                      ? "bg-[#003B71] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#003B71] hover:bg-slate-50"
                  }`}
                >
                  <FileSpreadsheet
                    className={`w-4 h-4 ${
                      pathname.startsWith("/reports") ? "text-[#F37021]" : "text-slate-400"
                    }`}
                  />
                  <span>Reports &amp; CSV Export</span>
                </Link>
                <Link
                  href="/guidelines"
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                    pathname.startsWith("/guidelines")
                      ? "bg-[#003B71] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#003B71] hover:bg-slate-50"
                  }`}
                >
                  <Settings
                    className={`w-4 h-4 ${
                      pathname.startsWith("/guidelines") ? "text-[#F37021]" : "text-slate-400"
                    }`}
                  />
                  <span>How to Use / Guide</span>
                </Link>
              </>
            )}

              {(isViceChairmanOrAdmin || isUserAdmin) && (
                <Link
                  href="/admin?tab=users"
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                    pathname === "/admin" && (!currentTab || currentTab === "users")
                      ? "bg-[#003B71] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#003B71] hover:bg-slate-50"
                  }`}
                >
                  <Users className="w-4 h-4 text-[#F37021]" />
                  <span>User Management</span>
                </Link>
              )}

              <Link
                href="/admin?tab=departments"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                  pathname === "/admin" && currentTab === "departments"
                    ? "bg-[#003B71] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#003B71] hover:bg-slate-50"
                }`}
              >
                <Building2 className="w-4 h-4 text-[#D81B60]" />
                <span>Departments &amp; HODs Master</span>
              </Link>

              <Link
                href="/admin?tab=form_config"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                  pathname === "/admin" && currentTab === "form_config"
                    ? "bg-[#003B71] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#003B71] hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-[#003B71]" />
                <span>Form Configuration</span>
              </Link>

              {isViceChairmanOrAdmin && (
                <>
                  <Link
                    href="/admin?tab=analytics_directives"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                      pathname === "/admin" && currentTab === "analytics_directives"
                        ? "bg-[#003B71] text-white shadow-xs"
                        : "text-slate-600 hover:text-[#003B71] hover:bg-slate-50"
                    }`}
                  >
                    <Layers className="w-4 h-4 text-[#F37021]" />
                    <span>Admin: Directives Analytics</span>
                  </Link>
                  <Link
                    href="/admin?tab=analytics_readiness"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                      pathname === "/admin" && currentTab === "analytics_readiness"
                        ? "bg-[#003B71] text-white shadow-xs"
                        : "text-slate-600 hover:text-[#003B71] hover:bg-slate-50"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-[#D81B60]" />
                    <span>Admin: Readiness Analytics</span>
                  </Link>
                  <Link
                    href="/admin?tab=analytics_financials"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                      pathname === "/admin" && currentTab === "analytics_financials"
                        ? "bg-[#003B71] text-white shadow-xs"
                        : "text-slate-600 hover:text-[#003B71] hover:bg-slate-50"
                    }`}
                  >
                    <IndianRupee className="w-4 h-4 text-[#003B71]" />
                    <span>Admin: Financial Analytics</span>
                  </Link>
                </>
              )}
            </div>
          </div>
      </nav>

      {/* Bottom User Badge */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-slate-600 truncate">{user.role}</span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#003B71] text-white">
            ACTIVE
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Floating Menu Trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-5 right-5 z-40 p-3.5 rounded-2xl bg-[#003B71] text-white shadow-xl border border-white/20 cursor-pointer"
        title="Open Navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            {renderNavContent()}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-slate-200 hidden md:flex flex-col shrink-0 select-none">
        {renderNavContent()}
      </aside>
    </>
  );
}

export default function SidebarNav({ user }: { user: SessionUser }) {
  return (
    <Suspense fallback={<aside className="w-64 border-r border-slate-200 hidden md:flex flex-col shrink-0 bg-white" />}>
      <SidebarNavContent user={user} />
    </Suspense>
  );
}
