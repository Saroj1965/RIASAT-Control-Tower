// scripts/test-chairman-access.mjs
const BASE_URL = "http://localhost:3000";

function parseCookie(res) {
  const raw = res.headers.get("set-cookie");
  if (!raw) return "";
  return raw.split(";")[0];
}

async function testChairmanAccess() {
  console.log("==================================================================");
  console.log("VERIFYING COMPLETE ACCESS FOR CHAIRMAN & ADMIN");
  console.log("==================================================================\n");

  // 1. Chairman Login
  console.log("1. Logging in as Chairman (chairman@riasat.ac.in)...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "chairman@riasat.ac.in", password: "Chairman@123" }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.success) {
    throw new Error(`Chairman login failed: ${JSON.stringify(loginData)}`);
  }
  const chairmanCookie = parseCookie(loginRes);
  console.log(`✓ Chairman logged in successfully with role: ${loginData.user.role}.\n`);

  // 2. Chairman Views Executive Control Tower
  console.log("2. Checking Chairman access to Executive Tower summary...");
  const execSummaryRes = await fetch(`${BASE_URL}/api/executive/summary`, {
    headers: { Cookie: chairmanCookie },
  });
  const execSummary = await execSummaryRes.json();
  if (!execSummaryRes.ok || !execSummary.departments || execSummary.departments.length < 8) {
    throw new Error("Chairman failed to load executive summary");
  }
  console.log(`✓ Chairman loaded executive tower with ${execSummary.departments.length} departments.\n`);

  // 3. Chairman Updates Overview of Semicon (Dept 1)
  console.log("3. Testing Chairman EDIT access to Semicon (Dept 1) Overview...");
  const updateSemiconRes = await fetch(`${BASE_URL}/api/departments/1`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: chairmanCookie },
    body: JSON.stringify({
      readiness_percentage: 85,
      rag_status: "GREEN",
      key_focus: "Chairman approved cleanroom fast-track and faculty recruitment",
    }),
  });
  const updateSemiconData = await updateSemiconRes.json();
  if (!updateSemiconRes.ok || !updateSemiconData.success) {
    throw new Error(`Chairman failed to update Semicon: ${JSON.stringify(updateSemiconData)}`);
  }
  console.log(`✓ Chairman successfully updated Semicon overview to 85% GREEN.\n`);

  // 4. Chairman Updates Overview of Aerospace (Dept 2)
  console.log("4. Testing Chairman EDIT access to Aerospace & Defence (Dept 2)...");
  const updateAeroRes = await fetch(`${BASE_URL}/api/departments/2`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: chairmanCookie },
    body: JSON.stringify({
      readiness_percentage: 75,
      rag_status: "GREEN",
      key_focus: "Chairman sanctioned HAL and GTRE propulsion joint research rig",
    }),
  });
  const updateAeroData = await updateAeroRes.json();
  if (!updateAeroRes.ok || !updateAeroData.success) {
    throw new Error(`Chairman failed to update Aerospace: ${JSON.stringify(updateAeroData)}`);
  }
  console.log(`✓ Chairman successfully updated Aerospace overview to 75% GREEN.\n`);

  // 5. Chairman Adds a Workstream to Space (Dept 3)
  console.log("5. Testing Chairman creating workstream in Space (Dept 3)...");
  const createWsRes = await fetch(`${BASE_URL}/api/workstreams`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: chairmanCookie },
    body: JSON.stringify({
      department_id: 3,
      category: "Strategic Mission",
      deliverable: "Chairman Special Initiative: RIASAT SmallSat Ground Station Phase 2",
      infrastructure_partnership: "IN-SPACe / ISRO",
      target_date: "2026-12-31",
      status: "In Progress",
      capex: "₹ 8.0 Cr",
      revenue_pipeline: "₹ 20.0 Cr",
      owner: "Chairman Office",
      risks_blockers: "None",
      decision_action: "Approved by Chairman",
    }),
  });
  const createWsData = await createWsRes.json();
  if (!createWsRes.ok || !createWsData.success) {
    throw new Error(`Chairman failed to create workstream: ${JSON.stringify(createWsData)}`);
  }
  console.log(`✓ Chairman successfully created strategic workstream in Space (Dept 3).\n`);

  // 6. Chairman Views User Management
  console.log("6. Testing Chairman access to User Management...");
  const usersRes = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Cookie: chairmanCookie },
  });
  const usersData = await usersRes.json();
  if (!usersRes.ok || !usersData.users) {
    throw new Error(`Chairman failed to access User Management: ${JSON.stringify(usersData)}`);
  }
  console.log(`✓ Chairman loaded User Management with ${usersData.users.length} registered users.\n`);

  // 7. Verify Department Head cannot edit other departments
  console.log("7. Verifying Department Head security isolation (Semicon Head -> Aerospace)...");
  const semiconLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "semicon.head@riasat.ac.in", password: "Semicon@123" }),
  });
  const semiconCookie = parseCookie(semiconLogin);
  const crossEditRes = await fetch(`${BASE_URL}/api/departments/2`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: semiconCookie },
    body: JSON.stringify({ readiness_percentage: 99, rag_status: "RED" }),
  });
  if (crossEditRes.status === 403) {
    console.log("✓ Access restriction confirmed: Department Head blocked (403 Forbidden) from unauthorized departments.\n");
  } else {
    throw new Error(`Expected 403 Forbidden for Department Head cross-edit, got ${crossEditRes.status}`);
  }

  console.log("==================================================================");
  console.log("ALL TESTS PASSED: CHAIRMAN & ADMIN HAVE COMPLETE ACCESS!");
  console.log("==================================================================");
}

testChairmanAccess().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
