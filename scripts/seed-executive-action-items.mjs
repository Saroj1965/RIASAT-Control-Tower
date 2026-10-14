// scripts/seed-executive-action-items.mjs
// Inserts the 12 authentic leadership Action Items into the database

import { query } from "../src/lib/db.ts";

const ACTION_ITEMS = [
  {
    department_id: 9, // Strategy & Ops / HR
    item_id: "ACT-01",
    category: "Faculty & Trainers",
    deliverable: "Confirm contract/tenure terms and permanent-conversion process for existing trainers; standardise and communicate the variable-pay approach.",
    owner: "Anamika to coordinate with relevant RUAS/HR contacts",
    target_date: "Urgent; close after clarification",
    status: "Open",
    remarks: "Standardise variable-pay approach and tenure terms",
    vc_decision_required: "Yes",
  },
  {
    department_id: 1, // Semicon
    item_id: "ACT-02",
    category: "Talent Acquisition",
    deliverable: "Progress the two semiconductor candidates (Dr. Durga Prakash and RUAS PhD candidate Darshan); confirm role, fit, package and offer route.",
    owner: "Anamika; Venky to guide/meet candidates",
    target_date: "Urgent",
    status: "Open",
    remarks: "Confirm role, fit, package and offer route",
    vc_decision_required: "Yes",
  },
  {
    department_id: 7, // HR & Recruitment
    item_id: "ACT-03",
    category: "Technical Hiring",
    deliverable: "Arrange remaining interviews and joining-date follow-ups for trainer and IT application roles; prioritise IT applications over infrastructure.",
    owner: "Recruitment team; relevant technical interviewers",
    target_date: "As soon as possible",
    status: "Open",
    remarks: "Prioritise IT applications over infrastructure",
    vc_decision_required: "No",
  },
  {
    department_id: 8, // Communications
    item_id: "ACT-04",
    category: "Marketing & Sales",
    deliverable: "Review and strengthen the two marketing/sales-related job descriptions; source experienced candidates and move recruitment quickly.",
    owner: "Marketing/Recruitment team",
    target_date: "Immediate; before Dec 2026 launch",
    status: "Open",
    remarks: "Source experienced candidates before Dec 2026 launch",
    vc_decision_required: "No",
  },
  {
    department_id: 8, // Communications
    item_id: "ACT-05",
    category: "Brand & Outreach",
    deliverable: "Prepare launch-ready programme positioning, website content, online application flow, corporate outreach and campaign collateral.",
    owner: "Marketing/Communications with programme leads",
    target_date: "By December 2026",
    status: "Open",
    remarks: "Prepare website, application flow, and collateral",
    vc_decision_required: "No",
  },
  {
    department_id: 1, // Semicon
    item_id: "ACT-06",
    category: "Curriculum & Labs",
    deliverable: "Compile curriculum and equipment requirements for reliability/testing, metrology and characterisation; review with IIT Madras and Keysight and propose programme/pricing options.",
    owner: "Programme/technical team",
    target_date: "Follow up after IIT Madras discussions",
    status: "Open",
    remarks: "Review with IIT Madras and Keysight for pricing options",
    vc_decision_required: "Yes",
  },
  {
    department_id: 6, // Advanced Manufacturing
    item_id: "ACT-07",
    category: "Executive Training",
    deliverable: "Confirm trainer capacity, infrastructure, location and schedule for prospective HiCAG training; Vice Chairman to join the follow-up discussion.",
    owner: "Business/programme team and technical leads",
    target_date: "Follow up immediately",
    status: "Open",
    remarks: "Vice Chairman to join the follow-up discussion",
    vc_decision_required: "Yes",
  },
  {
    department_id: 3, // Space
    item_id: "ACT-08",
    category: "Lab Infrastructure",
    deliverable: "Obtain written space-lab proposal and consolidate lab space plan for semiconductor, space, cybersecurity and AI; validate approximate areas.",
    owner: "Facilities/Strategy and programme team",
    target_date: "After partner proposals and IIT Madras visit",
    status: "Open",
    remarks: "Consolidate lab space plan across four verticals",
    vc_decision_required: "Yes",
  },
  {
    department_id: 9, // Strategy & Ops
    item_id: "ACT-09",
    category: "Facilities & Architecture",
    deliverable: "Revise architect/facility proposal to include validation/testing equipment; obtain final scope and submit for approval.",
    owner: "Facilities/Strategy team",
    target_date: "Target work start discussed around 15 Oct 2026; confirm",
    status: "Open",
    remarks: "Target work start around 15 Oct 2026",
    vc_decision_required: "Yes",
  },
  {
    department_id: 9, // Strategy & Ops
    item_id: "ACT-10",
    category: "IT & Infrastructure",
    deliverable: "Escalate laptop procurement and IT application hiring delays; arrange a call with the Vice Chairman and relevant contacts.",
    owner: "Avinash / Administration / relevant vendor contacts",
    target_date: "Immediate",
    status: "Open",
    remarks: "Arrange call with Vice Chairman and vendors",
    vc_decision_required: "Yes",
  },
  {
    department_id: 2, // Aerospace & Defence
    item_id: "ACT-11",
    category: "Software & Licences",
    deliverable: "Notify vendor that charges for inactive Dassault/CATIA licences should commence only from activation date; clarify licence categories.",
    owner: "Programme/Operations team",
    target_date: "Immediate",
    status: "Open",
    remarks: "Charges should commence only from activation date",
    vc_decision_required: "No",
  },
  {
    department_id: 9, // Strategy & Ops
    item_id: "ACT-12",
    category: "Governance & Review",
    deliverable: "Resend revised faculty compensation/revenue proposal for review; then schedule stakeholder discussion.",
    owner: "HR/Programme team; Sarojini to coordinate meeting after review",
    target_date: "Proposal review requested on 12 Oct",
    status: "Open",
    remarks: "Sarojini to coordinate meeting after review",
    vc_decision_required: "Yes",
  },
];

async function seed() {
  console.log("Seeding 12 Action Items into workstreams...");

  for (const item of ACTION_ITEMS) {
    const existing = await query(
      "SELECT id FROM workstreams WHERE item_id = $1 OR deliverable = $2",
      [item.item_id, item.deliverable]
    );

    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO workstreams (
          department_id, item_id, category, deliverable, action_point,
          owner, ownership, target_date, timeline,
          status, remarks, vc_decision_required, updated_by
        ) VALUES (
          $1, $2, $3, $4, $4,
          $5, $5, $6, $6,
          $7, $8, $9, 'Executive Secretariat'
        )`,
        [
          item.department_id,
          item.item_id,
          item.category,
          item.deliverable,
          item.owner,
          item.target_date,
          item.status,
          item.remarks,
          item.vc_decision_required,
        ]
      );
      console.log(`+ Inserted: [${item.item_id}] ${item.deliverable.slice(0, 50)}...`);
    } else {
      await query(
        `UPDATE workstreams SET
          department_id = $1, category = $2, deliverable = $3, action_point = $3,
          owner = $4, ownership = $4, target_date = $5, timeline = $5,
          status = $6, remarks = $7, vc_decision_required = $8, updated_by = 'Executive Secretariat'
         WHERE id = $9`,
        [
          item.department_id,
          item.category,
          item.deliverable,
          item.owner,
          item.target_date,
          item.status,
          item.remarks,
          item.vc_decision_required,
          existing.rows[0].id,
        ]
      );
      console.log(`~ Updated: [${item.item_id}] ${item.deliverable.slice(0, 50)}...`);
    }
  }

  console.log("Done! All 12 Action Items successfully seeded.");
}

seed().catch(console.error);
