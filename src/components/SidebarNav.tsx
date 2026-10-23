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
  Activity,
  CheckCircle,
  Sparkles,
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
      { label: "Departments Master", href: "/admin?tab=departments", icon: Building2 },
    ];
  } else if (role === ROLES.ADMIN || role === "Admin" || role === "System Administrator") {
    navItems = [
      { label: "Executive Dashboard", href: "/executive", icon: LayoutDashboard },
      { label: "Form Configuration", href: "/admin?tab=form_config", icon: Layers },
      { label: "User Management", href: "/admin?tab=users", icon: Users },
      { label: "Departments Master", href: "/admin?tab=departments", icon: Building2 },
      { label: "All Data & Reports", href: "/reports", icon: FileText },
    ];
  } else if (
    role === ROLES.VICE_CHAIRMAN ||
    role === "Vice Chairman" ||
    role === "Chairman"
  ) {
    navItems = [
      { label: "Executive Dashboard", href: "/executive", icon: LayoutDashboard },
      { label: "Form Configuration", href: "/admin?tab=form_config", icon: Layers },
      { label: "User Management", href: "/admin?tab=users", icon: Users },
      { label: "Departments Master", href: "/admin?tab=departments", icon: Building2 },
      { label: "Reports & Audit", href: "/reports", icon: FileText },
    ];
  } else if (role === ROLES.EXECUTIVE || role === "Executive") {
    navItems = [
      { label: "Executive Dashboard", href: "/executive", icon: LayoutDashboard },
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
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800 transition-all duration-300">
      {/* Brand Header with Logo */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex flex-col gap-2">
        <div className="bg-white rounded-xl p-2.5 shadow-sm flex items-center justify-center">
          <img
            src="/ramaiah_logo.png"
            alt="Ramaiah Logo"
            className="w-full h-auto max-h-12 object-contain"
          />
        </div>
        <div className="text-center mt-1">
          <div className="text-[11px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-pink-400 to-orange-400 tracking-wider uppercase">
            Control Tower Cockpit
          </div>
        </div>
      </div>

      {/* Role Pill */}
      <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-[11px] font-medium text-slate-400">Active Role</span>
        </div>
        <div className="text-xs font-bold text-white mt-0.5 truncate flex items-center justify-between">
          <span className="truncate">{user.role}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
            ONLINE
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400">
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
              className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-700 via-indigo-700 to-pink-700 text-white shadow-md shadow-blue-950/40"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                  isActive ? "text-orange-400" : "text-slate-400 group-hover:text-pink-400 group-hover:scale-110"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Synchronized Gateway Badge */}
      <div className="p-3.5 mx-3.5 mb-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>System Synchronized</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 leading-tight">
          Enterprise Decision Support &bull; Real-time Operations
        </p>
      </div>

      {/* Logout Button */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-900/60">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-900/40 rounded-xl transition-all duration-200"
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
