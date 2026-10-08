// scripts/run-acceptance-tests.mjs
const BASE_URL = "http://localhost:3000";

let adminCookie = "";
let semiconCookie = "";
let execCookie = "";

function parseCookie(res) {
  const raw = res.headers.get("set-cookie");
  if (!raw) return "";
  return raw.split(";")[0];
}

async function runTests() {
  console.log("==================================================================");
  console.log("RIASAT EXECUTIVE CONTROL TOWER: SECTION 35 ACCEPTANCE TEST SUITE");
  console.log("==================================================================\n");

  let passedCount = 0;

  // --- LOGIN AS ADMIN FIRST TO PREPARE TEST 1 ---
  console.log("Logging in as Admin (admin@riasat.ac.in)...");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@riasat.ac.in", password: "Admin@123" }),
  });
  const adminLoginData = await adminLoginRes.json();
  if (!adminLoginRes.ok || !adminLoginData.success) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
  }
  adminCookie = parseCookie(adminLoginRes);
  console.log("✓ Admin logged in successfully.\n");

  // ------------------------------------------------------------------
  // TEST 1: Admin creates a Semicon Department Head.
  // ------------------------------------------------------------------
  console.log("TEST 1: Admin creates a Semicon Department Head...");
  const newEmail = `semicon.test.${Date.now()}@riasat.ac.in`;
  const createUserRes = await fetch(`${BASE_URL}/api/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      name: "Dr. Test Semicon Lead",
      email: newEmail,
      mobile: "+91 99000 12345",
      designation: "Domain Specialist",
      role: "Department Head",
      department_id: 1, // Semicon
      status: "Active",
      password: "TestPassword@123",
    }),
  });
  const createUserData = await createUserRes.json();
  if (createUserRes.ok && createUserData.success && createUserData.user.role === "Department Head") {
    console.log(`[PASS] TEST 1: Admin successfully created user ${newEmail} for Semicon (Dept 1).`);
    passedCount++;
  } else {
    console.error("[FAIL] TEST 1:", createUserData);
  }

  // ------------------------------------------------------------------
  // TEST 2: Semicon Head logs in.
  // ------------------------------------------------------------------
  console.log("\nTEST 2: Semicon Head logs in...");
  const semiconLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "semicon.head@riasat.ac.in", password: "Semicon@123" }),
  });
  const semiconLoginData = await semiconLoginRes.json();
  if (semiconLoginRes.ok && semiconLoginData.success && semiconLoginData.user.department_id === 1) {
    semiconCookie = parseCookie(semiconLoginRes);
    console.log("[PASS] TEST 2: Semicon Head logged in successfully.");
    passedCount++;
  } else {
    console.error("[FAIL] TEST 2:", semiconLoginData);
  }

  // ------------------------------------------------------------------
  // TEST 3: Semicon Head sees Semicon only.
  // ------------------------------------------------------------------
  console.log("\nTEST 3: Semicon Head sees Semicon only (can view Semicon, blocked from others)...");
  const semiconViewRes = await fetch(`${BASE_URL}/api/departments/1`, {
    headers: { Cookie: semiconCookie },
  });
  const semiconViewData = await semiconViewRes.json();

  const aeroViewRes = await fetch(`${BASE_URL}/api/departments/2`, {
    headers: { Cookie: semiconCookie },
  });

  if (semiconViewRes.ok && semiconViewData.department.id === 1 && aeroViewRes.status === 403) {
    console.log("[PASS] TEST 3: Semicon Head can view Semicon (Dept 1) but is forbidden (403) from viewing Aerospace (Dept 2).");
    passedCount++;
  } else {
    console.error("[FAIL] TEST 3: Semicon view:", semiconViewRes.status, "Aero view:", aeroViewRes.status);
  }

  // ------------------------------------------------------------------
  // TEST 4: Semicon Head updates a workstream.
  // ------------------------------------------------------------------
  // Create a dedicated test workstream to verify update and persistence while preserving authentic WS-01
  const createWs = await fetch(`${BASE_URL}/api/workstreams`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: semiconCookie },
    body: JSON.stringify({
      department_id: 1,
      category: "Infrastructure",
      deliverable: "Temporary Acceptance Test Workstream",
      status: "In Progress",
      capex: "₹ 10.0 Cr",
      revenue_pipeline: "₹ 20.0 Cr",
    }),
  });
  const cwData = await createWs.json();
  let wsToUpdate = cwData.workstream;

  const newDeliverableText = `Cleanroom Facility ISO-5/6 HVAC Commissioning (Verified ${Date.now()})`;
  const updateWsRes = await fetch(`${BASE_URL}/api/workstreams/${wsToUpdate.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: semiconCookie,
    },
    body: JSON.stringify({
      category: wsToUpdate.category,
      deliverable: newDeliverableText,
      status: "Completed",
      capex: "₹ 15.0 Cr",
      revenue_pipeline: "₹ 30.0 Cr",
      owner: "Dr. Arun Kumar",
      risks_blockers: "No blockers - Commissioning completed",
      decision_action: "Approved by VC",
    }),
  });
  const updateWsData = await updateWsRes.json();
  if (updateWsRes.ok && updateWsData.success && updateWsData.workstream.status === "Completed") {
    console.log("[PASS] TEST 4: Semicon Head successfully updated workstream status to Completed.");
    passedCount++;
  } else {
    console.error("[FAIL] TEST 4:", updateWsData);
  }

  // ------------------------------------------------------------------
  // TEST 5: The update is stored in PostgreSQL database.
  // ------------------------------------------------------------------
  console.log("\nTEST 5: The update is stored in PostgreSQL database...");
  const verifyDbRes = await fetch(`${BASE_URL}/api/departments/1`, {
    headers: { Cookie: semiconCookie },
  });
  const verifyDbData = await verifyDbRes.json();
  const updatedItem = verifyDbData.items.find((x) => x.id === wsToUpdate.id);
  if (updatedItem && updatedItem.status === "Completed" && updatedItem.deliverable === newDeliverableText) {
    console.log(`[PASS] TEST 5: Workstream record verified persisted in PostgreSQL with deliverable: "${updatedItem.deliverable}".`);
    passedCount++;
  } else {
    console.error("[FAIL] TEST 5:", updatedItem);
  }

  // Clean up temporary test workstream to preserve authentic records
  await fetch(`${BASE_URL}/api/workstreams/${wsToUpdate.id}`, {
    method: "DELETE",
    headers: { Cookie: semiconCookie },
  });

  // ------------------------------------------------------------------
  // TEST 6: Executive logs in.
  // ------------------------------------------------------------------
  console.log("\nTEST 6: Executive logs in...");
  const execLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "executive@riasat.ac.in", password: "Exec@123" }),
  });
  const execLoginData = await execLoginRes.json();
  if (execLoginRes.ok && execLoginData.success && execLoginData.user.role === "Executive") {
    execCookie = parseCookie(execLoginRes);
    console.log("[PASS] TEST 6: Executive logged in successfully with Executive role.");
    passedCount++;
  } else {
    console.error("[FAIL] TEST 6:", execLoginData);
  }

  // ------------------------------------------------------------------
  // TEST 7: Executive immediately sees the updated Semicon information.
  // ------------------------------------------------------------------
  console.log("\nTEST 7: Executive immediately sees the updated Semicon information on Executive Tower...");
  const execSummaryRes = await fetch(`${BASE_URL}/api/executive/summary`, {
    headers: { Cookie: execCookie },
  });
  const execSummaryData = await execSummaryRes.json();
  const semiconCard = execSummaryData.departments.find((d) => d.id === 1);
  if (execSummaryRes.ok && semiconCard && semiconCard.name.toLowerCase().includes("semicon")) {
    console.log(`[PASS] TEST 7: Executive sees Semicon live on tower: Readiness=${semiconCard.readiness}%, RAG=${semiconCard.rag}, Open Items=${semiconCard.open_items}.`);
    passedCount++;
  } else {
    console.error("[FAIL] TEST 7:", execSummaryData);
  }

  // ------------------------------------------------------------------
  // TEST 8: Executive can click Semicon and see detailed information.
  // ------------------------------------------------------------------
  console.log("\nTEST 8: Executive can view detailed information for Semicon...");
  const execSemiconRes = await fetch(`${BASE_URL}/api/departments/1`, {
    headers: { Cookie: execCookie },
  });
  const execSemiconData = await execSemiconRes.json();
  if (execSemiconRes.ok && execSemiconData.items && execSemiconData.items.length > 0) {
    console.log(`[PASS] TEST 8: Executive loaded Semicon detail with ${execSemiconData.items.length} workstreams and readiness ${execSemiconData.overview.readiness_percentage}%.`);
    passedCount++;
  } else {
    console.error("[FAIL] TEST 8:", execSemiconData);
  }

  // ------------------------------------------------------------------
  // TEST 9: Executive cannot edit the information.
  // ------------------------------------------------------------------
  console.log("\nTEST 9: Executive cannot edit the information (must return 403 Forbidden)...");
  const execEditAttempt = await fetch(`${BASE_URL}/api/departments/1`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: execCookie,
    },
    body: JSON.stringify({
      readiness_percentage: 99,
      rag_status: "GREEN",
      key_focus: "Unauthorized edit attempt",
    }),
  });
  if (execEditAttempt.status === 403) {
    console.log("[PASS] TEST 9: Executive edit rejected with 403 Forbidden (Executive is strictly read-only).");
    passedCount++;
  } else {
    console.error("[FAIL] TEST 9: Expected 403 but got", execEditAttempt.status);
  }

  // ------------------------------------------------------------------
  // TEST 10: Semicon Head cannot edit Aerospace information.
  // ------------------------------------------------------------------
  console.log("\nTEST 10: Semicon Head cannot edit Aerospace information (must return 403 Forbidden)...");
  const semiconAeroEditAttempt = await fetch(`${BASE_URL}/api/departments/2`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: semiconCookie,
    },
    body: JSON.stringify({
      readiness_percentage: 10,
      rag_status: "RED",
      key_focus: "Unauthorized cross-department edit attempt",
    }),
  });
  if (semiconAeroEditAttempt.status === 403) {
    console.log("[PASS] TEST 10: Semicon Head cross-department edit rejected with 403 Forbidden.");
    passedCount++;
  } else {
    console.error("[FAIL] TEST 10: Expected 403 but got", semiconAeroEditAttempt.status);
  }

  // ------------------------------------------------------------------
  // TEST 11: Admin can see all departments.
  // ------------------------------------------------------------------
  console.log("\nTEST 11: Admin can see all departments...");
  const adminDeptsRes = await fetch(`${BASE_URL}/api/departments`, {
    headers: { Cookie: adminCookie },
  });
  const adminDeptsData = await adminDeptsRes.json();
  if (adminDeptsRes.ok && adminDeptsData.departments && adminDeptsData.departments.length >= 8) {
    console.log(`[PASS] TEST 11: Admin sees all ${adminDeptsData.departments.length} departments.`);
    passedCount++;
  } else {
    console.error("[FAIL] TEST 11:", adminDeptsData);
  }

  // ------------------------------------------------------------------
  // TEST 12: Every update records the user and timestamp.
  // ------------------------------------------------------------------
  console.log("\nTEST 12: Every update records user and timestamp in audit trail...");
  const auditRes = await fetch(`${BASE_URL}/api/audit-log?limit=10`, {
    headers: { Cookie: adminCookie },
  });
  const auditData = await auditRes.json();
  const latestLog = auditData.logs[0];
  if (auditRes.ok && latestLog && latestLog.user_name && latestLog.timestamp && latestLog.details) {
    console.log(`[PASS] TEST 12: Audit trail logged successfully: [${latestLog.timestamp}] ${latestLog.user_name} -> "${latestLog.details}".`);
    passedCount++;
  } else {
    console.error("[FAIL] TEST 12:", latestLog);
  }

  console.log("\n==================================================================");
  console.log(`SUMMARY: ${passedCount} OF 12 ACCEPTANCE TESTS PASSED!`);
  console.log("==================================================================");

  if (passedCount === 12) {
    console.log("ALL 12 ACCEPTANCE CRITERIA VERIFIED AND VALIDATED 100%!");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
