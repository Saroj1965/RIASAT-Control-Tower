// scripts/test-e2e-verification.mjs
const BASE_URL = "http://localhost:3000";

function parseCookie(res) {
  const raw = res.headers.get("set-cookie");
  if (!raw) return "";
  return raw.split(";")[0];
}

async function runE2E() {
  console.log("================================================================================");
  console.log("RIASAT EXECUTIVE CONTROL TOWER: END-TO-END VERIFICATION SUITE");
  console.log("================================================================================\n");

  const results = [];

  function record(check, result, status) {
    results.push({ check, result, status });
    const mark = status === "PASS" ? "✅ [PASS]" : "❌ [FAIL]";
    console.log(`${mark} ${check}`);
    console.log(`   Result: ${result}\n`);
  }

  // ----------------------------------------------------------------------------
  // STAGE 1: EXECUTIVE DASHBOARD RESTORATION & 9 VERTICALS
  // ----------------------------------------------------------------------------
  console.log(">>> STAGE 1: Testing Executive Dashboard Accessibility & 9 Verticals...\n");

  // 1.1 Login as Executive
  const execLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "executive@riasat.ac.in", password: "Exec@123" }),
  });
  const execLoginData = await execLoginRes.json();
  const execCookie = parseCookie(execLoginRes);

  if (execLoginRes.ok && execLoginData.success) {
    record("1.1 Executive Login", `Logged in as ${execLoginData.user.email} (Role: ${execLoginData.user.role})`, "PASS");
  } else {
    record("1.1 Executive Login", `Login failed: ${JSON.stringify(execLoginData)}`, "FAIL");
    return;
  }

  // 1.2 Open /executive route as Executive
  const execPageRes = await fetch(`${BASE_URL}/executive`, {
    headers: { Cookie: execCookie },
    redirect: "manual",
  });
  if (execPageRes.status === 200) {
    record("1.2 Executive Dashboard Route", `HTTP 200 OK. Page rendered successfully.`, "PASS");
  } else {
    record("1.2 Executive Dashboard Route", `Unexpected status HTTP ${execPageRes.status}`, "FAIL");
  }

  // 1.3 Executive Summary API & 9 Verticals
  const summaryRes1 = await fetch(`${BASE_URL}/api/executive/summary`, {
    headers: { Cookie: execCookie },
  });
  const summaryData1 = await summaryRes1.json();
  const initialPendingCount = summaryData1.summary?.pending_decisions ?? 0;

  if (summaryRes1.ok && summaryData1.departments && summaryData1.departments.length === 9) {
    const verticalNames = summaryData1.departments.map(d => `${d.id}. ${d.name} (${d.code})`).join(", ");
    record(
      "1.3 All 9 Strategic Verticals Displayed",
      `All 9 verticals loaded dynamically from DB: [${verticalNames}]. Initial VC Decisions Required: ${initialPendingCount}`,
      "PASS"
    );
  } else {
    record(
      "1.3 All 9 Strategic Verticals Displayed",
      `Expected 9 departments, got: ${summaryData1.departments?.length || 0}`,
      "FAIL"
    );
  }

  // 1.4 Role Permissions: Admin access
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@riasat.ac.in", password: "Admin@123" }),
  });
  const adminCookie = parseCookie(adminLoginRes);
  const adminExecRes = await fetch(`${BASE_URL}/executive`, {
    headers: { Cookie: adminCookie },
    redirect: "manual",
  });
  if (adminExecRes.status === 200) {
    record("1.4 System Administrator Access", `Admin can access Executive Dashboard (HTTP 200 OK)`, "PASS");
  } else {
    record("1.4 System Administrator Access", `Admin cannot access Executive Dashboard (HTTP ${adminExecRes.status})`, "FAIL");
  }

  // 1.5 Role Permissions: Department Head restriction
  const semiconLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "semicon.head@riasat.ac.in", password: "Semicon@123" }),
  });
  const semiconCookie = parseCookie(semiconLoginRes);
  const deptHeadExecRes = await fetch(`${BASE_URL}/executive`, {
    headers: { Cookie: semiconCookie },
    redirect: "manual",
  });
  const deptHeadLocation = deptHeadExecRes.headers.get("location");
  const deptHeadSummaryRes = await fetch(`${BASE_URL}/api/executive/summary`, {
    headers: { Cookie: semiconCookie },
  });

  if (deptHeadExecRes.status === 307 && deptHeadLocation === "/department/1" && deptHeadSummaryRes.status === 403) {
    record(
      "1.5 Department Head Access Restriction",
      `Department Head is strictly redirected to /department/1 and blocked from Executive API (HTTP 403)`,
      "PASS"
    );
  } else {
    record(
      "1.5 Department Head Access Restriction",
      `Expected redirect to /department/1 and 403 on API, got redirect ${deptHeadExecRes.status} to ${deptHeadLocation}, API status ${deptHeadSummaryRes.status}`,
      "FAIL"
    );
  }

  // ----------------------------------------------------------------------------
  // STAGE 2: 7-COLUMN ACTION TRACKER WORKSTREAM CREATION & PERSISTENCE
  // ----------------------------------------------------------------------------
  console.log(">>> STAGE 2: Testing 7-Column Action Tracker Creation & Persistence...\n");

  const testActionPoint = "Procure specialized cleanroom vacuum pump for 28nm test bench";
  const testOwnership = "Cleanroom Facilities Lead";
  const testTimeline = "2026-11-30";
  const testStatus = "In Progress";
  const testRag = "AMBER";
  const testRemarks = "VC approval required for equipment import clearance";
  const testVcDecision = "Yes";

  const createWsRes = await fetch(`${BASE_URL}/api/workstreams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: semiconCookie,
    },
    body: JSON.stringify({
      department_id: 1, // Semicon
      category: "Lab Equipment & Tooling",
      action_point: testActionPoint,
      ownership: testOwnership,
      timeline: testTimeline,
      status: testStatus,
      rag_status: testRag,
      remarks: testRemarks,
      vc_decision_required: testVcDecision,
    }),
  });

  const createWsData = await createWsRes.json();
  let createdWsId = null;

  if (createWsRes.ok && createWsData.workstream && createWsData.workstream.id) {
    createdWsId = createWsData.workstream.id;
    const ws = createWsData.workstream;
    const all7Match =
      ws.action_point === testActionPoint &&
      ws.ownership === testOwnership &&
      ws.timeline === testTimeline &&
      ws.status === testStatus &&
      ws.rag_status === testRag &&
      ws.remarks === testRemarks &&
      ws.vc_decision_required === "Yes";

    if (all7Match) {
      record(
        "2.1 7-Column Action Tracker Item Creation",
        `Created Workstream ID ${createdWsId} with all 7 columns verified:\n` +
        `       1. Action Point: "${ws.action_point}"\n` +
        `       2. Ownership: "${ws.ownership}"\n` +
        `       3. Timeline: "${ws.timeline}"\n` +
        `       4. Status: "${ws.status}"\n` +
        `       5. RAG Status: "${ws.rag_status}"\n` +
        `       6. Remarks: "${ws.remarks}"\n` +
        `       7. Vice Chairman Decision Required: "${ws.vc_decision_required}"`,
        "PASS"
      );
    } else {
      record("2.1 7-Column Action Tracker Item Creation", `Item created but fields mismatched: ${JSON.stringify(ws)}`, "FAIL");
    }
  } else {
    record("2.1 7-Column Action Tracker Item Creation", `Failed to create item: ${JSON.stringify(createWsData)}`, "FAIL");
    return;
  }

  // 2.2 Verify Persistence across independent GET
  const getDeptRes = await fetch(`${BASE_URL}/api/departments/1`, {
    headers: { Cookie: semiconCookie },
  });
  const getDeptData = await getDeptRes.json();
  const fetchedWs = getDeptData.workstreams?.find((w) => w.id === createdWsId);

  if (fetchedWs && fetchedWs.action_point === testActionPoint && fetchedWs.vc_decision_required === "Yes") {
    record(
      "2.2 Data Persistence in Database",
      `Workstream ID ${createdWsId} persisted and retrieved accurately via GET /api/departments/1.`,
      "PASS"
    );
  } else {
    record("2.2 Data Persistence in Database", `Could not find persisted workstream in department 1`, "FAIL");
  }

  // ----------------------------------------------------------------------------
  // STAGE 3: VICE CHAIRMAN DECISION REQUIRED COUNT & MANAGEMENT ATTENTION
  // ----------------------------------------------------------------------------
  console.log(">>> STAGE 3: Testing Vice Chairman Decision Required Count & Management Attention...\n");

  const summaryRes2 = await fetch(`${BASE_URL}/api/executive/summary`, {
    headers: { Cookie: execCookie },
  });
  const summaryData2 = await summaryRes2.json();
  const updatedPendingCount = summaryData2.summary?.pending_decisions ?? 0;

  const attentionItem = summaryData2.management_attention?.find(
    (item) => item.id === createdWsId && item.department_name === "Semicon"
  );

  if (updatedPendingCount === initialPendingCount + 1 && attentionItem) {
    record(
      "3.1 VC Decision Required Count Increments Dynamically",
      `Count increased from ${initialPendingCount} to ${updatedPendingCount} (+1). Item appears under VICE CHAIRMAN / MANAGEMENT ATTENTION table.`,
      "PASS"
    );
  } else {
    record(
      "3.1 VC Decision Required Count Increments Dynamically",
      `Expected count ${initialPendingCount + 1}, got ${updatedPendingCount}. Item found in attention: ${Boolean(attentionItem)}`,
      "FAIL"
    );
  }

  // ----------------------------------------------------------------------------
  // STAGE 4: UPDATING VC DECISION REQUIRED TO 'No' & VERIFYING DECREMENT
  // ----------------------------------------------------------------------------
  console.log(">>> STAGE 4: Testing Update to VC Decision Required = 'No'...\n");

  const updateWsRes = await fetch(`${BASE_URL}/api/workstreams/${createdWsId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: semiconCookie,
    },
    body: JSON.stringify({
      action_point: testActionPoint,
      ownership: testOwnership,
      timeline: testTimeline,
      status: "Completed",
      rag_status: "GREEN",
      remarks: "VC approval granted; purchase order issued.",
      vc_decision_required: "No",
    }),
  });
  const updateWsData = await updateWsRes.json();

  if (updateWsRes.ok && updateWsData.workstream && updateWsData.workstream.vc_decision_required === "No") {
    record(
      "4.1 Update Workstream to VC Decision Required = 'No'",
      `Updated Workstream ID ${createdWsId} status to 'Completed', RAG to 'GREEN', VC Decision Required to 'No'.`,
      "PASS"
    );
  } else {
    record("4.1 Update Workstream to VC Decision Required = 'No'", `Update failed: ${JSON.stringify(updateWsData)}`, "FAIL");
  }

  // 4.2 Verify Executive Dashboard count decrements back
  const summaryRes3 = await fetch(`${BASE_URL}/api/executive/summary`, {
    headers: { Cookie: execCookie },
  });
  const summaryData3 = await summaryRes3.json();
  const revertedPendingCount = summaryData3.summary?.pending_decisions ?? 0;

  const attentionItemAfter = summaryData3.management_attention?.find(
    (item) => item.id === createdWsId && item.department_id === 1
  );

  if (revertedPendingCount === initialPendingCount && !attentionItemAfter) {
    record(
      "4.2 VC Decision Required Count Decrements Dynamically",
      `Count decremented from ${updatedPendingCount} back to ${revertedPendingCount}. Item removed from pending decisions.`,
      "PASS"
    );
  } else {
    record(
      "4.2 VC Decision Required Count Decrements Dynamically",
      `Expected count ${initialPendingCount}, got ${revertedPendingCount}. Attention item still active: ${Boolean(attentionItemAfter)}`,
      "FAIL"
    );
  }

  // ----------------------------------------------------------------------------
  // CLEANUP TEST RECORD
  // ----------------------------------------------------------------------------
  console.log("Cleaning up test workstream ID " + createdWsId + "...");
  await fetch(`${BASE_URL}/api/workstreams/${createdWsId}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  console.log("Cleanup completed.\n");

  // ----------------------------------------------------------------------------
  // SUMMARY REPORT
  // ----------------------------------------------------------------------------
  console.log("================================================================================");
  console.log("FINAL TEST EXECUTION SUMMARY");
  console.log("================================================================================");
  console.log(`Total Checks: ${results.length} | Passed: ${results.filter(r => r.status === "PASS").length} | Failed: ${results.filter(r => r.status === "FAIL").length}`);
  console.log("================================================================================\n");

  return results;
}

runE2E().catch(console.error);
