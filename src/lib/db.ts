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

  const { PGlite } = await import("@electric-sql/pglite");
  const pgLite = new PGlite(dataDir);
  dbInstance = {
    type: "pglite",
    query: async (text: string, params?: any[]): Promise<DbResult> => {
      const res = await pgLite.query(text, params);
      return { rows: res.rows as any[], rowCount: res.rows.length };
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
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT
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

  await client.query(`
    ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS item_id TEXT;
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
