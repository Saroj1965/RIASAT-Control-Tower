import path from "path";
import fs from "fs";
import os from "os";
import { DEPARTMENTS, ROLES } from "./constants";
import bcrypt from "bcryptjs";
import { isSupabaseConfigured, getSupabaseAdmin, getSupabase } from "./supabase";

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

  // 1. Check for PostgreSQL connection strings (Supabase direct, pooler, or Vercel Postgres)
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.SUPABASE_DATABASE_URL;

  if (
    connectionString &&
    (connectionString.startsWith("postgres://") || connectionString.startsWith("postgresql://")) &&
    !connectionString.includes("YOUR_PASSWORD") &&
    !connectionString.includes("[YOUR-PASSWORD]") &&
    !connectionString.includes("your-project-ref")
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
      console.warn("PostgreSQL connection failed, switching to serverless engine fallback:", err);
    }
  }

  // 2. Serverless & Local In-Memory PostgreSQL engine (PGlite)
  // CRITICAL: NEVER write to /var/task (read-only filesystem on Vercel & AWS Lambda)
  const { PGlite } = await import("@electric-sql/pglite");
  let pgLite: any;

  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NEXT_RUNTIME === "edge" ||
    process.env.LAMBDA_TASK_ROOT
  );

  if (isServerless) {
    // In-Memory PGlite instance: Zero disk writes, zero ENOENT errors, pure WebAssembly speed
    pgLite = new PGlite();
    await pgLite.waitReady;
  } else {
    // Local development: attempt persistent storage in temp/data with safe fallback
    try {
      const dataDir = path.join(process.cwd(), ".data", "riasat_db");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      pgLite = new PGlite(dataDir);
      await pgLite.waitReady;
    } catch {
      // Fallback to pure in-memory if disk access fails
      pgLite = new PGlite();
      await pgLite.waitReady;
    }
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

export async function ensureDbInitialized() {
  if (isInitialized) return;

  const client = await getClient();

  // Fast check: If users are already populated, skip re-initialization
  try {
    const quickCheck = await client.query("SELECT COUNT(*) as cnt FROM users");
    if (quickCheck.rows && Number(quickCheck.rows[0]?.cnt) >= 10) {
      isInitialized = true;
      globalThis.__riasat_db_initialized = true;
      return;
    }
  } catch {
    // Tables do not exist yet, proceed with schema creation
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

  // 3. Seed department overview with authentic readiness states
  const departmentOverviews = [
    { deptId: 1, readiness: 40, rag: "AMBER", focus: "ISO-6 cleanroom HVAC validation and ASML DUV stepper customs clearance" },
    { deptId: 2, readiness: 45, rag: "AMBER", focus: "Autoclave composite testing commissioning and DRDO ToT agreement" },
    { deptId: 3, readiness: 35, rag: "AMBER", focus: "Thermal vacuum chamber setup and IN-SPACe ground station licensing" },
    { deptId: 4, readiness: 50, rag: "AMBER", focus: "Air-gapped cyber range deployment and CERT-In HSM procurement" },
    { deptId: 5, readiness: 38, rag: "AMBER", focus: "ISO 13485 clean room prototyping and Ramaiah clinical trial MoU" },
    { deptId: 6, readiness: 60, rag: "GREEN", focus: "5-Axis CNC milling center commissioned and robotics automation cell" },
    { deptId: 7, readiness: 48, rag: "GREEN", focus: "Sourcing critical talent for Semicon and Aerospace leadership roles" },
    { deptId: 8, readiness: 55, rag: "AMBER", focus: "Brand launch summit preparation and DeepTech quarterly whitepaper" },
    { deptId: 9, readiness: 65, rag: "AMBER", focus: "Executive Control Tower governance and Advisory Council formation" },
  ];

  for (const ov of departmentOverviews) {
    const existing = await client.query("SELECT id FROM department_overview WHERE department_id = $1", [ov.deptId]);
    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO department_overview (department_id, readiness_percentage, rag_status, key_focus, last_updated, updated_by, submission_status)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'System Administrator', 'SUBMITTED')`,
        [ov.deptId, ov.readiness, ov.rag, ov.focus]
      );
    }
  }

  // 4. Seed default official accounts with verified bcrypt hashes
  const defaultUsers = [
    { name: "Vice Chairman", email: "vicechairman@riasat.ac.in", pass: "ViceChairman@123", hash: "$2a$10$KLBL2bnQS.P7F9UUAjQgROB07HVRDF.IVF208bswpJtrz28a6UjjO", role: ROLES.VICE_CHAIRMAN, deptId: null, desig: "Vice Chairman & Executive Director", mobile: "+91 98450 11000" },
    { name: "System Administrator", email: "admin@riasat.ac.in", pass: "Admin@123", hash: "$2a$10$ueuukLVZ5apS05o9ruCZ7.fZw9O29vpGtZUR/psN.yViAwDgcbbJi", role: ROLES.ADMIN, deptId: null, desig: "System Administrator", mobile: "+91 98450 11001" },
    { name: "Executive Office", email: "executive@riasat.ac.in", pass: "Exec@123", hash: "$2a$10$Mem8sQkw2Cw6ZFoNJqBJjugadAzF880r.jTwTDDg5vRvYI3Rbqj7W", role: ROLES.EXECUTIVE, deptId: null, desig: "Executive Director / Management", mobile: "+91 98450 11002" },
    { name: "Form Configuration Admin", email: "forms.admin@riasat.ac.in", pass: "Forms@123", hash: "$2a$10$q4QqRmh7t8vNa9OfgxFSiO1rjsDw4pJkJ6ClCW2NczUmOz75xzg3i", role: ROLES.FORM_ADMIN, deptId: null, desig: "Forms & Schema Administrator", mobile: "+91 98450 11003" },
    { name: "User Management Admin", email: "users.admin@riasat.ac.in", pass: "Users@123", hash: "$2a$10$p4z9bv6zIcGOTjymBCjLEOf1kl5pYGCIUzVhsHFDxuWWAdFiU3sM2", role: ROLES.USER_ADMIN, deptId: null, desig: "User Access Administrator", mobile: "+91 98450 11004" },
    { name: "Departments Master Admin", email: "dept.admin@riasat.ac.in", pass: "Dept@123", hash: "$2a$10$uYzIYr8LOQIh2p12eIjrQeQ5v.my6GzYmZLzfJFeyAPx3cZ7He11u", role: ROLES.DEPT_ADMIN, deptId: null, desig: "Departments Master Administrator", mobile: "+91 98450 11005" },
    { name: "Dr. Arun Kumar", email: "semicon.head@riasat.ac.in", pass: "Semicon@123", hash: "$2a$10$CHQKEiBU1ANGUjx7KjaadeeBgMjb1/ise9FvchqH9pkn5ndK8t35i", role: ROLES.DEPARTMENT_HEAD, deptId: 1, desig: "Head - Semicon", mobile: "+91 98450 11006" },
    { name: "Wg Cdr R. Sharma", email: "aero.head@riasat.ac.in", pass: "Aero@123", hash: "$2a$10$MhOzHyrRRlq4EDRvHI9NsOJLMZbdEDmuH0zyzlinH/PHZ0pvVlXWO", role: ROLES.DEPARTMENT_HEAD, deptId: 2, desig: "Head - Aerospace & Defence", mobile: "+91 98450 11007" },
    { name: "Dr. P. Sundaram", email: "space.head@riasat.ac.in", pass: "Space@123", hash: "$2a$10$wITRGTQJ1sDoBMzq4TlPpeJA7MydSkjNuTiUEIacenReq231y6FHe", role: ROLES.DEPARTMENT_HEAD, deptId: 3, desig: "Head - Space", mobile: "+91 98450 11008" },
    { name: "Col. K. Menon", email: "cyber.head@riasat.ac.in", pass: "Cyber@123", hash: "$2a$10$gziJspang8msoJvsX4flv.8LmqgjdbKU.ewZqD5vDIgIkis3uOLmu", role: ROLES.DEPARTMENT_HEAD, deptId: 4, desig: "Head - Cybersecurity", mobile: "+91 98450 11009" },
    { name: "Dr. Neha Varma", email: "medtech.head@riasat.ac.in", pass: "MedTech@123", hash: "$2a$10$7VQc.OY7HGMDVgk7ieD07.xgD/9DSLQL0GJWxExFFKUsW4hKCUa0a", role: ROLES.DEPARTMENT_HEAD, deptId: 5, desig: "Head - MedTech", mobile: "+91 98450 11010" },
    { name: "Prof. Rajesh Iyer", email: "mfg.head@riasat.ac.in", pass: "Mfg@123", hash: "$2a$10$FZhubQGBfsO3WJAo/yxhvOP6rXDEnHTPZX7KW0cVZ1GMqtbfuM/Ze", role: ROLES.DEPARTMENT_HEAD, deptId: 6, desig: "Head - Advanced Manufacturing", mobile: "+91 98450 11011" },
    { name: "Sumanth Rao", email: "hr.head@riasat.ac.in", pass: "Hr@123", hash: "$2a$10$c469R9oPc..WqyZQJI5DFuDLSdujpKMqs2BjF2wltM/Bcj5hCZvjy", role: ROLES.DEPARTMENT_HEAD, deptId: 7, desig: "Head - HR & Recruitment", mobile: "+91 98450 11012" },
    { name: "Ananya Sen", email: "comm.head@riasat.ac.in", pass: "Comm@123", hash: "$2a$10$X4MJ0o5D2NQ4ncCj.cwYsunx69RP7ScESeUBy5spa1ORHOk8ziNEC", role: ROLES.DEPARTMENT_HEAD, deptId: 8, desig: "Head - Communications", mobile: "+91 98450 11013" },
    { name: "Dr. Venkat Raman", email: "ops.head@riasat.ac.in", pass: "Ops@123", hash: "$2a$10$pqMkSux5M2OWpIWV/eKofOTVfNRFx8jVFVIsmrCWdf9N1GQwzFKbC", role: ROLES.DEPARTMENT_HEAD, deptId: 9, desig: "Head - Strategy & Operations", mobile: "+91 98450 11014" },
  ];

  for (const u of defaultUsers) {
    const existing = await client.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [u.email]);
    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO users (name, email, password_hash, mobile, designation, role, department_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active')`,
        [u.name, u.email, u.hash, u.mobile, u.desig, u.role, u.deptId]
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

  // 6. Seed Sample Workstreams for All 9 Verticals
  const sampleWorkstreams = [
    { deptId: 1, itemId: "SEM-WS-01", cat: "Cleanroom Infrastructure & Validation", del: "ISO-6 Cleanroom HVAC Balancing & Airborne Particle Counter Validation", own: "Dr. S. Ramanathan / Semiconductor Fab Lead", time: "2026-11-15", stat: "In Progress", rag: "GREEN", rem: "Air handling units (AHU) commissioned. Airborne particle count validation scheduled with third-party auditor next week.", vc: "No", capex: "₹ 14.5 Cr", rev: "₹ 0.0 Cr" },
    { deptId: 1, itemId: "SEM-WS-02", cat: "Equipment Procurement & Import", del: "ASML DUV Lithography Stepper Customs Duty Exemption Clearance", own: "R. Venkatesh / Equipment Procurement Lead", time: "2026-10-30", stat: "Delayed", rag: "AMBER", rem: "Lithography stepper arrived at Chennai port bonded warehouse. DSIR customs concession certificate pending inter-ministry sign-off.", vc: "Yes", capex: "₹ 28.0 Cr", rev: "₹ 0.0 Cr" },
    { deptId: 2, itemId: "AERO-WS-01", cat: "Testing & Prototyping Infrastructure", del: "Aerospace-Grade Autoclave (3m Dia) Foundation & Calibration Setup", own: "Wg Cdr (Retd) K. Swaminathan / Aerospace Tech Lead", time: "2026-11-20", stat: "In Progress", rag: "GREEN", rem: "Autoclave pressure vessel anchored on foundation pad. Vacuum line piping and nitrogen purge system undergoing pressure testing.", vc: "No", capex: "₹ 9.8 Cr", rev: "₹ 0.0 Cr" },
    { deptId: 2, itemId: "AERO-WS-02", cat: "Institutional Partnership & ToT", del: "DRDO-ADE Transfer of Technology (ToT) MoU for Indigenous UAV Telemetry", own: "Col (Retd) Anand Varma / Defence Liaison Director", time: "2026-11-05", stat: "In Progress", rag: "AMBER", rem: "Bilateral draft agreement reviewed by legal counsel. Clause 7.2 on joint intellectual property indemnification requires VC sign-off.", vc: "Yes", capex: "₹ 3.5 Cr", rev: "₹ 6.2 Cr" },
    { deptId: 3, itemId: "SPC-WS-01", cat: "Payload Testing Infrastructure", del: "Thermal Vacuum Chamber (TVAC) Setup for CubeSat Qualification", own: "Dr. K. Radhakrishnan / Space Systems Director", time: "2026-12-10", stat: "In Progress", rag: "GREEN", rem: "Chamber vacuum reached 10^-6 Torr. Liquid nitrogen thermal shroud undergoing helium leak detection testing.", vc: "No", capex: "₹ 7.2 Cr", rev: "₹ 0.0 Cr" },
    { deptId: 3, itemId: "SPC-WS-02", cat: "Regulatory Clearance & Telemetry", del: "IN-SPACe Ground Station Authorization & S/X-Band Spectrum License", own: "Pooja Deshmukh / Telemetry & Comms Lead", time: "2026-11-12", stat: "Delayed", rag: "AMBER", rem: "Wireless Planning & Coordination (WPC) clearance pending frequency band harmonization with satellite operations.", vc: "Yes", capex: "₹ 1.8 Cr", rev: "₹ 4.5 Cr" },
    { deptId: 4, itemId: "CYB-WS-01", cat: "Cyber Infrastructure & Testbed", del: "Air-Gapped National Cyber Range & SCADA Defense Simulation Testbed", own: "Abhinav Sen / Cyber Defense Architect", time: "2026-11-18", stat: "In Progress", rag: "GREEN", rem: "Hardware server racks energized. Red team vs Blue team adversary simulation orchestration engine operational.", vc: "No", capex: "₹ 5.5 Cr", rev: "₹ 8.0 Cr" },
    { deptId: 4, itemId: "CYB-WS-02", cat: "Compliance & Security Hardware", del: "CERT-In Auditing Lab Accreditation & FIPS 140-3 Hardware HSM Procurement", own: "Rohit Nambiar / Compliance & Security Head", time: "2026-10-28", stat: "In Progress", rag: "AMBER", rem: "Documentation audit cleared. Procurement tender for dual-redundant Thales HSMs requires financial sanction above departmental limit.", vc: "Yes", capex: "₹ 2.4 Cr", rev: "₹ 3.0 Cr" },
    { deptId: 5, itemId: "MED-WS-01", cat: "Biomedical Prototyping Facility", del: "ISO 13485 Class 10,000 Biomedical Device Clean Room Bench Installation", own: "Dr. Manisha Sharma / MedTech Innovation Lead", time: "2026-11-25", stat: "In Progress", rag: "GREEN", rem: "HEPA filtration units and positive pressure differential sensors operational. First surgical guide batch test planned.", vc: "No", capex: "₹ 4.8 Cr", rev: "₹ 0.0 Cr" },
    { deptId: 5, itemId: "MED-WS-02", cat: "Clinical Trial Collaboration", del: "Ramaiah Medical College Clinical Trial Co-Development MoU & Ethics Protocol", own: "Dr. Harish Gowda / Clinical Partnerships Director", time: "2026-11-08", stat: "In Progress", rag: "AMBER", rem: "Institutional Ethics Committee (IEC) protocol submitted for non-invasive cardiac biomarker sensor trials.", vc: "Yes", capex: "₹ 1.5 Cr", rev: "₹ 5.0 Cr" },
    { deptId: 6, itemId: "MFG-WS-01", cat: "Precision Machining Infrastructure", del: "DMG MORI 5-Axis Precision CNC Machining Center Laser Calibration", own: "Rajesh Kulkarni / Precision Tooling Lead", time: "2026-10-15", stat: "Completed", rag: "GREEN", rem: "Machine calibrated to ±3 micron geometric tolerance. Impeller qualification part machined and verified using CMM inspection.", vc: "No", capex: "₹ 8.2 Cr", rev: "₹ 12.0 Cr" },
    { deptId: 6, itemId: "MFG-WS-02", cat: "Robotics Automation & Digital Twin", del: "6-Axis Articulated KUKA Robotic Welding Cell & Telemetry Integration", own: "S. Muthukrishnan / Robotics Automation Head", time: "2026-11-30", stat: "In Progress", rag: "GREEN", rem: "Robotic cell safety interlocks and light curtains installed. PLC integration with SCADA gateway underway.", vc: "No", capex: "₹ 6.4 Cr", rev: "₹ 7.5 Cr" },
  ];

  for (const sw of sampleWorkstreams) {
    const existing = await client.query("SELECT id FROM workstreams WHERE item_id = $1", [sw.itemId]);
    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO workstreams (
          department_id, item_id, category, deliverable, action_point,
          owner, ownership, target_date, timeline, status, rag_status,
          remarks, vc_decision_required, capex, revenue_pipeline, updated_by
        ) VALUES ($1, $2, $3, $4, $4, $5, $5, $6, $6, $7, $8, $9, $10, $11, $12, 'System Administrator')`,
        [sw.deptId, sw.itemId, sw.cat, sw.del, sw.own, sw.time, sw.stat, sw.rag, sw.rem, sw.vc, sw.capex, sw.rev]
      );
    }
  }

  // 7. Seed Recruitment Entries
  const recruitmentSeed = [
    { posId: "POS-SEM-001", title: "Lead Scientist - Cleanroom Microfabrication", seg: "Semicon", pri: "Critical", lead: "Anamika Sahay", dt: "2026-11-15", stat: "Interview in progress", src: 14, shrt: 4, intv: 2, off: 0, jnd: 0, ctc: "₹ 38 LPA", rem: "Top 2 candidates from TSMC & IMEC cleared technical rounds. VC final interview panel scheduled.", vc: "Yes", vca: true },
    { posId: "POS-AERO-002", title: "Principal Systems Architect - Avionics & Defence", seg: "Aerospace & Defence", pri: "High", lead: "Anamika Sahay", dt: "2026-11-30", stat: "Candidate sourced", src: 12, shrt: 4, intv: 1, off: 0, jnd: 0, ctc: "₹ 28 LPA", rem: "Coordinating with HAL external reviewers for panel formation.", vc: "No", vca: false },
    { posId: "POS-SPC-003", title: "Space Payload Systems Architect", seg: "Space", pri: "Critical", lead: "Anamika Sahay", dt: "2026-11-20", stat: "shortlisted", src: 8, shrt: 3, intv: 2, off: 0, jnd: 0, ctc: "₹ 35 LPA", rem: "Ex-ISRO specialist candidate profile under stage-2 review.", vc: "Yes", vca: true },
    { posId: "POS-CYB-004", title: "Offensive Security Specialist & Range Trainer", seg: "Cybersecurity", pri: "High", lead: "Anamika Sahay", dt: "2026-12-05", stat: "Offers released", src: 15, shrt: 6, intv: 2, off: 1, jnd: 0, ctc: "₹ 25 LPA", rem: "Offer released to selected offensive security specialist.", vc: "No", vca: false },
    { posId: "POS-MED-005", title: "Bio-Medical Instrument Design Lead", seg: "MedTech", pri: "Medium", lead: "Anamika Sahay", dt: "2026-12-15", stat: "Open", src: 6, shrt: 2, intv: 0, off: 0, jnd: 0, ctc: "₹ 22 LPA", rem: "Sourcing active on Naukri and LinkedIn talent network.", vc: "No", vca: false },
    { posId: "POS-MFG-006", title: "Robotics Automation & Digital Twin Engineer", seg: "Advanced Manufacturing", pri: "High", lead: "Anamika Sahay", dt: "2026-11-28", stat: "Interview in progress", src: 10, shrt: 4, intv: 2, off: 0, jnd: 0, ctc: "₹ 26 LPA", rem: "Technical assessment on PLC & KUKA programming completed.", vc: "No", vca: false },
  ];

  for (const r of recruitmentSeed) {
    const existing = await client.query("SELECT id FROM recruitment WHERE position_id = $1", [r.posId]);
    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO recruitment (
          position_id, position_title, strategic_segment, priority, hiring_lead,
          target_date, status, candidates_sourced, candidates_shortlisted,
          interviews, offers, candidates_joined, target_ctc, remarks,
          vc_decision_required, vc_attention, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'System Administrator')`,
        [r.posId, r.title, r.seg, r.pri, r.lead, r.dt, r.stat, r.src, r.shrt, r.intv, r.off, r.jnd, r.ctc, r.rem, r.vc, r.vca]
      );
    }
  }

  // 8. Seed Form Sections & Fields for all 9 departments
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

  for (let dId = 1; dId <= 9; dId++) {
    const isHR = dId === 7;
    const secKey = isHR ? "recruitment_tracker" : "action_tracker";
    const secTitle = isHR ? "Recruitment Tracker Web Form" : "Action Tracker Web Form";

    let secId: number;
    const sRes = await client.query("SELECT id FROM form_sections WHERE department_id = $1 AND section_key = $2", [dId, secKey]);
    if (sRes.rows.length === 0) {
      const ins = await client.query("INSERT INTO form_sections (department_id, section_key, title, display_order) VALUES ($1, $2, $3, 1) RETURNING id", [dId, secKey, secTitle]);
      secId = ins.rows[0].id;
    } else {
      secId = sRes.rows[0].id;
    }

    const fields = isHR ? recruitmentFields : actionFields;
    for (const f of fields) {
      const fRes = await client.query("SELECT id FROM form_fields WHERE department_id = $1 AND field_key = $2", [dId, f.key]);
      if (fRes.rows.length === 0) {
        await client.query(
          `INSERT INTO form_fields (department_id, section_id, field_key, label, field_type, required, active, display_order, help_text)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8)`,
          [dId, secId, f.key, f.label, f.type, f.required, f.order, f.help]
        );
      }
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
    // Non-blocking log write failure
  }
}
