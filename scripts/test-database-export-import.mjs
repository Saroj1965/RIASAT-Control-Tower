// scripts/test-database-export-import.mjs
const BASE_URL = "http://localhost:3000";

function parseCookie(res) {
  const raw = res.headers.get("set-cookie");
  if (!raw) return "";
  return raw.split(";")[0];
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed for ${email}: ${data.error}`);
  return parseCookie(res);
}

async function testExportAndImport() {
  console.log("================================================================================");
  console.log("TESTING DATABASE EXPORT AND IMPORT FUNCTIONALITY");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function record(title, ok, details = "") {
    total++;
    if (ok) {
      passed++;
      console.log(`✅ [PASS] ${title}`);
      if (details) console.log(`   ${details}`);
    } else {
      console.error(`❌ [FAIL] ${title}`);
      if (details) console.error(`   ${details}`);
    }
  }

  // 1. Admin login
  console.log("1. Logging in as Admin...");
  const adminCookie = await login("admin@riasat.ac.in", "Admin@123");
  record("Admin Login", !!adminCookie);

  // 2. Unauthenticated export test
  console.log("\n2. Testing unauthenticated export (should be blocked)...");
  const unauthRes = await fetch(`${BASE_URL}/api/database/export`);
  record("Unauthenticated Export Barrier", unauthRes.status === 401, `Status: ${unauthRes.status}`);

  // 3. Admin export database
  console.log("\n3. Testing Admin Export Database (/api/database/export)...");
  const exportRes = await fetch(`${BASE_URL}/api/database/export`, {
    headers: { Cookie: adminCookie },
  });
  const exportData = await exportRes.json();
  const hasValidTables = exportData.data &&
    Array.isArray(exportData.data.departments) &&
    Array.isArray(exportData.data.workstreams) &&
    Array.isArray(exportData.data.form_fields);

  record(
    "Admin Export Database (JSON Backup)",
    exportRes.ok && hasValidTables && exportData.counts.departments === 8,
    `Exported: ${exportData.counts.departments} departments, ${exportData.counts.workstreams} workstreams, ${exportData.counts.form_fields} form fields`
  );

  // 4. Unauthenticated import test
  console.log("\n4. Testing unauthenticated import (should be blocked)...");
  const unauthImportRes = await fetch(`${BASE_URL}/api/database/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: exportData.data }),
  });
  record("Unauthenticated Import Barrier", unauthImportRes.status === 401 || unauthImportRes.status === 403, `Status: ${unauthImportRes.status}`);

  // 5. Admin import database with the backup data
  console.log("\n5. Testing Admin Import Database (/api/database/import)...");
  const importRes = await fetch(`${BASE_URL}/api/database/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ data: exportData.data }),
  });
  const importResult = await importRes.json();

  record(
    "Admin Import Database Execution",
    importRes.ok && importResult.success === true && importResult.counts.departments === 8,
    `Message: "${importResult.message}", Imported Departments: ${importResult.counts?.departments}, Workstreams: ${importResult.counts?.workstreams}`
  );

  // 6. Verify database after import
  console.log("\n6. Verifying database health after import...");
  const verifyRes = await fetch(`${BASE_URL}/api/executive/summary`, {
    headers: { Cookie: adminCookie },
  });
  const verifyData = await verifyRes.json();
  const okVerify = verifyRes.ok && verifyData.departments && verifyData.departments.length === 8;

  record(
    "Database Consistency & Dashboard Health Post-Import",
    okVerify,
    `Verified 8 live departments intact on dashboard. Overall readiness: ${verifyData.summary?.overall_readiness}%`
  );

  console.log("\n================================================================================");
  console.log(`DATABASE EXPORT / IMPORT TEST RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log("================================================================================");
}

testExportAndImport().catch(console.error);
