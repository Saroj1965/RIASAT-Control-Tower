const BASE_URL = "http://localhost:3000";

async function runVerification() {
  console.log("=== STARTING VERIFICATION FOR 7-COLUMN TRACKER & DEPARTMENT CREATION ===");

  // 1. Login as Admin
  console.log("\n1. Logging in as Admin (admin@riasat.ac.in)...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@riasat.ac.in", password: "Admin@123" }),
  });
  if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
  const setCookie = loginRes.headers.get("set-cookie");
  console.log("✅ Admin logged in successfully! Cookie received.");

  const headers = {
    "Content-Type": "application/json",
    Cookie: setCookie ? setCookie.split(";")[0] : "",
  };

  // 2. Test Department Creation (Verify fix for 'departments_pkey' unique constraint error)
  console.log("\n2. Testing Department Creation via POST /api/departments...");
  const deptCode = `OPERATIONS_${Date.now()}`;
  const createDeptRes = await fetch(`${BASE_URL}/api/departments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "Operations & Strategy",
      code: deptCode,
      description: "Strategic operations and campus expansion",
    }),
  });
  const createDeptData = await createDeptRes.json();
  if (!createDeptRes.ok) {
    throw new Error(`Department creation failed: ${createDeptRes.status} ${JSON.stringify(createDeptData)}`);
  }
  console.log(`✅ Department created successfully with ID: ${createDeptData.department.id}, Code: ${createDeptData.department.code}`);

  // 3. Add an Action Point with the 7 columns: Vice Chairman Decision Required = YES
  console.log("\n3. Testing 7-Column Action Tracker item insertion with Vice Chairman Decision Required = YES...");
  const wsRes = await fetch(`${BASE_URL}/api/workstreams`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      department_id: 1, // Semicon
      action_point: "VC approval required for final cleanroom HEPA filter vendor selection",
      ownership: "Semicon Head",
      timeline: "2026-11-28",
      status: "In Progress",
      rag_status: "AMBER",
      remarks: "VC approval required for final vendor selection.",
      vc_decision_required: "Yes",
    }),
  });
  const wsData = await wsRes.json();
  if (!wsRes.ok) {
    throw new Error(`Action point creation failed: ${wsRes.status} ${JSON.stringify(wsData)}`);
  }
  const createdWs = wsData.workstream || wsData;
  console.log(`✅ Action point created successfully! ID: ${createdWs.id}`);
  console.log(`   - Action Point: "${createdWs.action_point}"`);
  console.log(`   - Ownership: "${createdWs.ownership}"`);
  console.log(`   - Timeline: "${createdWs.timeline}"`);
  console.log(`   - Status: "${createdWs.status}"`);
  console.log(`   - RAG Status: "${createdWs.rag_status}"`);
  console.log(`   - Remarks: "${createdWs.remarks}"`);
  console.log(`   - VC Decision Required: "${createdWs.vc_decision_required}"`);

  // 4. Verify Executive Dashboard counts and Management Attention visibility
  console.log("\n4. Fetching Executive Dashboard Summary (GET /api/executive/summary)...");
  const execRes = await fetch(`${BASE_URL}/api/executive/summary`, {
    headers,
  });
  if (!execRes.ok) {
    throw new Error(`Executive summary failed: ${execRes.status} ${await execRes.text()}`);
  }
  const execData = await execRes.json();
  console.log(`✅ Executive Summary returned:`);
  console.log(`   - Overall Readiness: ${execData.summary.overall_readiness}%`);
  console.log(`   - Overall RAG: ${execData.summary.overall_rag}`);
  console.log(`   - Vice Chairman Decisions Required: ${execData.summary.pending_decisions}`);

  const matchingAttention = execData.management_attention.find(
    (item) => item.id === createdWs.id && item.department_id === 1
  );
  if (!matchingAttention) {
    console.log("Management attention items found:", execData.management_attention);
    throw new Error("❌ Newly added action point with vc_decision_required = 'Yes' was NOT found in management_attention!");
  }
  console.log(`✅ Verified in VICE CHAIRMAN / MANAGEMENT ATTENTION:`);
  console.log(`   - Found item ID: ${matchingAttention.id}`);
  console.log(`   - Department: ${matchingAttention.department_name}`);
  console.log(`   - Action Point: "${matchingAttention.item}"`);
  console.log(`   - Ownership: "${matchingAttention.owner}"`);
  console.log(`   - Status: "${matchingAttention.status}"`);
  console.log(`   - VC Decision Required: "${matchingAttention.vc_decision_required}"`);
  console.log(`   - Remarks/Decision: "${matchingAttention.decision_action}"`);

  // 5. Cleanup test department
  console.log(`\n5. Cleaning up test department (ID: ${createDeptData.department.id})...`);
  const delDeptRes = await fetch(`${BASE_URL}/api/departments/${createDeptData.department.id}`, {
    method: "DELETE",
    headers,
  });
  if (delDeptRes.ok) {
    console.log("✅ Test department deleted cleanly.");
  }

  console.log("\n=================================================");
  console.log("🎉 ALL ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!");
  console.log("=================================================");
}

runVerification().catch((err) => {
  console.error("❌ VERIFICATION FAILED:", err);
  process.exit(1);
});
