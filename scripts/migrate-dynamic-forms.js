import { PGlite } from "@electric-sql/pglite";
import path from "path";
import bcrypt from "bcryptjs";

async function runMigration() {
  const dataDir = path.resolve(process.cwd(), ".data/riasat_pg");
  console.log(`Running migration on database at: ${dataDir}`);
  const pg = new PGlite(dataDir);
  await pg.waitReady;

  console.log("\n0. Ensuring base tables exist...");
  await pg.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

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

    CREATE TABLE IF NOT EXISTS department_overview (
      id SERIAL PRIMARY KEY,
      department_id INTEGER UNIQUE NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      readiness_percentage INTEGER NOT NULL DEFAULT 0,
      rag_status TEXT NOT NULL DEFAULT 'NOT STARTED',
      key_focus TEXT,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT,
      submission_status TEXT DEFAULT 'SUBMITTED'
    );

    CREATE TABLE IF NOT EXISTS workstreams (
      id SERIAL PRIMARY KEY,
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
  const depts = [
    { id: 1, name: "Semicon", code: "SEMICON" },
    { id: 2, name: "Aerospace & Defence", code: "AERO" },
    { id: 3, name: "Space", code: "SPACE" },
    { id: 4, name: "Cybersecurity", code: "CYBER" },
    { id: 5, name: "MedTech", code: "MEDTECH" },
    { id: 6, name: "Advanced Manufacturing", code: "MFG" },
    { id: 7, name: "HR & Recruitment", code: "HR" },
    { id: 8, name: "Communications", code: "COMM" },
  ];

  for (const dept of depts) {
    const existing = await pg.query("SELECT id FROM departments WHERE id = $1 OR code = $2", [dept.id, dept.code]);
    if (existing.rows.length === 0) {
      await pg.query(
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
    const existing = await pg.query("SELECT id FROM department_overview WHERE department_id = $1", [ov.deptId]);
    if (existing.rows.length === 0) {
      await pg.query(
        `INSERT INTO department_overview (department_id, readiness_percentage, rag_status, key_focus, last_updated, updated_by, submission_status)
         VALUES ($1, $2, $3, $4, NULL, NULL, 'DRAFT')`,
        [ov.deptId, ov.readiness, ov.rag, ov.focus]
      );
    }
  }

  // Seed default official user accounts
  const defaultUsers = [
    { name: "Vice Chairman", email: "vicechairman@riasat.ac.in", pass: "ViceChairman@123", role: "Vice Chairman", deptId: null, desig: "Vice Chairman & Executive Director", mobile: "" },
    { name: "System Administrator", email: "admin@riasat.ac.in", pass: "Admin@123", role: "System Administrator", deptId: null, desig: "System Administrator", mobile: "" },
    { name: "Executive Office", email: "executive@riasat.ac.in", pass: "Exec@123", role: "Executive", deptId: null, desig: "Executive Office", mobile: "" },
    { name: "Semicon Head", email: "semicon.head@riasat.ac.in", pass: "Semicon@123", role: "Department Head", deptId: 1, desig: "Head - Semicon", mobile: "" },
    { name: "Aerospace & Defence Head", email: "aero.head@riasat.ac.in", pass: "Aero@123", role: "Department Head", deptId: 2, desig: "Head - Aerospace & Defence", mobile: "" },
    { name: "Space Head", email: "space.head@riasat.ac.in", pass: "Space@123", role: "Department Head", deptId: 3, desig: "Head - Space", mobile: "" },
    { name: "Cybersecurity Head", email: "cyber.head@riasat.ac.in", pass: "Cyber@123", role: "Department Head", deptId: 4, desig: "Head - Cybersecurity", mobile: "" },
    { name: "MedTech Head", email: "medtech.head@riasat.ac.in", pass: "MedTech@123", role: "Department Head", deptId: 5, desig: "Head - MedTech", mobile: "" },
    { name: "Advanced Manufacturing Head", email: "mfg.head@riasat.ac.in", pass: "Mfg@123", role: "Department Head", deptId: 6, desig: "Head - Advanced Manufacturing", mobile: "" },
    { name: "HR & Recruitment Head", email: "hr.head@riasat.ac.in", pass: "Hr@123", role: "Department Head", deptId: 7, desig: "Head - HR & Recruitment", mobile: "" },
    { name: "Communications Head", email: "comm.head@riasat.ac.in", pass: "Comm@123", role: "Department Head", deptId: 8, desig: "Head - Communications", mobile: "" },
  ];

  for (const u of defaultUsers) {
    const existing = await pg.query("SELECT id FROM users WHERE email = $1", [u.email]);
    const hash = await bcrypt.hash(u.pass, 10);
    if (existing.rows.length === 0) {
      await pg.query(
        `INSERT INTO users (name, email, password_hash, mobile, designation, role, department_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active')`,
        [u.name, u.email, hash, u.mobile, u.desig, u.role, u.deptId]
      );
    } else {
      await pg.query("UPDATE users SET password_hash = $1 WHERE email = $2", [hash, u.email]);
    }
  }

  // Workstreams and Recruitment tables are kept empty, completely ready for authentic user entries.

  console.log("\n1. Ensuring new dynamic form tables exist...");

  // 1. form_sections
  await pg.query(`
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

  // 2. form_fields
  await pg.query(`
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

  // 3. form_field_options
  await pg.query(`
    CREATE TABLE IF NOT EXISTS form_field_options (
      id SERIAL PRIMARY KEY,
      field_id INTEGER NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 1,
      active BOOLEAN NOT NULL DEFAULT TRUE
    );
  `);

  // 4. department_form_values
  await pg.query(`
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

  // 5. Add submission_status to department_overview if not exists
  await pg.query(`
    ALTER TABLE department_overview 
    ADD COLUMN IF NOT EXISTS submission_status TEXT DEFAULT 'SUBMITTED';
  `);

  console.log("✓ Core dynamic tables verified.");

  // Department definitions and their initial Excel overview fields
  const deptFieldSpecs = [
    {
      deptId: 1,
      name: "Semicon",
      sectionTitle: "Sector Overview & Vice Chairman Focus / Decision Required",
      fields: [
        { key: "readiness_score", label: "Readiness Score", type: "Percentage", req: true, order: 1, help: "0-100 percentage" },
        { key: "rag_status", label: "RAG Status", type: "RAG Status", req: true, order: 2, help: "Current operational RAG status" },
        { key: "cleanroom_facility", label: "Cleanroom Facility", type: "Short Text", req: false, order: 3, help: "ISO-5 / ISO-6 cleanroom readiness" },
        { key: "cadence_eda_tooling", label: "Cadence EDA Tooling", type: "Short Text", req: false, order: 4, help: "EDA Tooling & Server licensing status" },
        { key: "academic_partners", label: "Academic Partners", type: "Short Text", req: false, order: 5, help: "IIT / IISc / International academic ties" },
        { key: "corporate_cohorts", label: "Corporate Cohorts", type: "Short Text", req: false, order: 6, help: "Corporate skilling batches & MoUs" },
        { key: "vc_focus_decision", label: "Vice Chairman Focus / Decision", type: "Long Text", req: false, order: 7, help: "Direct decisions required from Vice Chairman" },
      ]
    },
    {
      deptId: 2,
      name: "Aerospace & Defence",
      sectionTitle: "Sector Overview & Vice Chairman Focus / Decision Required",
      fields: [
        { key: "readiness_score", label: "Readiness Score", type: "Percentage", req: true, order: 1, help: "0-100 percentage" },
        { key: "rag_status", label: "RAG Status", type: "RAG Status", req: true, order: 2, help: "Current operational RAG status" },
        { key: "defense_radar_lab", label: "Defense Radar Lab", type: "Short Text", req: false, order: 3, help: "AESA radar & RF test facility" },
        { key: "avionics_hil_benches", label: "Avionics HIL Benches", type: "Short Text", req: false, order: 4, help: "Hardware-in-the-loop test benches" },
        { key: "anchor_alliances", label: "Anchor Alliances", type: "Short Text", req: false, order: 5, help: "HAL, DRDO, BEL strategic agreements" },
        { key: "domain_lead", label: "Domain Lead", type: "Short Text", req: false, order: 6, help: "Senior aerospace mentor & chairs" },
        { key: "vc_focus_decision", label: "Vice Chairman Focus / Decision", type: "Long Text", req: false, order: 7, help: "Direct decisions required from Vice Chairman" },
      ]
    },
    {
      deptId: 3,
      name: "Space",
      sectionTitle: "Sector Overview & Vice Chairman Focus / Decision Required",
      fields: [
        { key: "readiness_score", label: "Readiness Score", type: "Percentage", req: true, order: 1, help: "0-100 percentage" },
        { key: "rag_status", label: "RAG Status", type: "RAG Status", req: true, order: 2, help: "Current operational RAG status" },
        { key: "satellite_clean_bench", label: "Satellite Clean Bench", type: "Short Text", req: false, order: 3, help: "Clean bench for CubeSat payload assembly" },
        { key: "anchor_space_alliance", label: "Anchor Space Alliance", type: "Short Text", req: false, order: 4, help: "IN-SPACe / ISRO consortium partnership" },
        { key: "space_agency_advisory", label: "Space Agency Advisory", type: "Short Text", req: false, order: 5, help: "Expert advisory council members" },
        { key: "cubesat_flight_window", label: "CubeSat Flight Window", type: "Short Text", req: false, order: 6, help: "Target launch window & manifest" },
        { key: "vc_focus_decision", label: "Vice Chairman Focus / Decision", type: "Long Text", req: false, order: 7, help: "Direct decisions required from Vice Chairman" },
      ]
    },
    {
      deptId: 4,
      name: "Cybersecurity",
      sectionTitle: "Sector Overview & Vice Chairman Focus / Decision Required",
      fields: [
        { key: "readiness_score", label: "Readiness Score", type: "Percentage", req: true, order: 1, help: "0-100 percentage" },
        { key: "rag_status", label: "RAG Status", type: "RAG Status", req: true, order: 2, help: "Current operational RAG status" },
        { key: "defense_cyber_range", label: "Defense Cyber Range", type: "Short Text", req: false, order: 3, help: "Cyber simulation range infrastructure" },
        { key: "soc_infrastructure", label: "SOC Infrastructure", type: "Short Text", req: false, order: 4, help: "24/7 Security Operations Center tier" },
        { key: "academic_tier", label: "Academic Tier", type: "Short Text", req: false, order: 5, help: "Specialized postgraduate cyber curriculum" },
        { key: "monetization_model", label: "Monetization Model", type: "Short Text", req: false, order: 6, help: "Corporate threat training & pentest labs" },
        { key: "vc_focus_decision", label: "Vice Chairman Focus / Decision", type: "Long Text", req: false, order: 7, help: "Direct decisions required from Vice Chairman" },
      ]
    },
    {
      deptId: 5,
      name: "MedTech",
      sectionTitle: "Sector Overview & Vice Chairman Focus / Decision Required",
      fields: [
        { key: "readiness_score", label: "Readiness Score", type: "Percentage", req: true, order: 1, help: "0-100 percentage" },
        { key: "rag_status", label: "RAG Status", type: "RAG Status", req: true, order: 2, help: "Current operational RAG status" },
        { key: "clinical_testbed", label: "Clinical Testbed", type: "Short Text", req: false, order: 3, help: "Ramaiah Medical Hospital clinical testbeds" },
        { key: "lab_equipment", label: "Lab Equipment", type: "Short Text", req: false, order: 4, help: "Bio-telemetry and diagnostic simulators" },
        { key: "quality_standards", label: "Quality Standards", type: "Short Text", req: false, order: 5, help: "ISO 13485 & CDSCO regulatory compliance" },
        { key: "corporate_cohort", label: "Corporate Cohort", type: "Short Text", req: false, order: 6, help: "Medical device OEMs & hospital partners" },
        { key: "vc_focus_decision", label: "Vice Chairman Focus / Decision", type: "Long Text", req: false, order: 7, help: "Direct decisions required from Vice Chairman" },
      ]
    },
    {
      deptId: 6,
      name: "Advanced Manufacturing",
      sectionTitle: "Sector Overview & Vice Chairman Focus / Decision Required",
      fields: [
        { key: "readiness_score", label: "Readiness Score", type: "Percentage", req: true, order: 1, help: "0-100 percentage" },
        { key: "rag_status", label: "RAG Status", type: "RAG Status", req: true, order: 2, help: "Current operational RAG status" },
        { key: "3dexperience_coe", label: "3DEXPERIENCE CoE", type: "Short Text", req: false, order: 3, help: "Dassault 3DEXPERIENCE center of excellence" },
        { key: "cad_workstations", label: "CAD Workstations", type: "Short Text", req: false, order: 4, help: "High performance GPU rendering stations" },
        { key: "manufacturing_facility", label: "Manufacturing Facility", type: "Short Text", req: false, order: 5, help: "Metal 3D printing & 5-axis CNC machines" },
        { key: "live_capstones", label: "Live Capstones", type: "Short Text", req: false, order: 6, help: "Industry product design project pipelines" },
        { key: "vc_focus_decision", label: "Vice Chairman Focus / Decision", type: "Long Text", req: false, order: 7, help: "Direct decisions required from Vice Chairman" },
      ]
    },
    {
      deptId: 7,
      name: "HR & Recruitment",
      sectionTitle: "Recruitment & Talent Engine Overview",
      fields: [
        { key: "readiness_score", label: "Readiness Score", type: "Percentage", req: true, order: 1, help: "0-100 percentage" },
        { key: "rag_status", label: "RAG Status", type: "RAG Status", req: true, order: 2, help: "Current talent operational RAG status" },
        { key: "total_requisitions", label: "Total Requisitions", type: "Number", req: false, order: 3, help: "Total sanctioned positions" },
        { key: "pipeline_status", label: "Pipeline Status", type: "Short Text", req: false, order: 4, help: "Current sourcing velocity" },
        { key: "active_interviews", label: "Active Interviews", type: "Number", req: false, order: 5, help: "Candidates currently in interview loops" },
        { key: "critical_open_roles", label: "Critical Open Roles", type: "Number", req: false, order: 6, help: "Domain chairs & director level openings" },
        { key: "vc_focus_decision", label: "Vice Chairman Focus / Decision", type: "Long Text", req: false, order: 7, help: "Direct decisions required from Vice Chairman" },
      ]
    },
    {
      deptId: 8,
      name: "Communications",
      sectionTitle: "Sector Overview & Vice Chairman Focus / Decision Required",
      fields: [
        { key: "readiness_score", label: "Readiness Score", type: "Percentage", req: true, order: 1, help: "0-100 percentage" },
        { key: "rag_status", label: "RAG Status", type: "RAG Status", req: true, order: 2, help: "Current operational RAG status" },
        { key: "pr_media_agency", label: "PR & Media Agency", type: "Short Text", req: false, order: 3, help: "Retained national PR / media firm" },
        { key: "digital_web_portal", label: "Digital Web & Portal", type: "Short Text", req: false, order: 4, help: "RIASAT official web portal & SEO" },
        { key: "flagship_tech_conclave", label: "Flagship Tech Conclave", type: "Short Text", req: false, order: 5, help: "Annual RIASAT Industry Technology Summit" },
        { key: "statutory_psu_outreach", label: "Statutory & PSU Outreach", type: "Short Text", req: false, order: 6, help: "Government, PSU and defence ministry outreach" },
        { key: "vc_focus_decision", label: "Vice Chairman Focus / Decision", type: "Long Text", req: false, order: 7, help: "Direct decisions required from Vice Chairman" },
      ]
    },
  ];

  console.log("\n2. Seeding configurable sections and fields for all 8 departments...");

  for (const spec of deptFieldSpecs) {
    // 1. Create or get section
    let sectionId;
    const secRes = await pg.query(
      "SELECT id FROM form_sections WHERE department_id = $1 AND section_key = 'sector_overview'",
      [spec.deptId]
    );

    if (secRes.rows.length === 0) {
      const insSec = await pg.query(
        `INSERT INTO form_sections (department_id, section_key, title, display_order, active)
         VALUES ($1, 'sector_overview', $2, 1, TRUE) RETURNING id`,
        [spec.deptId, spec.sectionTitle]
      );
      sectionId = insSec.rows[0].id;
    } else {
      sectionId = secRes.rows[0].id;
    }

    // Also ensure workstream / recruitment section exists
    const wsKey = spec.deptId === 7 ? "recruitment_tracker" : "workstream_tracker";
    const wsTitle = spec.deptId === 7 ? "Recruitment Tracker" : "Workstream Deliverables, Assets, Partnerships & KPI Tracker";
    const wsSecRes = await pg.query(
      "SELECT id FROM form_sections WHERE department_id = $1 AND section_key = $2",
      [spec.deptId, wsKey]
    );
    if (wsSecRes.rows.length === 0) {
      await pg.query(
        `INSERT INTO form_sections (department_id, section_key, title, display_order, active)
         VALUES ($1, $2, $3, 2, TRUE)`,
        [spec.deptId, wsKey, wsTitle]
      );
    }

    // 2. Fetch existing overview row to migrate initial values
    const ovRes = await pg.query(
      "SELECT * FROM department_overview WHERE department_id = $1",
      [spec.deptId]
    );
    const ov = ovRes.rows[0] || {};

    // 3. Seed fields
    for (const f of spec.fields) {
      let fieldId;
      const fRes = await pg.query(
        "SELECT id FROM form_fields WHERE department_id = $1 AND field_key = $2",
        [spec.deptId, f.key]
      );

      if (fRes.rows.length === 0) {
        const insField = await pg.query(
          `INSERT INTO form_fields (department_id, section_id, field_key, label, field_type, required, active, display_order, help_text)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8) RETURNING id`,
          [spec.deptId, sectionId, f.key, f.label, f.type, f.req, f.order, f.help]
        );
        fieldId = insField.rows[0].id;
      } else {
        fieldId = fRes.rows[0].id;
      }

      // Forms remain completely blank for authentic departmental entry
    }
    console.log(`✓ Seeded ${spec.name} (${spec.fields.length} configurable fields).`);
  }

  // 3. Verification
  const totalSecs = await pg.query("SELECT COUNT(*) as cnt FROM form_sections");
  const totalFields = await pg.query("SELECT COUNT(*) as cnt FROM form_fields");
  const totalVals = await pg.query("SELECT COUNT(*) as cnt FROM department_form_values");
  const totalDepts = await pg.query("SELECT COUNT(*) as cnt FROM departments");
  const totalUsers = await pg.query("SELECT COUNT(*) as cnt FROM users");
  const totalWs = await pg.query("SELECT COUNT(*) as cnt FROM workstreams");

  console.log("\n=================================================");
  console.log("MIGRATION COMPLETED SUCCESSFULLY!");
  console.log("=================================================");
  console.log(`Total Departments Preserved: ${totalDepts.rows[0].cnt}`);
  console.log(`Total Users Preserved: ${totalUsers.rows[0].cnt}`);
  console.log(`Total Workstreams Preserved: ${totalWs.rows[0].cnt}`);
  console.log(`Configurable Sections Created: ${totalSecs.rows[0].cnt}`);
  console.log(`Configurable Fields Created: ${totalFields.rows[0].cnt}`);
  console.log(`Dynamic Form Values Seeded: ${totalVals.rows[0].cnt}`);

  await pg.close();
}

runMigration().catch(console.error);
