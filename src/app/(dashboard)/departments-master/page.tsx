import React from "react";
import Link from "next/link";
import { ArrowLeft, Layers, ListChecks } from "lucide-react";
import DepartmentsHodManager from "@/components/DepartmentsHodManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DepartmentsMasterPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/executive"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Executive Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-800">
            Departments & Heads of Department (HOD)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/actions"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-black transition-colors"
          >
            <ListChecks className="w-3.5 h-3.5" />
            All Actions Directory
          </Link>
          <Link
            href="/admin?tab=form_config"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-black transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            Form Configuration
          </Link>
        </div>
      </div>

      {/* Main Departments & HOD Manager */}
      <DepartmentsHodManager />
    </div>
  );
}
