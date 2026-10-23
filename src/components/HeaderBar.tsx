"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
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
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
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
              Ramaiah Institute for Advanced Skills &amp; Technology (RIASAT)
            </h1>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white shrink-0">
              CONTROL TOWER
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate">
            Executive Decision Support &amp; Operational Management Dashboard
          </p>
        </div>
      </div>

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
