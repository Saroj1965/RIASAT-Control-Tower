"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  X,
  Search,
  CheckCircle2,
  Shield,
  Building2,
  Users,
  Sparkles,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

interface CredentialAccount {
  name: string;
  role: string;
  email: string;
  pass: string;
  category: "Leadership" | "Administration" | "Department Heads";
  badgeColor: string;
  scope: string;
  department_name?: string;
  department_code?: string;
  designation?: string;
}

const DEFAULT_ACCOUNTS: CredentialAccount[] = [
  // Leadership
  {
    name: "Mr. Venkatesh Valluri",
    role: "Vice Chairman",
    email: "vicechairman@riasat.ac.in",
    pass: "ViceChairman@123",
    category: "Leadership",
    badgeColor: "bg-[#003B71] text-white",
    scope: "Complete Executive Control & Action Sign-off",
    department_name: "Executive Leadership",
    department_code: "VICE_CHAIRMAN",
    designation: "Vice Chairman & Executive Director",
  },
  {
    name: "System Administrator",
    role: "Admin",
    email: "admin@riasat.ac.in",
    pass: "Admin@123",
    category: "Leadership",
    badgeColor: "bg-black text-white",
    scope: "Full Access & System Configuration",
    department_name: "Global Administration",
    department_code: "ADMIN",
    designation: "System Administrator",
  },
  {
    name: "Ms. Sarojini Mangalam",
    role: "Executive",
    email: "executive@riasat.ac.in",
    pass: "Exec@123",
    category: "Leadership",
    badgeColor: "bg-[#D81B60] text-white",
    scope: "Riasat Executive Dashboard & Action Register",
    department_name: "Executive Administration",
    department_code: "EXEC_ADMIN",
    designation: "Head - Executive Administration",
  },

  // Administration
  {
    name: "Form Configuration Admin",
    role: "Form Admin",
    email: "forms.admin@riasat.ac.in",
    pass: "Forms@123",
    category: "Administration",
    badgeColor: "bg-[#F37021] text-white",
    scope: "Form Schema & Field Builder Only",
    department_name: "Forms Administration",
    department_code: "FORM_ADMIN",
    designation: "Forms & Schema Administrator",
  },
  {
    name: "User Management Admin",
    role: "User Admin",
    email: "users.admin@riasat.ac.in",
    pass: "Users@123",
    category: "Administration",
    badgeColor: "bg-blue-800 text-white",
    scope: "User Directory & Credentials Only",
    department_name: "User Access",
    department_code: "USER_ADMIN",
    designation: "User Access Administrator",
  },
  {
    name: "Departments Master Admin",
    role: "Department Admin",
    email: "dept.admin@riasat.ac.in",
    pass: "Dept@123",
    category: "Administration",
    badgeColor: "bg-[#D81B60] text-white",
    scope: "Department Verticals Master Only",
    department_name: "Departments Master",
    department_code: "DEPT_ADMIN",
    designation: "Departments Master Administrator",
  },

  // 9 Vertical Department Heads
  {
    name: "To be hired",
    role: "Department Head",
    email: "semicon.head@riasat.ac.in",
    pass: "Semicon@123",
    category: "Department Heads",
    badgeColor: "bg-[#003B71] text-white",
    scope: "Semiconductor Vertical & Cleanrooms",
    department_name: "Semiconductors & VLSI Design",
    department_code: "SEMICON",
    designation: "Head - Semicon",
  },
  {
    name: "To be hired",
    role: "Department Head",
    email: "aero.head@riasat.ac.in",
    pass: "Aero@123",
    category: "Department Heads",
    badgeColor: "bg-[#F37021] text-white",
    scope: "Aerospace & Defence Systems",
    department_name: "Aerospace & Defence Technologies",
    department_code: "AERO_DEFENCE",
    designation: "Head - Aerospace & Defence",
  },
  {
    name: "To be hired",
    role: "Department Head",
    email: "space.head@riasat.ac.in",
    pass: "Space@123",
    category: "Department Heads",
    badgeColor: "bg-blue-700 text-white",
    scope: "Space Payloads & Ground Station",
    department_name: "Space Systems & Satellites",
    department_code: "SPACE",
    designation: "Head - Space",
  },
  {
    name: "To be hired",
    role: "Department Head",
    email: "cyber.head@riasat.ac.in",
    pass: "Cyber@123",
    category: "Department Heads",
    badgeColor: "bg-black text-white",
    scope: "Cyber Range & Threat Defence",
    department_name: "Cybersecurity & Cryptography",
    department_code: "CYBER",
    designation: "Head - Cybersecurity",
  },
  {
    name: "To be hired",
    role: "Department Head",
    email: "medtech.head@riasat.ac.in",
    pass: "MedTech@123",
    category: "Department Heads",
    badgeColor: "bg-[#D81B60] text-white",
    scope: "Bio-Medical & Healthcare Sim",
    department_name: "Healthcare & MedTech Systems",
    department_code: "MEDTECH",
    designation: "Head - MedTech",
  },
  {
    name: "To be hired",
    role: "Department Head",
    email: "mfg.head@riasat.ac.in",
    pass: "Mfg@123",
    category: "Department Heads",
    badgeColor: "bg-[#F37021] text-white",
    scope: "Advanced Manufacturing & CNC Labs",
    department_name: "Advanced Manufacturing & Industry 4.0",
    department_code: "ADV_MFG",
    designation: "Head - Advanced Manufacturing",
  },
  {
    name: "Ms. Anamika Sahay",
    role: "Department Head",
    email: "hr.head@riasat.ac.in",
    pass: "Hr@123",
    category: "Department Heads",
    badgeColor: "bg-[#D81B60] text-white",
    scope: "Talent Acquisition Pipeline & Faculty Hiring",
    department_name: "HR & Recruitment",
    department_code: "HR_REC",
    designation: "Head - HR & Recruitment",
  },
  {
    name: "Ms. Vinila Kalive",
    role: "Department Head",
    email: "comm.head@riasat.ac.in",
    pass: "Comm@123",
    category: "Department Heads",
    badgeColor: "bg-[#003B71] text-white",
    scope: "Communications, Outreach & Brand",
    department_name: "Communications",
    department_code: "COMM",
    designation: "Head - Communications",
  },
  {
    name: "Mr. Avinash Ghodgaonkar",
    role: "Department Head",
    email: "ops.head@riasat.ac.in",
    pass: "Ops@123",
    category: "Department Heads",
    badgeColor: "bg-[#F37021] text-white",
    scope: "Institutional Strategy, Operations & SOPs",
    department_name: "Strategy & Process",
    department_code: "STRATEGY_OPS",
    designation: "Head - Strategy & Process",
  },
];

