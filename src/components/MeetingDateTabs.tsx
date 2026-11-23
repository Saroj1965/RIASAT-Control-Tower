"use client";

import React from "react";
import { Calendar, Sparkles, X, Filter, CheckCircle2 } from "lucide-react";
import type { MeetingDateGroup } from "@/lib/action-helpers";

/**
 * Dynamic Review Meeting Date Dropdown.
 *
 * All weekly meeting dates are rendered in a sleek, accessible dropdown selector.
 * Selecting any meeting date instantly filters action items to that specific review week.
 */

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
  title = "Review Meeting Date:",
  size = "md",
}: MeetingDateTabsProps) {
  const isAllSelected = selectedDate === allValue || !selectedDate;
  const selectedGroup = groups.find((g) => g.date === selectedDate);
  const reversedGroups = [...groups].reverse();

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full bg-gradient-to-r from-slate-50 via-white to-blue-50/30 p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
        {/* Label with Calendar Icon */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#003B71]/10 border border-[#003B71]/20 flex items-center justify-center text-[#003B71]">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <label htmlFor="meeting-date-dropdown" className="text-xs font-black uppercase tracking-wider text-slate-900 block">
              {title.replace(/:$/, "")}
            </label>
            <span className="text-[10px] text-slate-500 font-medium">Select a meeting week to inspect actions</span>
          </div>
        </div>

        {/* Meeting Dates Dropdown */}
        <div className="relative flex-1 max-w-md">
          <select
            id="meeting-date-dropdown"
            value={selectedDate}
            onChange={(e) => onSelectDate(e.target.value)}
            className="w-full pl-3.5 pr-8 py-2 rounded-xl border-2 border-blue-500/50 hover:border-blue-600 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer transition-all"
          >
            <option value={allValue}>
              📅 All Meeting Dates ({totalCount} Total Actions · {totalPending} Pending)
            </option>
            {reversedGroups.map((g) => (
              <option key={g.date} value={g.date}>
                Weekly Meeting: {g.mediumLabel} ({g.total} Total · {g.pending} Pending · {g.closed} Closed){g.isLatest ? " ★ LATEST" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Active Selection Badge */}
        {selectedGroup ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-100 text-[#003B71] border border-blue-200 text-xs font-bold">
            <span className="truncate">{selectedGroup.mediumLabel}</span>
            <span className="px-1.5 py-0.5 rounded bg-blue-200 text-blue-950 font-mono text-[10px] font-black shrink-0">
              {selectedGroup.pending} Pending / {selectedGroup.total} Total
            </span>
            <button
              type="button"
              onClick={() => onSelectDate(allValue)}
              className="text-blue-500 hover:text-rose-600 font-black ml-0.5 text-sm cursor-pointer shrink-0"
              title="Reset to All Meeting Dates"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
            <span>All Weeks</span>
            <span className="px-1.5 py-0.5 rounded bg-white text-slate-900 font-mono text-[10px] font-black shrink-0">
              {totalPending} Pending / {totalCount} Total
            </span>
          </div>
        )}
      </div>

      {/* Quick Pending Filter & Reset Controls */}
      {!isAllSelected && onSelectPendingOnly && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSelectPendingOnly(selectedDate)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              pendingOnlyActive
                ? "bg-[#D81B60] text-white border-[#D81B60] shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Filter className="w-3 h-3" />
            Pending Only ({selectedGroup?.pending ?? totalPending})
          </button>
          <button
            type="button"
            onClick={() => onSelectDate(allValue)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 cursor-pointer"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
