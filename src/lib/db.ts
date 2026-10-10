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

  // Workstreams and Recruitment tables are kept empty, completely ready for authentic user entries.

  // Initial audit log
  const existingAudit = await client.query("SELECT COUNT(*) as count FROM audit_log");
  if (parseInt(existingAudit.rows[0].count, 10) === 0) {
    await client.query(
      `INSERT INTO audit_log (user_id, user_name, action, department_id, department_name, record_id, details)
       VALUES 
       (1, 'System Administrator', 'SYSTEM_INIT', NULL, 'System', NULL, 'Database schema initialized with clean blank dashboard and forms for RIASAT Executive Control Tower.')`
    );
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
