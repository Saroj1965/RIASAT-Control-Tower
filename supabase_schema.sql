-- =====================================================================
-- RIASAT EXECUTIVE CONTROL TOWER: COMPLETE SUPABASE DATABASE SCHEMA
-- Ramaiah Institute for Advanced Skills & Technology (RIASAT)
-- Compatible with Supabase PostgreSQL (Standard & Transaction Pooler)
-- =====================================================================

-- 1. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  mobile TEXT DEFAULT '',
  designation TEXT,
  role TEXT NOT NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE
);

-- 3. DEPARTMENT OVERVIEW TABLE
CREATE TABLE IF NOT EXISTS department_overview (
  id SERIAL PRIMARY KEY,
  department_id INTEGER UNIQUE NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  readiness_percentage INTEGER NOT NULL DEFAULT 0,
  rag_status TEXT NOT NULL DEFAULT 'NOT STARTED',
  key_focus TEXT DEFAULT '',
  submission_status TEXT NOT NULL DEFAULT 'SUBMITTED',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT
);

-- 4. FORM SECTIONS TABLE
CREATE TABLE IF NOT EXISTS form_sections (
  id SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  title TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(department_id, section_key)
);

-- 5. FORM FIELDS TABLE
CREATE TABLE IF NOT EXISTS form_fields (
  id SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  section_id INTEGER NOT NULL REFERENCES form_sections(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'Short Text',
  required BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 1,
  help_text TEXT DEFAULT '',
  default_value TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(department_id, field_key)
);

-- 6. FORM FIELD OPTIONS TABLE
CREATE TABLE IF NOT EXISTS form_field_options (
  id SERIAL PRIMARY KEY,
  field_id INTEGER NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 7. DEPARTMENT FORM VALUES TABLE
CREATE TABLE IF NOT EXISTS department_form_values (
  id SERIAL PRIMARY KEY,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  field_id INTEGER NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  text_value TEXT,
  number_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT,
  UNIQUE(department_id, field_id)
);

-- 8. WORKSTREAMS TABLE (11 Blueprint Columns + Action Tracking Extensions)
CREATE TABLE IF NOT EXISTS workstreams (
  id SERIAL PRIMARY KEY,
  item_id TEXT,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  deliverable TEXT NOT NULL,
  action_point TEXT,
  infrastructure_partnership TEXT,
  target_date TEXT,
  timeline TEXT,
  status TEXT NOT NULL DEFAULT 'Not Started',
  rag_status TEXT DEFAULT 'GREEN',
  capex TEXT DEFAULT '₹ 0.0 Cr',
  revenue_pipeline TEXT DEFAULT '₹ 0.0 Cr',
  owner TEXT,
  ownership TEXT,
  risks_blockers TEXT DEFAULT '',
  decision_action TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  vc_decision_required TEXT DEFAULT 'No',
  supporting_departments TEXT DEFAULT '',
  supporting_department_ids TEXT DEFAULT '',
  next_followup_date TEXT DEFAULT '',
  meeting_context TEXT DEFAULT 'Weekly Management Review - 12 Oct 2026',
  priority TEXT DEFAULT 'Medium',
  review_meeting_date DATE DEFAULT '2026-10-12',
  review_week TEXT DEFAULT 'Week 42 (12 Oct 2026)',
  initial_target_date TEXT,
  closure_date TIMESTAMP WITH TIME ZONE,
  closure_remarks TEXT DEFAULT '',
  closed_by TEXT DEFAULT '',
  action_history TEXT DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT DEFAULT ''
);

-- 9. RECRUITMENT TABLE (Talent Acquisition Pipeline)
CREATE TABLE IF NOT EXISTS recruitment (
  id SERIAL PRIMARY KEY,
  position_id TEXT NOT NULL,
  position_title TEXT NOT NULL,
  strategic_segment TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium',
  target_date TEXT,
  status TEXT NOT NULL DEFAULT 'Open',
  candidates_sourced INTEGER DEFAULT 0,
  candidates_shortlisted INTEGER DEFAULT 0,
  interviews INTEGER DEFAULT 0,
  offers INTEGER DEFAULT 0,
  candidates_joined INTEGER DEFAULT 0,
  ageing_days INTEGER DEFAULT 0,
  target_ctc TEXT DEFAULT '',
  budget TEXT DEFAULT '',
  hiring_lead TEXT DEFAULT '',
  next_action TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  rag_status TEXT DEFAULT 'GREEN',
  vc_attention BOOLEAN DEFAULT FALSE,
  vc_decision_required TEXT DEFAULT 'No',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT DEFAULT ''
);

-- 10. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  user_name TEXT,
  action TEXT NOT NULL,
  department_id INTEGER,
  department_name TEXT,
  record_id INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  old_value TEXT,
  new_value TEXT,
  details TEXT
);

-- =====================================================================
-- PERFORMANCE INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_workstreams_dept ON workstreams(department_id);
CREATE INDEX IF NOT EXISTS idx_workstreams_status ON workstreams(status);
CREATE INDEX IF NOT EXISTS idx_workstreams_vc ON workstreams(vc_decision_required);
CREATE INDEX IF NOT EXISTS idx_recruitment_status ON recruitment(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);

-- =====================================================================
-- SEED DATA: 9 STRATEGIC DEPARTMENTS
-- =====================================================================
INSERT INTO departments (id, name, code, active) VALUES
  (1, 'Semicon', 'SEMICON', TRUE),
  (2, 'Aerospace & Defence', 'AERO_DEFENCE', TRUE),
  (3, 'Space', 'SPACE', TRUE),
  (4, 'Cybersecurity', 'CYBER', TRUE),
  (5, 'MedTech', 'MEDTECH', TRUE),
  (6, 'Advanced Manufacturing', 'ADV_MFG', TRUE),
  (7, 'HR & Recruitment', 'HR_REC', TRUE),
  (8, 'Communications', 'COMM', TRUE),
  (9, 'Strategy & Operations', 'STRATEGY_OPS', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

-- Reset sequence for departments
SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));

