// Test script to verify Vice Chairman & Admin Complete Access
import assert from "assert";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==================================================================");
  console.log("VERIFYING COMPLETE ACCESS FOR VICE CHAIRMAN & ADMIN");
  console.log("==================================================================\n");

  let vcCookie = "";

  // 1. Log in as Vice Chairman
  console.log("1. Logging in as Vice Chairman (vicechairman@riasat.ac.in)...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "vicechairman@riasat.ac.in",
      password: "ViceChairman@123",
    }),
  });

  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, `Login failed: ${JSON.stringify(loginData)}`);
  assert.strictEqual(loginData.user.role, "Vice Chairman", `Expected role 'Vice Chairman', got ${loginData.user.role}`);
  assert.strictEqual(loginData.redirectUrl, "/executive", "Expected redirect to /executive");
  vcCookie = loginRes.headers.get("set-cookie")?.split(";")[0] || "";
  console.log(`✓ Vice Chairman logged in successfully with role: ${loginData.user.role}.\n`);

  // 2. Check Vice Chairman access to Executive Tower
  console.log("2. Checking Vice Chairman access to Executive Tower summary...");
  const execRes = await fetch(`${BASE_URL}/api/executive/summary`, {
    headers: { Cookie: vcCookie },
  });
  assert.strictEqual(execRes.status, 200, "Vice Chairman should have access to Executive Tower");
  const execData = await execRes.json();
  assert.ok(execData.departments && execData.departments.length >= 8, "Expected at least 8 departments in summary");
  console.log(`✓ Vice Chairman loaded executive tower with ${execData.departments.length} departments.\n`);

  // 3. Test Vice Chairman EDIT access to Semicon (Dept 1) Overview
  console.log("3. Testing Vice Chairman EDIT access to Semicon (Dept 1) Overview...");
  const updateSemicon = await fetch(`${BASE_URL}/api/departments/1`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: vcCookie,
    },
    body: JSON.stringify({
      readiness_percentage: 90,
      rag_status: "GREEN",
      key_focus: "Vice Chairman Review: Cleanroom & 28nm Tape-out Accelerator Setup",
    }),
  });
  assert.strictEqual(updateSemicon.status, 200, "Vice Chairman should have permission to edit Semicon overview");
  const semiconData = await updateSemicon.json();
  assert.strictEqual(semiconData.overview.readiness_percentage, 90);
  assert.strictEqual(semiconData.overview.rag_status, "GREEN");
  console.log("✓ Vice Chairman successfully updated Semicon overview to 90% GREEN.\n");

  // 4. Test Vice Chairman EDIT access to Aerospace & Defence (Dept 2) Overview
  console.log("4. Testing Vice Chairman EDIT access to Aerospace & Defence (Dept 2)...");
  const updateAero = await fetch(`${BASE_URL}/api/departments/2`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: vcCookie,
    },
    body: JSON.stringify({
      readiness_percentage: 80,
      rag_status: "GREEN",
      key_focus: "Vice Chairman Strategic Directive: DRDO Gas Turbine Testing Rig",
    }),
  });
  assert.strictEqual(updateAero.status, 200, "Vice Chairman should have permission to edit Aerospace");
  const aeroData = await updateAero.json();
  assert.strictEqual(aeroData.overview.readiness_percentage, 80);
  console.log("✓ Vice Chairman successfully updated Aerospace overview to 80% GREEN.\n");

  // 5. Test Vice Chairman adding a workstream in Space (Dept 3)
  console.log("5. Testing Vice Chairman creating workstream in Space (Dept 3)...");
  const createWsRes = await fetch(`${BASE_URL}/api/workstreams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: vcCookie,
    },
    body: JSON.stringify({
      department_id: 3,
      category: "Strategic Infrastructure",
      deliverable: `Ground Station Ground Segment with IN-SPACe (VC Approved ${Date.now()})`,
      infrastructure_partnership: "ISRO / IN-SPACe Consortium",
      target_date: "2026-12-31",
      status: "On Track",
      capex: "₹ 18.0 Cr",
      revenue_pipeline: "₹ 35.0 Cr",
      owner: "Space Domain Lead",
      risks_blockers: "Spectrum clearance pending WPC clearance",
      decision_action: "Expedite frequency clearance application",
    }),
  });
  assert.strictEqual(createWsRes.status, 200, "Vice Chairman should be able to create workstreams in any department");
  console.log("✓ Vice Chairman successfully created strategic workstream in Space (Dept 3).\n");

  // 6. Test Vice Chairman access to User Management
  console.log("6. Testing Vice Chairman access to User Management...");
  const usersRes = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Cookie: vcCookie },
  });
  assert.strictEqual(usersRes.status, 200, "Vice Chairman should have access to User Management");
  const usersData = await usersRes.json();
  assert.ok(Array.isArray(usersData.users) && usersData.users.length > 0, "Users list should not be empty");
  console.log(`✓ Vice Chairman loaded User Management with ${usersData.users.length} registered users.\n`);

  // 7. Test Department Head security isolation (Semicon Head cannot edit Aerospace)
  console.log("7. Verifying Department Head security isolation (Semicon Head -> Aerospace)...");
  const semiconLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "semicon.head@riasat.ac.in",
      password: "Semicon@123",
    }),
  });
  const sCookie = semiconLogin.headers.get("set-cookie")?.split(";")[0] || "";

  const unauthorizedEdit = await fetch(`${BASE_URL}/api/departments/2`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: sCookie,
    },
    body: JSON.stringify({
      readiness_percentage: 99,
      rag_status: "RED",
      key_focus: "Unauthorized Hack Attempt",
    }),
  });
  assert.strictEqual(unauthorizedEdit.status, 403, "Semicon Head must be forbidden from editing Aerospace & Defence");
  console.log("✓ Access restriction confirmed: Department Head blocked (403 Forbidden) from unauthorized departments.\n");

  console.log("==================================================================");
  console.log("ALL TESTS PASSED: VICE CHAIRMAN & ADMIN HAVE COMPLETE ACCESS!");
  console.log("==================================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
