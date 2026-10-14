// scripts/seed-executive-action-items.mjs
// Inserts or updates the 15 authentic management review Action Items (Weekly Management Review - 12 Oct 2026)

import { query } from "../src/lib/db.ts";

export const ACTION_ITEMS = [
  {
    department_id: 7, // HR & Recruitment
    item_id: "ACT-01",
    category: "Faculty & Trainers",
    deliverable: "Confirm contract/tenure terms and the permanent-conversion process for existing trainers; standardise and communicate the variable-pay approach.",
    owner: "Anamika to coordinate with relevant RUAS/HR contacts",
    target_date: "Urgent; close after clarification",
    status: "OPEN",
    rag_status: "AMBER",
    remarks: "Confirm tenure terms and standardise variable-pay approach with RUAS/HR contacts.",
    vc_decision_required: "Yes",
    decision_action: "Standardise and communicate the variable-pay approach and permanent tenure terms.",
    supporting_departments: "HR & Recruitment",
    supporting_department_ids: "7",
    meeting_context: "Weekly Management Review - 12 Oct 2026",
  },
  {
    department_id: 7, // HR & Recruitment
    item_id: "ACT-02",
    category: "Talent Acquisition",
    deliverable: "Progress the two semiconductor candidates, Dr. Durga Prakash and RUAS PhD candidate Darshan; confirm role, fit, package and offer route.",
    owner: "Anamika; Venky to guide/meet candidates",
    target_date: "URGENT",
    status: "OPEN",
    rag_status: "AMBER",
    remarks: "Venky to guide and meet candidates; confirm role, fit, package and offer route.",
    vc_decision_required: "Yes",
    decision_action: "Executive approval on package and offer route for semiconductor candidates.",
    supporting_departments: "Semicon",
    supporting_department_ids: "1",
    meeting_context: "Weekly Management Review - 12 Oct 2026",
  },
  {
    department_id: 7, // HR & Recruitment
    item_id: "ACT-03",
    category: "Technical Hiring",
    deliverable: "Arrange remaining interviews and joining-date follow-ups for trainer and IT application roles; prioritise IT applications over infrastructure.",
    owner: "Anamika; relevant technical interviewers",
    target_date: "As soon as possible",
    status: "OPEN",
    rag_status: "AMBER",
    remarks: "Prioritise IT applications over infrastructure; expedite technical interviews.",
    vc_decision_required: "No",
    decision_action: "Prioritise IT applications over infrastructure.",
    supporting_departments: "Strategy & Operations",
    supporting_department_ids: "9",
    meeting_context: "Weekly Management Review - 12 Oct 2026",
  },
  {
    department_id: 7, // HR & Recruitment
    item_id: "ACT-04",
    category: "Marketing & Sales",
    deliverable: "Review and strengthen the two marketing/sales-related job descriptions; source experienced candidates and move recruitment quickly.",
    owner: "Anamika/Naukri team",
    target_date: "Immediate; before the December 2026 launch",
    status: "OPEN",
    rag_status: "AMBER",
    remarks: "Strengthen JDs with Naukri team; source experienced candidates before Dec 2026 launch.",
    vc_decision_required: "No",
    decision_action: "Strengthen JDs and accelerate recruitment before Dec 2026 launch.",
    supporting_departments: "Communications",
    supporting_department_ids: "8",
    meeting_context: "Weekly Management Review - 12 Oct 2026",
  },
  {
    department_id: 8, // Communications
    item_id: "ACT-05",
    category: "Brand & Outreach",
    deliverable: "Prepare launch-ready programme positioning, website content, online application flow, corporate outreach and campaign collateral.",
    owner: "Vinila along with programme leads",
    target_date: "By December 2026",
    status: "OPEN",
    rag_status: "GREEN",
    remarks: "Coordinate with programme leads for Dec 2026 launch readiness and online application flow.",
    vc_decision_required: "No",
    decision_action: "Finalize programme positioning, website content and campaign collateral.",
    supporting_departments: "Semicon, Aerospace & Defence, Strategy & Operations",
    supporting_department_ids: "1,2,9",
    meeting_context: "Weekly Management Review - 12 Oct 2026",
  },
  {
    department_id: 8, // Communications
    item_id: "ACT-06",
    category: "Industry Partnerships",
    deliverable: "Contact at least five companies to validate the programme proposal and gather feedback.",
    owner: "Vinila/Avinash",
    target_date: "As soon as possible",
    status: "OPEN",
    rag_status: "GREEN",
    remarks: "Corporate outreach initiated to validate programme proposal with 5 industry partners.",
    vc_decision_required: "No",
    decision_action: "Validate programme proposal with at least five corporate partners.",
    supporting_departments: "Strategy & Operations",
    supporting_department_ids: "9",
    meeting_context: "Weekly Management Review - 12 Oct 2026",
  },
  {
    department_id: 8, // Communications
    item_id: "ACT-07",
    category: "Collateral & Privacy",
    deliverable: "Prepare approved trainer/project profiles and customer-facing examples; remove or generalise confidential information.",
    owner: "Vinila/Marketing with technical teams",
    target_date: "For customer outreach and launch",
    status: "OPEN",
    rag_status: "GREEN",
    remarks: "Maintain strict confidentiality: generalise sensitive project data for customer-facing profiles.",
    vc_decision_required: "No",
    decision_action: "Prepare approved customer-facing profiles respecting confidentiality.",
    supporting_departments: "HR & Recruitment, Strategy & Operations",
    supporting_department_ids: "7,9",
    meeting_context: "Weekly Management Review - 12 Oct 2026",
  },
  {
    department_id: 8, // Communications
    item_id: "ACT-08",
    category: "Branding & Operations",
    deliverable: "Obtain and review the staff ID card print sample; revise certificate collateral to foreground RIASAT/Ramaiah branding.",
    owner: "Vinila/Sarojini",
    target_date: "Sample expected 12 October 2026; follow up",
    status: "OPEN",
    rag_status: "AMBER",
    remarks: "Sample expected 12 Oct 2026; follow up immediately with vendor to verify RIASAT/Ramaiah branding.",
    vc_decision_required: "No",
    decision_action: "Review ID card sample and ensure prominent RIASAT/Ramaiah branding.",
    supporting_departments: "Strategy & Operations",
    supporting_department_ids: "9",
    meeting_context: "Weekly Management Review - 12 Oct 2026",
  },
  {
    department_id: 1, // Semicon
    item_id: "ACT-09",
    category: "Curriculum & Labs",
    deliverable: "Compile curriculum and equipment requirements for reliability/testing, metrology and characterisation; review with IIT Madras and Keysight and propose programme/pricing options.",
    owner: "Avinash/Venky",
    target_date: "Follow up after IIT Madras discussions",
    status: "OPEN",
    rag_status: "AMBER",
    remarks: "Review curriculum and equipment requirements with IIT Madras and Keysight; propose pricing options.",
    vc_decision_required: "Yes",
    decision_action: "VC review of programme structure and pricing options following IIT Madras discussions.",
    supporting_departments: "Strategy & Operations",
    supporting_department_ids: "9",
    meeting_context: "Weekly Management Review - 12 Oct 2026",
  },
  {
    department_id: 1, // Semicon
    item_id: "ACT-10",
    category: "Executive Training",
    deliverable: "Confirm trainer capacity, infrastructure, location and schedule for prospective HiCAG training; Venky to join the follow-up discussion.",
    owner: "Avinash/Venky and technical leads",
    target_date: "Follow up immediately",
    status: "OPEN",
    rag_status: "AMBER",
    remarks: "Confirm trainer capacity, infrastructure, location and schedule; Venky to join discussion.",
    vc_decision_required: "Yes",
    decision_action: "Leadership alignment on HiCAG prospective training schedule and trainer deployment.",
    supporting_departments: "Advanced Manufacturing, Strategy & Operations",
    supporting_department_ids: "6,9",
    meeting_context: "Weekly Management Review - 12 Oct 2026",
  },
  {
    department_id: 3, // Space
    item_id: "ACT-11",
    category: "Lab Infrastructure",
    deliverable: "Obtain a written space-lab proposal and consolidate the lab space plan for semiconductor, space, cybersecurity and AI; validate approximate areas.",
    owner: "Architect/Avinash/Venky",
    target_date: "After partner proposals and IIT Madras visit",
    status: "OPEN",
    rag_status: "AMBER",
    remarks: "Consolidate integrated lab space plan across semiconductor, space, cyber and AI; validate areas.",
    vc_decision_required: "Yes",
    decision_action: "Executive approval of consolidated lab space plan across 4 verticals.",
    supporting_departments: "Semicon, Cybersecurity, Strategy & Operations",
    supporting_department_ids: "1,4,9",
    meeting_context: "Weekly Management Review - 12 Oct 2026",
  },
  {
    department_id: 6, // Advanced Manufacturing
    item_id: "ACT-12",
    category: "Facilities & Architecture",
    deliverable: "Revise the architect/facility proposal to include validation/testing equipment; obtain final scope and submit for approval.",
    owner: "Avinash/Venky",
    target_date: "Target work start discussed around 15 October 2026; confirm",
    status: "OPEN",
    rag_status: "AMBER",
    remarks: "Target work start discussed around 15 Oct 2026; confirm revised scope with testing equipment.",
    vc_decision_required: "Yes",
    decision_action: "VC approval of final facility scope and budget including validation/testing equipment.",
    supporting_departments: "Strategy & Operations",
    supporting_department_ids: "9",
    meeting_context: "Weekly Management Review - 12 Oct 2026",
  },
  {
    department_id: 9, // Strategy & Operations
    item_id: "ACT-13",
    category: "IT & Infrastructure",
    deliverable: "Escalate laptop procurement and IT application hiring delays; arrange a call with the Vice Chairman and relevant contacts.",
    owner: "Avinash/Sarojini/relevant vendor contacts",
    target_date: "Immediate",
    status: "OPEN",
    rag_status: "RED",
    remarks: "Critical delay in laptop procurement and IT application hiring; arrange VC escalation call.",
    vc_decision_required: "Yes",
    decision_action: "Vice Chairman intervention on vendor laptop procurement and IT application hiring delays.",
    supporting_departments: "HR & Recruitment",
    supporting_department_ids: "7",
    meeting_context: "Weekly Management Review - 12 Oct 2026",
  },
  {
    department_id: 9, // Strategy & Operations
    item_id: "ACT-14",
    category: "Software & Licences",
    deliverable: "Notify the vendor that charges for inactive Dassault/CATIA licences should commence only from the activation date; clarify licence categories.",
    owner: "Avinash",
    target_date: "Immediate",
    status: "OPEN",
    rag_status: "AMBER",
    remarks: "Billing dispute: notify vendor that charges must commence only from live activation date.",
    vc_decision_required: "No",
    decision_action: "Notify vendor that charges commence only from activation date and clarify categories.",
    supporting_departments: "Aerospace & Defence, Advanced Manufacturing",
    supporting_department_ids: "2,6",
    meeting_context: "Weekly Management Review - 12 Oct 2026",
  },
  {
    department_id: 9, // Strategy & Operations
    item_id: "ACT-15",
    category: "Governance & Review",
    deliverable: "Resend the revised faculty compensation/revenue proposal for review; then schedule the stakeholder discussion.",
    owner: "Anamika/Sarojini to coordinate the meeting after review",
    target_date: "Proposal review requested on 12 October 2026",
    status: "OPEN",
    rag_status: "AMBER",
    remarks: "Proposal review requested on 12 Oct 2026; Sarojini to coordinate stakeholder meeting after review.",
    vc_decision_required: "Yes",
    decision_action: "Vice Chairman review and approval of revised faculty compensation & revenue proposal.",
    supporting_departments: "HR & Recruitment",
    supporting_department_ids: "7",
    meeting_context: "Weekly Management Review - 12 Oct 2026",
  },
];

