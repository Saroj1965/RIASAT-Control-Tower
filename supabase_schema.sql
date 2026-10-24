-- =====================================================================
-- RIASAT EXECUTIVE DASHBOARD: COMPLETE SUPABASE DATABASE SCHEMA
-- Ramaiah Institute for Advanced Skills & Technology (RIASAT)
-- Unified Action Register, Edit Action Form & Departmental Report Schema
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
  review_frequency TEXT DEFAULT 'Weekly',
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

-- Ensure review_frequency column exists on existing deployments
ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS review_frequency TEXT DEFAULT 'Weekly';

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

-- 11. LOGIN LOGS TABLE (Supabase Authentication & Session Verification Ledger)
CREATE TABLE IF NOT EXISTS login_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  user_name TEXT,
  role TEXT,
  department_id INTEGER,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  details TEXT DEFAULT ''
);

-- =====================================================================
-- PERFORMANCE INDEXES (Including Top-Priority, Red Alert & Pending Filters)
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_workstreams_dept ON workstreams(department_id);
CREATE INDEX IF NOT EXISTS idx_workstreams_status ON workstreams(status);
CREATE INDEX IF NOT EXISTS idx_workstreams_vc ON workstreams(vc_decision_required);
CREATE INDEX IF NOT EXISTS idx_workstreams_pending_top ON workstreams(id DESC, rag_status, priority);
CREATE INDEX IF NOT EXISTS idx_recruitment_status ON recruitment(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_timestamp ON login_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_email ON login_logs(LOWER(email));

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & PERMISSIONS FOR SUPABASE
-- =====================================================================
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_field_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_form_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE workstreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- Permissive policies for dashboard operations
DROP POLICY IF EXISTS "Public Read All Departments" ON departments;
CREATE POLICY "Public Read All Departments" ON departments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service Role All Departments" ON departments;
CREATE POLICY "Service Role All Departments" ON departments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Users" ON users;
CREATE POLICY "Allow All Users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Overview" ON department_overview;
CREATE POLICY "Allow All Overview" ON department_overview FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Sections" ON form_sections;
CREATE POLICY "Allow All Sections" ON form_sections FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Fields" ON form_fields;
CREATE POLICY "Allow All Fields" ON form_fields FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Field Options" ON form_field_options;
CREATE POLICY "Allow All Field Options" ON form_field_options FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Form Values" ON department_form_values;
CREATE POLICY "Allow All Form Values" ON department_form_values FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Workstreams" ON workstreams;
CREATE POLICY "Allow All Workstreams" ON workstreams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Recruitment" ON recruitment;
CREATE POLICY "Allow All Recruitment" ON recruitment FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All Audit Log" ON audit_log;
CREATE POLICY "Allow All Audit Log" ON audit_log FOR ALL USING (true) WITH CHECK (true);

-- Grant schema privileges to standard Supabase roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

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

SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));

-- =====================================================================
-- SEED DATA: DEPARTMENT OVERVIEW (FROM ORIGINAL DATABASE)
-- =====================================================================
INSERT INTO department_overview (department_id, readiness_percentage, rag_status, key_focus, submission_status) VALUES
  (1, 40, 'AMBER', 'ISO-6 cleanroom HVAC validation and ASML DUV stepper customs clearance', 'SUBMITTED'),
  (2, 45, 'AMBER', 'Autoclave composite testing commissioning and DRDO ToT agreement', 'SUBMITTED'),
  (3, 35, 'AMBER', 'Thermal vacuum chamber setup and IN-SPACe ground station licensing', 'SUBMITTED'),
  (4, 50, 'AMBER', 'Air-gapped cyber range deployment and CERT-In HSM procurement', 'SUBMITTED'),
  (5, 38, 'AMBER', 'ISO 13485 clean room prototyping and Ramaiah clinical trial MoU', 'SUBMITTED'),
  (6, 60, 'GREEN', '5-Axis CNC milling center commissioned and robotics automation cell', 'SUBMITTED'),
  (7, 48, 'GREEN', 'Sourcing critical talent for Semicon and Aerospace leadership roles', 'SUBMITTED'),
  (8, 55, 'AMBER', 'Brand launch summit preparation and DeepTech quarterly whitepaper', 'SUBMITTED'),
  (9, 65, 'AMBER', 'Executive Control Tower governance and Advisory Council formation', 'SUBMITTED')