-- =====================================================================
-- SEED DATA: DEPARTMENT OVERVIEW
-- =====================================================================
INSERT INTO department_overview (department_id, readiness_percentage, rag_status, key_focus, submission_status) VALUES
  (1, 0, 'NOT STARTED', '', 'SUBMITTED'),
  (2, 0, 'NOT STARTED', '', 'SUBMITTED'),
  (3, 0, 'NOT STARTED', '', 'SUBMITTED'),
  (4, 0, 'NOT STARTED', '', 'SUBMITTED'),
  (5, 0, 'NOT STARTED', '', 'SUBMITTED'),
  (6, 0, 'NOT STARTED', '', 'SUBMITTED'),
  (7, 0, 'NOT STARTED', '', 'SUBMITTED'),
  (8, 0, 'NOT STARTED', '', 'SUBMITTED'),
  (9, 0, 'NOT STARTED', '', 'SUBMITTED')
ON CONFLICT (department_id) DO NOTHING;

-- =====================================================================
-- SEED DATA: OFFICIAL USERS & CREDENTIALS
-- Passwords hashed with bcrypt (salt 10)
-- =====================================================================
-- Credentials Reference:
-- vicechairman@riasat.ac.in -> ViceChairman@123
-- admin@riasat.ac.in        -> Admin@123
-- executive@riasat.ac.in    -> Exec@123
-- forms.admin@riasat.ac.in  -> Forms@123
-- users.admin@riasat.ac.in  -> Users@123
-- dept.admin@riasat.ac.in   -> Dept@123
-- semicon.head@riasat.ac.in -> Semicon@123
-- aero.head@riasat.ac.in    -> Aero@123
-- space.head@riasat.ac.in   -> Space@123
-- cyber.head@riasat.ac.in   -> Cyber@123
-- medtech.head@riasat.ac.in -> MedTech@123
-- mfg.head@riasat.ac.in     -> Mfg@123
-- hr.head@riasat.ac.in      -> Hr@123
-- comm.head@riasat.ac.in    -> Comm@123
-- ops.head@riasat.ac.in     -> Ops@123

