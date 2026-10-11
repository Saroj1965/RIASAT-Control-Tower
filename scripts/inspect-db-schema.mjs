// scripts/inspect-db-schema.mjs
import { PGlite } from "@electric-sql/pglite";
import path from "path";

async function run() {
  const dataDir = path.resolve(process.cwd(), ".data/riasat_db");
  const pg = new PGlite(dataDir);
  await pg.waitReady;

  const ws = await pg.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workstreams' ORDER BY ordinal_position"
  );
  console.log("=== WORKSTREAMS TABLE COLUMNS ===");
  console.table(ws.rows);

  const rec = await pg.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'recruitment' ORDER BY ordinal_position"
  );
  console.log("=== RECRUITMENT TABLE COLUMNS ===");
  console.table(rec.rows);

  const depts = await pg.query("SELECT id, name, code FROM departments ORDER BY id");
  console.log("=== DEPARTMENTS ===");
  console.table(depts.rows);

  await pg.close();
}

run().catch(console.error);
