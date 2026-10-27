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
    sno: "1",
    title: "Purpose of the Riasat Executive Dashboard",
    body: [
      "The Riasat Executive Dashboard is the central real-time governance, action-tracking, and readiness command platform for the Ramaiah Institute for Advanced Skills & Technology (RIASAT).",
      "Its primary purpose is to maintain a single, live, non-duplicated source of truth in Supabase for every directive agreed in weekly and monthly management review meetings with the Vice Chairman, Executive Office, and Department Heads (HODs).",
      "The Summary Sheet displays all active pending actions. Whenever a new review meeting takes place (e.g. 12 Oct, 19 Oct, 26 Oct, or future dates), any open/pending items from earlier meetings automatically carry forward into the current agenda—nothing is lost or manually re-copied.",
      "When an action is completed and marked Closed, it moves out of the Pending Summary Sheet into the Closed History and All Actions Directory (/actions) with its full audit trail preserved.",
    ],
  },
  {
    sno: "2",
    title: "How & Where to Enter Actions of 26 October (Step-by-Step)",
    body: [
      "Follow this simple 4-step process to enter actions from the 26 October 2026 (or any upcoming) review meeting:",
      "1. WHERE TO ENTER: Click the '+ Add Action Item' button (or '+ Add Action') located on the top-right of any register: Action Register (/executive), All Actions (/actions), Department Workspace (/department/[id]), or Unified Reports (/reports).",
      "2. SET REVIEW MEETING DATE: In the modal, locate the 'Review Meeting Date *' field. The date picker is pre-populated, or you can click the '26 Oct' quick button, or type/pick 2026-10-26 directly from the calendar.",
      "3. FILL IN DIRECTIVE DETAILS: Select the Department, assign the Action Owner (pick from HOD dropdown or type name), choose Priority, specify Target Date, and describe the Action Item / Deliverable and initial Action Taken.",
      "4. CLICK 'SAVE ACTION ITEM': Click the blue 'Save Action Item' button at the bottom of the modal. The action is committed instantly to Supabase with automatic audit logging.",
    ],
  },
  {
    sno: "3",
    title: "Automatic 3rd Tab Creation (Is It Automatic? YES!)",
    body: [
      "• YES, TAB CREATION IS 100% AUTOMATIC: The review meeting tabs across the entire website are generated dynamically from Supabase database rows.",
      "• Before any 26 October actions are entered, only meetings with existing actions (12 Oct and 19 Oct) are displayed as tabs.",
      "• The exact moment you save your first action with Review Meeting Date set to 26 October 2026, the 3rd tab — '26 October 2026 Actions' — is created automatically across all 4 key pages:",
      "    — Action Register (/executive?view=actions)",
      "    — All Actions Directory (/actions)",
      "    — Department Workspaces (/department/[id])",
      "    — Unified Reports (/reports)",
      "• A corresponding '26 Oct Pending Only' quick toggle and '26 Oct 2026 agenda' dropdown entry are also created automatically with live counters.",
      "• FUTURE MEETINGS: The exact same automatic process applies to all future meetings (e.g. 2 Nov, 9 Nov, 16 Nov, etc.). Whenever you enter an action for a new Monday review date, its dedicated tab appears instantly.",
    ],
  },
  {
    sno: "4",
    title: "Carried-Forward Pending Directives Across Meeting Cycles",
    body: [
      "• Cumulative Accountability: A new review meeting (like 26 October) does not discard unfinished actions from previous meetings (12 Oct and 19 Oct).",
      "• Agenda Filter: Selecting the '26 Oct 2026 agenda' filter displays all new deliverables agreed on 26 Oct PLUS every pending carried-forward action from 12 Oct and 19 Oct.",
      "• Visual Badges: Actions raised during the latest meeting cycle display a shiny 'NEW' badge, while unfinished actions from earlier meetings display a 'C/F' (Carried Forward) badge.",
      "• Red Alerts: Any directive that is overdue, blocked, marked Critical, or flagged for Vice Chairman attention appears prominently on top of all views.",
    ],
  },
  {
    sno: "5",
    title: "Where to Find Actions Across the Website",
    body: [
      "You can view, search, and filter actions from 5 dedicated locations:",
      "1. Action Register (Summary Sheet — /executive?view=actions): Default landing register showing active pending actions, closed actions, or all actions with Red Alerts and newly added items prioritized at the top.",
      "2. All Actions & History Directory (/actions): Dedicated master page listing every action across all departments with instant status cards (All, All Pending, Open Status, In Progress, Closed, With Updates, Red Alerts).",
      "3. Executive Action Dashboard (/executive?view=executive_dashboard): High-level KPI summary, Department-wise completion table, Priority/Status donut charts, Overdue & At-Risk list, and Vice Chairman Decisions Required.",
      "4. Department Workspaces (/department/[id]): Each vertical has its own dedicated Action Register, Vertical Analytics, and Unified Department Form.",
      "5. Unified Reports (/reports): Printable and CSV-exportable department-by-department action registers.",
    ],
  },
  {
    sno: "6",
    title: "Where & How to Make Changes (Add, Edit & Assign HOD Owner)",
    body: [
      "1. Add a New Action: Click '+ Add New Action Item' on the top-right of any register. The next serial code (e.g., ACT-29) is assigned automatically.",
      "2. Edit Any Action: Every row across the entire dashboard has an 'Edit' button available to all users. Clicking 'Edit' opens the unified Action Form Modal.",
      "3. Select Action Owner from HOD Dropdown: In the 'Action Owner *' field, click the dropdown arrow button ('Select from HOD / Staff List') to pick any Department Head (HOD) or staff member, or type a custom name directly. Selecting a Department also auto-links its assigned HOD.",
      "4. Log Weekly Progress & Action Taken: Enter your weekly note in 'Progress Update / Remarks (this week)' and update 'Action Taken (Summary of Execution / Resolution)'. Your update is prepended to the top of the numbered datewise history list.",
    ],
  },
  {
    sno: "7",
    title: "Status Color Coding Guide (Distinct 'Open' Status Theme)",
    body: [
      "Every status button and badge uses a distinct color so you can identify execution state at a glance:",
      "• Open (Sky-Blue): Newly registered or open directive awaiting execution progress.",
      "• In Progress / On Track (Indigo / Navy Blue): Active execution underway with weekly updates.",
      "• On Hold / Delayed (Amber / Orange): Temporarily paused or behind target date.",
      "• Blocked / Red Alert / Critical (Rose / Pink-Red): Escalated item or overdue directive prioritized at the top of the register.",
      "• Closed / Completed (Emerald Green): Verified and completed directive (archived in Closed view, never deleted).",
    ],
  },
  {
    sno: "8",
    title: "Closing an Action, Reopening & Recording VC Decisions",
    body: [
      "• Closing an Action: Click 'Edit', change Status to 'Closed' or 'Completed', and fill in the green 'Close action' box with the Actual Closure Date and Closure Remarks / Action Taken.",
      "• Reopening a Closed Action: Switch to the 'Closed actions' or 'All actions' tab, click 'Edit' on the item, change Status back to 'Open' or 'In Progress', and enter the 'Reason for reopening'.",
      "• Vice Chairman Decisions: Set 'VC Decision Required' to 'Yes' to escalate an item to the Vice Chairman panel on the Executive Dashboard. Record the VC's decision and date inside the Edit modal.",
    ],
  },
  {
    sno: "9",
    title: "Managing Departments & Heads of Department (HOD)",
    body: [
      "Click 'Departments & HODs' in the sidebar (/departments-master) or scroll to the live manager at the bottom of this page to:",
      "• Quick Edit Inline: Click 'Quick Edit' on any row to rename a department or assign/change its Head of Department (HOD) and click 'Save'.",
      "• Full Edit Modal: Click 'Edit Dept & HOD' to update the department name, code, HOD name, readiness %, and RAG status.",
      "• Add or Delete Departments: Click '+ Add Department & HOD' to create a new vertical (automatically provisioning 14 standardized form fields) or click 'Delete' to remove a department.",
    ],
  },
];

