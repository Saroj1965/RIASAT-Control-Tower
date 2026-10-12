"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Printer,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Layers,
  HelpCircle,
  ShieldCheck,
  Search,
} from "lucide-react";

export default function PublicGuidelinesPage() {
  const [activeVertical, setActiveVertical] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const verticals = [
    { id: "SEMICON", name: "1. Semicon", code: "SEMICON" },
    { id: "AERO", name: "2. Aerospace & Defence", code: "AERO_DEFENCE" },
    { id: "SPACE", name: "3. Space", code: "SPACE" },
    { id: "CYBER", name: "4. Cybersecurity", code: "CYBER" },
    { id: "MEDTECH", name: "5. MedTech", code: "MEDTECH" },
    { id: "MFG", name: "6. Advanced Manufacturing", code: "ADV_MFG" },
    { id: "HR", name: "7. HR & Recruitment", code: "HR_REC" },
    { id: "COMM", name: "8. Communications", code: "COMM" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Top Banner & Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase">
                Official Operational Standard
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight mt-0.5">
              RIASAT Executive Dashboard: Form Filing Guidelines
            </h1>
            <p className="text-xs text-slate-400">
              Ramaiah Institute for Advanced Skills & Technology (RIASAT) • Academic & Commissioning Cycle 2026–2027
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold border border-slate-700 text-slate-200 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-xs transition"
            >
              <span>Go to App Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-8">
        {/* Document Navigation & Quick Overview */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Table of Contents & Quick Navigation
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            This document outlines the standard operational procedure for Department Heads to fill in and maintain their
            assigned department forms in the RIASAT Executive Dashboard. All verified submissions feed directly to the
            live Executive Dashboard for the <strong>Vice Chairman</strong> and <strong>Executive Director</strong>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-semibold">
            <a href="#core-metrics" className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition flex items-center justify-between">
              <span>1. Core Strategic Metrics</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <a href="#workstream-columns" className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition flex items-center justify-between">
              <span>2. 11 Workstream Columns</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </a>
            <a href="#vertical-headings" className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition flex items-center justify-between">
              <span>3. Vertical Specific Headings</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </section>

        {/* SECTION 1: CORE STRATEGIC METRICS */}
        <section id="core-metrics" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight uppercase">
              1. Core Strategic Metrics: Readiness Scoring & RAG Definitions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every department update requires setting the Readiness Percentage and RAG status.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Readiness Scoring */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                Readiness Score (0% – 100%)
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Band</th>
                      <th className="px-3 py-2">Stage</th>
                      <th className="px-3 py-2">Operational State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="px-3 py-2 font-mono font-bold text-slate-900">0% – 25%</td>
                      <td className="px-3 py-2 font-semibold">Initiation</td>
                      <td className="px-3 py-2">Concept stage; civil layout planned.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono font-bold text-slate-900">26% – 49%</td>
                      <td className="px-3 py-2 font-semibold">Procurement</td>
                      <td className="px-3 py-2">Tenders floated; curriculum drafted.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono font-bold text-slate-900">50% – 74%</td>
                      <td className="px-3 py-2 font-semibold">Installation</td>
                      <td className="px-3 py-2">Hardware delivered; pilot testing.</td>
                    </tr>
                    <tr className="bg-indigo-50/50">
                      <td className="px-3 py-2 font-mono font-bold text-indigo-700">75% – 89%</td>
                      <td className="px-3 py-2 font-bold text-indigo-900">Validation</td>
                      <td className="px-3 py-2 text-indigo-950 font-medium">Lab functional; active licenses. Target.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono font-bold text-slate-900">90% – 100%</td>
                      <td className="px-3 py-2 font-semibold text-emerald-700">Commissioned</td>
                      <td className="px-3 py-2">Regular cohorts running; revenue live.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* RAG Status */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                RAG Status Definitions
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">When to Select</th>
                      <th className="px-3 py-2">Executive Implication</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="px-3 py-2 font-bold text-slate-500">NOT STARTED</td>
                      <td className="px-3 py-2">Initial zero-baseline before kickoff.</td>
                      <td className="px-3 py-2">Roadmap pending.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-emerald-600">GREEN</td>
                      <td className="px-3 py-2">Milestones on schedule & budget.</td>
                      <td className="px-3 py-2">Normal operations.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-amber-600">AMBER</td>
                      <td className="px-3 py-2">Minor delay (1–3 weeks) or vendor hitch.</td>
                      <td className="px-3 py-2">Under active monitoring.</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-bold text-rose-600">RED</td>
                      <td className="px-3 py-2">Critical blocker: regulatory, civil halt.</td>
                      <td className="px-3 py-2 font-semibold text-rose-800">Immediate VC intervention.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: THE 11 WORKSTREAM COLUMNS */}
        <section id="workstream-columns" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight uppercase">
              2. Workstream Data Entry Standard: The 11 Columns
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Clicking <strong>+ Add Workstream</strong> opens the standardized 11-column entry form.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="px-3.5 py-3">#</th>
                  <th className="px-4 py-3">Column Name</th>
                  <th className="px-4 py-3">Format / Value</th>
                  <th className="px-6 py-3">Guideline / What to Enter</th>
                  <th className="px-6 py-3">Real-World Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-400">01</td>
                  <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">Item_ID</td>
                  <td className="px-4 py-3 font-mono text-indigo-700 whitespace-nowrap">WS-01, WS-02</td>
                  <td className="px-6 py-3">Unique reference identifier generated by system.</td>
                  <td className="px-6 py-3 font-mono text-slate-600">SEM-WS-01</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-400">02</td>
                  <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">Workstream_Category</td>
                  <td className="px-4 py-3 text-slate-800 font-semibold whitespace-nowrap">Category text</td>
                  <td className="px-6 py-3">Standard bucket: Infrastructure, Tooling, Curriculum, Partnerships, etc.</td>
                  <td className="px-6 py-3 font-semibold text-slate-800">Infrastructure</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-400">03</td>
                  <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">Deliverable_Milestone</td>
                  <td className="px-4 py-3 text-slate-800 whitespace-nowrap">Specific Title</td>
                  <td className="px-6 py-3">Concrete, verifiable outcome detailing what is being commissioned.</td>
                  <td className="px-6 py-3 font-medium text-slate-800">Cleanroom ISO-5/6 HVAC Commissioning & Certification</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-400">04</td>
                  <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">Key_Assets_Partnerships_Infrastructure</td>
                  <td className="px-4 py-3 text-slate-800 whitespace-nowrap">Partner / OEM</td>
                  <td className="px-6 py-3">Hardware vendor, technology partner, or university tie-up.</td>
                  <td className="px-6 py-3 text-slate-700">Cadence / Applied Materials filtration systems</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-400">05</td>
                  <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">Target_Date</td>
                  <td className="px-4 py-3 font-mono text-slate-800 whitespace-nowrap">YYYY-MM-DD</td>
                  <td className="px-6 py-3">Committed delivery completion date.</td>
                  <td className="px-6 py-3 font-mono text-slate-700">2026-11-15</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-400">06</td>
                  <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">Status and Actions</td>
                  <td className="px-4 py-3 text-slate-800 whitespace-nowrap">Dropdown Select</td>
                  <td className="px-6 py-3">Not Started, In Progress, On Track, Delayed, Completed, Blocked, On Hold.</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">Delayed</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-400">07</td>
                  <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">Capex_Budget_Cr</td>
                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">₹ Crores</td>
                  <td className="px-6 py-3">Capital investment allocated or spent. Format in ₹ Cr.</td>
                  <td className="px-6 py-3 font-bold text-slate-800">₹ 14.5 Cr</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-400">08</td>
                  <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">Revenue_Pipeline_Cr</td>
                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">₹ Crores</td>
                  <td className="px-6 py-3">Commercial training or testing revenue pipeline. Format in ₹ Cr.</td>
                  <td className="px-6 py-3 font-bold text-emerald-700">₹ 28.0 Cr</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-400">09</td>
                  <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">Lead_Owner</td>
                  <td className="px-4 py-3 text-slate-800 whitespace-nowrap">Role / Designation</td>
                  <td className="px-6 py-3">Single accountable person or official departmental role title.</td>
                  <td className="px-6 py-3 text-slate-800 font-medium">Semicon Head</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-400">10</td>
                  <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">Risks_Operational_Blockers</td>
                  <td className="px-4 py-3 text-slate-800 whitespace-nowrap">Text description</td>
                  <td className="px-6 py-3">Active bottlenecks, supply chain stalls, or regulatory approvals needed.</td>
                  <td className="px-6 py-3 text-rose-700">HEPA filtration vendor delivery delayed by 2 weeks</td>
                </tr>
                <tr>
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-400">11</td>
                  <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">Vice_Chairman_Decision_Action</td>
                  <td className="px-4 py-3 text-slate-800 whitespace-nowrap">Executive request</td>
                  <td className="px-6 py-3 font-medium text-indigo-950">Action required from Vice Chairman. Appears in executive attention table.</td>
                  <td className="px-6 py-3 font-semibold text-indigo-800">VC approval requested for expedited air shipping waiver</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Real-World Department Row Templates */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Official Milestone Templates Across Strategic Verticals
              </h3>
              <span className="text-[11px] font-semibold text-indigo-600">
                7 Real-World Reference Rows
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Semicon */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-700">1. Semicon (SEM-WS-01)</span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[10px]">Delayed</span>
                </div>
                <div className="text-slate-800 font-semibold">Cleanroom ISO-5/6 HVAC Commissioning & Certification</div>
                <div className="text-[11px] text-slate-500">Partner: Cadence / Applied Materials clean air filtration</div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                  <span>Capex: <strong>₹ 14.5 Cr</strong> | Rev: <strong>₹ 28.0 Cr</strong></span>
                  <span className="text-slate-500">Date: 2026-11-15</span>
                </div>
                <div className="text-[11px] text-rose-700 font-medium">Risk: HEPA filtration vendor delivery delayed by 2 weeks</div>
                <div className="text-[11px] text-indigo-800 font-semibold">VC Action: VC approval requested for expedited air shipping waiver</div>
              </div>

              {/* Aerospace & Defence */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-700">2. Aerospace & Defence (AERO-WS-01)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">On Track</span>
                </div>
                <div className="text-slate-800 font-semibold">Avionics Hardware-in-the-Loop (HIL) Flight Simulator Lab</div>
                <div className="text-[11px] text-slate-500">Partner: HAL Avionics Division / National Instruments</div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                  <span>Capex: <strong>₹ 8.5 Cr</strong> | Rev: <strong>₹ 18.0 Cr</strong></span>
                  <span className="text-slate-500">Date: 2026-11-20</span>
                </div>
                <div className="text-[11px] text-slate-600">Risk: Component customs clearance pending at Bengaluru airport</div>
                <div className="text-[11px] text-indigo-800 font-semibold">VC Action: Duty exemption certificate submitted for VC signature</div>
              </div>

              {/* Space */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-700">3. Space (SPC-WS-01)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">On Track</span>
                </div>
                <div className="text-slate-800 font-semibold">Ground Station & CubeSat Telemetry Dish Installation</div>
                <div className="text-[11px] text-slate-500">Partner: ISRO IN-SPACe / Dhruva Space</div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                  <span>Capex: <strong>₹ 6.0 Cr</strong> | Rev: <strong>₹ 12.0 Cr</strong></span>
                  <span className="text-slate-500">Date: 2026-11-10</span>
                </div>
                <div className="text-[11px] text-slate-600">Risk: Rooftop civil reinforcement load-bearing audit complete</div>
                <div className="text-[11px] text-indigo-800 font-semibold">VC Action: VC signature required on IN-SPACe Master Authorization</div>
              </div>

              {/* Cybersecurity */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-700">4. Cybersecurity (CYB-WS-01)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">On Track</span>
                </div>
                <div className="text-slate-800 font-semibold">Enterprise Simulation Cyber Range (100 Student Seats)</div>
                <div className="text-[11px] text-slate-500">Partner: Fortinet / Palo Alto Networks / Dell Server Stack</div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                  <span>Capex: <strong>₹ 5.2 Cr</strong> | Rev: <strong>₹ 25.0 Cr</strong></span>
                  <span className="text-slate-500">Date: 2026-10-30</span>
                </div>
                <div className="text-[11px] text-slate-600">Risk: Dedicated 10 Gbps ISP fiber pipe required for attack simulation</div>
                <div className="text-[11px] text-indigo-800 font-semibold">VC Action: VC approval required for annual leased line ISP contract</div>
              </div>

              {/* MedTech */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-700">5. MedTech (MED-WS-01)</span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[10px]">Delayed</span>
                </div>
                <div className="text-slate-800 font-semibold">Hospital Bio-Telemetry & Patient Simulator Facility</div>
                <div className="text-[11px] text-slate-500">Partner: Ramaiah Medical College & Hospital Simulation Ward</div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                  <span>Capex: <strong>₹ 9.0 Cr</strong> | Rev: <strong>₹ 19.0 Cr</strong></span>
                  <span className="text-slate-500">Date: 2026-10-28</span>
                </div>
                <div className="text-[11px] text-rose-700 font-medium">Risk: Hospital ward plumbing and medical gas line retrofit delayed</div>
                <div className="text-[11px] text-indigo-800 font-semibold">VC Action: VC liaison requested with Medical Director for work order sign-off</div>
              </div>

              {/* Advanced Manufacturing */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-700">6. Advanced Manufacturing (MFG-WS-01)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">On Track</span>
                </div>
                <div className="text-slate-800 font-semibold">Direct Metal Laser Sintering (DMLS) 3D Printing Lab</div>
                <div className="text-[11px] text-slate-500">Partner: EOS GmbH / Renishaw Metrology</div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                  <span>Capex: <strong>₹ 11.0 Cr</strong> | Rev: <strong>₹ 32.0 Cr</strong></span>
                  <span className="text-slate-500">Date: 2026-10-18</span>
                </div>
                <div className="text-[11px] text-slate-600">Risk: Argon gas delivery pipeline manifold installation</div>
                <div className="text-[11px] text-slate-500 font-semibold">VC Action: None</div>
              </div>

              {/* Communications */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-700">8. Communications (COMM-WS-01)</span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[10px]">In Progress</span>
                </div>
                <div className="text-slate-800 font-semibold">National Advanced Skills Summit & Industry Round Table</div>
                <div className="text-[11px] text-slate-500">Partner: CII / FICCI / IESA Industry Alliances</div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                  <span>Capex: <strong>₹ 1.5 Cr</strong> | Rev: <strong>₹ 5.0 Cr</strong></span>
                  <span className="text-slate-500">Date: 2026-11-28</span>
                </div>
                <div className="text-[11px] text-slate-600">Risk: Keynote confirmations pending from 4 semiconductor CEOs</div>
                <div className="text-[11px] text-indigo-800 font-semibold">VC Action: VC invitation letter dispatch to 20 Chief Executive Officers</div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: VERTICAL-BY-VERTICAL CONFIGURABLE HEADINGS */}
        <section id="vertical-headings" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight uppercase">
                3. Vertical-by-Vertical Field Directory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard field descriptions for each vertical's Sector Overview Web Form.
              </p>
            </div>

            {/* Vertical Filter Tabs */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveVertical("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  activeVertical === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All 8 Verticals
              </button>
              {verticals.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveVertical(v.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    activeVertical === v.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {v.name.split(". ")[1]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {(activeVertical === "ALL" || activeVertical === "SEMICON") && (
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
                  Vertical 1: Semicon
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Cleanroom Facility</strong>
                    ISO-5/6/7 cleanroom civil readiness, HVAC air circulation, filtration, gas supply line status.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Cadence EDA Tooling</strong>
                    EDA cluster server provisioning, node seat count (e.g. 250 nodes), license server activation.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Academic Partners</strong>
                    Joint M.Tech / B.Tech VLSI curriculums, university collaborations with IITs / international institutes.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Corporate Cohorts</strong>
                    Corporate training batches contracted with semiconductor fabs and ATMP providers (e.g., Tata, Micron).
                  </div>
                </div>
              </div>
            )}

            {(activeVertical === "ALL" || activeVertical === "AERO") && (
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
                  Vertical 2: Aerospace & Defence
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Defense Radar Lab</strong>
                    X-Band / AESA radar test bench installation, RF anechoic chamber, signal generator setup.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Avionics HIL Benches</strong>
                    Hardware-in-the-Loop flight computers, MIL-STD-1553 bus analyzers, flight test simulator.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Anchor Alliances</strong>
                    Strategic pacts with defence PSUs (HAL, BEL) and DRDO research labs (ADE, GTRE, LRDE).
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Domain Lead</strong>
                    Onboarding of Chief Technical Advisor, Emeritus Defence Chairs, or military veterans leading the lab.
                  </div>
                </div>
              </div>
            )}

            {(activeVertical === "ALL" || activeVertical === "SPACE") && (
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
                  Vertical 3: Space
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Satellite Clean Bench</strong>
                    Class 100 laminar flow assembly booth, thermal vacuum chamber access, vibration test readiness.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Anchor Space Alliance</strong>
                    Partnerships with IN-SPACe, ISRO centers, and private satellite/propulsion startups.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Space Agency Advisory</strong>
                    Expert advisory council composed of veteran ISRO scientists and satellite payload engineers.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">CubeSat Flight Window</strong>
                    Target launch manifest, satellite payload specifications, and launch service provider booking.
                  </div>
                </div>
              </div>
            )}

            {(activeVertical === "ALL" || activeVertical === "CYBER") && (
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
                  Vertical 4: Cybersecurity
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Defense Cyber Range</strong>
                    Simulation range server capacity (100 seats), attack-defense scenario packs (OT, Banking, Defence).
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">SOC Infrastructure</strong>
                    Student-led Security Operations Center, SIEM appliances (Splunk, Elastic), and 24/7 console setup.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Academic Tier</strong>
                    Postgraduate diplomas and certifications aligned to CERT-In and NCIIPC standards.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Monetization Model</strong>
                    Corporate threat simulation bootcamps, penetration testing services, and sponsored red-teaming.
                  </div>
                </div>
              </div>
            )}

            {(activeVertical === "ALL" || activeVertical === "MEDTECH") && (
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
                  Vertical 5: MedTech
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Clinical Testbed</strong>
                    Ward retrofitting at Ramaiah Memorial Hospital for in-vivo clinical device validation.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Lab Equipment</strong>
                    High-fidelity patient simulation manikins, bio-signal telemetry, ECG/EEG acquisition carts.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Quality Standards</strong>
                    ISO 13485 (Medical Device QMS), CDSCO medical device clearance roadmap, and ethics committee filings.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Corporate Cohort</strong>
                    Medical device OEM partnerships (GE Healthcare, Siemens Healthineers, Philips) and hospital accelerators.
                  </div>
                </div>
              </div>
            )}

            {(activeVertical === "ALL" || activeVertical === "MFG") && (
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
                  Vertical 6: Advanced Manufacturing
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">3DEXPERIENCE CoE</strong>
                    Dassault Systèmes 3DEXPERIENCE platform installation, cloud licenses, digital twin testbed.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">CAD Workstations</strong>
                    High-performance GPU rendering stations (NVIDIA RTX / HP Z-series), multi-axis CAM tools.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Manufacturing Facility</strong>
                    Direct Metal Laser Sintering (DMLS) 3D printer, 5-axis CNC machines, and industrial metrology.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Live Capstones</strong>
                    Direct product engineering contracts from automotive OEMs (EV battery casings, lightweight structures).
                  </div>
                </div>
              </div>
            )}

            {(activeVertical === "ALL" || activeVertical === "HR") && (
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
                  Vertical 7: HR & Recruitment
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Total Requisitions</strong>
                    Total sanctioned positions across Domain Chairs, Senior Professors, and Technical Lab Engineers.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Pipeline Status</strong>
                    Sourcing velocity, executive search agency engagement, active candidate pool size.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Active Interviews</strong>
                    Candidates currently in technical loop, panel interview rounds, or offer negotiation.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Critical Open Roles</strong>
                    Director-level leadership positions vacant requiring executive search escalation.
                  </div>
                </div>
              </div>
            )}

            {(activeVertical === "ALL" || activeVertical === "COMM") && (
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">
                  Vertical 8: Communications
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Web Portal & Digital Footprint</strong>
                    RIASAT main web portal, departmental microsites, digital outreach campaigns, search presence.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Industry Outreach Summit</strong>
                    Annual National Advanced Skills Summit, CEO roundtables, conference agenda and date.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Collateral & Media Assets</strong>
                    Executive prospectus, printed brochures, promotional video releases, institutional booths.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="block text-slate-900 mb-0.5">Strategic Alliances</strong>
                    Institutional memberships and visibility agreements with CII, FICCI, NASSCOM, and IESA.
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 4: SUBMISSION PROTOCOL */}
        <section className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold tracking-tight">
              4. Submission Protocol: Draft vs. Submit to Executive Dashboard
            </h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every department form provides two actions at the bottom of the screen:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
              <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px] font-bold uppercase">
                Action 1
              </span>
              <h3 className="font-bold text-sm text-white">Save as Draft</h3>
              <p className="text-slate-400 text-xs">
                Saves your work progressively into PostgreSQL. Does not publish final numbers to the Executive Dashboard.
                Use this while gathering data from faculty and vendors.
              </p>
            </div>
            <div className="p-4 bg-slate-800 rounded-xl border border-emerald-600/60 space-y-2">
              <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 text-[10px] font-bold uppercase">
                Action 2
              </span>
              <h3 className="font-bold text-sm text-emerald-400">Submit to Executive Dashboard</h3>
              <p className="text-slate-300 text-xs">
                Marks the submission as verified. Immediately updates the live Executive Dashboard, Capex/Revenue graphs,
                and Vice Chairman Attention List.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
