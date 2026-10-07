import { PGlite } from "@electric-sql/pglite";
import path from "path";

async function main() {
  const dataDir = path.resolve(process.cwd(), ".data/riasat_pg");
  const pg = new PGlite(dataDir);
  await pg.waitReady;

  const res = await pg.query("SELECT id, name, email, role, status FROM users WHERE email LIKE '%vicechairman%' OR email LIKE '%vc%'");
  console.table(res.rows);

  await pg.query("UPDATE users SET status = 'Active' WHERE email = 'vicechairman@riasat.ac.in'");
  console.log("Ensured vicechairman is Active!");

  await pg.close();
}

main().catch(console.error);
