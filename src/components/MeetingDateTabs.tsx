"use client";

import React from "react";
import { Calendar, Sparkles } from "lucide-react";
import type { MeetingDateGroup } from "@/lib/action-helpers";

/**
 * Dynamic Review Meeting Date Tabs.
 *
 * One tab is rendered for every distinct `review_meeting_date` present in the
 * actions coming from Supabase. When the first action of a new meeting
 * (e.g. 26 October 2026) is saved, its tab appears automatically — no code change needed.
 */

// Brand palette rotation: orange, pink, blue, black (then repeats)
const TAB_PALETTE = [
  {
    active: "bg-[#F37021] text-white border-[#F37021]",
    idle: "bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100",
    pendingActive: "bg-[#F37021]/15 text-[#F37021] border-[#F37021]",
  },
  {
    active: "bg-[#D81B60] text-white border-[#D81B60]",
    idle: "bg-pink-50 text-pink-900 border-pink-200 hover:bg-pink-100",
    pendingActive: "bg-[#D81B60]/15 text-[#D81B60] border-[#D81B60]",
  },
  {
    active: "bg-[#003B71] text-white border-[#003B71]",
    idle: "bg-blue-50 text-[#003B71] border-blue-200 hover:bg-blue-100",
    pendingActive: "bg-[#003B71]/15 text-[#003B71] border-[#003B71]",
  },
  {
    active: "bg-slate-900 text-white border-slate-900",
    idle: "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200",
    pendingActive: "bg-slate-900/10 text-slate-900 border-slate-900",
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
  title = "Review Meeting Date Tabs:",
  size = "md",
  labelStyle = "long",
}: MeetingDateTabsProps) {
  const pad = size === "sm" ? "px-3 py-1.5" : "px-3.5 py-2";

  return (
    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5 w-full">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 mr-1">
          <Calendar className="w-3.5 h-3.5 text-[#003B71]" />
          {title}
        </span>

        <button
          type="button"
          onClick={() => onSelectDate(allValue)}
          className={`inline-flex items-center gap-2 ${pad} rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            selectedDate === allValue
              ? "bg-[#003B71] text-white border-[#003B71] shadow-xs"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
          }`}
        >
          <span>All Meeting Dates</span>
          <span className="px-1.5 py-0.5 rounded bg-black/15 font-mono text-[10px] font-black whitespace-nowrap">
            {totalCount} Total · {totalPending} Pending
          </span>
        </button>

        {groups.map((g, idx) => {
          const palette = TAB_PALETTE[idx % TAB_PALETTE.length];
          const isActive = selectedDate === g.date;
          return (
            <button
              key={g.date}
              type="button"
              onClick={() => onSelectDate(g.date)}
              className={`inline-flex items-center gap-2 ${pad} rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isActive ? `${palette.active} shadow-xs` : palette.idle
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

      {onSelectPendingOnly && groups.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {groups.map((g, idx) => {
            const palette = TAB_PALETTE[idx % TAB_PALETTE.length];
            const isActive = pendingOnlyActive && selectedDate === g.date;
            return (
              <button
                key={`pending-${g.date}`}
                type="button"
                onClick={() => onSelectPendingOnly(g.date)}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive ? palette.pendingActive : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {g.shortLabel} Pending Only ({g.pending})
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
