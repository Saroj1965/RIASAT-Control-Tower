"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  Sparkles,
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(true);

  // Auto-redirect straight to /executive so user never gets stuck
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/executive";
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleQuickEnter = async (roleName = "Vice Chairman", email = "vicechairman@riasat.ac.in", name = "Mr. Venkatesh Valluri") => {
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleName, email, name }),
      });
    } catch {
      // ignore
    }
    window.location.href = "/executive";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021]" />

        <div className="p-8 text-center">
          {/* Logo */}
          <div className="w-64 h-16 mx-auto mb-4 flex items-center justify-center">
            <img
              src="/ramaiah_logo.png"
              alt="Ramaiah Logo"
              className="w-full h-full object-contain max-h-16"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 tracking-wider uppercase mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Direct Executive Access Enabled</span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            RIASAT Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 mb-6">
            Ramaiah Institute for Advanced Skills &amp; Technology &bull; Password protection has been removed.
          </p>

          {/* Main Direct Enter Button */}
          <div className="mb-6">
            <Link
              href="/executive"
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#003B71] to-[#00284d] text-white font-bold text-sm shadow-md hover:shadow-lg hover:from-[#002d57] hover:to-[#001c36] transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Enter Executive Control Tower</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {/* Auto-redirect status indicator */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-6">
            <span className="inline-block w-2 h-2 rounded-full bg-[#003B71] animate-ping" />
            <span>Redirecting automatically to Executive Dashboard...</span>
          </div>

          {/* Quick 1-click Role Selector (Optional) */}
          <div className="pt-6 border-t border-slate-100 text-left">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
              Quick 1-Click Role Access (No Password Required)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickEnter("Vice Chairman", "vicechairman@riasat.ac.in", "Mr. Venkatesh Valluri")}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-[#003B71] hover:bg-slate-50 text-xs font-semibold text-slate-800 transition text-left cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#003B71] shrink-0" />
                <div>
                  <div className="font-bold">Vice Chairman</div>
                  <div className="text-[10px] text-slate-500">Mr. Venkatesh Valluri</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickEnter("Executive", "executive@riasat.ac.in", "Ms. Sarojini Mangalam")}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-[#D81B60] hover:bg-slate-50 text-xs font-semibold text-slate-800 transition text-left cursor-pointer"
              >
                <Users className="w-4 h-4 text-[#D81B60] shrink-0" />
                <div>
                  <div className="font-bold">Executive Office</div>
                  <div className="text-[10px] text-slate-500">Ms. Sarojini Mangalam</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