const ROLE_GUIDES = [
  {
    no: "1",
    role: "Vice Chairman (VC)",
    access: "Full Global Access (/executive, /actions, /departments-master, /reports, /admin)",
    howToUse: [
      "Open the Executive Action Dashboard (/executive?view=executive_dashboard) to review the 8 headline KPIs, department-wise completion rates, and interactive priority/status donut charts.",
      "Review the 'Vice Chairman decisions required' panel and click 'Record / Edit' to log executive decisions directly into Supabase.",
      "Use the dynamic Meeting Date Tabs (12 Oct, 19 Oct, 26 Oct, etc.) to review and compare carried-forward actions against newly raised directives for each review cycle.",
      "Add, edit, or close any action item across all 11 departments and assign deliverables to any HOD.",
    ],
  },
  {
    no: "2",
    role: "Executive Office & Leadership",
    access: "Full Cross-Departmental Access (/executive, /actions, /departments-master, /reports)",
    howToUse: [
      "Coordinate weekly review meetings using the Action Register Summary Sheet (/executive?view=actions).",
      "During or after each review meeting, click '+ Add New Action Item' to log new directives with the meeting date, review frequency, department, HOD owner, and support required.",
      "Filter by meeting agenda (e.g. 26 Oct 2026 agenda or 19 Oct 2026 agenda) to run through every pending carry-forward item department by department.",
      "Export unified CSV or PDF reports from /reports for distribution to leadership.",
    ],
  },
  {
    no: "3",
    role: "System Administrator (Super Admin)",
    access: "Complete System, User, Department, Form & Database Governance (/admin + all routes)",
    howToUse: [
      "Manage user accounts, credentials, roles, and active status under Admin Suite -> User Accounts (/admin?tab=users).",
      "Add, rename, or delete departments and update Heads of Department under Admin Suite -> Departments & HODs Master (/admin?tab=departments).",
      "Configure the 14 standardized departmental reporting fields under Admin Suite -> Form Configuration (/admin?tab=form_config).",
      "Download full JSON database backups and inspect Directives, Readiness, and Financial analytics.",
    ],
  },
  {
    no: "4",
    role: "Form Admin, User Admin & Department Admin",
    access: "Specialized Administrative Governance (/admin, /departments-master, /actions)",
    howToUse: [
      "User Admin: Create new logins, reset passwords, and assign users to verticals in /admin?tab=users.",
      "Department Admin: Maintain department names, codes, and HOD assignments in /departments-master and /admin?tab=departments.",
      "Form Admin: Customize vertical form fields, mandatory flags, and dropdown options in /admin?tab=form_config.",
    ],
  },
  {
    no: "5",
    role: "Department Heads (HODs) & Vertical Leads",
    access: "Dedicated Vertical Workspace (/department/[id]) + Master Action Register (/actions)",
    howToUse: [
      "Open your Department Workspace (/department/[id]) to view your vertical's Pending Items, review meeting date tabs (12 Oct, 19 Oct, 26 Oct, etc.), Red Alerts, and Closed History.",
      "Click 'Edit' on each assigned action item before the weekly review meeting to log 'Progress Update / Remarks (this week)' and update 'Action Taken'.",
      "Use the 'Unified Department Form' tab inside your department workspace to update your vertical's Readiness %, RAG status, and 14 standardized reporting metrics.",
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
                  {s.sno === "8" && (
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

        {/* Role-by-Role Usage Guide */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-950">
                Role-by-Role Guide — How Different Users Use the Dashboard
              </h3>
              <p className="text-xs text-slate-500">
                Permissions, recommended pages, and workflows for every role in the Riasat Executive Dashboard
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#003B71]/10 text-[#003B71] text-[11px] font-black uppercase">
              5 User Role Categories
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROLE_GUIDES.map((r) => (
              <div
                key={r.role}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#003B71] text-white font-mono text-xs font-black">
                      {r.no}
                    </span>
                    <h4 className="text-sm font-black text-slate-900">{r.role}</h4>
                  </div>
                  <div className="text-[11px] font-bold text-[#F37021] mb-2">
                    Access: {r.access}
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
                    {r.howToUse.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Interactive Departments & Heads of Department Editor right on the Guidelines Page */}
        <div id="departments-hod-editor" className="pt-2">
          <DepartmentsHodManager />
        </div>
      </main>
    </div>
  );
}