ON CONFLICT (department_id) DO UPDATE SET
  readiness_percentage = EXCLUDED.readiness_percentage,
  rag_status = EXCLUDED.rag_status,
  key_focus = EXCLUDED.key_focus,
  submission_status = EXCLUDED.submission_status;

-- =====================================================================
-- SEED DATA: OFFICIAL USERS & PASSWORDS (VERIFIED BCRYPT HASHES)
-- =====================================================================
-- Credentials Map:
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
  (1, 'Vice Chairman', 'vicechairman@riasat.ac.in', '$2a$10$KLBL2bnQS.P7F9UUAjQgROB07HVRDF.IVF208bswpJtrz28a6UjjO', '+91 98450 11000', 'Vice Chairman & Executive Director', 'Vice Chairman', NULL, 'Active'),
  (2, 'System Administrator', 'admin@riasat.ac.in', '$2a$10$ueuukLVZ5apS05o9ruCZ7.fZw9O29vpGtZUR/psN.yViAwDgcbbJi', '+91 98450 11001', 'System Administrator', 'Admin', NULL, 'Active'),
  (3, 'Executive Office', 'executive@riasat.ac.in', '$2a$10$Mem8sQkw2Cw6ZFoNJqBJjugadAzF880r.jTwTDDg5vRvYI3Rbqj7W', '+91 98450 11002', 'Executive Director / Management', 'Executive', NULL, 'Active'),
  (4, 'Form Configuration Admin', 'forms.admin@riasat.ac.in', '$2a$10$q4QqRmh7t8vNa9OfgxFSiO1rjsDw4pJkJ6ClCW2NczUmOz75xzg3i', '+91 98450 11003', 'Forms & Schema Administrator', 'Form Admin', NULL, 'Active'),
  (5, 'User Management Admin', 'users.admin@riasat.ac.in', '$2a$10$p4z9bv6zIcGOTjymBCjLEOf1kl5pYGCIUzVhsHFDxuWWAdFiU3sM2', '+91 98450 11004', 'User Access Administrator', 'User Admin', NULL, 'Active'),
  (6, 'Departments Master Admin', 'dept.admin@riasat.ac.in', '$2a$10$uYzIYr8LOQIh2p12eIjrQeQ5v.my6GzYmZLzfJFeyAPx3cZ7He11u', '+91 98450 11005', 'Departments Master Administrator', 'Department Admin', NULL, 'Active'),
  (7, 'Dr. Arun Kumar', 'semicon.head@riasat.ac.in', '$2a$10$CHQKEiBU1ANGUjx7KjaadeeBgMjb1/ise9FvchqH9pkn5ndK8t35i', '+91 98450 11006', 'Head - Semicon', 'Department Head', 1, 'Active'),
  (8, 'Wg Cdr R. Sharma', 'aero.head@riasat.ac.in', '$2a$10$MhOzHyrRRlq4EDRvHI9NsOJLMZbdEDmuH0zyzlinH/PHZ0pvVlXWO', '+91 98450 11007', 'Head - Aerospace & Defence', 'Department Head', 2, 'Active'),
  (9, 'Dr. P. Sundaram', 'space.head@riasat.ac.in', '$2a$10$wITRGTQJ1sDoBMzq4TlPpeJA7MydSkjNuTiUEIacenReq231y6FHe', '+91 98450 11008', 'Head - Space', 'Department Head', 3, 'Active'),
  (10, 'Col. K. Menon', 'cyber.head@riasat.ac.in', '$2a$10$gziJspang8msoJvsX4flv.8LmqgjdbKU.ewZqD5vDIgIkis3uOLmu', '+91 98450 11009', 'Head - Cybersecurity', 'Department Head', 4, 'Active'),
  (11, 'Dr. Neha Varma', 'medtech.head@riasat.ac.in', '$2a$10$7VQc.OY7HGMDVgk7ieD07.xgD/9DSLQL0GJWxExFFKUsW4hKCUa0a', '+91 98450 11010', 'Head - MedTech', 'Department Head', 5, 'Active'),
  (12, 'Prof. Rajesh Iyer', 'mfg.head@riasat.ac.in', '$2a$10$FZhubQGBfsO3WJAo/yxhvOP6rXDEnHTPZX7KW0cVZ1GMqtbfuM/Ze', '+91 98450 11011', 'Head - Advanced Manufacturing', 'Department Head', 6, 'Active'),
  (13, 'Sumanth Rao', 'hr.head@riasat.ac.in', '$2a$10$c469R9oPc..WqyZQJI5DFuDLSdujpKMqs2BjF2wltM/Bcj5hCZvjy', '+91 98450 11012', 'Head - HR & Recruitment', 'Department Head', 7, 'Active'),
  (14, 'Ananya Sen', 'comm.head@riasat.ac.in', '$2a$10$X4MJ0o5D2NQ4ncCj.cwYsunx69RP7ScESeUBy5spa1ORHOk8ziNEC', '+91 98450 11013', 'Head - Communications', 'Department Head', 8, 'Active'),
  (15, 'Dr. Venkat Raman', 'ops.head@riasat.ac.in', '$2a$10$pqMkSux5M2OWpIWV/eKofOTVfNRFx8jVFVIsmrCWdf9N1GQwzFKbC', '+91 98450 11014', 'Head - Strategy & Operations', 'Department Head', 9, 'Active')
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name, 
  role = EXCLUDED.role, 
  password_hash = EXCLUDED.password_hash,
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

