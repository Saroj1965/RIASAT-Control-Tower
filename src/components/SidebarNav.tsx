"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  LogOut,
  Layers,
  Shield,
  Activity,
} from "lucide-react";
import { ROLES } from "@/lib/constants";
import { SessionUser } from "@/lib/auth";

function SidebarNavContent({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  // Define navigation items based on role
  let navItems: { label: string; href: string; icon: any }[] = [];

  const role = user.role;

  if (role === ROLES.FORM_ADMIN || role === "Form Admin" || role === "Forms Admin") {
    navItems = [
      { label: "Form Configuration", href: "/admin?tab=form_config", icon: Layers },
    ];
  } else if (role === ROLES.USER_ADMIN || role === "User Admin" || role === "Users Admin") {
    navItems = [
      { label: "User Management", href: "/admin?tab=users", icon: Users },
    ];
  } else if (role === ROLES.DEPT_ADMIN || role === "Department Admin" || role === "Departments Admin") {
    navItems = [
      { label: "Departments", href: "/admin?tab=departments", icon: Building2 },
    ];
  } else if (role === ROLES.ADMIN || role === "Admin" || role === "System Administrator") {
    navItems = [
      { label: "Executive Tower", href: "/executive", icon: LayoutDashboard },
      { label: "Form Configuration", href: "/admin?tab=form_config", icon: Layers },
      { label: "User Management", href: "/admin?tab=users", icon: Users },
      { label: "Departments", href: "/admin?tab=departments", icon: Building2 },
      { label: "All Data & Reports", href: "/reports", icon: FileText },
    ];
  } else if (
    role === ROLES.VICE_CHAIRMAN ||
    role === "Vice Chairman" ||
    role === "Chairman"
  ) {
    navItems = [
      { label: "Executive Tower", href: "/executive", icon: LayoutDashboard },
      { label: "Form Configuration", href: "/admin?tab=form_config", icon: Layers },
      { label: "User Management", href: "/admin?tab=users", icon: Users },
      { label: "Departments", href: "/admin?tab=departments", icon: Building2 },
      { label: "Reports & Audit", href: "/reports", icon: FileText },
    ];
  } else if (role === ROLES.EXECUTIVE || role === "Executive") {
    navItems = [
      { label: "Executive Tower", href: "/executive", icon: LayoutDashboard },
      { label: "Departments", href: "/executive#departments", icon: Building2 },
      { label: "Reports & Logs", href: "/reports", icon: FileText },
    ];
  } else if (role === ROLES.DEPARTMENT_HEAD || role === "Department Head") {
    const deptPath = `/department/${user.department_id || 1}`;
    navItems = [
      { label: "My Department", href: deptPath, icon: Building2 },
      { label: "Department Update Form", href: `${deptPath}#form`, icon: FileText },
      { label: "Workstream Tracker", href: `${deptPath}#workstreams`, icon: Layers },
      { label: "Reports & Audit", href: "/reports", icon: Activity },
    ];
  }

  const currentTab = searchParams ? (searchParams.get("tab") || "users") : "users";

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg overflow-hidden bg-white p-0.5 shrink-0 ring-1 ring-white/20"
          style={{ width: 40, height: 40, minWidth: 40, minHeight: 40 }}
        >
          <img
            src="/riasat_logo.jpg"
            alt="RIASAT"
            width={40}
            height={40}
            style={{ width: 40, height: 40, objectFit: "contain" }}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-white text-sm tracking-tight truncate">
            RIASAT
          </div>
          <div className="text-[11px] text-indigo-300 font-medium tracking-wide uppercase truncate">
            Control Tower
          </div>
        </div>
      </div>

      {/* Role Pill */}
      <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-400">Logged in as</span>
        </div>
        <div className="text-xs font-semibold text-white mt-0.5 truncate">
          {user.role}
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          let isActive = false;

          if (item.href.includes("?tab=")) {
            const urlTab = item.href.split("?tab=")[1]?.split("#")[0];
            isActive = pathname === "/admin" && currentTab === urlTab;
          } else {
            const basePath = item.href.split("?")[0].split("#")[0];
            isActive = pathname === basePath;
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Live DB Indicator */}
      <div className="p-4 mx-4 mb-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="flex items-center gap-1.5 text-indigo-300 font-medium text-[11px]">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>PostgreSQL Active</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 leading-tight">
          Single Source of Truth. Live updates synchronized.
        </p>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default function SidebarNav({ user }: { user: SessionUser }) {
  return (
    <Suspense
      fallback={
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800 p-6">
          <div className="text-white text-sm font-bold">RIASAT Control Tower</div>
        </aside>
      }
    >
      <SidebarNavContent user={user} />
    </Suspense>
  );
}
