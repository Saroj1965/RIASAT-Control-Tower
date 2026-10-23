"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/90 overflow-hidden p-8 animate-scaleUp">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative w-56 h-16 flex items-center justify-center">
            <img
              src="/ramaiah_logo.png"
              alt="Ramaiah Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-pink-600 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>

        <h1 className="text-xl font-bold text-[#1e1b4b] mb-1">Reset Password</h1>
        <p className="text-xs text-slate-500 mb-6">
          Enter your registered RIASAT institutional email address. Instructions and temporary recovery credentials will be dispatched.
        </p>

        {submitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-start gap-3 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Request Received</p>
              <p className="text-xs mt-1 text-emerald-700">
                If an active account exists for <strong>{email}</strong>, password reset verification has been notified to the RIASAT System Administrator.
              </p>
              <p className="text-xs mt-2 text-slate-600">
                For urgent access, please contact: <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-300">admin@riasat.ac.in</code>
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 text-blue-900" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@riasat.ac.in"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#1e1b4b] hover:bg-gradient-to-r hover:from-blue-800 hover:via-pink-600 hover:to-orange-500 text-white font-semibold text-sm rounded-xl shadow-md transition-all duration-200 cursor-pointer"
            >
              Submit Reset Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