async function seed() {
  console.log("Seeding / Syncing 15 authentic Action Items into workstreams...");

  for (const item of ACTION_ITEMS) {
    const existing = await query(
      "SELECT id FROM workstreams WHERE item_id = $1",
      [item.item_id]
    );

    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO workstreams (
          department_id, item_id, category, deliverable, action_point,
          owner, ownership, target_date, timeline,
          status, rag_status, remarks, vc_decision_required, decision_action,
          supporting_departments, supporting_department_ids, meeting_context, updated_by
        ) VALUES (
          $1, $2, $3, $4, $4,
          $5, $5, $6, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, 'Executive Secretariat'
        )`,
        [
          item.department_id,
          item.item_id,
          item.category,
          item.deliverable,
          item.owner,
          item.target_date,
          item.status,
          item.rag_status,
          item.remarks,
          item.vc_decision_required,
          item.decision_action,
          item.supporting_departments,
          item.supporting_department_ids,
          item.meeting_context,
        ]
      );
      console.log(`+ Inserted: [${item.item_id}] ${item.deliverable.slice(0, 50)}...`);
    } else {
      await query(
        `UPDATE workstreams SET
          department_id = $1, category = $2, deliverable = $3, action_point = $3,
          owner = $4, ownership = $4, target_date = $5, timeline = $5,
          status = $6, rag_status = $7, remarks = $8, vc_decision_required = $9, decision_action = $10,
          supporting_departments = $11, supporting_department_ids = $12, meeting_context = $13,
          updated_by = 'Executive Secretariat'
         WHERE id = $14`,
        [
          item.department_id,
          item.category,
          item.deliverable,
          item.owner,
          item.target_date,
          item.status,
          item.rag_status,
          item.remarks,
          item.vc_decision_required,
          item.decision_action,
          item.supporting_departments,
          item.supporting_department_ids,
          item.meeting_context,
          existing.rows[0].id,
        ]
      );
      console.log(`~ Updated: [${item.item_id}] ${item.deliverable.slice(0, 50)}...`);
    }
  }

  console.log("Done! All 15 Action Items successfully seeded and synced.");
}

seed().catch(console.error);
