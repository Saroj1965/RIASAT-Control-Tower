import { PGlite } from "@electric-sql/pglite";
import bcrypt from "bcryptjs";
import path from "path";

async function main() {
  const dbDir = path.resolve(process.cwd(), ".data/riasat_pg");
  console.log(`Connecting to database at ${dbDir}...`);
  const client = new PGlite(dbDir);
  await client.waitReady;

  const passwordHash = await bcrypt.hash("ViceChairman@123", 10);

  // 1. Update any existing user with role 'Chairman' to 'Vice Chairman'
  await client.query(`
    UPDATE users 
    SET role = 'Vice Chairman' 
    WHERE role = 'Chairman'
  `);
  console.log("Updated any users with role 'Chairman' to 'Vice Chairman'.");

  // 2. Ensure vicechairman@riasat.ac.in exists
  const vcUser = await client.query("SELECT id FROM users WHERE email = $1", ["vicechairman@riasat.ac.in"]);
  if (vcUser.rows.length === 0) {
    await client.query(`
      INSERT INTO users (name, email, password_hash, mobile, designation, role, department_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      "Vice Chairman",
      "vicechairman@riasat.ac.in",
      passwordHash,
      "+91 98450 11000",
      "Vice Chairman & Executive Director",
      "Vice Chairman",
      null,
      "Active"
    ]);
    console.log("Created Vice Chairman user (vicechairman@riasat.ac.in).");
  } else {
    await client.query(`
      UPDATE users 
      SET name = 'Vice Chairman',
          role = 'Vice Chairman',
          password_hash = $1,
          designation = 'Vice Chairman & Executive Director',
          status = 'Active'
      WHERE email = 'vicechairman@riasat.ac.in'
    `, [passwordHash]);
    console.log("Updated existing Vice Chairman user (vicechairman@riasat.ac.in).");
  }

  // 3. Also alias vc@riasat.ac.in for convenience
  const vcAlias = await client.query("SELECT id FROM users WHERE email = $1", ["vc@riasat.ac.in"]);
  if (vcAlias.rows.length === 0) {
    await client.query(`
      INSERT INTO users (name, email, password_hash, mobile, designation, role, department_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      "Vice Chairman",
      "vc@riasat.ac.in",
      passwordHash,
      "+91 98450 11000",
      "Vice Chairman & Executive Director",
      "Vice Chairman",
      null,
      "Active"
    ]);
    console.log("Created vc@riasat.ac.in alias.");
  } else {
    await client.query(`
      UPDATE users 
      SET role = 'Vice Chairman', password_hash = $1, status = 'Active' 
      WHERE email = 'vc@riasat.ac.in'
    `, [passwordHash]);
    console.log("Updated vc@riasat.ac.in alias.");
  }

  // 4. Update chairman@riasat.ac.in to have Vice Chairman role and sync password
  const chUser = await client.query("SELECT id FROM users WHERE email = $1", ["chairman@riasat.ac.in"]);
  if (chUser.rows.length > 0) {
    await client.query(`
      UPDATE users 
      SET name = 'Vice Chairman',
          role = 'Vice Chairman',
          password_hash = $1,
          designation = 'Vice Chairman & Executive Director'
      WHERE email = 'chairman@riasat.ac.in'
    `, [passwordHash]);
    console.log("Synchronized chairman@riasat.ac.in to Vice Chairman.");
  }

  // 5. Query and list current users
  const allUsers = await client.query("SELECT id, name, email, role, status FROM users ORDER BY id ASC");
  console.log("\nCurrent registered users in PostgreSQL:");
  console.table(allUsers.rows);

  await client.close();
  console.log("Database synchronization complete!");
}

main().catch(console.error);
