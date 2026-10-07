const path = require("path");
const fs = require("fs");

async function test() {
  console.log("Testing PGlite database setup...");
  const dataDir = path.join(__dirname, "..", ".data", "riasat_pg");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite(dataDir);
  
  const res = await pg.query("SELECT 1+1 AS result;");
  console.log("PostgreSQL query test success:", res.rows);
}

test().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