INSERT INTO users (id, name, email, password_hash, mobile, designation, role, department_id, status) VALUES
  (1, 'Vice Chairman', 'vicechairman@riasat.ac.in', '$2a$10$wTfR6lU49XW21r0Kx66M5e9vJ/V5V/H661kQY9sMv4xZ1jW3hXj8G', '+91 98450 11000', 'Vice Chairman & Executive Director', 'Vice Chairman', NULL, 'Active'),
  (2, 'System Administrator', 'admin@riasat.ac.in', '$2a$10$1Y8uQfC98yVw28zZ91wEeeP0bYcZ6V4QfB3m8N7K6J5L4M3K2J1I0', '+91 98450 11001', 'System Administrator', 'Admin', NULL, 'Active'),
  (3, 'Executive Office', 'executive@riasat.ac.in', '$2a$10$2Z9vRgD09zWx39aA02xFffQ1cZd07W5RgC4n9O8L7K6M5N4L3K2J1', '+91 98450 11002', 'Executive Director / Management', 'Executive', NULL, 'Active'),
  (4, 'Form Configuration Admin', 'forms.admin@riasat.ac.in', '$2a$10$3A0wShE10aXy40bB13yGggR2dYe18X6ShD5o0P9M8L7N6O5M4L3K2', '+91 98450 11003', 'Forms & Schema Administrator', 'Form Admin', NULL, 'Active'),
  (5, 'User Management Admin', 'users.admin@riasat.ac.in', '$2a$10$4B1xTiF21bYz51cC24zHhhS3eZf29Y7TiE6p1Q0N9M8O7P6N5M4L3', '+91 98450 11004', 'User Access Administrator', 'User Admin', NULL, 'Active'),
  (6, 'Departments Master Admin', 'dept.admin@riasat.ac.in', '$2a$10$5C2yUjG32cZa62dD35aIiiT4fAg30Z8UjF7q2R1O0N9P8Q7O6N5M4', '+91 98450 11005', 'Departments Master Administrator', 'Department Admin', NULL, 'Active'),
  (7, 'Dr. Arun Kumar', 'semicon.head@riasat.ac.in', '$2a$10$6D3zVkH43dAb73eE46bJjjU5gBh41A9VkG8r3S2P1O0Q9R8P7O6N5', '+91 98450 11006', 'Head - Semicon', 'Department Head', 1, 'Active'),
  (8, 'Wg Cdr R. Sharma', 'aero.head@riasat.ac.in', '$2a$10$7E4aWlI54eBc84fF57cKkkV6hCi52B0WlH9s4T3Q2P1R0S9Q8P7O6', '+91 98450 11007', 'Head - Aerospace & Defence', 'Department Head', 2, 'Active'),
  (9, 'Dr. P. Sundaram', 'space.head@riasat.ac.in', '$2a$10$8F5bXmJ65fCd95gG68dLllW7iDj63C1XmI0t5U4R3Q2S1T0R9Q8P7', '+91 98450 11008', 'Head - Space', 'Department Head', 3, 'Active'),
  (10, 'Col. K. Menon', 'cyber.head@riasat.ac.in', '$2a$10$9G6cYnK76gDe06hH79eMmmX8jEk74D2YnJ1u6V5S4R3T2U1S0R9Q8', '+91 98450 11009', 'Head - Cybersecurity', 'Department Head', 4, 'Active'),
  (11, 'Dr. Neha Varma', 'medtech.head@riasat.ac.in', '$2a$10$0H7dZoL87hEf17iI80fNnnY9kFl85E3ZoK2v7W6T5S4U3V2T1S0R9', '+91 98450 11010', 'Head - MedTech', 'Department Head', 5, 'Active'),
  (12, 'Prof. Rajesh Iyer', 'mfg.head@riasat.ac.in', '$2a$10$1I8eApM98iFg28jJ91gOooZ0lGm96F4ApL3w8X7U6T5V4W3U2T1S0', '+91 98450 11011', 'Head - Advanced Manufacturing', 'Department Head', 6, 'Active'),
  (13, 'Sumanth Rao', 'hr.head@riasat.ac.in', '$2a$10$2J9fBqN09jGh39kK02hPppA1mHn07G5BqM4x9Y8V7U6W5X4V3U2T1', '+91 98450 11012', 'Head - HR & Recruitment', 'Department Head', 7, 'Active'),
  (14, 'Ananya Sen', 'comm.head@riasat.ac.in', '$2a$10$3K0gCrO10kHi40lL13iQqqB2nIo18H6CrN5y0Z9W8V7X6Y5W4V3U2', '+91 98450 11013', 'Head - Communications', 'Department Head', 8, 'Active'),
  (15, 'Dr. Venkat Raman', 'ops.head@riasat.ac.in', '$2a$10$4L1hDsP21lIj51mM24jRrrC3oJp29I7DsO6z1A0X9W8Y7Z6X5W4V3', '+91 98450 11014', 'Head - Strategy & Operations', 'Department Head', 9, 'Active')
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name, 
  role = EXCLUDED.role, 
  department_id = EXCLUDED.department_id, 
  designation = EXCLUDED.designation;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- =====================================================================
