import { PGlite } from "@electric-sql/pglite";
import path from "path";

async function main() {
  const dataDir = path.resolve(process.cwd(), ".data/riasat_pg");
  console.log(`Connecting to database at: ${dataDir}`);
  const pg = new PGlite(dataDir);
  await pg.waitReady;

  // 1. Add item_id column if not exists
  console.log("Adding item_id column to workstreams table...");
  await pg.query("ALTER TABLE workstreams ADD COLUMN IF NOT EXISTS item_id TEXT;");

  // 2. Clear any old workstreams for dept 1 to ensure clean state
  await pg.query("DELETE FROM workstreams WHERE department_id = 1;");

  // 3. Insert the user's workstream record
  console.log("Inserting user workstream record for Semicon...");
  const insertQuery = `
    INSERT INTO workstreams (
      item_id,
      department_id,
      category,
      deliverable,
      infrastructure_partnership,
      target_date,
      status,
      capex,
      revenue_pipeline,
      owner,
      risks_blockers,
      decision_action,
      updated_by
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    ) RETURNING *;
  `;

  const values = [
    "WS-01",
    1, // Semicon department_id
    "Infrastructure",
    "Cleanroom ISO-5/6 HVAC Commissioning & Certification",
    "Cadence / Applied Materials clean air filtration",
    "2026-11-15",
    "Delayed",
    "₹ 14.5 Cr",
    "₹ 28.0 Cr",
    "Semicon Head",
    "HEPA filtration vendor delivery delayed by 2 weeks",
    "VC approval requested for expedited air shipping waiver",
    "Semicon Head"
  ];

  const res = await pg.query(insertQuery, values);
  console.log("Successfully inserted workstream:", res.rows[0]);

  // Update department overview for Semicon
  await pg.query(`
    UPDATE department_overview
    SET rag_status = 'AMBER',
        last_updated = CURRENT_TIMESTAMP,
        updated_by = 'Semicon Head'
    WHERE department_id = 1;
  `);

  console.log("Updated department overview for Semicon to AMBER (due to Delayed milestone).");
  process.exit(0);
}

main().catch(err => {
  console.error("Error executing script:", err);
  process.exit(1);
});
