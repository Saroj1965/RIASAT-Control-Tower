"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, User } from "lucide-react";
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
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Title & Responsive Brand */}
      <div className="flex items-center gap-3">
        <div className="md:hidden w-32 h-8 flex items-center">
          <img
            src="/ramaiah_logo.png"
            alt="Ramaiah Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-[#1e1b4b] tracking-tight">
              Ramaiah Institute for Advanced Skills &amp; Technology (RIASAT)
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 via-pink-600 to-orange-500 text-white">
              CONTROL TOWER
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Executive Decision Support &amp; Operational Management Dashboard
          </p>
        </div>
      </div>

      {/* User Card & Sign Out */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 text-right">
          <div className="hidden md:block">
            <div className="text-xs font-bold text-slate-900">
              {user.name}
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate max-w-[160px]">
              {user.designation || user.role}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 via-pink-600 to-orange-500 p-0.5 flex items-center justify-center shadow-xs">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-[#1e1b4b] font-extrabold text-xs">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
