import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  ListChecks,
  Building2,
  UserCheck,
  Edit3,
} from "lucide-react";
import DepartmentsHodManager from "@/components/DepartmentsHodManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const GUIDE_SECTIONS = [
  {
    sno: "S.No. 1",
    title: "What the Riasat Executive Dashboard does",
    body: [
      "The Riasat Executive Dashboard keeps one ongoing list of departmental actions agreed in weekly and monthly management reviews across all strategic verticals and administrative offices.",
      "The Summary Sheet shows every action that is still pending. When a new review meeting takes place, pending actions stay in this list automatically—nothing needs to be copied over from last week.",
      "When an action is finished and marked Closed, it leaves the pending list and is kept in Closed actions and All Actions Directory (/actions) so its record and history are never lost.",
      "All departments (including HR & Recruitment, Strategy & Process, Executive Administration, and Vice Chairman) use the exact same unified Action Form and generate identical, uniform reports.",
    ],
  },
  {
    sno: "S.No. 2",
    title: "Switching between the dashboard views & dedicated pages",
    body: [
      "Use the top navigation bar or sidebar to switch between:",
      "• Action Register (Summary Sheet): where weekly updates are entered and pending, closed, and all actions are listed.",
      "• All Actions Directory (/actions): a dedicated page where every action (pending, in-progress, and closed) can be searched, filtered, and edited.",
      "• Departments & Heads of Department (/departments-master): a dedicated page where Admin, Vice Chairman, and all users can add, edit, rename, and delete departments and assign Heads of Department (HOD).",
      "• Executive Action Dashboard: an overview for the Vice Chairman and leadership showing totals, department-wise progress, interactive priority/status charts, overdue items, and actions waiting for a Vice Chairman decision.",
      "• Reports & CSV Export: unified departmental reports across all verticals with one-click CSV and PDF export.",
    ],
  },
  {
    sno: "S.No. 3",
    title: "Adding a new action item (linked to Department HOD)",
    body: [
      "1. Click Add Action Item in the top-right corner of any dashboard page.",
      "2. Sl.No. (such as ACT-16) is assigned automatically when you save.",
      "3. Pick the Review Meeting Date and whether the action is reviewed Weekly or Monthly.",
      "4. Choose the Department from the list — its Head of Department (HOD) is automatically displayed and linked to the Action Owner field.",
      "5. Set the Priority (Critical, High, Medium, or Low) and write the Action Item / Deliverable.",
      "6. Tick anyone under Support Required From. If the person or team is not listed, tick Others — enter name and type their name(s).",
      "7. Set the Completion Date / Target Date, Status, Next Follow-up Date, and whether a Vice Chairman Decision is required.",
      "8. Enter your name at the bottom and click Add action.",
    ],
  },
  {
    sno: "S.No. 4",
    title: "Editing an action & clearly viewing what action was taken",
    body: [
      "1. Every action row across the entire website has an Edit button available to everyone.",
      "2. At the top of the Edit Action modal, a colour-coded Status & Action Taken banner clearly displays what action was taken whether the item is Closed, In Progress, or Open.",
      "3. Type this week’s progress in Progress Update / Remarks (this week) and update Action Taken (Summary of Execution / Resolution).",
      "4. Your update is added to the top of the action’s numbered history list with the date and your name. Earlier updates are preserved below it.",
    ],
  },
  {
    sno: "S.No. 5",
    title: "Closing an action (and reopening if needed)",
    body: [
      "1. Click Edit on the action and change Status to Closed or Completed.",
      "2. A green Close action box appears. Fill in the Actual closure date and Closure remarks / Action taken (what was delivered or decided).",
      "3. Click Save changes. The action moves out of the Summary Sheet into Closed actions and remains visible in All Actions (/actions). The original target date is kept.",
      "4. If a closed action needs to be worked on again, open Closed actions or All Actions, click Edit, change the status back to an open status (such as In Progress), and enter the Reason for reopening.",
    ],
  },
  {
    sno: "S.No. 6",
    title: "Recording a Vice Chairman decision",
    body: [
      "When Vice Chairman Decision Required is set to Yes, the action appears in the Vice Chairman decisions required panel on the Executive Dashboard.",
      "To record the decision, click Edit on the action and fill in the Record Vice Chairman decision box with the decision text and date.",
    ],
  },
  {
    sno: "S.No. 7",
    title: "Departments & Heads of Department (HOD)",
    body: [
      "Each action item relates directly to its Department and Head of the Department (HOD):",
      "• Semicon (SEMICON) — HOD: To be hired",
      "• Aerospace & Defence (AERO_DEFENCE) — HOD: To be hired",
      "• Space (SPACE) — HOD: To be hired",
      "• Cybersecurity (CYBER) — HOD: To be hired",
      "• MedTech (MEDTECH) — HOD: To be hired",
      "• Advanced Manufacturing (ADV_MFG) — HOD: To be hired",
      "• HR & Recruitment (HR_REC) — HOD: Ms. Anamika Sahay",
      "• Communications (COMM) — HOD: Ms. Vinila Kalive",
      "• Strategy & Process (STRATEGY_PROCESS) — HOD: Mr. Avinash Ghodgaonkar",
      "• Executive Administration (EXEC_ADMIN) — HOD: Ms. Sarojini Mangalam",
      "• Vice Chairman (VICE_CHAIRMAN) — HOD: Mr. Venkatesh Valluri",
      "You can edit department names, add new departments, delete departments, and update Heads of Department below or on the dedicated Departments & HODs page (/departments-master).",
    ],
  },
  {
    sno: "S.No. 8",
    title: "Unified Form Fields Across All Departments",
    body: [
      "All departments share the same 14 standardised fields (S.No. 1 to S.No. 14) so that every departmental report has the exact same columns and structure.",
    ],
  },
];

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-sm shrink-0">
              <img
                src="/ramaiah_logo.png"
                alt="Ramaiah Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Riasat Executive Dashboard — How to Use &amp; Departments / HOD Guide
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#003B71] text-white border border-blue-400/30">
                  Official Manual
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ramaiah Institute for Advanced Skills &amp; Technology (RIASAT)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/departments-master"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F37021] hover:opacity-90 text-xs font-black text-white transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Edit Departments &amp; HODs
            </Link>
            <Link
              href="/actions"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#003B71] hover:bg-blue-800 text-xs font-semibold text-white transition"
            >
              <ListChecks className="w-3.5 h-3.5" />
              All Actions
            </Link>
            <Link
              href="/executive?view=executive_dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Intro Hero */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021]" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#003B71] text-xs font-bold uppercase tracking-widest mb-2">
                <Sparkles className="w-4 h-4 text-[#F37021]" />
                Riasat Executive Dashboard Guide
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 mb-2">
                How to use the Riasat Executive Dashboard
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
                Step-by-step instructions for logging actions, managing{" "}
                <strong>Departments &amp; Heads of Department (HOD)</strong>, viewing all
                actions (Open, In Progress, or Closed), and generating unified reports.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                href="/departments-master"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#003B71] via-[#D81B60] to-[#F37021] text-white text-xs font-black uppercase tracking-wider shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Open Departments &amp; HOD Page
              </Link>
              <Link
                href="/actions"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-black uppercase tracking-wider shadow-sm"
              >
                <ListChecks className="w-3.5 h-3.5 text-[#F37021]" />
                Open All Actions Page
              </Link>
            </div>
          </div>
        </div>

        {/* Guide Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GUIDE_SECTIONS.map((s) => (
            <section
              key={s.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#003B71]/10 text-[#003B71] font-mono text-xs font-black">
                      {s.sno}
                    </span>
                    <h3 className="text-sm font-black text-slate-900">{s.title}</h3>
                  </div>
                  {s.sno === "S.No. 7" && (
                    <Link
                      href="/departments-master"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F37021] text-white text-[11px] font-black hover:opacity-90"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit &amp; Save
                    </Link>
                  )}
                </div>
                <div className="space-y-1.5 text-xs leading-relaxed text-slate-700">
                  {s.body.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Live Interactive Departments & Heads of Department Editor right on the Guidelines Page */}
        <div id="departments-hod-editor" className="pt-2">
          <DepartmentsHodManager />
        </div>
      </main>
    </div>
  );
}