-- =====================================================================
-- SEED DATA: VERTICAL OPERATIONAL WORKSTREAMS
-- =====================================================================
INSERT INTO workstreams (
  item_id, department_id, category, deliverable, action_point,
  owner, ownership, target_date, timeline,
  status, rag_status, remarks, vc_decision_required, capex, revenue_pipeline, updated_by
) VALUES
  ('SEM-WS-01', 1, 'Cleanroom Infrastructure & Validation', 'ISO-6 Cleanroom HVAC Balancing & Airborne Particle Counter Validation', 'ISO-6 Cleanroom HVAC Balancing & Airborne Particle Counter Validation', 'Dr. S. Ramanathan / Semiconductor Fab Lead', 'Dr. S. Ramanathan / Semiconductor Fab Lead', '2026-11-15', '2026-11-15', 'In Progress', 'GREEN', 'Air handling units (AHU) commissioned. Airborne particle count validation scheduled with third-party auditor next week.', 'No', '₹ 14.5 Cr', '₹ 0.0 Cr', 'System Administrator'),
  ('SEM-WS-02', 1, 'Equipment Procurement & Import', 'ASML DUV Lithography Stepper Customs Duty Exemption Clearance', 'ASML DUV Lithography Stepper Customs Duty Exemption Clearance', 'R. Venkatesh / Equipment Procurement Lead', 'R. Venkatesh / Equipment Procurement Lead', '2026-10-30', '2026-10-30', 'Delayed', 'AMBER', 'Lithography stepper arrived at Chennai port bonded warehouse. DSIR customs concession certificate pending inter-ministry sign-off.', 'Yes', '₹ 28.0 Cr', '₹ 0.0 Cr', 'System Administrator'),
  ('AERO-WS-01', 2, 'Testing & Prototyping Infrastructure', 'Aerospace-Grade Autoclave (3m Dia) Foundation & Calibration Setup', 'Aerospace-Grade Autoclave (3m Dia) Foundation & Calibration Setup', 'Wg Cdr (Retd) K. Swaminathan / Aerospace Tech Lead', 'Wg Cdr (Retd) K. Swaminathan / Aerospace Tech Lead', '2026-11-20', '2026-11-20', 'In Progress', 'GREEN', 'Autoclave pressure vessel anchored on foundation pad. Vacuum line piping and nitrogen purge system undergoing pressure testing.', 'No', '₹ 9.8 Cr', '₹ 0.0 Cr', 'System Administrator'),
  ('AERO-WS-02', 2, 'Institutional Partnership & ToT', 'DRDO-ADE Transfer of Technology (ToT) MoU for Indigenous UAV Telemetry', 'DRDO-ADE Transfer of Technology (ToT) MoU for Indigenous UAV Telemetry', 'Col (Retd) Anand Varma / Defence Liaison Director', 'Col (Retd) Anand Varma / Defence Liaison Director', '2026-11-05', '2026-11-05', 'In Progress', 'AMBER', 'Bilateral draft agreement reviewed by legal counsel. Clause 7.2 on joint intellectual property indemnification requires VC sign-off.', 'Yes', '₹ 3.5 Cr', '₹ 6.2 Cr', 'System Administrator'),
  ('SPC-WS-01', 3, 'Payload Testing Infrastructure', 'Thermal Vacuum Chamber (TVAC) Setup for CubeSat Qualification', 'Thermal Vacuum Chamber (TVAC) Setup for CubeSat Qualification', 'Dr. K. Radhakrishnan / Space Systems Director', 'Dr. K. Radhakrishnan / Space Systems Director', '2026-12-10', '2026-12-10', 'In Progress', 'GREEN', 'Chamber vacuum reached 10^-6 Torr. Liquid nitrogen thermal shroud undergoing helium leak detection testing.', 'No', '₹ 7.2 Cr', '₹ 0.0 Cr', 'System Administrator'),
  ('SPC-WS-02', 3, 'Regulatory Clearance & Telemetry', 'IN-SPACe Ground Station Authorization & S/X-Band Spectrum License', 'IN-SPACe Ground Station Authorization & S/X-Band Spectrum License', 'Pooja Deshmukh / Telemetry & Comms Lead', 'Pooja Deshmukh / Telemetry & Comms Lead', '2026-11-12', '2026-11-12', 'Delayed', 'AMBER', 'Wireless Planning & Coordination (WPC) clearance pending frequency band harmonization with satellite operations.', 'Yes', '₹ 1.8 Cr', '₹ 4.5 Cr', 'System Administrator'),
  ('CYB-WS-01', 4, 'Cyber Infrastructure & Testbed', 'Air-Gapped National Cyber Range & SCADA Defense Simulation Testbed', 'Air-Gapped National Cyber Range & SCADA Defense Simulation Testbed', 'Abhinav Sen / Cyber Defense Architect', 'Abhinav Sen / Cyber Defense Architect', '2026-11-18', '2026-11-18', 'In Progress', 'GREEN', 'Hardware server racks energized. Red team vs Blue team adversary simulation orchestration engine operational.', 'No', '₹ 5.5 Cr', '₹ 8.0 Cr', 'System Administrator'),
  ('CYB-WS-02', 4, 'Compliance & Security Hardware', 'CERT-In Auditing Lab Accreditation & FIPS 140-3 Hardware HSM Procurement', 'CERT-In Auditing Lab Accreditation & FIPS 140-3 Hardware HSM Procurement', 'Rohit Nambiar / Compliance & Security Head', 'Rohit Nambiar / Compliance & Security Head', '2026-10-28', '2026-10-28', 'In Progress', 'AMBER', 'Documentation audit cleared. Procurement tender for dual-redundant Thales HSMs requires financial sanction above departmental limit.', 'Yes', '₹ 2.4 Cr', '₹ 3.0 Cr', 'System Administrator'),
  ('MED-WS-01', 5, 'Biomedical Prototyping Facility', 'ISO 13485 Class 10,000 Biomedical Device Clean Room Bench Installation', 'ISO 13485 Class 10,000 Biomedical Device Clean Room Bench Installation', 'Dr. Manisha Sharma / MedTech Innovation Lead', 'Dr. Manisha Sharma / MedTech Innovation Lead', '2026-11-25', '2026-11-25', 'In Progress', 'GREEN', 'HEPA filtration units and positive pressure differential sensors operational. First surgical guide batch test planned.', 'No', '₹ 4.8 Cr', '₹ 0.0 Cr', 'System Administrator'),
  ('MED-WS-02', 5, 'Clinical Trial Collaboration', 'Ramaiah Medical College Clinical Trial Co-Development MoU & Ethics Protocol', 'Ramaiah Medical College Clinical Trial Co-Development MoU & Ethics Protocol', 'Dr. Harish Gowda / Clinical Partnerships Director', 'Dr. Harish Gowda / Clinical Partnerships Director', '2026-11-08', '2026-11-08', 'In Progress', 'AMBER', 'Institutional Ethics Committee (IEC) protocol submitted for non-invasive cardiac biomarker sensor trials.', 'Yes', '₹ 1.5 Cr', '₹ 5.0 Cr', 'System Administrator'),
  ('MFG-WS-01', 6, 'Precision Machining Infrastructure', 'DMG MORI 5-Axis Precision CNC Machining Center Laser Calibration', 'DMG MORI 5-Axis Precision CNC Machining Center Laser Calibration', 'Rajesh Kulkarni / Precision Tooling Lead', 'Rajesh Kulkarni / Precision Tooling Lead', '2026-10-15', '2026-10-15', 'Completed', 'GREEN', 'Machine calibrated to ±3 micron geometric tolerance. Impeller qualification part machined and verified using CMM inspection.', 'No', '₹ 8.2 Cr', '₹ 12.0 Cr', 'System Administrator'),
  ('MFG-WS-02', 6, 'Robotics Automation & Digital Twin', '6-Axis Articulated KUKA Robotic Welding Cell & Telemetry Integration', '6-Axis Articulated KUKA Robotic Welding Cell & Telemetry Integration', 'S. Muthukrishnan / Robotics Automation Head', 'S. Muthukrishnan / Robotics Automation Head', '2026-11-30', '2026-11-30', 'In Progress', 'GREEN', 'Robotic cell safety interlocks and light curtains installed. PLC integration with SCADA gateway underway.', 'No', '₹ 6.4 Cr', '₹ 7.5 Cr', 'System Administrator')
