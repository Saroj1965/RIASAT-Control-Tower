import { PGlite } from "@electric-sql/pglite";
import bcrypt from "bcryptjs";
import path from "path";

async function resetToCleanBlankState() {
  const dataDir = path.resolve(process.cwd(), ".data/riasat_pg");
  console.log(`Connecting to database at: ${dataDir}`);
  const pg = new PGlite(dataDir);
  await pg.waitReady;

  console.log("\n1. Resetting Department Overview to completely blank state...");
  await pg.query(`
    UPDATE department_overview
    SET readiness_percentage = 0,
        rag_status = 'NOT STARTED',
        key_focus = '',
        submission_status = 'DRAFT',
        last_updated = NULL,
        updated_by = NULL;
  `);

  console.log("\n2. Clearing Department Form Values (ensuring all forms are blank)...");
  await pg.query("DELETE FROM department_form_values;");

  console.log("\n3. Clearing Workstreams (removing all demo workstreams)...");
  await pg.query("DELETE FROM workstreams;");

  console.log("\n4. Clearing Recruitment Pipeline (removing all demo talent requisitions)...");
  await pg.query("DELETE FROM recruitment;");

  console.log("\n5. Updating User Accounts with clean official titles (no superfluous names/phones)...");
  const officialUsers = [
    { email: "admin@riasat.ac.in", pass: "Admin@123", name: "System Administrator", role: "System Administrator", desig: "System Administrator", deptId: null },
    { email: "vicechairman@riasat.ac.in", pass: "ViceChairman@123", name: "Vice Chairman", role: "Vice Chairman", desig: "Vice Chairman & Executive Director", deptId: null },
    { email: "executive@riasat.ac.in", pass: "Exec@123", name: "Executive Office", role: "Executive", desig: "Executive Office", deptId: null },
    { email: "semicon.head@riasat.ac.in", pass: "Semicon@123", name: "Semicon Head", role: "Department Head", desig: "Head - Semicon", deptId: 1 },
    { email: "aero.head@riasat.ac.in", pass: "Aero@123", name: "Aerospace & Defence Head", role: "Department Head", desig: "Head - Aerospace & Defence", deptId: 2 },
    { email: "space.head@riasat.ac.in", pass: "Space@123", name: "Space Head", role: "Department Head", desig: "Head - Space", deptId: 3 },
    { email: "cyber.head@riasat.ac.in", pass: "Cyber@123", name: "Cybersecurity Head", role: "Department Head", desig: "Head - Cybersecurity", deptId: 4 },
    { email: "medtech.head@riasat.ac.in", pass: "MedTech@123", name: "MedTech Head", role: "Department Head", desig: "Head - MedTech", deptId: 5 },
    { email: "mfg.head@riasat.ac.in", pass: "Mfg@123", name: "Advanced Manufacturing Head", role: "Department Head", desig: "Head - Advanced Manufacturing", deptId: 6 },
    { email: "hr.head@riasat.ac.in", pass: "Hr@123", name: "HR & Recruitment Head", role: "Department Head", desig: "Head - HR & Recruitment", deptId: 7 },
    { email: "comm.head@riasat.ac.in", pass: "Comm@123", name: "Communications Head", role: "Department Head", desig: "Head - Communications", deptId: 8 },
  ];

  for (const u of officialUsers) {
    const hash = await bcrypt.hash(u.pass, 10);
    const existing = await pg.query("SELECT id FROM users WHERE email = $1", [u.email]);
    if (existing.rows.length === 0) {
      await pg.query(
        `INSERT INTO users (name, email, password_hash, mobile, designation, role, department_id, status)
         VALUES ($1, $2, $3, '', $4, $5, $6, 'Active')`,
        [u.name, u.email, hash, u.desig, u.role, u.deptId]
      );
    } else {
      await pg.query(
        `UPDATE users
         SET name = $1, password_hash = $2, mobile = '', designation = $3, role = $4, department_id = $5, status = 'Active'
         WHERE email = $6`,
        [u.name, hash, u.desig, u.role, u.deptId, u.email]
      );
    }
    console.log(`✓ Clean user verified: ${u.name} <${u.email}>`);
  }

  console.log("\n6. Resetting Audit Log to clean system initialization...");
  await pg.query("DELETE FROM audit_log;");
  await pg.query(`
    INSERT INTO audit_log (user_id, user_name, action, department_id, department_name, record_id, details)
    VALUES (
      1, 
      'System Administrator', 
      'SYSTEM_INIT', 
      NULL, 
      'System', 
      NULL, 
      'Database reset to clean blank state. Executive Dashboard, department forms, workstreams, and recruitment pipelines ready for authentic operational data entry.'
    );
  `);

  // Verification counts
  const ovCount = await pg.query("SELECT COUNT(*) as cnt, AVG(readiness_percentage) as avg_readiness FROM department_overview");
  const wsCount = await pg.query("SELECT COUNT(*) as cnt FROM workstreams");
  const recCount = await pg.query("SELECT COUNT(*) as cnt FROM recruitment");
  const valCount = await pg.query("SELECT COUNT(*) as cnt FROM department_form_values");
  const userCount = await pg.query("SELECT COUNT(*) as cnt FROM users");
  const auditCount = await pg.query("SELECT COUNT(*) as cnt FROM audit_log");

  console.log("\n========================================================");
  console.log("CLEAN BLANK STATE VERIFICATION REPORT");
  console.log("========================================================");
  console.log(`Department Overviews: ${ovCount.rows[0].cnt} (Avg Readiness: ${ovCount.rows[0].avg_readiness}%)`);
  console.log(`Department Form Values: ${valCount.rows[0].cnt} (Completely Blank)`);
  console.log(`Workstreams: ${wsCount.rows[0].cnt} (Completely Blank)`);
  console.log(`Recruitment Positions: ${recCount.rows[0].cnt} (Completely Blank)`);
  console.log(`Users with Official Institutional Roles: ${userCount.rows[0].cnt}`);
  console.log(`Audit Trail Log Entries: ${auditCount.rows[0].cnt}`);
  console.log("========================================================\n");

  await pg.close();
}

resetToCleanBlankState().catch(console.error);
