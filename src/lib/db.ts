import path from "path";
import fs from "fs";
import { DEPARTMENTS, ROLES } from "./constants";
import bcrypt from "bcryptjs";
import { isSupabaseConfigured, getSupabaseAdmin } from "./supabase";

// Database adapter interface
export interface DbResult<T = any> {
  rows: T[];
  rowCount?: number;
}

declare global {
  var __riasat_db_client: any;
  var __riasat_db_initialized: boolean;
}

let dbInstance: any = globalThis.__riasat_db_client || null;
let isInitialized = globalThis.__riasat_db_initialized || false;

export async function getClient() {
  if (dbInstance) return dbInstance;

  // 1. Check for Supabase Connection String (DATABASE_URL or SUPABASE_DB_URL)
  const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

  if (
    connectionString &&
    (connectionString.startsWith("postgres://") || connectionString.startsWith("postgresql://")) &&
    !connectionString.includes("YOUR_PASSWORD")
  ) {
    try {
      const { Pool } = await import("pg");
      const isLocalhost = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
      const pool = new Pool({
        connectionString,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      dbInstance = {
        type: "supabase_pg",
        query: async (text: string, params?: any[]): Promise<DbResult> => {
          const res = await pool.query(text, params);
          return { rows: res.rows, rowCount: res.rowCount ?? 0 };
        },
      };

      globalThis.__riasat_db_client = dbInstance;
      console.log("Connected to Supabase PostgreSQL Database");
      return dbInstance;
    } catch (err) {
      console.warn("Supabase database connection failed, falling back to local database engine:", err);
    }
  }

  // 2. Embedded PostgreSQL engine (PGlite) for instant setup and local offline resilience
  const dataDir = path.join(process.cwd(), ".data", "riasat_db");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Clean stale lockfiles if left from abruptly terminated processes
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
    console.warn("Recovering clean local database state...", err);
    const backupDir = path.join(process.cwd(), ".data", `riasat_db_corrupt_${Date.now()}`);
    try {
      fs.renameSync(dataDir, backupDir);
    } catch {
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

  globalThis.__riasat_db_client = dbInstance;
  return dbInstance;
}

export async function query<T = any>(text: string, params?: any[]): Promise<DbResult<T>> {
  if (!isInitialized) {
    await ensureDbInitialized();
  }
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

  // Fast check: If tables and users are already present, mark initialized and return instantly
  try {
    const quickCheck = await client.query("SELECT COUNT(*) as cnt FROM users");
    if (quickCheck.rows && Number(quickCheck.rows[0]?.cnt) >= 10) {
      isInitialized = true;
      globalThis.__riasat_db_initialized = true;
      return;
    }
  } catch {
    // Tables do not exist yet, continue with schema creation
  }

  // 1. Create Core Tables
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
      mobile TEXT DEFAULT '',
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
      key_focus TEXT DEFAULT '',
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
      help_text TEXT DEFAULT '',
      default_value TEXT DEFAULT '',
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
  `);

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

  // 2. Seed default 9 strategic departments
  for (const dept of DEPARTMENTS) {
    const existing = await client.query("SELECT id FROM departments WHERE id = $1 OR code = $2", [dept.id, dept.code]);
    if (existing.rows.length === 0) {
      await client.query(
        "INSERT INTO departments (id, name, code, active) VALUES ($1, $2, $3, $4)",
        [dept.id, dept.name, dept.code, true]
      );
    }
  }

  // 3. Seed department overview
  for (let deptId = 1; deptId <= 9; deptId++) {
    const existing = await client.query("SELECT id FROM department_overview WHERE department_id = $1", [deptId]);
    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO department_overview (department_id, readiness_percentage, rag_status, key_focus, last_updated, updated_by, submission_status)
         VALUES ($1, 0, 'NOT STARTED', '', NULL, NULL, 'SUBMITTED')`,
        [deptId]
      );
    }
  }

  // 4. Seed default official accounts
  const defaultUsers = [
    { name: "Vice Chairman", email: "vicechairman@riasat.ac.in", pass: "ViceChairman@123", role: ROLES.VICE_CHAIRMAN, deptId: null, desig: "Vice Chairman & Executive Director", mobile: "+91 98450 11000" },
    { name: "System Administrator", email: "admin@riasat.ac.in", pass: "Admin@123", role: ROLES.ADMIN, deptId: null, desig: "System Administrator", mobile: "+91 98450 11001" },
    { name: "Executive Office", email: "executive@riasat.ac.in", pass: "Exec@123", role: ROLES.EXECUTIVE, deptId: null, desig: "Executive Director / Management", mobile: "+91 98450 11002" },
    { name: "Form Configuration Admin", email: "forms.admin@riasat.ac.in", pass: "Forms@123", role: ROLES.FORM_ADMIN, deptId: null, desig: "Forms & Schema Administrator", mobile: "+91 98450 11003" },
    { name: "User Management Admin", email: "users.admin@riasat.ac.in", pass: "Users@123", role: ROLES.USER_ADMIN, deptId: null, desig: "User Access Administrator", mobile: "+91 98450 11004" },
    { name: "Departments Master Admin", email: "dept.admin@riasat.ac.in", pass: "Dept@123", role: ROLES.DEPT_ADMIN, deptId: null, desig: "Departments Master Administrator", mobile: "+91 98450 11005" },
    { name: "Dr. Arun Kumar", email: "semicon.head@riasat.ac.in", pass: "Semicon@123", role: ROLES.DEPARTMENT_HEAD, deptId: 1, desig: "Head - Semicon", mobile: "+91 98450 11006" },
    { name: "Wg Cdr R. Sharma", email: "aero.head@riasat.ac.in", pass: "Aero@123", role: ROLES.DEPARTMENT_HEAD, deptId: 2, desig: "Head - Aerospace & Defence", mobile: "+91 98450 11007" },
    { name: "Dr. P. Sundaram", email: "space.head@riasat.ac.in", pass: "Space@123", role: ROLES.DEPARTMENT_HEAD, deptId: 3, desig: "Head - Space", mobile: "+91 98450 11008" },
    { name: "Col. K. Menon", email: "cyber.head@riasat.ac.in", pass: "Cyber@123", role: ROLES.DEPARTMENT_HEAD, deptId: 4, desig: "Head - Cybersecurity", mobile: "+91 98450 11009" },
    { name: "Dr. Neha Varma", email: "medtech.head@riasat.ac.in", pass: "MedTech@123", role: ROLES.DEPARTMENT_HEAD, deptId: 5, desig: "Head - MedTech", mobile: "+91 98450 11010" },
    { name: "Prof. Rajesh Iyer", email: "mfg.head@riasat.ac.in", pass: "Mfg@123", role: ROLES.DEPARTMENT_HEAD, deptId: 6, desig: "Head - Advanced Manufacturing", mobile: "+91 98450 11011" },
    { name: "Sumanth Rao", email: "hr.head@riasat.ac.in", pass: "Hr@123", role: ROLES.DEPARTMENT_HEAD, deptId: 7, desig: "Head - HR & Recruitment", mobile: "+91 98450 11012" },
    { name: "Ananya Sen", email: "comm.head@riasat.ac.in", pass: "Comm@123", role: ROLES.DEPARTMENT_HEAD, deptId: 8, desig: "Head - Communications", mobile: "+91 98450 11013" },
    { name: "Dr. Venkat Raman", email: "ops.head@riasat.ac.in", pass: "Ops@123", role: ROLES.DEPARTMENT_HEAD, deptId: 9, desig: "Head - Strategy & Operations", mobile: "+91 98450 11014" },
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

  // 5. Seed 15 Authentic Management Review Action Items
  const executiveActionItems = [
    {
      deptId: 7, itemId: "ACT-01", category: "Faculty & Trainers",
      deliverable: "Confirm contract/tenure terms and the permanent-conversion process for existing trainers; standardise and communicate the variable-pay approach.",
      owner: "Anamika to coordinate with relevant RUAS/HR contacts", timeline: "Urgent; close after clarification",
      status: "OPEN", rag_status: "AMBER", remarks: "Confirm tenure terms and standardise variable-pay approach with RUAS/HR contacts.",
      vc_req: "Yes", supporting: "HR & Recruitment", supporting_ids: "7",
      decision_action: "Standardise and communicate the variable-pay approach and permanent tenure terms."
    },
    {
      deptId: 7, itemId: "ACT-02", category: "Talent Acquisition",
      deliverable: "Progress Dr. Durga Prakash and RUAS PhD candidate Darshan; confirm role, fit, package and offer route.",
      owner: "Anamika; Venky to guide/meet candidates", timeline: "Urgent",
      status: "OPEN", rag_status: "AMBER", remarks: "Venky to guide and meet candidates; confirm role, fit, package and offer route.",
      vc_req: "Yes", supporting: "Semicon", supporting_ids: "1",
      decision_action: "Executive approval on package and offer route for semiconductor candidates."
    },
    {
      deptId: 7, itemId: "ACT-03", category: "Technical Hiring",
      deliverable: "Arrange remaining interviews and joining-date follow-ups for trainer and IT application roles; prioritise IT applications over infrastructure.",
      owner: "Anamika; relevant technical interviewers", timeline: "As soon as possible",
      status: "OPEN", rag_status: "AMBER", remarks: "Prioritise IT applications over infrastructure; expedite technical interviews.",
      vc_req: "No", supporting: "Strategy & Operations", supporting_ids: "9",
      decision_action: "Prioritise IT applications over infrastructure."
    },
    {
      deptId: 7, itemId: "ACT-04", category: "Marketing & Sales",
      deliverable: "Review and strengthen the two marketing/sales-related job descriptions; source experienced candidates and move recruitment quickly.",
      owner: "Anamika/Naukri team", timeline: "Immediate; before December 2026 launch",
      status: "OPEN", rag_status: "AMBER", remarks: "Strengthen JDs with Naukri team; source experienced candidates before Dec 2026 launch.",
      vc_req: "No", supporting: "Communications", supporting_ids: "8",
      decision_action: "Strengthen JDs and accelerate recruitment before Dec 2026 launch."
    },
    {
      deptId: 8, itemId: "ACT-05", category: "Brand & Outreach",
      deliverable: "Prepare launch-ready programme positioning, website content, online application flow, corporate outreach and campaign collateral.",
      owner: "Vinila and programme leads", timeline: "By December 2026",
      status: "OPEN", rag_status: "GREEN", remarks: "Coordinate with programme leads for Dec 2026 launch readiness and online application flow.",
      vc_req: "No", supporting: "Semicon, Aerospace & Defence, Strategy & Operations", supporting_ids: "1,2,9",
      decision_action: "Finalize programme positioning, website content and campaign collateral."
    },
    {
      deptId: 8, itemId: "ACT-06", category: "Industry Partnerships",
      deliverable: "Contact at least five companies to validate the programme proposal and gather feedback.",
      owner: "Vinila/Avinash", timeline: "As soon as possible",
      status: "OPEN", rag_status: "GREEN", remarks: "Corporate outreach initiated to validate programme proposal with 5 industry partners.",
      vc_req: "No", supporting: "Strategy & Operations", supporting_ids: "9",
      decision_action: "Validate programme proposal with at least five corporate partners."
    },
    {
      deptId: 8, itemId: "ACT-07", category: "Collateral & Privacy",
      deliverable: "Prepare approved trainer/project profiles and customer-facing examples; remove or generalise confidential information.",
      owner: "Vinila/Marketing with technical teams", timeline: "For customer outreach and launch",
      status: "OPEN", rag_status: "GREEN", remarks: "Maintain strict confidentiality: generalise sensitive project data for customer-facing profiles.",
      vc_req: "No", supporting: "HR & Recruitment, Strategy & Operations", supporting_ids: "7,9",
      decision_action: "Prepare approved customer-facing profiles respecting confidentiality."
    },
    {
      deptId: 8, itemId: "ACT-08", category: "Branding & Operations",
      deliverable: "Obtain and review the staff ID card print sample; revise certificate collateral to foreground RIASAT/Ramaiah branding.",
      owner: "Vinila/Sarojini", timeline: "Sample expected 12 October 2026; follow up",
      status: "OPEN", rag_status: "AMBER", remarks: "Sample expected 12 Oct 2026; follow up immediately with vendor to verify RIASAT/Ramaiah branding.",
      vc_req: "No", supporting: "Strategy & Operations", supporting_ids: "9",
      decision_action: "Review ID card sample and ensure prominent RIASAT/Ramaiah branding."
    },
    {
      deptId: 1, itemId: "ACT-09", category: "Curriculum & Labs",
      deliverable: "Compile curriculum and equipment requirements for reliability/testing, metrology and characterisation; review with IIT Madras and Keysight and propose programme/pricing options.",
      owner: "Avinash/Venky", timeline: "Follow up after IIT Madras discussions",
      status: "OPEN", rag_status: "AMBER", remarks: "Review curriculum and equipment requirements with IIT Madras and Keysight; propose pricing options.",
      vc_req: "Yes", supporting: "Strategy & Operations", supporting_ids: "9",
      decision_action: "VC review of programme structure and pricing options following IIT Madras discussions."
    },
    {
      deptId: 1, itemId: "ACT-10", category: "Executive Training",
      deliverable: "Confirm trainer capacity, infrastructure, location and schedule for prospective HiCAG training; Venky to join the follow-up discussion.",
      owner: "Avinash/Venky and technical leads", timeline: "Follow up immediately",
      status: "OPEN", rag_status: "AMBER", remarks: "Confirm trainer capacity, infrastructure, location and schedule; Venky to join discussion.",
      vc_req: "Yes", supporting: "Advanced Manufacturing, Strategy & Operations", supporting_ids: "6,9",
      decision_action: "Leadership alignment on HiCAG prospective training schedule and trainer deployment."
    },
    {
      deptId: 3, itemId: "ACT-11", category: "Lab Infrastructure",
      deliverable: "Obtain a written space-lab proposal and consolidate the lab space plan for semiconductor, space, cybersecurity and AI; validate approximate areas.",
      owner: "Architect/Avinash/Venky", timeline: "After partner proposals and IIT Madras visit",
      status: "OPEN", rag_status: "AMBER", remarks: "Consolidate integrated lab space plan across semiconductor, space, cyber and AI; validate areas.",
      vc_req: "Yes", supporting: "Semicon, Cybersecurity, Strategy & Operations", supporting_ids: "1,4,9",
      decision_action: "Executive approval of consolidated lab space plan across 4 verticals."
    },
    {
      deptId: 6, itemId: "ACT-12", category: "Facilities & Architecture",
      deliverable: "Revise the architect/facility proposal to include validation/testing equipment; obtain final scope and submit for approval.",
      owner: "Avinash/Venky", timeline: "Target work start discussed around 15 October 2026; confirm",
      status: "OPEN", rag_status: "AMBER", remarks: "Target work start discussed around 15 Oct 2026; confirm revised scope with testing equipment.",
      vc_req: "Yes", supporting: "Strategy & Operations", supporting_ids: "9",
      decision_action: "VC approval of final facility scope and budget including validation/testing equipment."
    },
    {
      deptId: 9, itemId: "ACT-13", category: "IT & Infrastructure",
      deliverable: "Escalate laptop procurement and IT application hiring delays; arrange a call with the Vice Chairman and relevant contacts.",
      owner: "Avinash/Sarojini/relevant vendor contacts", timeline: "Immediate",
      status: "OPEN", rag_status: "RED", remarks: "Critical delay in laptop procurement and IT application hiring; arrange VC escalation call.",
      vc_req: "Yes", supporting: "HR & Recruitment", supporting_ids: "7",
      decision_action: "Vice Chairman intervention on vendor laptop procurement and IT application hiring delays."
    },
    {
      deptId: 9, itemId: "ACT-14", category: "Software & Licences",
      deliverable: "Notify the vendor that charges for inactive Dassault/CATIA licences should commence only from the activation date; clarify licence categories.",
      owner: "Avinash", timeline: "Immediate",
      status: "OPEN", rag_status: "AMBER", remarks: "Billing dispute: notify vendor that charges must commence only from live activation date.",
      vc_req: "No", supporting: "Aerospace & Defence, Advanced Manufacturing", supporting_ids: "2,6",
      decision_action: "Notify vendor that charges commence only from activation date and clarify categories."
    },
    {
      deptId: 9, itemId: "ACT-15", category: "Governance & Review",
      deliverable: "Resend the revised faculty compensation/revenue proposal for review; then schedule the stakeholder discussion.",
      owner: "Anamika/Sarojini to coordinate the meeting after review", timeline: "Proposal review requested on 12 October 2026",
      status: "OPEN", rag_status: "AMBER", remarks: "Proposal review requested on 12 Oct 2026; Sarojini to coordinate stakeholder meeting after review.",
      vc_req: "Yes", supporting: "HR & Recruitment", supporting_ids: "7",
      decision_action: "Vice Chairman review and approval of revised faculty compensation & revenue proposal."
    },
  ];

  for (const act of executiveActionItems) {
    const actExists = await client.query("SELECT id FROM workstreams WHERE item_id = $1", [act.itemId]);
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
    }
  }

  isInitialized = true;
  globalThis.__riasat_db_initialized = true;
  console.log("RIASAT database initialization complete.");
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
    const client = await getClient();
    await client.query(
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
    console.error("Audit log error:", err);
  }
}