ON CONFLICT DO NOTHING;

SELECT setval('workstreams_id_seq', (SELECT MAX(id) FROM workstreams));

-- =====================================================================
-- SEED DATA: RECRUITMENT POSITIONS (HR & RECRUITMENT PIPELINE)
-- =====================================================================
INSERT INTO recruitment (
  position_id, position_title, strategic_segment, priority, target_date,
  status, candidates_sourced, candidates_shortlisted, interviews, offers,
  candidates_joined, ageing_days, target_ctc, budget, hiring_lead, next_action,
  remarks, rag_status, vc_attention, vc_decision_required
) VALUES
  ('POS-SEM-001', 'Lead Scientist - Cleanroom Microfabrication', 'Semicon', 'Critical', '2026-11-15', 'Interview in progress', 14, 4, 2, 0, 0, 24, '₹ 38 LPA', '₹ 45 LPA', 'Anamika Sahay', 'Conduct final VC leadership interview and release formal offer letter.', 'Top 2 candidates from TSMC & IMEC cleared technical rounds. VC final interview panel scheduled.', 'GREEN', TRUE, 'Yes'),
  ('POS-AERO-002', 'Principal Systems Architect - Avionics & Defence', 'Aerospace & Defence', 'High', '2026-11-30', 'Candidate sourced', 12, 4, 1, 0, 0, 18, '₹ 28 LPA', '₹ 32 LPA', 'Anamika Sahay', 'Technical panel screening', 'Coordinating with HAL external reviewers for panel formation.', 'GREEN', FALSE, 'No'),
  ('POS-SPC-003', 'Space Payload Systems Architect', 'Space', 'Critical', '2026-11-20', 'shortlisted', 8, 3, 2, 0, 0, 31, '₹ 35 LPA', '₹ 40 LPA', 'Anamika Sahay', 'Scheduling Stage-2 Interview', 'Ex-ISRO specialist candidate profile under stage-2 review.', 'AMBER', TRUE, 'Yes'),
  ('POS-CYB-004', 'Offensive Security Specialist & Range Trainer', 'Cybersecurity', 'High', '2026-12-05', 'Offers released', 15, 6, 2, 1, 0, 12, '₹ 25 LPA', '₹ 30 LPA', 'Anamika Sahay', 'Background verification on offered candidate', 'Offer released to selected offensive security specialist.', 'GREEN', FALSE, 'No'),
  ('POS-MED-005', 'Bio-Medical Instrument Design Lead', 'MedTech', 'Medium', '2026-12-15', 'Open', 6, 2, 0, 0, 0, 9, '₹ 22 LPA', '₹ 26 LPA', 'Anamika Sahay', 'Sourcing profiles via Naukri portal', 'Sourcing active on Naukri and LinkedIn talent network.', 'GREEN', FALSE, 'No'),
  ('POS-MFG-006', 'Robotics Automation & Digital Twin Engineer', 'Advanced Manufacturing', 'High', '2026-11-28', 'Interview in progress', 10, 4, 2, 0, 0, 15, '₹ 26 LPA', '₹ 30 LPA', 'Anamika Sahay', 'Final assessment with Dept Head', 'Technical assessment on PLC & KUKA programming completed.', 'GREEN', FALSE, 'No')
