import { PGlite } from "@electric-sql/pglite";
import path from "path";

async function run() {
  const dataDir = path.join(process.cwd(), ".data", "riasat_db");
  const pg = new PGlite(dataDir);
  await pg.waitReady;

  console.log("Cleaning up extra departments...");
  await pg.query("DELETE FROM workstreams WHERE department_id > 9");
  await pg.query("DELETE FROM department_form_values WHERE department_id > 9");
  await pg.query("DELETE FROM form_fields WHERE department_id > 9");
  await pg.query("DELETE FROM form_sections WHERE department_id > 9");
  await pg.query("DELETE FROM users WHERE department_id > 9");
  await pg.query("DELETE FROM department_overview WHERE department_id > 9");
  await pg.query("DELETE FROM departments WHERE id > 9");

  const d9 = await pg.query("SELECT * FROM departments WHERE id = 9");
  if (d9.rows.length === 0) {
    await pg.query(
      "INSERT INTO departments (id, name, code, active) VALUES (9, 'Strategy & Operations', 'STRATEGY_OPS', true)"
    );
  } else {
    await pg.query(
      "UPDATE departments SET name = 'Strategy & Operations', code = 'STRATEGY_OPS', active = true WHERE id = 9"
    );
  }

  const ov9 = await pg.query("SELECT * FROM department_overview WHERE department_id = 9");
  if (ov9.rows.length === 0) {
    await pg.query(
      "INSERT INTO department_overview (department_id, readiness_percentage, rag_status, key_focus, submission_status) VALUES (9, 0, 'NOT STARTED', '', 'DRAFT')"
    );
  } else {
    await pg.query(
      "UPDATE department_overview SET readiness_percentage = 0, rag_status = 'NOT STARTED', submission_status = 'DRAFT' WHERE department_id = 9"
    );
  }

  const depts = await pg.query("SELECT id, name, code, active FROM departments ORDER BY id ASC");
  console.log("Current Departments in DB:", depts.rows);
  console.log("Total Count:", depts.rows.length);

  await pg.close();
}

run().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
