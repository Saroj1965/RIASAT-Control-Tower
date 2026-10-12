// Safe, non-destructive Neon PostgreSQL connectivity verification script
// Masking and security: Never logs or prints connection strings, passwords, or credentials.

import { Pool } from "@neondatabase/serverless";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ ERROR: DATABASE_URL environment variable is not defined.");
  console.log("ℹ️  To test Neon connectivity, set DATABASE_URL or pass it via environment.");
  process.exit(1);
}

// Security: parse host only to display safe diagnostics
let safeHost = "unknown";
let safeDb = "unknown";
try {
  const parsed = new URL(connectionString);
  safeHost = parsed.hostname;
  safeDb = parsed.pathname.replace(/^\//, "");
} catch (e) {
  safeHost = "[Custom Connection Format]";
}

console.log("==================================================");
console.log("  RIASAT NEON POSTGRESQL CONNECTIVITY CHECK");
console.log("==================================================");
console.log(`📡 Target Endpoint : ${safeHost}`);
console.log(`🗄️  Target Database : ${safeDb}`);
console.log("🔒 Credentials     : [SECURED / MASKED]");
console.log("--------------------------------------------------");

async function runCheck() {
  const startTime = Date.now();
  let client;

  try {
    if (connectionString.includes("neon.tech")) {
      const pool = new Pool({ connectionString });
      client = await pool.connect();
    } else {
      const pool = new pg.Pool({
        connectionString,
        ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
      });
      client = await pool.connect();
    }

    const latency = Date.now() - startTime;
    console.log(`✅ Handshake Successful! (Latency: ${latency}ms)`);

    // Non-destructive basic queries
    const verRes = await client.query("SELECT version();");
    console.log(`🐘 PostgreSQL Engine : ${verRes.rows[0].version.split(",")[0]}`);

    // Check tables existence safely
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tableNames = tableRes.rows.map(r => r.table_name);
    console.log(`📋 Existing Public Tables (${tableNames.length}): ${tableNames.join(", ") || "(None yet - will initialize on first launch)"}`);

    console.log("--------------------------------------------------");
    console.log("🎉 NEON POSTGRESQL CONNECTION VERIFIED SUCCESSFULLY!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Database Connection Failed:");
    console.error(`   Message: ${err.message}`);
    process.exit(1);
  } finally {
    if (client) client.release();
    process.exit(0);
  }
}

runCheck();
