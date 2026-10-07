import { PGlite } from "@electric-sql/pglite";
import path from "path";

async function main() {
  const dataDir = path.resolve(process.cwd(), ".data/riasat_pg");
  const pg = new PGlite(dataDir);
  await pg.waitReady;

  const res = await pg.query("DELETE FROM form_fields WHERE field_key LIKE 'automated_partner_metric%'");
  console.log("Deleted test fields, affected rows:", res.affectedRows || res.rowCount);

  // Check remaining fields for Semicon
  const semiconFields = await pg.query("SELECT id, field_key, label, field_type, active, display_order FROM form_fields WHERE department_id = 1 ORDER BY display_order");
  console.table(semiconFields.rows);

  await pg.close();
}

main().catch(console.error);