ON CONFLICT DO NOTHING;

SELECT setval('recruitment_id_seq', (SELECT MAX(id) FROM recruitment));

-- =====================================================================
-- SEED DATA: UNIFIED FORM SECTIONS & 14 STANDARDISED FIELDS FOR ALL 9 VERTICALS
-- (All 9 departments including HR & Recruitment share the exact same form structure
--  with S.No. 1..14 to generate identical, uniform reports across the dashboard)
-- =====================================================================
DO $$
DECLARE
  dept_rec RECORD;
  sec_id INTEGER;
BEGIN
  DELETE FROM department_form_values;
  DELETE FROM form_field_options;
  DELETE FROM form_fields;
  DELETE FROM form_sections;

  FOR dept_rec IN SELECT id, code, name FROM departments ORDER BY id LOOP
    INSERT INTO form_sections (department_id, section_key, title, display_order, active)
    VALUES (dept_rec.id, 'action_tracker', 'Weekly Departmental Action Register & Progress Form', 1, TRUE)
    ON CONFLICT (department_id, section_key) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO sec_id;

    IF sec_id IS NULL THEN
      SELECT id INTO sec_id FROM form_sections WHERE department_id = dept_rec.id AND section_key = 'action_tracker';
    END IF;

    INSERT INTO form_fields (department_id, section_id, field_key, label, field_type, required, active, display_order, help_text) VALUES
      (dept_rec.id, sec_id, 'sl_no', 'Sl.No. (assigned automatically)', 'Short Text', TRUE, TRUE, 1, 'Automatically assigned action code (e.g. ACT-01)'),
      (dept_rec.id, sec_id, 'review_meeting_date', 'Review Meeting Date', 'Date', TRUE, TRUE, 2, 'Date of the review meeting (YYYY-MM-DD)'),
      (dept_rec.id, sec_id, 'review_frequency', 'Review Frequency', 'Dropdown', TRUE, TRUE, 3, 'Weekly or Monthly review cadence'),
      (dept_rec.id, sec_id, 'department', 'Department', 'Dropdown', TRUE, TRUE, 4, 'Primary responsible department / vertical'),
      (dept_rec.id, sec_id, 'ownership', 'Action Owner', 'Short Text', TRUE, TRUE, 5, 'Pick from the staff list or type a name'),
      (dept_rec.id, sec_id, 'priority', 'Priority', 'Dropdown', TRUE, TRUE, 6, 'Critical / High / Medium / Low'),
      (dept_rec.id, sec_id, 'deliverable', 'Action Item / Deliverable', 'Long Text', TRUE, TRUE, 7, 'Concrete action or deliverable agreed in the review meeting'),
      (dept_rec.id, sec_id, 'supporting_departments', 'Support Required From', 'Short Text', FALSE, TRUE, 8, 'People, teams or departments required for support'),
      (dept_rec.id, sec_id, 'timeline', 'Completion Date / Target Date', 'Date', TRUE, TRUE, 9, 'Not reset on carry-forward. Changes are logged.'),
      (dept_rec.id, sec_id, 'status', 'Status', 'Dropdown', TRUE, TRUE, 10, 'Open / In Progress / On Track / Delayed / Blocked / On Hold / Completed / Closed'),
      (dept_rec.id, sec_id, 'next_followup_date', 'Next Follow-up Date', 'Date', FALSE, TRUE, 11, 'Scheduled date for next follow-up review'),
      (dept_rec.id, sec_id, 'vc_decision_required', 'Vice Chairman Decision Required', 'Dropdown', TRUE, TRUE, 12, 'No / Yes — whether Vice Chairman decision is required'),
      (dept_rec.id, sec_id, 'remarks', 'Progress Update / Remarks (this week)', 'Long Text', FALSE, TRUE, 13, 'Progress, blockers and dependencies since the last review'),
      (dept_rec.id, sec_id, 'decision_action', 'Action Taken (Closed / Open / In Progress)', 'Long Text', FALSE, TRUE, 14, 'Clearly records what action was taken if closed, open, or in progress')
    ON CONFLICT (department_id, field_key) DO UPDATE SET
      label = EXCLUDED.label,
      field_type = EXCLUDED.field_type,
      display_order = EXCLUDED.display_order,
      help_text = EXCLUDED.help_text;
  END LOOP;