export default function LoginPage() {
  const [showLoading, setShowLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState("Initializing secure session...");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Live real-time credentials from Supabase
  const [credentialsList, setCredentialsList] = useState<CredentialAccount[]>(DEFAULT_ACCOUNTS);
  const [loadingLiveCredentials, setLoadingLiveCredentials] = useState(false);

  // See Credentials Modal state
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [credentialSearch, setCredentialSearch] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch real-time credentials and departments dynamically from Supabase
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveCredentials() {
      try {
        setLoadingLiveCredentials(true);
        const res = await fetch("/api/auth/credentials", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.credentials) && data.credentials.length > 0) {
            setCredentialsList(data.credentials);
          }
        }
      } catch (err) {
        console.warn("Could not load dynamic credentials from Supabase, using verified defaults:", err);
      } finally {
        if (isMounted) setLoadingLiveCredentials(false);
      }
    }
    fetchLiveCredentials();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3-second animated loading screen
  useEffect(() => {
    const startTime = Date.now();
    const duration = 2500;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setLoadingProgress(progress);

      if (elapsed < 800) {
        setLoadingPhase("Connecting to RIASAT Institutional Network...");
      } else if (elapsed < 1600) {
        setLoadingPhase("Syncing real-time departments & credentials from Supabase...");
      } else if (elapsed < 2500) {
        setLoadingPhase("Welcome to RIASAT. Opening access gateway...");
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setShowLoading(false);
        }, 150);
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

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

      window.location.href = data.redirectUrl || "/executive";
    } catch (err: any) {
      setError(err.message || "Failed to log in");
      setSubmitting(false);
    }
  };

  const handleSelectCredential = (acc: CredentialAccount) => {
    setEmail(acc.email);
    setPassword(acc.pass);
    setError("");
    setCopiedKey(acc.email);
    setTimeout(() => setCopiedKey(null), 1500);
    setShowCredentialsModal(false);
  };

  const filteredCredentials = credentialsList.filter((acc) => {
    const matchesCat = selectedCategory === "ALL" || acc.category === selectedCategory;
    const q = credentialSearch.toLowerCase().trim();
    const matchesQuery =
      !q ||
      acc.name.toLowerCase().includes(q) ||
      acc.role.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      (acc.department_name && acc.department_name.toLowerCase().includes(q)) ||
      (acc.department_code && acc.department_code.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 selection:bg-pink-100 selection:text-pink-900 flex flex-col justify-center items-center px-4 py-8">
      {/* =====================================================================
          1. 3-SECOND RESPONSIVE WHITE LOADING ANIMATION BEFORE LOGIN PAGE
      ====================================================================== */}
      {showLoading && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center px-6 transition-opacity duration-500 ease-out">
          <div className="w-full max-w-lg flex flex-col items-center text-center">
            {/* Centered Responsive Official Logo */}
            <div className="relative w-64 sm:w-80 md:w-96 h-24 sm:h-28 flex items-center justify-center mb-8 transform transition-transform duration-700 animate-pulse">
              <img
                src="/ramaiah_logo.png"
                alt="Ramaiah Logo"
                className="w-full h-full object-contain max-h-24 sm:max-h-28"
              />
            </div>

            {/* Welcome & Context Typography */}
            <div className="space-y-2 mb-8">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#003B71] tracking-tight">
                Welcome to <span className="text-black">RIASAT</span>{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021]">
                  Executive Dashboard
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 tracking-wide uppercase">
                Ramaiah Institute for Advanced Skills &amp; Technology
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Executive Decision Support &bull; Multi-Vertical Operational Control &bull; Real-time Supabase Core
              </p>
            </div>

            {/* Minimal Smooth Progress Bar */}
            <div className="w-full max-w-xs sm:max-w-sm mb-3">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] transition-all duration-100 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>

            {/* Dynamic Status Indicator */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span className="inline-block w-2 h-2 rounded-full bg-[#F37021] animate-ping" />
              <span>{loadingPhase}</span>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. LOGIN CARD (WHITE, BLUE, BLACK, ORANGE, PINK THEME)
      ====================================================================== */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden relative transition-all duration-300 hover:shadow-2xl">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021]" />

        <div className="p-6 sm:p-8">
          {/* Institution Header inside Card */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-48 h-14 flex items-center justify-center mb-2">
              <img
                src="/ramaiah_logo.png"
                alt="Ramaiah Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-700 tracking-wider uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-[#003B71]" />
              <span>Riasat Executive Dashboard</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Sign In to Control Tower
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your official credentials or select from the directory
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 text-[#003B71]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@riasat.ac.in"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#003B71] focus:border-transparent transition placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#D81B60] hover:underline transition"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-[#003B71]" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D81B60] focus:border-transparent transition placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Primary Action Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 bg-[#003B71] hover:bg-gradient-to-r hover:from-[#003B71] hover:via-[#D81B60] hover:to-[#F37021] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-blue-900/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* See Credentials Secondary Button */}
            <button
              type="button"
              onClick={() => setShowCredentialsModal(true)}
              className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-pink-300 text-slate-800 font-semibold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-4 h-4 text-[#F37021]" />
              <span>See Real-Time Credentials ({credentialsList.length})</span>
            </button>
          </form>

          {/* Quick link to /edit-credentail */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <Link
              href="/edit-credentail"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003B71] hover:text-[#D81B60] transition"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#F37021]" />
              <span>Manage &amp; Edit Credentials (/edit-credentail)</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. SEE CREDENTIALS MODAL (CLICK TO AUTOFILL WITH REAL-TIME DEPARTMENTS)
      ====================================================================== */}
      {showCredentialsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003B71] via-[#D81B60] to-[#F37021] p-0.5 flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center">
                    <KeyRound className="w-4 h-4 text-[#003B71]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Real-Time Institutional Accounts &amp; Credentials</span>
                    {loadingLiveCredentials && (
                      <RefreshCw className="w-3.5 h-3.5 text-[#003B71] animate-spin" />
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live department mappings from Supabase. Click any card to autofill and sign in.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCredentialsModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-white space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={credentialSearch}
                  onChange={(e) => setCredentialSearch(e.target.value)}
                  placeholder="Search by department name, code, role, or official name..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003B71] focus:border-transparent transition"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
                {["ALL", "Leadership", "Administration", "Department Heads"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-[#003B71] text-white shadow-xs font-bold"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Credentials List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100">
              {filteredCredentials.map((acc, idx) => (
                <div
                  key={`${acc.email}-${idx}`}
                  onClick={() => handleSelectCredential(acc)}
                  className="pt-2.5 first:pt-0 group p-3.5 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50/60 hover:via-pink-50/40 hover:to-orange-50/40 border border-transparent hover:border-slate-200 transition-all duration-150 cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 group-hover:text-[#003B71] transition">
                        {acc.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${acc.badgeColor}`}
                      >
                        {acc.role}
                      </span>
                      {acc.department_code && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {acc.department_code}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#003B71]" />
                      <span>{acc.department_name || "Institutional Administration"}</span>
                      {acc.designation && (
                        <span className="text-slate-400 font-normal">
                          · {acc.designation}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-slate-600">
                      <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                        {acc.email}
                      </span>
                      <span className="font-mono text-slate-500">
                        Password: <strong className="text-slate-900 font-bold">{acc.pass}</strong>
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      {acc.scope}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 px-3 py-1.5 bg-slate-100 group-hover:bg-[#003B71] group-hover:text-white text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-2xs"
                  >
                    <span>Autofill</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {filteredCredentials.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400">
                  No credentials match your search.
                </div>
              )}
            </div>

            {/* Modal Footer with Direct Link to /edit-credentail */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <Link
                href="/edit-credentail"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003B71] hover:text-[#D81B60] transition"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#F37021]" />
                <span>Go to /edit-credentail to Edit or Create Users</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setShowCredentialsModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
