import { PGlite } from "@electric-sql/pglite";
import path from "path";

async function main() {
  const dataDir = path.resolve(process.cwd(), ".data/riasat_pg");
  const pg = new PGlite(dataDir);
  await pg.waitReady;

  // Insert workstream for Aero
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
    2,
    "Infrastructure",
    "Avionics Hardware-in-the-Loop (HIL) Flight Simulator Lab",
    "HAL Avionics Division / National Instruments",
    "2026-11-20",
    "On Track",
    "₹ 8.5 Cr",
    "₹ 18.0 Cr",
    "Aerospace & Defence Head",
    "Component customs clearance pending at Bengaluru airport",
    "Duty exemption certificate submitted for VC signature",
    "Aerospace & Defence Head"
  ];

  const res = await pg.query(insertQuery, values);
  console.log("Successfully inserted Aerospace & Defence workstream:", res.rows[0]);

  // Update department overview for department 2
  await pg.query(`
    UPDATE department_overview
    SET rag_status = 'GREEN',
        last_updated = CURRENT_TIMESTAMP,
        updated_by = 'Aerospace & Defence Head'
    WHERE department_id = 2;
  `);

  console.log("Aerospace & Defence overview updated.");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