END $$;

SELECT setval('form_sections_id_seq', (SELECT MAX(id) FROM form_sections));
SELECT setval('form_fields_id_seq', (SELECT MAX(id) FROM form_fields));

-- =====================================================================
-- DEDICATED ANALYTICS & PENDING REGISTER SQL VIEWS FOR SUB-PAGES
-- =====================================================================
DROP POLICY IF EXISTS "Allow All Login Logs" ON login_logs;
CREATE POLICY "Allow All Login Logs" ON login_logs FOR ALL USING (true) WITH CHECK (true);

-- View 1: Pending Items Only (Sorted with Newly Added & Red Alerts on Top)
CREATE OR REPLACE VIEW v_pending_actions_register AS
SELECT
  w.*,
  d.name AS department_name,
  d.code AS department_code
FROM workstreams w
LEFT JOIN departments d ON d.id = w.department_id
WHERE UPPER(TRIM(COALESCE(w.status, 'OPEN'))) NOT IN ('CLOSED', 'COMPLETED')
ORDER BY
  CASE WHEN w.id > 15 THEN 0 ELSE 1 END ASC,
  CASE WHEN UPPER(COALESCE(w.rag_status, '')) = 'RED' OR UPPER(COALESCE(w.status, '')) IN ('BLOCKED', 'DELAYED') OR UPPER(COALESCE(w.priority, '')) = 'CRITICAL' OR w.vc_decision_required = 'Yes' THEN 0 ELSE 1 END ASC,
  w.id DESC;

