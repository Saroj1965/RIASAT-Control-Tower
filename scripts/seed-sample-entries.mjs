// scripts/seed-sample-entries.mjs
const BASE_URL = "http://localhost:3000";

function parseCookie(res) {
  const raw = res.headers.get("set-cookie");
  if (!raw) return "";
  return raw.split(";")[0];
}

async function run() {
  console.log("================================================================================");
  console.log("SEEDING TWO SAMPLE ENTRIES FOR EACH OF THE 9 VERTICALS IN RIASAT CONTROL TOWER");
  console.log("================================================================================\n");

  // Step 1: Login as Admin
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@riasat.ac.in", password: "Admin@123" }),
  });
  const cookie = parseCookie(loginRes);
  if (!cookie) {
    console.error("❌ Login failed as Admin:", await loginRes.text());
    process.exit(1);
  }
  console.log("✅ Logged in successfully as System Administrator.\n");

  // Step 2: Clear any existing items in workstreams and recruitment
  console.log("--- Clearing existing workstreams and recruitment items ---");
  for (let id = 1; id <= 9; id++) {
    const deptRes = await fetch(`${BASE_URL}/api/departments/${id}`, {
      headers: { Cookie: cookie },
    });
    const data = await deptRes.json();
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        if (id === 7) {
          await fetch(`${BASE_URL}/api/recruitment/${item.id}`, {
            method: "DELETE",
            headers: { Cookie: cookie },
          });
        } else {
          await fetch(`${BASE_URL}/api/workstreams/${item.id}`, {
            method: "DELETE",
            headers: { Cookie: cookie },
          });
        }
      }
      console.log(`Cleared ${data.items.length} items from Department ${id} (${data.department?.name})`);
    }
  }
  console.log("Existing items cleared.\n");

  // Step 3: Define 2 sample entries per vertical
  const departmentOverviews = {
    1: { readiness: 40, rag: "AMBER", focus: "ISO-6 cleanroom HVAC validation and ASML DUV stepper customs clearance" },
    2: { readiness: 45, rag: "AMBER", focus: "Autoclave composite testing commissioning and DRDO ToT agreement" },
    3: { readiness: 35, rag: "AMBER", focus: "Thermal vacuum chamber setup and IN-SPACe ground station licensing" },
    4: { readiness: 50, rag: "AMBER", focus: "Air-gapped cyber range deployment and CERT-In HSM procurement" },
    5: { readiness: 38, rag: "AMBER", focus: "ISO 13485 clean room prototyping and Ramaiah clinical trial MoU" },
    6: { readiness: 60, rag: "GREEN", focus: "5-Axis CNC milling center commissioned and robotics automation cell" },
    7: { readiness: 48, rag: "GREEN", focus: "Sourcing critical talent for Semicon and Aerospace leadership roles" },
    8: { readiness: 55, rag: "AMBER", focus: "Brand launch summit preparation and DeepTech quarterly whitepaper" },
    9: { readiness: 65, rag: "AMBER", focus: "Executive Control Tower governance and Advisory Council formation" },
  };

  const actionEntries = [
    // Dept 1: Semicon
    {
      deptId: 1,
      category: "Cleanroom Infrastructure & Validation",
      action_point: "ISO-6 Cleanroom HVAC Balancing & Airborne Particle Counter Validation",
      ownership: "Dr. S. Ramanathan / Semiconductor Fab Lead",
      timeline: "2026-11-15",
      status: "In Progress",
      rag_status: "GREEN",
      remarks: "Air handling units (AHU) commissioned. Airborne particle count validation scheduled with third-party auditor next week.",
      vc_decision_required: "No",
      decision_action: "",
    },
    {
      deptId: 1,
      category: "Equipment Procurement & Import",
      action_point: "ASML DUV Lithography Stepper Customs Duty Exemption Clearance",
      ownership: "R. Venkatesh / Equipment Procurement Lead",
      timeline: "2026-10-30",
      status: "Delayed",
      rag_status: "AMBER",
      remarks: "Lithography stepper arrived at Chennai port bonded warehouse. DSIR customs concession certificate pending inter-ministry sign-off.",
      vc_decision_required: "Yes",
      decision_action: "Vice Chairman representation letter required for MeitY Secretary to expedite customs duty exemption waiver.",
    },

    // Dept 2: Aerospace & Defence
    {
      deptId: 2,
      category: "Testing & Prototyping Infrastructure",
      action_point: "Aerospace-Grade Autoclave (3m Dia) Foundation & Calibration Setup",
      ownership: "Wg Cdr (Retd) K. Swaminathan / Aerospace Tech Lead",
      timeline: "2026-11-20",
      status: "In Progress",
      rag_status: "GREEN",
      remarks: "Autoclave pressure vessel anchored on foundation pad. Vacuum line piping and nitrogen purge system undergoing pressure testing.",
      vc_decision_required: "No",
      decision_action: "",
    },
    {
      deptId: 2,
      category: "Institutional Partnership & ToT",
      action_point: "DRDO-ADE Transfer of Technology (ToT) MoU for Indigenous UAV Telemetry",
      ownership: "Col (Retd) Anand Varma / Defence Liaison Director",
      timeline: "2026-11-05",
      status: "In Progress",
      rag_status: "AMBER",
      remarks: "Bilateral draft agreement reviewed by legal counsel. Clause 7.2 on joint intellectual property indemnification requires VC sign-off.",
      vc_decision_required: "Yes",
      decision_action: "Vice Chairman approval required to finalize joint IP indemnification clause and authorize MoU execution.",
    },

    // Dept 3: Space
    {
      deptId: 3,
      category: "Payload Testing Infrastructure",
      action_point: "Thermal Vacuum Chamber (TVAC) Setup for CubeSat Qualification",
      ownership: "Dr. K. Radhakrishnan / Space Systems Director",
      timeline: "2026-12-10",
      status: "In Progress",
      rag_status: "GREEN",
      remarks: "Chamber vacuum reached 10^-6 Torr. Liquid nitrogen thermal shroud undergoing helium leak detection testing.",
      vc_decision_required: "No",
      decision_action: "",
    },
    {
      deptId: 3,
      category: "Regulatory Clearance & Telemetry",
      action_point: "IN-SPACe Ground Station Authorization & S/X-Band Spectrum License",
      ownership: "Pooja Deshmukh / Telemetry & Comms Lead",
      timeline: "2026-11-12",
      status: "Delayed",
      rag_status: "AMBER",
      remarks: "Wireless Planning & Coordination (WPC) clearance pending frequency band harmonization with satellite operations.",
      vc_decision_required: "Yes",
      decision_action: "Vice Chairman intervention requested with IN-SPACe Director General for priority spectrum allocation window.",
    },

    // Dept 4: Cybersecurity
    {
      deptId: 4,
      category: "Cyber Infrastructure & Testbed",
      action_point: "Air-Gapped National Cyber Range & SCADA Defense Simulation Testbed",
      ownership: "Abhinav Sen / Cyber Defense Architect",
      timeline: "2026-11-18",
      status: "In Progress",
      rag_status: "GREEN",
      remarks: "Hardware server racks energized. Red team vs Blue team adversary simulation orchestration engine operational.",
      vc_decision_required: "No",
      decision_action: "",
    },
    {
      deptId: 4,
      category: "Compliance & Security Hardware",
      action_point: "CERT-In Auditing Lab Accreditation & FIPS 140-3 Hardware HSM Procurement",
      ownership: "Rohit Nambiar / Compliance & Security Head",
      timeline: "2026-10-28",
      status: "In Progress",
      rag_status: "AMBER",
      remarks: "Documentation audit cleared. Procurement tender for dual-redundant Thales HSMs requires financial sanction above departmental limit.",
      vc_decision_required: "Yes",
      decision_action: "Sanction of ₹42 Lakhs capex release for Tier-4 Hardware Security Module acquisition.",
    },

    // Dept 5: MedTech
    {
      deptId: 5,
      category: "Biomedical Prototyping Facility",
      action_point: "ISO 13485 Class 10,000 Biomedical Device Clean Room Bench Installation",
      ownership: "Dr. Manisha Sharma / MedTech Innovation Lead",
      timeline: "2026-11-25",
      status: "In Progress",
      rag_status: "GREEN",
      remarks: "HEPA filtration units and positive pressure differential sensors operational. First surgical guide batch test planned.",
      vc_decision_required: "No",
      decision_action: "",
    },
    {
      deptId: 5,
      category: "Clinical Trial Collaboration",
      action_point: "Ramaiah Medical College Clinical Trial Co-Development MoU & Ethics Protocol",
      ownership: "Dr. Harish Gowda / Clinical Partnerships Director",
      timeline: "2026-11-08",
      status: "In Progress",
      rag_status: "AMBER",
      remarks: "Institutional Ethics Committee (IEC) protocol submitted for non-invasive cardiac biomarker sensor trials.",
      vc_decision_required: "Yes",
      decision_action: "Vice Chairman approval for Joint Academic-Industry Clinical Trial governance charter and seed grant allocation.",
    },

    // Dept 6: Advanced Manufacturing
    {
      deptId: 6,
      category: "Precision Machining Infrastructure",
      action_point: "DMG MORI 5-Axis Precision CNC Machining Center Laser Calibration",
      ownership: "Rajesh Kulkarni / Precision Tooling Lead",
      timeline: "2026-10-15",
      status: "Completed",
      rag_status: "GREEN",
      remarks: "Machine calibrated to ±3 micron geometric tolerance. Impeller qualification part machined and verified using CMM inspection.",
      vc_decision_required: "No",
      decision_action: "",
    },
    {
      deptId: 6,
      category: "Robotics Automation & Digital Twin",
      action_point: "6-Axis Articulated KUKA Robotic Welding Cell & Telemetry Integration",
      ownership: "S. Muthukrishnan / Robotics Automation Head",
      timeline: "2026-11-30",
      status: "In Progress",
      rag_status: "GREEN",
      remarks: "Robotic cell safety interlocks and light curtains installed. PLC integration with SCADA gateway underway.",
      vc_decision_required: "No",
      decision_action: "",
    },

    // Dept 8: Communications
    {
      deptId: 8,
      category: "Institutional Summit & Brand Launch",
      action_point: "RIASAT Institutional Brand Launch & Industry Summit Strategy",
      ownership: "Natasha Verghese / Communications Director",
      timeline: "2026-11-10",
      status: "In Progress",
      rag_status: "AMBER",
      remarks: "Brand collateral, media kits, and VIP invitee list prepared. Keynote address outline and policy announcement embargo drafted.",
      vc_decision_required: "Yes",
      decision_action: "Vice Chairman approval required on summit keynote speaking points and institutional launch date.",
    },
    {
      deptId: 8,
      category: "Publications & Thought Leadership",
      action_point: "DeepTech Quarterly Sectoral Whitepaper on National Semiconductor Roadmap",
      ownership: "Arun Subramanian / Editorial & Research Lead",
      timeline: "2026-12-05",
      status: "In Progress",
      rag_status: "GREEN",
      remarks: "Draft research chapters completed with input from Semicon and Defence faculty leads. Design layout in progress.",
      vc_decision_required: "No",
      decision_action: "",
    },

    // Dept 9: Strategy & Operations
    {
      deptId: 9,
      category: "Governance & Control Tower Operations",
      action_point: "Executive Control Tower KPI Governance & Review Cadence SOP",
      ownership: "Tariq Ahmed / Head Strategy & Operations",
      timeline: "2026-10-20",
      status: "Completed",
      rag_status: "GREEN",
      remarks: "Executive dashboard live with all 9 verticals. Standard reporting SOP and tracker guidelines deployed across all department heads.",
      vc_decision_required: "No",
      decision_action: "",
    },
    {
      deptId: 9,
      category: "Strategic Advisory Council",
      action_point: "Academic & Industry Advisory Council Formation (Phase 1 Appointments)",
      ownership: "Priya Nair / Strategic Initiatives Lead",
      timeline: "2026-11-15",
      status: "In Progress",
      rag_status: "AMBER",
      remarks: "Shortlist of 15 distinguished prospective advisors compiled across semiconductors, space, aerospace, and medical technologies.",
      vc_decision_required: "Yes",
      decision_action: "Vice Chairman review and approval of the honorary invitation list and charter terms of reference.",
    },
  ];

  // Dept 7: HR & Recruitment entries
  const recruitmentEntries = [
    {
      position_id: "POS-SEM-001",
      position_title: "Lead Scientist - Cleanroom Microfabrication",
      strategic_segment: "Semicon",
      priority: "Critical",
      hiring_lead: "Anamika Sahay / Head HR",
      target_date: "2026-11-15",
      status: "Interview in progress",
      candidates_sourced: 14,
      candidates_shortlisted: 4,
      interviews: 2,
      offers: 0,
      candidates_joined: 0,
      remarks: "Top 2 candidates from TSMC & IMEC cleared technical rounds. VC final interview panel scheduled.",
      next_action: "Conduct final VC leadership interview and release formal offer letter.",
      rag_status: "GREEN",
      vc_decision_required: "Yes",
      vc_attention: true,
    },
    {
      position_id: "POS-AERO-002",
      position_title: "Principal Systems Architect - Avionics & Defence",
      strategic_segment: "Aerospace & Defence",
      priority: "High",
      hiring_lead: "Sumanth Rao / Senior HR Lead",
      target_date: "2026-12-01",
      status: "Candidate sourced",
      candidates_sourced: 8,
      candidates_shortlisted: 3,
      interviews: 0,
      offers: 0,
      candidates_joined: 0,
      remarks: "Profiles sourced from HAL R&D, BEL, and private aerospace tier-1 suppliers. Initial technical screening underway.",
      next_action: "Technical panel shortlisting review by Aerospace Department Head.",
      rag_status: "GREEN",
      vc_decision_required: "No",
      vc_attention: false,
    },
  ];

  // Step 4: Insert Action Tracker entries
  console.log("--- Inserting Action Tracker entries for Verticals 1, 2, 3, 4, 5, 6, 8, 9 ---");
  for (const entry of actionEntries) {
    const res = await fetch(`${BASE_URL}/api/workstreams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        department_id: entry.deptId,
        category: entry.category,
        action_point: entry.action_point,
        deliverable: entry.action_point,
        ownership: entry.ownership,
        owner: entry.ownership,
        timeline: entry.timeline,
        target_date: entry.timeline,
        status: entry.status,
        rag_status: entry.rag_status,
        remarks: entry.remarks,
        vc_decision_required: entry.vc_decision_required,
        decision_action: entry.decision_action,
      }),
    });

    const resJson = await res.json();
    if (res.ok) {
      console.log(`✅ [Dept ${entry.deptId}] Added action: "${entry.action_point.slice(0, 45)}..." (Status: ${entry.status}, VC: ${entry.vc_decision_required})`);
    } else {
      console.error(`❌ [Dept ${entry.deptId}] Error adding action:`, resJson);
    }
  }

  // Step 5: Insert HR & Recruitment entries
  console.log("\n--- Inserting Recruitment Tracker entries for Vertical 7 (HR & Recruitment) ---");
  for (const entry of recruitmentEntries) {
    const res = await fetch(`${BASE_URL}/api/recruitment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify(entry),
    });

    const resJson = await res.json();
    if (res.ok) {
      console.log(`✅ [HR & Recruitment] Added position: "${entry.position_title}" (Status: ${entry.status}, VC: ${entry.vc_decision_required})`);
    } else {
      console.error(`❌ [HR & Recruitment] Error adding position:`, resJson);
    }
  }

  // Step 6: Update Department Overview for all 9 verticals
  console.log("\n--- Updating Department Overview metrics across all 9 verticals ---");
  for (let id = 1; id <= 9; id++) {
    const ov = departmentOverviews[id];
    const updateRes = await fetch(`${BASE_URL}/api/departments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        readiness_percentage: ov.readiness,
        rag_status: ov.rag,
        key_focus: ov.focus,
      }),
    });
    if (updateRes.ok) {
      console.log(`✅ [Dept ${id}] Updated Overview: Readiness = ${ov.readiness}%, RAG = ${ov.rag}`);
    } else {
      console.error(`❌ [Dept ${id}] Failed to update overview:`, await updateRes.text());
    }
  }

  // Step 7: Verify final counts and summary
  console.log("\n================================================================================");
  console.log("FINAL VERIFICATION: CHECKING ALL 9 VERTICALS");
  console.log("================================================================================\n");

  let allPass = true;
  for (let id = 1; id <= 9; id++) {
    const deptRes = await fetch(`${BASE_URL}/api/departments/${id}`, {
      headers: { Cookie: cookie },
    });
    const data = await deptRes.json();
    const count = data.items?.length || 0;
    const ov = data.overview;
    const ok = count === 2;
    if (!ok) allPass = false;
    console.log(`${ok ? "✅" : "❌"} Vertical ${id} [${data.department?.name}]:`);
    console.log(`   Items: ${count} entries (Expected: 2)`);
    console.log(`   Readiness: ${ov?.readiness_percentage}%, RAG: ${ov?.rag_status}`);
    data.items.forEach((it, idx) => {
      if (id === 7) {
        console.log(`     Entry ${idx + 1}: [${it.status}] ${it.position_title} (Vertical: ${it.strategic_segment}, VC: ${it.vc_decision_required})`);
      } else {
        console.log(`     Entry ${idx + 1}: [${it.status}] ${it.deliverable || it.action_point} (Owner: ${it.ownership || it.owner}, VC: ${it.vc_decision_required})`);
      }
    });
  }

  // Step 8: Verify Executive Summary
  console.log("\n--- Checking Executive Summary API ---");
  const execSummaryRes = await fetch(`${BASE_URL}/api/executive/summary`, {
    headers: { Cookie: cookie },
  });
  const execData = await execSummaryRes.json();
  console.log(`Total Verticals on Executive Dashboard: ${execData.departments?.length}`);
  console.log(`Overall Readiness: ${execData.summary?.overall_readiness}%`);
  console.log(`Overall RAG: ${execData.summary?.overall_rag}`);
  console.log(`Pending VC Decisions: ${execData.summary?.pending_decisions}`);

  console.log("\n================================================================================");
  if (allPass && execData.departments?.length === 9) {
    console.log("🎉 ALL 9 VERTICALS SUCCESSFULLY POPULATED WITH 2 SAMPLE ENTRIES EACH!");
  } else {
    console.log("⚠️ SOME CHECKS DID NOT MEET THE EXACT REQUIREMENTS.");
  }
  console.log("================================================================================\n");
}

run().catch(console.error);
