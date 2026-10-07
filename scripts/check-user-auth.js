import { PGlite } from "@electric-sql/pglite";
import bcrypt from "bcryptjs";
import path from "path";

async function checkUsers() {
  const dataDir = path.resolve(process.cwd(), ".data/riasat_pg");
  const pg = new PGlite(dataDir);
  await pg.waitReady;

  const usersToCheck = [
    { email: "admin@riasat.ac.in", testPass: "Admin@123" },
    { email: "vicechairman@riasat.ac.in", testPass: "ViceChairman@123" },
    { email: "vc@riasat.ac.in", testPass: "ViceChairman@123" },
    { email: "executive@riasat.ac.in", testPass: "Exec@123" },
    { email: "semicon.head@riasat.ac.in", testPass: "Semicon@123" },
  ];

  console.log("=================================================");
  console.log("CHECKING USER AUTHENTICATION HASHES IN DATABASE");
  console.log("=================================================");

  for (const item of usersToCheck) {
    const res = await pg.query("SELECT id, name, email, role, status, password_hash FROM users WHERE email = $1", [item.email]);
    if (res.rows.length === 0) {
      console.log(`❌ USER NOT FOUND: ${item.email}`);
    } else {
      const u = res.rows[0];
      const match = await bcrypt.compare(item.testPass, u.password_hash);
      console.log(`User: ${u.email} | Name: ${u.name} | Role: ${u.role} | Status: ${u.status}`);
      console.log(`Testing password "${item.testPass}": MATCH = ${match ? "✅ VALID" : "❌ FAILED"}\n`);
    }
  }

  await pg.close();
}

checkUsers().catch(console.error);
