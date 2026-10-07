import { PGlite } from "@electric-sql/pglite";
import path from "path";

async function inspect() {
  const dataDir = path.resolve(process.cwd(), ".data/riasat_pg");
  const pg = new PGlite(dataDir);
  await pg.waitReady;

  const tablesRes = await pg.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log("==================================================================");
  console.log("POSTGRESQL DATABASE INSPECTION REPORT (SCHEMA: 'public')");
  console.log("==================================================================");
  console.log(`Total Tables Found: ${tablesRes.rows.length}\n`);

  for (const row of tablesRes.rows) {
    const tableName = row.table_name;
    const countRes = await pg.query(`SELECT COUNT(*) as cnt FROM "${tableName}"`);
    console.log(`TABLE: "${tableName}" | CURRENT ROWS: ${countRes.rows[0].cnt}`);
  }

  console.log("\n==================================================================");
  console.log("DETAILED TABLE SCHEMAS & COLUMN DEFINITIONS");
  console.log("==================================================================");

  for (const row of tablesRes.rows) {
    const tableName = row.table_name;
    const countRes = await pg.query(`SELECT COUNT(*) as cnt FROM "${tableName}"`);
    const colsRes = await pg.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `);

    console.log(`\n------------------------------------------------------------------`);
    console.log(`TABLE: "${tableName}" (${countRes.rows[0].cnt} records)`);
    console.log(`------------------------------------------------------------------`);
    console.table(colsRes.rows);
  }

  await pg.close();
}

inspect().catch(console.error);