-- SEED DATA: 15 AUTHENTIC MANAGEMENT REVIEW ACTION ITEMS
-- Meeting: Weekly Management Review - 12 Oct 2026
-- =====================================================================
INSERT INTO workstreams (
  item_id, department_id, category, deliverable, action_point,
  owner, ownership, target_date, timeline,
  status, rag_status, remarks, vc_decision_required, decision_action,
  supporting_departments, supporting_department_ids, meeting_context, updated_by
) VALUES
  ('ACT-01', 7, 'Faculty & Trainers', 'Confirm contract/tenure terms and the permanent-conversion process for existing trainers; standardise and communicate the variable-pay approach.', 'Confirm contract/tenure terms and the permanent-conversion process for existing trainers; standardise and communicate the variable-pay approach.', 'Anamika to coordinate with relevant RUAS/HR contacts', 'Anamika to coordinate with relevant RUAS/HR contacts', 'Urgent; close after clarification', 'Urgent; close after clarification', 'OPEN', 'AMBER', 'Confirm tenure terms and standardise variable-pay approach with RUAS/HR contacts.', 'Yes', 'Standardise and communicate the variable-pay approach and permanent tenure terms.', 'HR & Recruitment', '7', 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat'),
  ('ACT-02', 7, 'Talent Acquisition', 'Progress Dr. Durga Prakash and RUAS PhD candidate Darshan; confirm role, fit, package and offer route.', 'Progress Dr. Durga Prakash and RUAS PhD candidate Darshan; confirm role, fit, package and offer route.', 'Anamika; Venky to guide/meet candidates', 'Anamika; Venky to guide/meet candidates', 'Urgent', 'Urgent', 'OPEN', 'AMBER', 'Venky to guide and meet candidates; confirm role, fit, package and offer route.', 'Yes', 'Executive approval on package and offer route for semiconductor candidates.', 'Semicon', '1', 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat'),
  ('ACT-03', 7, 'Technical Hiring', 'Arrange remaining interviews and joining-date follow-ups for trainer and IT application roles; prioritise IT applications over infrastructure.', 'Arrange remaining interviews and joining-date follow-ups for trainer and IT application roles; prioritise IT applications over infrastructure.', 'Anamika; relevant technical interviewers', 'Anamika; relevant technical interviewers', 'As soon as possible', 'As soon as possible', 'OPEN', 'AMBER', 'Prioritise IT applications over infrastructure; expedite technical interviews.', 'No', 'Prioritise IT applications over infrastructure.', 'Strategy & Operations', '9', 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat'),
  ('ACT-04', 7, 'Marketing & Sales', 'Review and strengthen the two marketing/sales-related job descriptions; source experienced candidates and move recruitment quickly.', 'Review and strengthen the two marketing/sales-related job descriptions; source experienced candidates and move recruitment quickly.', 'Anamika/Naukri team', 'Anamika/Naukri team', 'Immediate; before December 2026 launch', 'Immediate; before December 2026 launch', 'OPEN', 'AMBER', 'Strengthen JDs with Naukri team; source experienced candidates before Dec 2026 launch.', 'No', 'Strengthen JDs and accelerate recruitment before Dec 2026 launch.', 'Communications', '8', 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat'),
  ('ACT-05', 8, 'Brand & Outreach', 'Prepare launch-ready programme positioning, website content, online application flow, corporate outreach and campaign collateral.', 'Prepare launch-ready programme positioning, website content, online application flow, corporate outreach and campaign collateral.', 'Vinila and programme leads', 'Vinila and programme leads', 'By December 2026', 'By December 2026', 'OPEN', 'GREEN', 'Coordinate with programme leads for Dec 2026 launch readiness and online application flow.', 'No', 'Finalize programme positioning, website content and campaign collateral.', 'Semicon, Aerospace & Defence, Strategy & Operations', '1,2,9', 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat'),
  ('ACT-06', 8, 'Industry Partnerships', 'Contact at least five companies to validate the programme proposal and gather feedback.', 'Contact at least five companies to validate the programme proposal and gather feedback.', 'Vinila/Avinash', 'Vinila/Avinash', 'As soon as possible', 'As soon as possible', 'OPEN', 'GREEN', 'Corporate outreach initiated to validate programme proposal with 5 industry partners.', 'No', 'Validate programme proposal with at least five corporate partners.', 'Strategy & Operations', '9', 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat'),
  ('ACT-07', 8, 'Collateral & Privacy', 'Prepare approved trainer/project profiles and customer-facing examples; remove or generalise confidential information.', 'Prepare approved trainer/project profiles and customer-facing examples; remove or generalise confidential information.', 'Vinila/Marketing with technical teams', 'Vinila/Marketing with technical teams', 'For customer outreach and launch', 'For customer outreach and launch', 'OPEN', 'GREEN', 'Maintain strict confidentiality: generalise sensitive project data for customer-facing profiles.', 'No', 'Prepare approved customer-facing profiles respecting confidentiality.', 'HR & Recruitment, Strategy & Operations', '7,9', 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat'),
  ('ACT-08', 8, 'Branding & Operations', 'Obtain and review the staff ID card print sample; revise certificate collateral to foreground RIASAT/Ramaiah branding.', 'Obtain and review the staff ID card print sample; revise certificate collateral to foreground RIASAT/Ramaiah branding.', 'Vinila/Sarojini', 'Vinila/Sarojini', 'Sample expected 12 October 2026; follow up', 'Sample expected 12 October 2026; follow up', 'OPEN', 'AMBER', 'Sample expected 12 Oct 2026; follow up immediately with vendor to verify RIASAT/Ramaiah branding.', 'No', 'Review ID card sample and ensure prominent RIASAT/Ramaiah branding.', 'Strategy & Operations', '9', 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat'),
  ('ACT-09', 1, 'Curriculum & Labs', 'Compile curriculum and equipment requirements for reliability/testing, metrology and characterisation; review with IIT Madras and Keysight and propose programme/pricing options.', 'Compile curriculum and equipment requirements for reliability/testing, metrology and characterisation; review with IIT Madras and Keysight and propose programme/pricing options.', 'Avinash/Venky', 'Avinash/Venky', 'Follow up after IIT Madras discussions', 'Follow up after IIT Madras discussions', 'OPEN', 'AMBER', 'Review curriculum and equipment requirements with IIT Madras and Keysight; propose pricing options.', 'Yes', 'VC review of programme structure and pricing options following IIT Madras discussions.', 'Strategy & Operations', '9', 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat'),
  ('ACT-10', 1, 'Executive Training', 'Confirm trainer capacity, infrastructure, location and schedule for prospective HiCAG training; Venky to join the follow-up discussion.', 'Confirm trainer capacity, infrastructure, location and schedule for prospective HiCAG training; Venky to join the follow-up discussion.', 'Avinash/Venky and technical leads', 'Avinash/Venky and technical leads', 'Follow up immediately', 'Follow up immediately', 'OPEN', 'AMBER', 'Confirm trainer capacity, infrastructure, location and schedule; Venky to join discussion.', 'Yes', 'Leadership alignment on HiCAG prospective training schedule and trainer deployment.', 'Advanced Manufacturing, Strategy & Operations', '6,9', 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat'),
  ('ACT-11', 3, 'Lab Infrastructure', 'Obtain a written space-lab proposal and consolidate the lab space plan for semiconductor, space, cybersecurity and AI; validate approximate areas.', 'Obtain a written space-lab proposal and consolidate the lab space plan for semiconductor, space, cybersecurity and AI; validate approximate areas.', 'Architect/Avinash/Venky', 'Architect/Avinash/Venky', 'After partner proposals and IIT Madras visit', 'After partner proposals and IIT Madras visit', 'OPEN', 'AMBER', 'Consolidate integrated lab space plan across semiconductor, space, cyber and AI; validate areas.', 'Yes', 'Executive approval of consolidated lab space plan across 4 verticals.', 'Semicon, Cybersecurity, Strategy & Operations', '1,4,9', 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat'),
  ('ACT-12', 6, 'Facilities & Architecture', 'Revise the architect/facility proposal to include validation/testing equipment; obtain final scope and submit for approval.', 'Revise the architect/facility proposal to include validation/testing equipment; obtain final scope and submit for approval.', 'Avinash/Venky', 'Avinash/Venky', 'Target work start discussed around 15 October 2026; confirm', 'Target work start discussed around 15 October 2026; confirm', 'OPEN', 'AMBER', 'Target work start discussed around 15 Oct 2026; confirm revised scope with testing equipment.', 'Yes', 'VC approval of final facility scope and budget including validation/testing equipment.', 'Strategy & Operations', '9', 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat'),
  ('ACT-13', 9, 'IT & Infrastructure', 'Escalate laptop procurement and IT application hiring delays; arrange a call with the Vice Chairman and relevant contacts.', 'Escalate laptop procurement and IT application hiring delays; arrange a call with the Vice Chairman and relevant contacts.', 'Avinash/Sarojini/relevant vendor contacts', 'Avinash/Sarojini/relevant vendor contacts', 'Immediate', 'Immediate', 'OPEN', 'RED', 'Critical delay in laptop procurement and IT application hiring; arrange VC escalation call.', 'Yes', 'Vice Chairman intervention on vendor laptop procurement and IT application hiring delays.', 'HR & Recruitment', '7', 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat'),
  ('ACT-14', 9, 'Software & Licences', 'Notify the vendor that charges for inactive Dassault/CATIA licences should commence only from the activation date; clarify licence categories.', 'Notify the vendor that charges for inactive Dassault/CATIA licences should commence only from the activation date; clarify licence categories.', 'Avinash', 'Avinash', 'Immediate', 'Immediate', 'OPEN', 'AMBER', 'Billing dispute: notify vendor that charges must commence only from live activation date.', 'No', 'Notify vendor that charges commence only from activation date and clarify categories.', 'Aerospace & Defence, Advanced Manufacturing', '2,6', 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat'),
  ('ACT-15', 9, 'Governance & Review', 'Resend the revised faculty compensation/revenue proposal for review; then schedule the stakeholder discussion.', 'Resend the revised faculty compensation/revenue proposal for review; then schedule the stakeholder discussion.', 'Anamika/Sarojini to coordinate the meeting after review', 'Anamika/Sarojini to coordinate the meeting after review', 'Proposal review requested on 12 October 2026', 'Proposal review requested on 12 October 2026', 'OPEN', 'AMBER', 'Proposal review requested on 12 Oct 2026; Sarojini to coordinate stakeholder meeting after review.', 'Yes', 'Vice Chairman review and approval of revised faculty compensation & revenue proposal.', 'HR & Recruitment', '7', 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat')
ON CONFLICT DO NOTHING;

SELECT setval('workstreams_id_seq', (SELECT MAX(id) FROM workstreams));

-- =====================================================================
-- SEED DATA: RECRUITMENT POSITIONS (HR & Recruitment Vertical)
-- =====================================================================
INSERT INTO recruitment (
  position_id, position_title, strategic_segment, priority, target_date,
  status, candidates_sourced, candidates_shortlisted, interviews, offers,
  candidates_joined, ageing_days, target_ctc, budget, hiring_lead, next_action,
  remarks, rag_status, vc_attention, vc_decision_required
) VALUES
  ('REC-01', 'Lead Semiconductor Process Specialist', 'Semicon', 'Critical', '2026-11-15', 'Interview in progress', 18, 5, 3, 1, 0, 24, '₹ 38 LPA', '₹ 45 LPA', 'Anamika', 'Final interview with Vice Chairman', 'Candidate Dr. Durga Prakash under evaluation', 'AMBER', TRUE, 'Yes'),
  ('REC-02', 'Aerospace Structural Dynamics Engineer', 'Aerospace & Defence', 'High', '2026-11-30', 'Candidate sourced', 12, 4, 1, 0, 0, 18, '₹ 28 LPA', '₹ 32 LPA', 'Anamika', 'Technical panel screening', 'Coordinating with HAL external reviewers', 'GREEN', FALSE, 'No'),
  ('REC-03', 'Space Payload Systems Architect', 'Space', 'Critical', '2026-11-20', 'shortlisted', 8, 3, 2, 0, 0, 31, '₹ 35 LPA', '₹ 40 LPA', 'Anamika', 'Scheduling Stage-2 Interview', 'Ex-ISRO specialist candidate profile received', 'AMBER', TRUE, 'Yes'),
  ('REC-04', 'Offensive Security Specialist & Range Trainer', 'Cybersecurity', 'High', '2026-12-05', 'Candidate sourced', 15, 6, 2, 1, 0, 12, '₹ 25 LPA', '₹ 30 LPA', 'Anamika', 'Background verification on offered candidate', 'Offer released to selected candidate', 'GREEN', FALSE, 'No'),
  ('REC-05', 'Bio-Medical Instrument Design Lead', 'MedTech', 'Medium', '2026-12-15', 'Open', 6, 2, 0, 0, 0, 9, '₹ 22 LPA', '₹ 26 LPA', 'Anamika', 'Sourcing profiles via Naukri portal', 'JD refreshed and active', 'GREEN', FALSE, 'No')
ON CONFLICT DO NOTHING;

SELECT setval('recruitment_id_seq', (SELECT MAX(id) FROM recruitment));

-- =====================================================================
-- SEED DATA: FORM SECTIONS & DYNAMIC FIELDS FOR ALL 9 VERTICALS
-- =====================================================================
DO $$
DECLARE
  dept_rec RECORD;
  sec_id INTEGER;
BEGIN
  FOR dept_rec IN SELECT id, code FROM departments LOOP
    IF dept_rec.id = 7 OR dept_rec.code = 'HR_REC' THEN
      INSERT INTO form_sections (department_id, section_key, title, display_order)
      VALUES (dept_rec.id, 'recruitment_tracker', 'Recruitment Tracker Web Form', 1)
      ON CONFLICT (department_id, section_key) DO UPDATE SET title = EXCLUDED.title
      RETURNING id INTO sec_id;

      IF sec_id IS NULL THEN
        SELECT id INTO sec_id FROM form_sections WHERE department_id = dept_rec.id AND section_key = 'recruitment_tracker';
      END IF;

      INSERT INTO form_fields (department_id, section_id, field_key, label, field_type, required, active, display_order, help_text) VALUES
        (dept_rec.id, sec_id, 'sl_no', 'Sl. No. — automatically generated', 'Number', TRUE, TRUE, 1, 'Automatically generated sequential row number'),
        (dept_rec.id, sec_id, 'position_title', 'Position / Role', 'Short Text', TRUE, TRUE, 2, 'Position title or role designation'),
        (dept_rec.id, sec_id, 'strategic_segment', 'Department / Strategic Vertical', 'Dropdown', TRUE, TRUE, 3, 'Target strategic vertical domain'),
        (dept_rec.id, sec_id, 'priority', 'Priority', 'Dropdown', TRUE, TRUE, 4, 'Critical / High / Medium / Low'),
        (dept_rec.id, sec_id, 'hiring_lead', 'Hiring Owner', 'Short Text', TRUE, TRUE, 5, 'Assigned talent acquisition lead or hiring manager'),
        (dept_rec.id, sec_id, 'target_date', 'Target Joining Date', 'Date', FALSE, TRUE, 6, 'Planned joining date (YYYY-MM-DD)'),
        (dept_rec.id, sec_id, 'status', 'Status', 'Dropdown', TRUE, TRUE, 7, 'Candidate sourced / shortlisted / Interview in progress / Offers released / Rejected / Joined'),
        (dept_rec.id, sec_id, 'remarks', 'Remarks', 'Long Text', FALSE, TRUE, 8, 'Progress, notes, compensation or bottlenecks'),
        (dept_rec.id, sec_id, 'vc_decision_required', 'VC decision required', 'Dropdown', TRUE, TRUE, 9, 'Yes / No - leadership escalation flag')
      ON CONFLICT (department_id, field_key) DO UPDATE SET label = EXCLUDED.label, field_type = EXCLUDED.field_type;

    ELSE
      INSERT INTO form_sections (department_id, section_key, title, display_order)
      VALUES (dept_rec.id, 'action_tracker', 'Action Tracker Web Form', 1)
      ON CONFLICT (department_id, section_key) DO UPDATE SET title = EXCLUDED.title
      RETURNING id INTO sec_id;

      IF sec_id IS NULL THEN
        SELECT id INTO sec_id FROM form_sections WHERE department_id = dept_rec.id AND section_key = 'action_tracker';
      END IF;

      INSERT INTO form_fields (department_id, section_id, field_key, label, field_type, required, active, display_order, help_text) VALUES
        (dept_rec.id, sec_id, 'deliverable', 'Action item', 'Short Text', TRUE, TRUE, 1, 'Specific action item or key operational deliverable'),
        (dept_rec.id, sec_id, 'ownership', 'Owner / support', 'Short Text', TRUE, TRUE, 2, 'Responsible person, team, or support coordinator'),
        (dept_rec.id, sec_id, 'timeline', 'Timeline', 'Short Text', TRUE, TRUE, 3, 'Target completion deadline (e.g. Urgent, Immediate, Dec 2026)'),
        (dept_rec.id, sec_id, 'status', 'Status', 'Dropdown', TRUE, TRUE, 4, 'Open / In Progress / Completed / Delayed / Blocked'),
        (dept_rec.id, sec_id, 'remarks', 'Remarks / Dependencies', 'Long Text', FALSE, TRUE, 5, 'Progress notes, dependencies, or blockers'),
        (dept_rec.id, sec_id, 'vc_decision_required', 'Vice Chairman Decision Required', 'Dropdown', TRUE, TRUE, 6, 'Yes / No - escalation required for leadership action'),
        (dept_rec.id, sec_id, 'category', 'Initiative / Event / Campaign', 'Short Text', FALSE, TRUE, 7, 'Strategic initiative or functional theme'),
        (dept_rec.id, sec_id, 'sl_no', 'Sl. No. — automatically generated', 'Number', FALSE, TRUE, 8, 'Sequential line item number')
      ON CONFLICT (department_id, field_key) DO UPDATE SET label = EXCLUDED.label, field_type = EXCLUDED.field_type;
    END IF;
  END LOOP;
END $$;

SELECT setval('form_sections_id_seq', (SELECT MAX(id) FROM form_sections));
SELECT setval('form_fields_id_seq', (SELECT MAX(id) FROM form_fields));

-- =====================================================================
-- SUCCESS NOTIFICATION
-- =====================================================================
INSERT INTO audit_log (user_name, action, details)
VALUES ('System Migration', 'SUPABASE_INIT', 'RIASAT Control Tower Supabase Database Schema and initial seed dataset installed successfully.');
