// scripts/inspect-trackers.mjs
import { query } from "./src/lib/db.js";

async function inspect() {
  console.log("=== INSPECTING DATABASE SCHEMA & CURRENT STATE ===");

  // 1. Departments
  const depts = await query("SELECT id, name, code FROM departments ORDER BY id");
  console.log("\n1. Departments in database:");
  console.table(depts.rows);

  // 2. Workstreams Columns
  const wsCols = await query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'workstreams' 
    ORDER BY ordinal_position
  `);
  console.log("\n2. Workstreams Table Columns:");
  console.table(wsCols.rows);

  // 3. Current Workstreams data count & sample
  const wsCount = await query("SELECT COUNT(*) as count FROM workstreams");
  console.log(`\n3. Total rows in workstreams: ${wsCount.rows[0].count}`);
  const wsSample = await query("SELECT * FROM workstreams LIMIT 3");
  console.log("Sample workstreams rows:");
  console.log(wsSample.rows);

  // 4. Recruitment Columns
  const recCols = await query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'recruitment' 
    ORDER BY ordinal_position
  `);
  console.log("\n4. Recruitment Table Columns:");
  console.table(recCols.rows);

  // 5. Current Recruitment data count & sample
  const recCount = await query("SELECT COUNT(*) as count FROM recruitment");
  console.log(`\n5. Total rows in recruitment: ${recCount.rows[0].count}`);
  const recSample = await query("SELECT * FROM recruitment LIMIT 3");
  console.log("Sample recruitment rows:");
  console.log(recSample.rows);
}

inspect().catch(console.error);
