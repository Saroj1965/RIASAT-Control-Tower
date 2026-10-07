import { PGlite } from "@electric-sql/pglite";
import bcrypt from "bcryptjs";
import path from "path";

async function main() {
  const dataDir = path.resolve(process.cwd(), ".data/riasat_pg");
  const pg = new PGlite(dataDir);
  await pg.waitReady;

  const users = [
    { email: "semicon.head@riasat.ac.in", pass: "Semicon@123" },
    { email: "aero.head@riasat.ac.in", pass: "Aero@123" },
    { email: "space.head@riasat.ac.in", pass: "Space@123" },
    { email: "cyber.head@riasat.ac.in", pass: "Cyber@123" },
    { email: "medtech.head@riasat.ac.in", pass: "MedTech@123" },
    { email: "mfg.head@riasat.ac.in", pass: "Mfg@123" },
    { email: "hr.head@riasat.ac.in", pass: "Hr@123" },
    { email: "comm.head@riasat.ac.in", pass: "Comm@123" },
    { email: "admin@riasat.ac.in", pass: "Admin@123" },
    { email: "vicechairman@riasat.ac.in", pass: "ViceChairman@123" },
    { email: "executive@riasat.ac.in", pass: "Exec@123" },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.pass, 10);
    await pg.query("UPDATE users SET password_hash = $1 WHERE email = $2", [hash, u.email]);
    console.log(`Verified & updated password hash for: ${u.email}`);
  }

  await pg.close();
  console.log("All passwords synced successfully!");
}

main().catch(console.error);
