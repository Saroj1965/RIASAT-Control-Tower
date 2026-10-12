"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, ShieldCheck, Building } from "lucide-react";
import { SessionUser } from "@/lib/auth";

export default function HeaderBar({ user }: { user: SessionUser }) {
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

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div>
        <h1 className="text-sm font-bold text-slate-800 tracking-tight">
          Ramaiah Institute for Advanced Skills & Technology (RIASAT)
        </h1>
        <p className="text-[11px] text-slate-500">
          Executive Decision Support & Management Dashboard
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* User Card */}
        <div className="flex items-center gap-3 text-right">
          <div className="hidden sm:block">
            <div className="text-xs font-semibold text-slate-800">
              {user.name}
            </div>
            <div className="text-[11px] text-slate-500">
              {user.designation || user.role}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
            {user.name.charAt(0)}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
