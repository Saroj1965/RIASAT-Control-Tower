import path from "path";
import fs from "fs";
import { DEPARTMENTS, ROLES } from "./constants";
import bcrypt from "bcryptjs";

// Database adapter interface
interface DbResult<T = any> {
  rows: T[];
  rowCount?: number;
}

let dbInstance: any = null;
let isInitialized = false;

async function getClient() {
  if (dbInstance) return dbInstance;

  const connectionString = process.env.DATABASE_URL;

  if (connectionString && (connectionString.startsWith("postgres://") || connectionString.startsWith("postgresql://"))) {
    // If it's a Neon serverless URL
    if (connectionString.includes("neon.tech")) {
      try {
        const { Pool } = await import("@neondatabase/serverless");
        const pool = new Pool({ connectionString });
        dbInstance = {
          type: "neon",
          query: async (text: string, params?: any[]): Promise<DbResult> => {
            const res = await pool.query(text, params);
            return { rows: res.rows, rowCount: res.rowCount ?? 0 };
          },
        };
        console.log("Connected to Neon PostgreSQL");
        return dbInstance;
      } catch (err) {
        console.warn("Failed to load Neon serverless client, falling back to pg or pglite:", err);
      }
    }

    // Standard PostgreSQL via pg
    try {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString, ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false } });
      dbInstance = {
        type: "pg",
        query: async (text: string, params?: any[]): Promise<DbResult> => {
          const res = await pool.query(text, params);
          return { rows: res.rows, rowCount: res.rowCount ?? 0 };
        },
      };
      console.log("Connected to PostgreSQL via pg Pool");
      return dbInstance;
    } catch (err) {
      console.warn("Standard pg client error, falling back to PGlite:", err);
    }
  }

  // Local Embedded PostgreSQL (PGlite) for instant setup and local development
  const dataDir = path.join(process.cwd(), ".data", "riasat_db");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Clean stale lockfiles if left from abruptly terminated process
  const pidFile = path.join(dataDir, "postmaster.pid");
  if (fs.existsSync(pidFile)) {
    try { fs.unlinkSync(pidFile); } catch (e) {}
  }
  const lockOut = path.join(dataDir, ".s.PGSQL.5432.lock.out");
  if (fs.existsSync(lockOut)) {
    try { fs.unlinkSync(lockOut); } catch (e) {}
  }

  const { PGlite } = await import("@electric-sql/pglite");
  let pgLite: any;
  try {
    pgLite = new PGlite(dataDir);
    await pgLite.waitReady;
  } catch (err) {
    console.warn("PGlite failed to open data directory (possible WAL corruption). Recovering clean database...", err);
    const backupDir = path.join(process.cwd(), ".data", `riasat_db_corrupt_${Date.now()}`);
    try {
      fs.renameSync(dataDir, backupDir);
    } catch (renameErr) {
      fs.rmSync(dataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(dataDir, { recursive: true });
    pgLite = new PGlite(dataDir);
    await pgLite.waitReady;
    isInitialized = false;
  }

  dbInstance = {
    type: "pglite",
    query: async (text: string, params?: any[]): Promise<DbResult> => {
      if (params && params.length > 0) {
        const res = await pgLite.query(text, params);
        return { rows: res.rows as any[], rowCount: res.rows.length };
      }
      try {
        const res = await pgLite.query(text);
        return { rows: res.rows as any[], rowCount: res.rows.length };
      } catch (err: any) {
        if (err.message && err.message.includes("cannot insert multiple commands")) {
          await pgLite.exec(text);
          return { rows: [], rowCount: 0 };
        }
        throw err;
      }
    },
  };
  console.log("Connected to PostgreSQL via local PGlite engine at:", dataDir);
  return dbInstance;
}

export async function query<T = any>(text: string, params?: any[]): Promise<DbResult<T>> {
  await ensureDbInitialized();
  const client = await getClient();
  return client.query(text, params);
}

// Low-level query without recursive initialization
async function rawQuery<T = any>(text: string, params?: any[]): Promise<DbResult<T>> {
  const client = await getClient();
  return client.query(text, params);
}

export async function ensureDbInitialized() {
  if (isInitialized) return;

  const client = await getClient();

  // Create tables in PostgreSQL
  await client.query(`
    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      mobile TEXT,
      designation TEXT,
      role TEXT NOT NULL,
      department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP WITH TIME ZONE
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS department_overview (
      id SERIAL PRIMARY KEY,
      department_id INTEGER UNIQUE NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      readiness_percentage INTEGER NOT NULL DEFAULT 0,
      rag_status TEXT NOT NULL DEFAULT 'NOT STARTED',
      key_focus TEXT,
      submission_status TEXT NOT NULL DEFAULT 'SUBMITTED',
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT
    );
  `);

  await client.query(`
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
  `);

  await client.query(`
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
      help_text TEXT,
      default_value TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(department_id, field_key)
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS form_field_options (
      id SERIAL PRIMARY KEY,
      field_id INTEGER NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 1,
      active BOOLEAN NOT NULL DEFAULT TRUE
    );
  `);

  await client.query(`
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
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS workstreams (
      id SERIAL PRIMARY KEY,
      item_id TEXT,
      department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      deliverable TEXT NOT NULL,
      infrastructure_partnership TEXT,
      target_date TEXT,
      status TEXT NOT NULL DEFAULT 'Not Started',
      capex TEXT,
      revenue_pipeline TEXT,
      owner TEXT,
      risks_blockers TEXT,
      decision_action TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT
    );
  `);

  // Migrate tables schema safely
  const migrations = [
    "ALTER TABLE department_overview ADD COLUMN IF NOT EXISTS submission_status TEXT NOT NULL DEFAULT 'SUBMITTED';",
    "ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS item_id TEXT;",
    "ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS action_point TEXT;",
    "ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS ownership TEXT;",
    "ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS timeline TEXT;",
    "ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS rag_status TEXT DEFAULT 'GREEN';",
    "ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS remarks TEXT;",
    "ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS vc_decision_required TEXT DEFAULT 'No';",
    "ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS supporting_departments TEXT DEFAULT '';",
    "ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS supporting_department_ids TEXT DEFAULT '';",
    "ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS next_followup_date TEXT DEFAULT '';",
    "ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS closure_date TIMESTAMP WITH TIME ZONE;",
    "ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS closure_remarks TEXT;",
    "ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS closed_by TEXT;",
    "ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS meeting_context TEXT DEFAULT 'Weekly Management Review - 12 Oct 2026';",
    "ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS action_history TEXT DEFAULT '[]';",
    "ALTER TABLE recruitment ADD COLUMN IF NOT EXISTS candidates_shortlisted INTEGER DEFAULT 0;",
    "ALTER TABLE recruitment ADD COLUMN IF NOT EXISTS candidates_joined INTEGER DEFAULT 0;",
    "ALTER TABLE recruitment ADD COLUMN IF NOT EXISTS remarks TEXT;",
    "ALTER TABLE recruitment ADD COLUMN IF NOT EXISTS rag_status TEXT DEFAULT 'GREEN';",
    "ALTER TABLE recruitment ADD COLUMN IF NOT EXISTS vc_decision_required TEXT DEFAULT 'No';",
    "UPDATE workstreams SET action_point = deliverable WHERE action_point IS NULL OR action_point = '';",
    "UPDATE workstreams SET ownership = owner WHERE ownership IS NULL OR ownership = '';",
    "UPDATE workstreams SET timeline = target_date WHERE timeline IS NULL OR timeline = '';",
    "UPDATE workstreams SET remarks = COALESCE(decision_action, risks_blockers, '') WHERE remarks IS NULL OR remarks = '';",
    "UPDATE workstreams SET rag_status = CASE WHEN status IN ('Delayed', 'Blocked') THEN 'AMBER' WHEN status = 'Completed' THEN 'GREEN' ELSE 'GREEN' END WHERE rag_status IS NULL OR rag_status = '';",
    "UPDATE workstreams SET vc_decision_required = CASE WHEN decision_action IS NOT NULL AND decision_action != '' AND decision_action != 'None' THEN 'Yes' ELSE 'No' END WHERE vc_decision_required IS NULL OR vc_decision_required = '';",
    "UPDATE recruitment SET vc_decision_required = CASE WHEN vc_attention = TRUE THEN 'Yes' ELSE 'No' END WHERE vc_decision_required IS NULL OR vc_decision_required = '';",
  ];

  for (const m of migrations) {
    try {
      await client.query(m);
    } catch (mErr) {
      // Continue if migration statement has already been applied
    }
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS recruitment (
      id SERIAL PRIMARY KEY,
      position_id TEXT NOT NULL,
      position_title TEXT NOT NULL,
      strategic_segment TEXT,
      priority TEXT NOT NULL DEFAULT 'Medium',
      target_date TEXT,
      status TEXT NOT NULL DEFAULT 'Open',
      candidates_sourced INTEGER DEFAULT 0,
      interviews INTEGER DEFAULT 0,
      offers INTEGER DEFAULT 0,
      ageing_days INTEGER DEFAULT 0,
      target_ctc TEXT,
      budget TEXT,
      hiring_lead TEXT,
      next_action TEXT,
      vc_attention BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT
    );
  `);

  await client.query(`
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
  `);

  // Seed default 8 departments if not present
  for (const dept of DEPARTMENTS) {
    const existing = await client.query("SELECT id FROM departments WHERE id = $1 OR code = $2", [dept.id, dept.code]);
    if (existing.rows.length === 0) {
      await client.query(
        "INSERT INTO departments (id, name, code, active) VALUES ($1, $2, $3, $4)",
        [dept.id, dept.name, dept.code, true]
      );
    }
  }

  // Seed department overview with blank clean state
  const defaultOverviews = [
    { deptId: 1, readiness: 0, rag: "NOT STARTED", focus: "", by: null },
    { deptId: 2, readiness: 0, rag: "NOT STARTED", focus: "", by: null },
    { deptId: 3, readiness: 0, rag: "NOT STARTED", focus: "", by: null },
    { deptId: 4, readiness: 0, rag: "NOT STARTED", focus: "", by: null },
    { deptId: 5, readiness: 0, rag: "NOT STARTED", focus: "", by: null },
    { deptId: 6, readiness: 0, rag: "NOT STARTED", focus: "", by: null },
    { deptId: 7, readiness: 0, rag: "NOT STARTED", focus: "", by: null },
    { deptId: 8, readiness: 0, rag: "NOT STARTED", focus: "", by: null },
    { deptId: 9, readiness: 0, rag: "NOT STARTED", focus: "", by: null },
  ];

  for (const ov of defaultOverviews) {
    const existing = await client.query("SELECT id FROM department_overview WHERE department_id = $1", [ov.deptId]);
    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO department_overview (department_id, readiness_percentage, rag_status, key_focus, last_updated, updated_by, submission_status)
         VALUES ($1, $2, $3, $4, NULL, NULL, 'DRAFT')`,
        [ov.deptId, ov.readiness, ov.rag, ov.focus]
      );
    }
  }

  // Seed default official user accounts
  const defaultUsers = [
    { name: "Vice Chairman", email: "vicechairman@riasat.ac.in", pass: "ViceChairman@123", role: ROLES.VICE_CHAIRMAN, deptId: null, desig: "Vice Chairman & Executive Director", mobile: "" },
    { name: "System Administrator", email: "admin@riasat.ac.in", pass: "Admin@123", role: ROLES.ADMIN, deptId: null, desig: "System Administrator", mobile: "" },
    { name: "Executive Office", email: "executive@riasat.ac.in", pass: "Exec@123", role: ROLES.EXECUTIVE, deptId: null, desig: "Executive Director / Management", mobile: "" },
    { name: "Form Configuration Admin", email: "forms.admin@riasat.ac.in", pass: "Forms@123", role: ROLES.FORM_ADMIN, deptId: null, desig: "Forms & Schema Administrator", mobile: "" },
    { name: "User Management Admin", email: "users.admin@riasat.ac.in", pass: "Users@123", role: ROLES.USER_ADMIN, deptId: null, desig: "User Access Administrator", mobile: "" },
    { name: "Departments Master Admin", email: "dept.admin@riasat.ac.in", pass: "Dept@123", role: ROLES.DEPT_ADMIN, deptId: null, desig: "Departments Master Administrator", mobile: "" },
    { name: "Semicon Head", email: "semicon.head@riasat.ac.in", pass: "Semicon@123", role: ROLES.DEPARTMENT_HEAD, deptId: 1, desig: "Head - Semicon", mobile: "" },
    { name: "Aerospace & Defence Head", email: "aero.head@riasat.ac.in", pass: "Aero@123", role: ROLES.DEPARTMENT_HEAD, deptId: 2, desig: "Head - Aerospace & Defence", mobile: "" },
    { name: "Space Head", email: "space.head@riasat.ac.in", pass: "Space@123", role: ROLES.DEPARTMENT_HEAD, deptId: 3, desig: "Head - Space", mobile: "" },
    { name: "Cybersecurity Head", email: "cyber.head@riasat.ac.in", pass: "Cyber@123", role: ROLES.DEPARTMENT_HEAD, deptId: 4, desig: "Head - Cybersecurity", mobile: "" },
    { name: "MedTech Head", email: "medtech.head@riasat.ac.in", pass: "MedTech@123", role: ROLES.DEPARTMENT_HEAD, deptId: 5, desig: "Head - MedTech", mobile: "" },
    { name: "Advanced Manufacturing Head", email: "mfg.head@riasat.ac.in", pass: "Mfg@123", role: ROLES.DEPARTMENT_HEAD, deptId: 6, desig: "Head - Advanced Manufacturing", mobile: "" },
    { name: "HR & Recruitment Head", email: "hr.head@riasat.ac.in", pass: "Hr@123", role: ROLES.DEPARTMENT_HEAD, deptId: 7, desig: "Head - HR & Recruitment", mobile: "" },
    { name: "Communications Head", email: "comm.head@riasat.ac.in", pass: "Comm@123", role: ROLES.DEPARTMENT_HEAD, deptId: 8, desig: "Head - Communications", mobile: "" },
    { name: "Strategy & Operations Head", email: "ops.head@riasat.ac.in", pass: "Ops@123", role: ROLES.DEPARTMENT_HEAD, deptId: 9, desig: "Head - Strategy & Operations", mobile: "" },
  ];

  for (const u of defaultUsers) {
    const existing = await client.query("SELECT id FROM users WHERE email = $1", [u.email]);
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(u.pass, 10);
      await client.query(
        `INSERT INTO users (name, email, password_hash, mobile, designation, role, department_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active')`,
        [u.name, u.email, hash, u.mobile, u.desig, u.role, u.deptId]
      );
    }
  }

  // Seed the 15 authentic management review Action Items (Weekly Management Review - 12 Oct 2026)
  const executiveActionItems = [
    {
      deptId: 7, // HR & Recruitment
      itemId: "ACT-01",
      category: "Faculty & Trainers",
      deliverable: "Confirm contract/tenure terms and the permanent-conversion process for existing trainers; standardise and communicate the variable-pay approach.",
      owner: "Anamika to coordinate with relevant RUAS/HR contacts",
      timeline: "Urgent; close after clarification",
      status: "OPEN",
      rag_status: "AMBER",
      remarks: "Confirm tenure terms and standardise variable-pay approach with RUAS/HR contacts.",
      vc_req: "Yes",
      supporting: "HR & Recruitment",
      supporting_ids: "7",
      decision_action: "Standardise and communicate the variable-pay approach and permanent tenure terms.",
    },
    {
      deptId: 7, // HR & Recruitment
      itemId: "ACT-02",
      category: "Talent Acquisition",
      deliverable: "Progress the two semiconductor candidates, Dr. Durga Prakash and RUAS PhD candidate Darshan; confirm role, fit, package and offer route.",
      owner: "Anamika; Venky to guide/meet candidates",
      timeline: "URGENT",
      status: "OPEN",
      rag_status: "AMBER",
      remarks: "Venky to guide and meet candidates; confirm role, fit, package and offer route.",
      vc_req: "Yes",
      supporting: "Semicon",
      supporting_ids: "1",
      decision_action: "Executive approval on package and offer route for semiconductor candidates.",
    },
    {
      deptId: 7, // HR & Recruitment
      itemId: "ACT-03",
      category: "Technical Hiring",
      deliverable: "Arrange remaining interviews and joining-date follow-ups for trainer and IT application roles; prioritise IT applications over infrastructure.",
      owner: "Anamika; relevant technical interviewers",
      timeline: "As soon as possible",
      status: "OPEN",
      rag_status: "AMBER",
      remarks: "Prioritise IT applications over infrastructure; expedite technical interviews.",
      vc_req: "No",
      supporting: "Strategy & Operations",
      supporting_ids: "9",
      decision_action: "Prioritise IT applications over infrastructure.",
    },
    {
      deptId: 7, // HR & Recruitment
      itemId: "ACT-04",
      category: "Marketing & Sales",
      deliverable: "Review and strengthen the two marketing/sales-related job descriptions; source experienced candidates and move recruitment quickly.",
      owner: "Anamika/Naukri team",
      timeline: "Immediate; before the December 2026 launch",
      status: "OPEN",
      rag_status: "AMBER",
      remarks: "Strengthen JDs with Naukri team; source experienced candidates before Dec 2026 launch.",
      vc_req: "No",
      supporting: "Communications",
      supporting_ids: "8",
      decision_action: "Strengthen JDs and accelerate recruitment before Dec 2026 launch.",
    },
    {
      deptId: 8, // Communications
      itemId: "ACT-05",
      category: "Brand & Outreach",
      deliverable: "Prepare launch-ready programme positioning, website content, online application flow, corporate outreach and campaign collateral.",
      owner: "Vinila along with programme leads",
      timeline: "By December 2026",
      status: "OPEN",
      rag_status: "GREEN",
      remarks: "Coordinate with programme leads for Dec 2026 launch readiness and online application flow.",
      vc_req: "No",
      supporting: "Semicon, Aerospace & Defence, Strategy & Operations",
      supporting_ids: "1,2,9",
      decision_action: "Finalize programme positioning, website content and campaign collateral.",
    },
    {
      deptId: 8, // Communications
      itemId: "ACT-06",
      category: "Industry Partnerships",
      deliverable: "Contact at least five companies to validate the programme proposal and gather feedback.",
      owner: "Vinila/Avinash",
      timeline: "As soon as possible",
      status: "OPEN",
      rag_status: "GREEN",
      remarks: "Corporate outreach initiated to validate programme proposal with 5 industry partners.",
      vc_req: "No",
      supporting: "Strategy & Operations",
      supporting_ids: "9",
      decision_action: "Validate programme proposal with at least five corporate partners.",
    },
    {
      deptId: 8, // Communications
      itemId: "ACT-07",
      category: "Collateral & Privacy",
      deliverable: "Prepare approved trainer/project profiles and customer-facing examples; remove or generalise confidential information.",
      owner: "Vinila/Marketing with technical teams",
      timeline: "For customer outreach and launch",
      status: "OPEN",
      rag_status: "GREEN",
      remarks: "Maintain strict confidentiality: generalise sensitive project data for customer-facing profiles.",
      vc_req: "No",
      supporting: "HR & Recruitment, Strategy & Operations",
      supporting_ids: "7,9",
      decision_action: "Prepare approved customer-facing profiles respecting confidentiality.",
    },
    {
      deptId: 8, // Communications
      itemId: "ACT-08",
      category: "Branding & Operations",
      deliverable: "Obtain and review the staff ID card print sample; revise certificate collateral to foreground RIASAT/Ramaiah branding.",
      owner: "Vinila/Sarojini",
      timeline: "Sample expected 12 October 2026; follow up",
      status: "OPEN",
      rag_status: "AMBER",
      remarks: "Sample expected 12 Oct 2026; follow up immediately with vendor to verify RIASAT/Ramaiah branding.",
      vc_req: "No",
      supporting: "Strategy & Operations",
      supporting_ids: "9",
      decision_action: "Review ID card sample and ensure prominent RIASAT/Ramaiah branding.",
    },
    {
      deptId: 1, // Semicon
      itemId: "ACT-09",
      category: "Curriculum & Labs",
      deliverable: "Compile curriculum and equipment requirements for reliability/testing, metrology and characterisation; review with IIT Madras and Keysight and propose programme/pricing options.",
      owner: "Avinash/Venky",
      timeline: "Follow up after IIT Madras discussions",
      status: "OPEN",
      rag_status: "AMBER",
      remarks: "Review curriculum and equipment requirements with IIT Madras and Keysight; propose pricing options.",
      vc_req: "Yes",
      supporting: "Strategy & Operations",
      supporting_ids: "9",
      decision_action: "VC review of programme structure and pricing options following IIT Madras discussions.",
    },
    {
      deptId: 1, // Semicon
      itemId: "ACT-10",
      category: "Executive Training",
      deliverable: "Confirm trainer capacity, infrastructure, location and schedule for prospective HiCAG training; Venky to join the follow-up discussion.",
      owner: "Avinash/Venky and technical leads",
      timeline: "Follow up immediately",
      status: "OPEN",
      rag_status: "AMBER",
      remarks: "Confirm trainer capacity, infrastructure, location and schedule; Venky to join discussion.",
      vc_req: "Yes",
      supporting: "Advanced Manufacturing, Strategy & Operations",
      supporting_ids: "6,9",
      decision_action: "Leadership alignment on HiCAG prospective training schedule and trainer deployment.",
    },
    {
      deptId: 3, // Space
      itemId: "ACT-11",
      category: "Lab Infrastructure",
      deliverable: "Obtain a written space-lab proposal and consolidate the lab space plan for semiconductor, space, cybersecurity and AI; validate approximate areas.",
      owner: "Architect/Avinash/Venky",
      timeline: "After partner proposals and IIT Madras visit",
      status: "OPEN",
      rag_status: "AMBER",
      remarks: "Consolidate integrated lab space plan across semiconductor, space, cyber and AI; validate areas.",
      vc_req: "Yes",
      supporting: "Semicon, Cybersecurity, Strategy & Operations",
      supporting_ids: "1,4,9",
      decision_action: "Executive approval of consolidated lab space plan across 4 verticals.",
    },
    {
      deptId: 6, // Advanced Manufacturing
      itemId: "ACT-12",
      category: "Facilities & Architecture",
      deliverable: "Revise the architect/facility proposal to include validation/testing equipment; obtain final scope and submit for approval.",
      owner: "Avinash/Venky",
      timeline: "Target work start discussed around 15 October 2026; confirm",
      status: "OPEN",
      rag_status: "AMBER",
      remarks: "Target work start discussed around 15 Oct 2026; confirm revised scope with testing equipment.",
      vc_req: "Yes",
      supporting: "Strategy & Operations",
      supporting_ids: "9",
      decision_action: "VC approval of final facility scope and budget including validation/testing equipment.",
    },
    {
      deptId: 9, // Strategy & Operations
      itemId: "ACT-13",
      category: "IT & Infrastructure",
      deliverable: "Escalate laptop procurement and IT application hiring delays; arrange a call with the Vice Chairman and relevant contacts.",
      owner: "Avinash/Sarojini/relevant vendor contacts",
      timeline: "Immediate",
      status: "OPEN",
      rag_status: "RED",
      remarks: "Critical delay in laptop procurement and IT application hiring; arrange VC escalation call.",
      vc_req: "Yes",
      supporting: "HR & Recruitment",
      supporting_ids: "7",
      decision_action: "Vice Chairman intervention on vendor laptop procurement and IT application hiring delays.",
    },
    {
      deptId: 9, // Strategy & Operations
      itemId: "ACT-14",
      category: "Software & Licences",
      deliverable: "Notify the vendor that charges for inactive Dassault/CATIA licences should commence only from the activation date; clarify licence categories.",
      owner: "Avinash",
      timeline: "Immediate",
      status: "OPEN",
      rag_status: "AMBER",
      remarks: "Billing dispute: notify vendor that charges must commence only from live activation date.",
      vc_req: "No",
      supporting: "Aerospace & Defence, Advanced Manufacturing",
      supporting_ids: "2,6",
      decision_action: "Notify vendor that charges commence only from activation date and clarify categories.",
    },
    {
      deptId: 9, // Strategy & Operations
      itemId: "ACT-15",
      category: "Governance & Review",
      deliverable: "Resend the revised faculty compensation/revenue proposal for review; then schedule the stakeholder discussion.",
      owner: "Anamika/Sarojini to coordinate the meeting after review",
      timeline: "Proposal review requested on 12 October 2026",
      status: "OPEN",
      rag_status: "AMBER",
      remarks: "Proposal review requested on 12 Oct 2026; Sarojini to coordinate stakeholder meeting after review.",
      vc_req: "Yes",
      supporting: "HR & Recruitment",
      supporting_ids: "7",
      decision_action: "Vice Chairman review and approval of revised faculty compensation & revenue proposal.",
    },
  ];

  for (const act of executiveActionItems) {
    const actExists = await client.query(
      "SELECT id FROM workstreams WHERE item_id = $1",
      [act.itemId]
    );
    if (actExists.rows.length === 0) {
      await client.query(
        `INSERT INTO workstreams (
          department_id, item_id, category, deliverable, action_point,
          owner, ownership, target_date, timeline,
          status, rag_status, remarks, vc_decision_required, decision_action,
          supporting_departments, supporting_department_ids, meeting_context, updated_by
        ) VALUES ($1, $2, $3, $4, $4, $5, $5, $6, $6, $7, $8, $9, $10, $11, $12, $13, 'Weekly Management Review - 12 Oct 2026', 'Executive Secretariat')`,
        [
          act.deptId, act.itemId, act.category, act.deliverable, act.owner, act.timeline,
          act.status, act.rag_status, act.remarks, act.vc_req, act.decision_action,
          act.supporting, act.supporting_ids
        ]
      );
    } else {
      await client.query(
        `UPDATE workstreams SET
          department_id = $1, category = $2, deliverable = $3, action_point = $3,
          owner = $4, ownership = $4, target_date = $5, timeline = $5,
          status = $6, rag_status = $7, remarks = $8, vc_decision_required = $9, decision_action = $10,
          supporting_departments = $11, supporting_department_ids = $12, meeting_context = 'Weekly Management Review - 12 Oct 2026',
          updated_by = 'Executive Secretariat'
        WHERE id = $13`,
        [
          act.deptId, act.category, act.deliverable, act.owner, act.timeline,
          act.status, act.rag_status, act.remarks, act.vc_req, act.decision_action,
          act.supporting, act.supporting_ids, actExists.rows[0].id
        ]
      );
    }
  }

  // Seed official Dynamic Form Configuration fields for all 9 verticals with exact required headings
  const actionFields = [
    { order: 1, key: "deliverable", label: "Action item", type: "Short Text", required: true, help: "Specific action item or key operational deliverable" },
    { order: 2, key: "ownership", label: "Owner / support", type: "Short Text", required: true, help: "Responsible person, team, or support coordinator" },
    { order: 3, key: "timeline", label: "Timeline", type: "Short Text", required: true, help: "Target completion deadline (e.g. Urgent, Immediate, Dec 2026)" },
    { order: 4, key: "status", label: "Status", type: "Dropdown", required: true, help: "Open / In Progress / Completed / Delayed / Blocked" },
    { order: 5, key: "remarks", label: "Remarks / Dependencies", type: "Long Text", required: false, help: "Progress notes, dependencies, or blockers" },
    { order: 6, key: "vc_decision_required", label: "Vice Chairman Decision Required", type: "Dropdown", required: true, help: "Yes / No - escalation required for leadership action" },
    { order: 7, key: "category", label: "Initiative / Event / Campaign", type: "Short Text", required: false, help: "Strategic initiative or functional theme" },
    { order: 8, key: "sl_no", label: "Sl. No. — automatically generated", type: "Number", required: false, help: "Sequential line item number" },
  ];

  const recruitmentFields = [
    { order: 1, key: "sl_no", label: "Sl. No. — automatically generated", type: "Number", required: true, help: "Automatically generated sequential row number" },
    { order: 2, key: "position_title", label: "Position / Role", type: "Short Text", required: true, help: "Position title or role designation" },
    { order: 3, key: "strategic_segment", label: "Department / Strategic Vertical", type: "Dropdown", required: true, help: "Target strategic vertical domain" },
    { order: 4, key: "priority", label: "Priority", type: "Dropdown", required: true, help: "Critical / High / Medium / Low" },
    { order: 5, key: "hiring_lead", label: "Hiring Owner", type: "Short Text", required: true, help: "Assigned talent acquisition lead or hiring manager" },
    { order: 6, key: "target_date", label: "Target Joining Date", type: "Date", required: false, help: "Planned joining date (YYYY-MM-DD)" },
    { order: 7, key: "status", label: "Status", type: "Dropdown", required: true, help: "Candidate sourced / shortlisted / Interview in progress / Offers released / Rejected / Joined" },
    { order: 8, key: "remarks", label: "Remarks", type: "Long Text", required: false, help: "Progress, notes, compensation or bottlenecks" },
    { order: 9, key: "vc_decision_required", label: "VC decision required", type: "Dropdown", required: true, help: "Yes / No - leadership escalation flag" },
  ];

  // Fetch all existing active departments
  const allDeptsRes = await client.query("SELECT id, code, name FROM departments WHERE active = TRUE ORDER BY id ASC");
  for (const dept of allDeptsRes.rows) {
    const isHRDept = dept.code === "HR_REC" || Number(dept.id) === 7;
    const sectionKey = isHRDept ? "recruitment_tracker" : "action_tracker";
    const sectionTitle = isHRDept ? "Recruitment Tracker Web Form" : "Action Tracker Web Form";

    // Ensure section exists
    let sectionId: number;
    const secRes = await client.query("SELECT id FROM form_sections WHERE department_id = $1 AND section_key = $2", [dept.id, sectionKey]);
    if (secRes.rows.length === 0) {
      const insSec = await client.query(
        "INSERT INTO form_sections (department_id, section_key, title, display_order) VALUES ($1, $2, $3, 1) RETURNING id",
        [dept.id, sectionKey, sectionTitle]
      );
      sectionId = insSec.rows[0].id;
    } else {
      sectionId = secRes.rows[0].id;
    }

    const targetFields = isHRDept ? recruitmentFields : actionFields;
    const targetKeys = targetFields.map(f => f.key);
    await client.query(
      `UPDATE form_fields SET active = FALSE WHERE department_id = $1 AND field_key != ALL($2::text[])`,
      [dept.id, targetKeys]
    );

    for (const f of targetFields) {
      const fRes = await client.query("SELECT id FROM form_fields WHERE department_id = $1 AND field_key = $2", [dept.id, f.key]);
      if (fRes.rows.length === 0) {
        await client.query(
          `INSERT INTO form_fields (
            department_id, section_id, field_key, label, field_type, required, active, display_order, help_text
          ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8)`,
          [dept.id, sectionId, f.key, f.label, f.type, f.required, f.order, f.help]
        );
      } else {
        await client.query(
          `UPDATE form_fields SET 
            label = $1, field_type = $2, required = $3, active = TRUE, display_order = $4, help_text = $5, section_id = $6
           WHERE id = $7`,
          [f.label, f.type, f.required, f.order, f.help, sectionId, fRes.rows[0].id]
        );
      }
    }
  }

  // Synchronize sequences with existing maximum IDs across all tables
  const serialTables = [
    'departments', 'users', 'department_overview', 'workstreams', 
    'recruitment', 'audit_log', 'form_sections', 'form_fields', 
    'form_field_options', 'department_form_values'
  ];
  for (const tbl of serialTables) {
    try {
      await client.query(`
        SELECT setval(
          pg_get_serial_sequence('${tbl}', 'id'), 
          COALESCE((SELECT MAX(id) FROM ${tbl}), 1)
        );
      `);
    } catch (e) {
      try {
        await client.query(`
          SELECT setval(
            '${tbl}_id_seq', 
            COALESCE((SELECT MAX(id) FROM ${tbl}), 1)
          );
        `);
      } catch (err) {}
    }
  }

  isInitialized = true;
  console.log("RIASAT PostgreSQL database initialized successfully with 8 departments, sample users, and demo data.");
}

export async function logAudit(params: {
  userId?: number | null;
  userName: string;
  action: string;
  departmentId?: number | null;
  departmentName?: string;
  recordId?: number | null;
  oldValue?: string;
  newValue?: string;
  details: string;
}) {
  try {
    await query(
      `INSERT INTO audit_log (user_id, user_name, action, department_id, department_name, record_id, old_value, new_value, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        params.userId || null,
        params.userName,
        params.action,
        params.departmentId || null,
        params.departmentName || null,
        params.recordId || null,
        params.oldValue || null,
        params.newValue || null,
        params.details,
      ]
    );
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