-- View 2: Vertical Readiness & RAG Analytics
CREATE OR REPLACE VIEW v_vertical_readiness_analytics AS
SELECT
  d.id AS department_id,
  d.name AS department_name,
  d.code AS department_code,
  COALESCE(ov.readiness_percentage, 0) AS readiness_percentage,
  COALESCE(ov.rag_status, 'NOT STARTED') AS rag_status,
  COALESCE(ov.key_focus, '') AS key_focus,
  COUNT(w.id) FILTER (WHERE UPPER(TRIM(COALESCE(w.status, 'OPEN'))) NOT IN ('CLOSED', 'COMPLETED')) AS pending_actions_count,
  COUNT(w.id) FILTER (WHERE UPPER(TRIM(COALESCE(w.status, 'OPEN'))) IN ('CLOSED', 'COMPLETED')) AS closed_actions_count
FROM departments d
LEFT JOIN department_overview ov ON ov.department_id = d.id
LEFT JOIN workstreams w ON w.department_id = d.id
WHERE d.active = TRUE
GROUP BY d.id, d.name, d.code, ov.readiness_percentage, ov.rag_status, ov.key_focus
ORDER BY d.id ASC;

-- Backfill datewise action_history (latest update on top) for any workstreams with empty history
UPDATE workstreams
SET action_history = json_build_array(
  json_build_object(
    'timestamp', COALESCE(updated_at::text, '2026-10-23T09:00:00Z'),
    'date', COALESCE(updated_at::text, '2026-10-23T09:00:00Z'),
    'user', COALESCE(NULLIF(ownership, ''), NULLIF(owner, ''), 'Vertical Lead'),
    'role', 'Department Head',
    'action', 'UPDATED',
    'status', COALESCE(status, 'OPEN'),
    'rag_status', COALESCE(rag_status, 'AMBER'),
    'priority', COALESCE(priority, 'Medium'),
    'vc_decision_required', COALESCE(vc_decision_required, 'No'),
    'remarks', COALESCE(NULLIF(remarks, ''), NULLIF(decision_action, ''), 'Active operational directive under weekly tracking')
  ),
  json_build_object(
    'timestamp', '2026-10-12T09:00:00Z',
    'date', '2026-10-12T09:00:00Z',
    'user', 'Executive Control Tower',
    'role', 'Admin',
    'action', 'CREATED',
    'status', 'OPEN',
    'rag_status', COALESCE(rag_status, 'AMBER'),
    'remarks', CONCAT('Registered during Weekly Management Review (', COALESCE(review_week, 'Week 42'), ') — Target: ', COALESCE(timeline, target_date, 'TBD'))
  )
)::text
WHERE action_history IS NULL OR action_history = '[]' OR action_history = '';

-- =====================================================================
-- INITIAL AUDIT LEDGER ENTRY
-- =====================================================================
INSERT INTO audit_log (user_name, action, details)
VALUES ('System Migration', 'SUPABASE_INIT', 'RIASAT Control Tower Supabase Database Schema and complete operational dataset installed successfully.');
