"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, BookOpen, FileBarChart, LayoutDashboard, ListChecks, UserCheck, Building2 } from "lucide-react";
import { SessionUser } from "@/lib/auth";

export default function HeaderBar({ user }: { user: SessionUser }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
      {/* Title & Responsive Brand */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="md:hidden w-28 h-8 flex items-center shrink-0">
          <img
            src="/ramaiah_logo.png"
            alt="Ramaiah Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="hidden sm:block min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black text-slate-950 tracking-tight truncate">
              Riasat Executive Dashboard
            </h1>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white shrink-0">
              RAMAIAH (RIASAT)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate">
            Weekly Departmental Action Register &amp; Executive Action Dashboard
          </p>
        </div>
      </div>

      {/* Top Navigation Links matching Riasat Executive Dashboard */}
      <nav className="hidden lg:flex items-center gap-1.5 shrink-0">
        <Link
          href="/executive?view=actions"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            pathname === "/executive"
              ? "bg-[#003B71] text-white"
              : "text-slate-700 hover:bg-slate-100 hover:text-[#003B71]"
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          Action Register
        </Link>
        <Link
          href="/actions"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            pathname.startsWith("/actions")
              ? "bg-[#003B71] text-white"
              : "text-slate-700 hover:bg-slate-100 hover:text-[#003B71]"
          }`}
        >
          <ListChecks className="w-3.5 h-3.5 text-[#D81B60]" />
          All Actions
        </Link>
        <Link
          href="/departments-master"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            pathname.startsWith("/departments-master")
              ? "bg-[#003B71] text-white"
              : "text-slate-700 hover:bg-slate-100 hover:text-[#003B71]"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-[#F37021]" />
          Departments &amp; HODs
        </Link>
        <Link
          href="/executive?view=executive_dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-[#003B71] transition"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-[#D81B60]" />
          Executive Dashboard
        </Link>
        <Link
          href="/reports"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            pathname.startsWith("/reports")
              ? "bg-[#003B71] text-white"
              : "text-slate-700 hover:bg-slate-100 hover:text-[#003B71]"
          }`}
        >
          <FileBarChart className="w-3.5 h-3.5 text-[#F37021]" />
          Reports
        </Link>
        <Link
          href="/guidelines"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            pathname.startsWith("/guidelines")
              ? "bg-[#003B71] text-white"
              : "text-slate-700 hover:bg-slate-100 hover:text-[#003B71]"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#003B71]" />
          How to Use
        </Link>
      </nav>

      {/* User Card & Sign Out */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5 text-right">
          <div className="hidden md:block">
            <div className="text-xs font-black text-slate-900">{user.name}</div>
            <div className="text-[10px] text-[#003B71] font-bold truncate max-w-[160px]">
              {user.designation || user.role}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#003B71] via-[#D81B60] to-[#F37021] p-0.5 flex items-center justify-center shadow-xs">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-slate-950 font-black text-xs">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 rounded-xl text-slate-500 hover:text-[#D81B60] hover:bg-[#D81B60]/10 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
