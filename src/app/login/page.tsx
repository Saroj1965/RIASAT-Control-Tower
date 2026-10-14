"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Building2, User, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Use window.location.href to guarantee full document reload with session cookies attached
      window.location.href = data.redirectUrl || "/executive";
    } catch (err: any) {
      setError(err.message || "Failed to log in");
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center px-4 py-8">
      {/* Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header with Logo */}
        <div className="bg-slate-900 px-8 pt-8 pb-6 text-center border-b border-slate-800">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden ring-2 ring-indigo-500/50 shadow-lg bg-white p-1" style={{ width: 64, height: 64, minWidth: 64, minHeight: 64 }}>
              <img
                src="/riasat_logo.jpg"
                alt="RIASAT Logo"
                width={64}
                height={64}
                style={{ width: 64, height: 64, objectFit: "contain" }}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            RIASAT Executive Dashboard
          </h1>
          <p className="text-xs text-indigo-200 mt-1 uppercase tracking-wider font-medium">
            Ramaiah Institute for Advanced Skills & Technology
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. semicon.head@riasat.ac.in"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-indigo-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Institutional Role Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-3">
              Institutional Role Credentials (Click to populate)
            </p>
            <div className="space-y-3">
              {/* Leadership accounts */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setDemoAccount("vicechairman@riasat.ac.in", "ViceChairman@123")}
                  className="text-left p-2 rounded-lg border border-indigo-300 bg-indigo-50/70 hover:border-indigo-500 hover:bg-indigo-100/70 transition col-span-2"
                >
                  <div className="font-bold text-indigo-900 flex items-center justify-between">
                    <span>Vice Chairman</span>
                    <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold">COMPLETE ACCESS</span>
                  </div>
                  <div className="text-[11px] text-indigo-700">vicechairman@riasat.ac.in • ViceChairman@123</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount("admin@riasat.ac.in", "Admin@123")}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition"
                >
                  <div className="font-semibold text-slate-800 flex items-center justify-between">
                    <span>Admin</span>
                    <span className="text-[9px] bg-purple-600 text-white px-1 rounded">ALL</span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">admin@riasat.ac.in</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount("executive@riasat.ac.in", "Exec@123")}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition"
                >
                  <div className="font-semibold text-slate-800">Executive Office</div>
                  <div className="text-[11px] text-slate-500 truncate">executive@riasat.ac.in</div>
                </button>
              </div>

              {/* 3 Dedicated Administrative Accounts */}
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-1">
                3 Dedicated Admin Roles (Separate Logins):
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setDemoAccount("forms.admin@riasat.ac.in", "Forms@123")}
                  className="text-left p-2 rounded-lg border border-emerald-200 bg-emerald-50/40 hover:border-emerald-400 hover:bg-emerald-50 transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
                      <span>Form Configuration Admin</span>
                      <span className="text-[9px] bg-emerald-600 text-white px-1 rounded font-bold">TAB 1</span>
                    </div>
                    <div className="text-[11px] text-emerald-800">forms.admin@riasat.ac.in • Forms@123</div>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">Form Config Only &rarr;</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount("users.admin@riasat.ac.in", "Users@123")}
                  className="text-left p-2 rounded-lg border border-purple-200 bg-purple-50/40 hover:border-purple-400 hover:bg-purple-50 transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-purple-950 flex items-center gap-1.5">
                      <span>User Management Admin</span>
                      <span className="text-[9px] bg-purple-600 text-white px-1 rounded font-bold">TAB 2</span>
                    </div>
                    <div className="text-[11px] text-purple-800">users.admin@riasat.ac.in • Users@123</div>
                  </div>
                  <span className="text-[10px] text-purple-700 font-medium">User Mgmt Only &rarr;</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount("dept.admin@riasat.ac.in", "Dept@123")}
                  className="text-left p-2 rounded-lg border border-blue-200 bg-blue-50/40 hover:border-blue-400 hover:bg-blue-50 transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-blue-950 flex items-center gap-1.5">
                      <span>Departments Master Admin</span>
                      <span className="text-[9px] bg-blue-600 text-white px-1 rounded font-bold">TAB 3</span>
                    </div>
                    <div className="text-[11px] text-blue-800">dept.admin@riasat.ac.in • Dept@123</div>
                  </div>
                  <span className="text-[10px] text-blue-700 font-medium">Departments Only &rarr;</span>
                </button>
              </div>

              {/* 9 Verticals / Department Heads */}
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-1">
                9 Vertical Department Heads:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setDemoAccount("semicon.head@riasat.ac.in", "Semicon@123")}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition"
                >
                  <div className="font-semibold text-slate-800">1. Semicon Head</div>
                  <div className="text-[11px] text-slate-500 truncate">semicon.head@riasat.ac.in</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount("aero.head@riasat.ac.in", "Aero@123")}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition"
                >
                  <div className="font-semibold text-slate-800">2. Aerospace & Defence</div>
                  <div className="text-[11px] text-slate-500 truncate">aero.head@riasat.ac.in</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount("space.head@riasat.ac.in", "Space@123")}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition"
                >
                  <div className="font-semibold text-slate-800">3. Space Head</div>
                  <div className="text-[11px] text-slate-500 truncate">space.head@riasat.ac.in</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount("cyber.head@riasat.ac.in", "Cyber@123")}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition"
                >
                  <div className="font-semibold text-slate-800">4. Cybersecurity Head</div>
                  <div className="text-[11px] text-slate-500 truncate">cyber.head@riasat.ac.in</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount("medtech.head@riasat.ac.in", "MedTech@123")}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition"
                >
                  <div className="font-semibold text-slate-800">5. MedTech Head</div>
                  <div className="text-[11px] text-slate-500 truncate">medtech.head@riasat.ac.in</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount("mfg.head@riasat.ac.in", "Mfg@123")}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition"
                >
                  <div className="font-semibold text-slate-800">6. Advanced Mfg Head</div>
                  <div className="text-[11px] text-slate-500 truncate">mfg.head@riasat.ac.in</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount("hr.head@riasat.ac.in", "Hr@123")}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition"
                >
                  <div className="font-semibold text-slate-800">7. HR & Recruitment</div>
                  <div className="text-[11px] text-slate-500 truncate">hr.head@riasat.ac.in</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount("comm.head@riasat.ac.in", "Comm@123")}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition"
                >
                  <div className="font-semibold text-slate-800">8. Communications</div>
                  <div className="text-[11px] text-slate-500 truncate">comm.head@riasat.ac.in</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAccount("ops.head@riasat.ac.in", "Ops@123")}
                  className="text-left p-2 rounded-lg border border-indigo-200 bg-indigo-50/30 hover:border-indigo-400 hover:bg-indigo-50/70 transition col-span-2"
                >
                  <div className="font-semibold text-indigo-900 flex items-center justify-between">
                    <span>9. Strategy & Operations Head</span>
                    <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold">VERTICAL 9</span>
                  </div>
                  <div className="text-[11px] text-indigo-600 truncate">ops.head@riasat.ac.in</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-3 text-center border-t border-slate-100">
          <p className="text-[11px] text-slate-500">
            PostgreSQL Live Database • Single Source of Truth
          </p>
        </div>
      </div>
    </div>
  );
}
