"use client";

import React from "react";
import { Calendar, Sparkles, X, Filter } from "lucide-react";
import type { MeetingDateGroup } from "@/lib/action-helpers";

/**
 * Dynamic Review Meeting Date Tabs matching Image 3.
 *
 * Renders interactive tabs with counts for each meeting date:
 * - "All Meeting Dates (105 Total · 86 Pending)"
 * - "12 October 2026 Actions (14 Total · 9 Pending)"
 * - "19 October 2026 Actions (11 Total · 6 Pending)"
 * - ...
 * Along with "<Date> Pending Only (<count>)" pills on the right,
 * and a quick dropdown selector.
 */

// Brand palette rotation matching Image 3: orange, pink, blue, slate
const TAB_PALETTE = [
  {
    active: "bg-[#F37021] text-white border-[#F37021] shadow-xs",
    idle: "bg-orange-50/80 text-orange-950 border-orange-200 hover:bg-orange-100",
    pendingActive: "border-pink-500 text-pink-600 bg-pink-50 ring-1 ring-pink-500",
  },
  {
    active: "bg-[#D81B60] text-white border-[#D81B60] shadow-xs",
    idle: "bg-pink-50/80 text-pink-950 border-pink-200 hover:bg-pink-100",
    pendingActive: "border-pink-500 text-pink-600 bg-pink-50 ring-1 ring-pink-500",
  },
  {
    active: "bg-[#003B71] text-white border-[#003B71] shadow-xs",
    idle: "bg-blue-50/80 text-[#003B71] border-blue-200 hover:bg-blue-100",
    pendingActive: "border-blue-500 text-blue-700 bg-blue-50 ring-1 ring-blue-500",
  },
  {
    active: "bg-slate-900 text-white border-slate-900 shadow-xs",
    idle: "bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100",
    pendingActive: "border-slate-800 text-slate-900 bg-slate-100 ring-1 ring-slate-800",
  },
];

interface MeetingDateTabsProps {
  groups: MeetingDateGroup[];
  totalCount: number;
  totalPending: number;
  /** Currently selected meeting date, or `allValue` */
  selectedDate: string;
  /** Value representing "All Meeting Dates" (pages use "all" or "ALL") */
  allValue?: string;
  onSelectDate: (value: string) => void;
  /** If provided, renders "<date> Pending Only" quick pills */
  onSelectPendingOnly?: (date: string) => void;
  /** Whether the pending-only filter is currently active (used for pill highlight) */
  pendingOnlyActive?: boolean;
  title?: string;
  size?: "md" | "sm";
  /** Use "long" labels like "26 October 2026 Actions" or "medium" like "26 Oct 2026 Actions" */
  labelStyle?: "long" | "medium";
}

export default function MeetingDateTabs({
  groups,
  totalCount,
  totalPending,
  selectedDate,
  allValue = "all",
  onSelectDate,
  onSelectPendingOnly,
  pendingOnlyActive = false,
  title = "REVIEW MEETING DATE TABS:",
  size = "md",
  labelStyle = "long",
}: MeetingDateTabsProps) {
  const pad = size === "sm" ? "px-3 py-1.5" : "px-3.5 py-2";

  return (
    <div className="flex flex-col gap-3 w-full bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 w-full">
        {/* Left: Review Meeting Date Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 mr-1 shrink-0">
            <Calendar className="w-4 h-4 text-[#003B71]" />
            {title}
          </span>

          {/* All Meeting Dates Tab */}
          <button
            type="button"
            onClick={() => onSelectDate(allValue)}
            className={`inline-flex items-center gap-2 ${pad} rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedDate === allValue || !selectedDate
                ? "bg-[#003B71] text-white border-[#003B71] shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>All Meeting Dates</span>
            <span className="px-1.5 py-0.5 rounded bg-black/15 font-mono text-[10px] font-black whitespace-nowrap">
              {totalCount} Total · {totalPending} Pending
            </span>
          </button>

          {/* Individual Meeting Date Tabs */}
          {groups.map((g, idx) => {
            const palette = TAB_PALETTE[idx % TAB_PALETTE.length];
            const isActive = selectedDate === g.date;
            return (
              <button
                key={g.date}
                type="button"
                onClick={() => onSelectDate(g.date)}
                className={`inline-flex items-center gap-2 ${pad} rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isActive ? palette.active : palette.idle
                }`}
                title={`Actions raised in the ${g.label} review meeting`}
              >
                {g.isLatest && groups.length > 1 && (
                  <Sparkles className="w-3 h-3 shrink-0" aria-label="Latest meeting" />
                )}
                <span className="whitespace-nowrap">
                  {labelStyle === "medium" ? g.mediumLabel : g.label} Actions
                </span>
                <span className="px-1.5 py-0.5 rounded bg-black/15 font-mono text-[10px] font-black whitespace-nowrap">
                  {g.total} Total · {g.pending} Pending
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: "<Date> Pending Only" Quick Pill Buttons */}
        {onSelectPendingOnly && groups.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start xl:self-center">
            {groups.map((g) => {
              const isActive = pendingOnlyActive && selectedDate === g.date;
              return (
                <button
                  key={`pending-${g.date}`}
                  type="button"
                  onClick={() => onSelectPendingOnly(g.date)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "border-pink-500 text-pink-600 bg-pink-50 ring-1 ring-pink-500 font-extrabold shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {g.shortLabel} Pending Only ({g.pending})
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
