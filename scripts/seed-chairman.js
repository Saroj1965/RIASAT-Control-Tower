const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

async function seedChairman() {
  const dataDir = path.join(__dirname, "..", ".data", "riasat_pg");
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite(dataDir);

  const email = "chairman@riasat.ac.in";
  const existing = await pg.query("SELECT id FROM users WHERE LOWER(email) = $1", [email]);

  const hash = await bcrypt.hash("Chairman@123", 10);

  if (existing.rows.length === 0) {
    await pg.query(
      `INSERT INTO users (name, email, password_hash, mobile, designation, role, department_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, NULL, 'Active')`,
      ["Chairman & Chancellor", email, hash, "+91 98450 11000", "Chairman / Vice Chairman", "Chairman"]
    );
    console.log("Chairman user created successfully in PostgreSQL!");
  } else {
    await pg.query(
      `UPDATE users SET role = 'Chairman', designation = 'Chairman / Vice Chairman', password_hash = $1 WHERE LOWER(email) = $2`,
      [hash, email]
    );
    console.log("Chairman user updated successfully in PostgreSQL!");
  }

  // Also make sure Executive account retains Executive role
  await pg.query(
    "UPDATE users SET role = 'Executive' WHERE email = 'executive@riasat.ac.in'"
  );
  console.log("Executive user role synchronized as Executive.");
}

seedChairman().catch(console.error);
