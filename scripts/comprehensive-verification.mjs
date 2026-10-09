// scripts/comprehensive-verification.mjs
const BASE_URL = "http://localhost:3000";

function parseCookie(res) {
  const raw = res.headers.get("set-cookie");
  if (!raw) return "";
  return raw.split(";")[0];
}

async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  }
  return {
    user: data.user,
    redirectUrl: data.redirectUrl,
    cookie: parseCookie(res),
  };
}

async function runComprehensiveVerification() {
  console.log("===============================================================================");
  console.log("RIASAT EXECUTIVE CONTROL TOWER: COMPREHENSIVE VERIFICATION SUITE");
  console.log("===============================================================================\n");

  const results = [];

  function recordCheck(checkName, resultDesc, status) {
    results.push({ check: checkName, result: resultDesc, status });
    const symbol = status === "PASS" ? "✅" : "❌";
    console.log(`${symbol} [${status}] ${checkName}`);
    console.log(`   -> ${resultDesc}\n`);
  }

  // --------------------------------------------------------------------------
  // SECTION 1: EXECUTIVE DASHBOARD RESTORATION & ACCESS CONTROL
  // --------------------------------------------------------------------------
  console.log("--- 1. VERIFYING EXECUTIVE DASHBOARD ACCESS & RESTORATION ---");

  // 1.1 Login as Executive
  let execSession;
  try {
    execSession = await loginUser("executive@riasat.ac.in", "Exec@123");
    const summaryRes = await fetch(`${BASE_URL}/api/executive/summary`, {
      headers: { Cookie: execSession.cookie },
    });
    if (summaryRes.ok && execSession.redirectUrl === "/executive") {
      recordCheck(
        "Executive / Management Login & Dashboard Access",
        `Executive logged in successfully and lands on /executive (HTTP ${summaryRes.status})`,
        "PASS"
      );
    } else {
      recordCheck("Executive / Management Login & Dashboard Access", `Failed with status ${summaryRes.status}`, "FAIL");
    }
  } catch (err) {
    recordCheck("Executive / Management Login & Dashboard Access", err.message, "FAIL");
  }

  // 1.2 Login as Vice Chairman
  let vcSession;
  try {
    vcSession = await loginUser("vicechairman@riasat.ac.in", "ViceChairman@123");
    const summaryRes = await fetch(`${BASE_URL}/api/executive/summary`, {
      headers: { Cookie: vcSession.cookie },
    });
    if (summaryRes.ok && vcSession.redirectUrl === "/executive") {
      recordCheck(
        "Vice Chairman Login & Dashboard Access",
        `Vice Chairman logged in successfully and lands on /executive (HTTP ${summaryRes.status})`,
        "PASS"
      );
    } else {
      recordCheck("Vice Chairman Login & Dashboard Access", `Failed with status ${summaryRes.status}`, "FAIL");
    }
  } catch (err) {
    recordCheck("Vice Chairman Login & Dashboard Access", err.message, "FAIL");
  }

  // 1.3 Login as System Administrator
  let adminSession;
  try {
    adminSession = await loginUser("admin@riasat.ac.in", "Admin@123");
    const summaryRes = await fetch(`${BASE_URL}/api/executive/summary`, {
      headers: { Cookie: adminSession.cookie },
    });
    if (summaryRes.ok && adminSession.redirectUrl === "/executive") {
      recordCheck(
        "System Administrator Login & Dashboard Access",
        `Admin logged in successfully and has full Executive Dashboard access (HTTP ${summaryRes.status})`,
        "PASS"
      );
    } else {
      recordCheck("System Administrator Login & Dashboard Access", `Failed with status ${summaryRes.status}`, "FAIL");
    }
  } catch (err) {
    recordCheck("System Administrator Login & Dashboard Access", err.message, "FAIL");
  }

  // 1.4 Department Head Restricted from Executive Dashboard Summary
  let semiconSession;
  try {
    semiconSession = await loginUser("semicon.head@riasat.ac.in", "Semicon@123");
    const summaryRes = await fetch(`${BASE_URL}/api/executive/summary`, {
      headers: { Cookie: semiconSession.cookie },
    });
    if (summaryRes.status === 403) {
      recordCheck(
        "Department Head Access Restriction",
        `Semicon Head correctly forbidden (HTTP 403) from full Executive Dashboard summary`,
        "PASS"
      );
    } else {
      recordCheck(
        "Department Head Access Restriction",
        `Expected HTTP 403 Forbidden but received HTTP ${summaryRes.status}`,
        "FAIL"
      );
    }
  } catch (err) {
    recordCheck("Department Head Access Restriction", err.message, "FAIL");
  }

  // 1.5 Confirm all 9 verticals are displayed in Executive Dashboard
  let dashboardData;
  try {
    const res = await fetch(`${BASE_URL}/api/executive/summary`, {
      headers: { Cookie: adminSession.cookie },
    });
    dashboardData = await res.json();
    const depts = dashboardData.departments || [];
    const expectedVerticals = [
      "Semicon",
      "Aerospace & Defence",
      "Space",
      "Cybersecurity",
      "MedTech",
      "Advanced Manufacturing",
      "HR & Recruitment",
      "Communications",
      "Strategy & Operations",
    ];

    const foundNames = depts.map((d) => d.name);
    const missing = expectedVerticals.filter((name) => !foundNames.includes(name));

    if (missing.length === 0 && depts.length === 9) {
      recordCheck(
        "9 Strategic Verticals Display",
        `All 9 strategic verticals present with live data: [${foundNames.join(", ")}]`,
        "PASS"
      );
    } else {
      recordCheck(
        "9 Strategic Verticals Display",
        `Expected 9 verticals, found ${depts.length}. Missing: [${missing.join(", ")}]`,
        "FAIL"
      );
    }
  } catch (err) {
    recordCheck("9 Strategic Verticals Display", err.message, "FAIL");
  }

  // 1.6 Confirm each vertical card provides all minimum required fields
  try {
    const depts = dashboardData.departments || [];
    let allCardsValid = true;
    let cardIssue = "";

    for (const d of depts) {
      if (
        d.readiness === undefined ||
        !d.rag ||
        d.open_items === undefined ||
        d.critical_issues === undefined ||
        d.pending_vc === undefined ||
        d.last_updated === undefined
      ) {
        allCardsValid = false;
        cardIssue = `Department ${d.name} missing one or more required card fields`;
        break;
      }
    }

    if (allCardsValid) {
      recordCheck(
        "Vertical Card Minimum Required Fields",
        `All 9 cards contain: Readiness, RAG Status, Open Actions, Delayed/Red, VC Decisions, Last Updated`,
        "PASS"
      );
    } else {
      recordCheck("Vertical Card Minimum Required Fields", cardIssue, "FAIL");
    }
  } catch (err) {
    recordCheck("Vertical Card Minimum Required Fields", err.message, "FAIL");
  }

  // --------------------------------------------------------------------------
  // SECTION 2: 7-COLUMN ACTION TRACKER (CREATE, READ, UPDATE, DELETE)
  // --------------------------------------------------------------------------
  console.log("--- 2. VERIFYING 7-COLUMN ACTION TRACKER (DATABASE PERSISTENCE) ---");

  let testActionPointId;
  const initialVcDecisions = dashboardData?.summary?.pending_decisions || 0;
  const initialSemiconVc = dashboardData?.departments?.find((d) => d.id === 1)?.pending_vc || 0;

  // 2.1 Create Action Point with exactly 7 columns
  try {
    const createRes = await fetch(`${BASE_URL}/api/workstreams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: semiconSession.cookie,
      },
      body: JSON.stringify({
        department_id: 1,
        action_point: "Commissioning of ISO-5 cleanroom HEPA filters and air handling units",
        ownership: "Semicon Technical Lead",
        timeline: "2026-11-30",
        status: "In Progress",
        rag_status: "AMBER",
        remarks: "VC approval required for final vendor contract sign-off.",
        vc_decision_required: "Yes",
      }),
    });
    const createData = await createRes.json();
    if (createRes.ok && createData.success && createData.workstream) {
      testActionPointId = createData.workstream.id;
      const ws = createData.workstream;
      const hasAll7 =
        ws.action_point &&
        ws.ownership &&
        ws.timeline &&
        ws.status &&
        ws.rag_status &&
        ws.remarks &&
        ws.vc_decision_required === "Yes";

      if (hasAll7) {
        recordCheck(
          "7-Column Action Point Creation & DB Save",
          `Created item ID ${ws.id} with all 7 columns persisted in PostgreSQL`,
          "PASS"
        );
      } else {
        recordCheck("7-Column Action Point Creation & DB Save", "One or more of 7 columns failed to persist", "FAIL");
      }
    } else {
      recordCheck("7-Column Action Point Creation & DB Save", JSON.stringify(createData), "FAIL");
    }
  } catch (err) {
    recordCheck("7-Column Action Point Creation & DB Save", err.message, "FAIL");
  }

  // 2.2 Verify Action Point Read Back from Department API
  try {
    const deptRes = await fetch(`${BASE_URL}/api/departments/1`, {
      headers: { Cookie: semiconSession.cookie },
    });
    const deptData = await deptRes.json();
    const fetchedWs = deptData.items?.find((item) => item.id === testActionPointId);

    if (fetchedWs && fetchedWs.action_point.includes("ISO-5 cleanroom HEPA filters")) {
      recordCheck(
        "7-Column Action Point Read Back",
        `Successfully retrieved item ID ${testActionPointId} from department items table`,
        "PASS"
      );
    } else {
      recordCheck("7-Column Action Point Read Back", `Item ${testActionPointId} not found in department items`, "FAIL");
    }
  } catch (err) {
    recordCheck("7-Column Action Point Read Back", err.message, "FAIL");
  }

  // --------------------------------------------------------------------------
  // SECTION 3: VICE CHAIRMAN DECISION REQUIRED COUNT UPDATES
  // --------------------------------------------------------------------------
  console.log("--- 3. VERIFYING VICE CHAIRMAN DECISION REQUIRED COUNT DYNAMICS ---");

  // 3.1 Verify VC Decision Required Count Increment when 'Yes'
  try {
    const resAfterAdd = await fetch(`${BASE_URL}/api/executive/summary`, {
      headers: { Cookie: adminSession.cookie },
    });
    const dataAfterAdd = await resAfterAdd.json();
    const newVcDecisions = dataAfterAdd.summary.pending_decisions;
    const newSemiconVc = dataAfterAdd.departments.find((d) => d.id === 1)?.pending_vc;

    const inAttention = dataAfterAdd.management_attention.some((x) => x.id === testActionPointId);

    if (newVcDecisions === initialVcDecisions + 1 && newSemiconVc === initialSemiconVc + 1 && inAttention) {
      recordCheck(
        "VC Decision Count Increment (Yes)",
        `Overall count increased to ${newVcDecisions} (+1) and Semicon VC increased to ${newSemiconVc} (+1); Visible in Management Attention table`,
        "PASS"
      );
    } else {
      recordCheck(
        "VC Decision Count Increment (Yes)",
        `Expected total ${initialVcDecisions + 1} and semicon ${initialSemiconVc + 1}; got total ${newVcDecisions}, semicon ${newSemiconVc}, inAttention: ${inAttention}`,
        "FAIL"
      );
    }
  } catch (err) {
    recordCheck("VC Decision Count Increment (Yes)", err.message, "FAIL");
  }

  // 3.2 Update VC Decision Required from 'Yes' to 'No'
  try {
    const updateRes = await fetch(`${BASE_URL}/api/workstreams/${testActionPointId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: semiconSession.cookie,
      },
      body: JSON.stringify({
        action_point: "Commissioning of ISO-5 cleanroom HEPA filters (Internal Resolved)",
        ownership: "Semicon Technical Lead",
        timeline: "2026-11-30",
        status: "In Progress",
        rag_status: "GREEN",
        remarks: "Internal vendor selection approved, no executive VC action required.",
        vc_decision_required: "No",
      }),
    });
    const updateData = await updateRes.json();

    const resAfterNo = await fetch(`${BASE_URL}/api/executive/summary`, {
      headers: { Cookie: adminSession.cookie },
    });
    const dataAfterNo = await resAfterNo.json();
    const countAfterNo = dataAfterNo.summary.pending_decisions;
    const semiconAfterNo = dataAfterNo.departments.find((d) => d.id === 1)?.pending_vc;

    if (countAfterNo === initialVcDecisions && semiconAfterNo === initialSemiconVc) {
      recordCheck(
        "VC Decision Count Decrement (No)",
        `Changing VC Decision Required to 'No' correctly decreased pending decisions count back to ${countAfterNo}`,
        "PASS"
      );
    } else {
      recordCheck(
        "VC Decision Count Decrement (No)",
        `Expected count ${initialVcDecisions}, got ${countAfterNo} (semicon: ${semiconAfterNo})`,
        "FAIL"
      );
    }
  } catch (err) {
    recordCheck("VC Decision Count Decrement (No)", err.message, "FAIL");
  }

  // 3.3 Clean up test action point
  try {
    const delRes = await fetch(`${BASE_URL}/api/workstreams/${testActionPointId}`, {
      method: "DELETE",
      headers: { Cookie: semiconSession.cookie },
    });
    if (delRes.ok) {
      recordCheck(
        "Clean Up Test Record",
        `Successfully deleted temporary action point ID ${testActionPointId}`,
        "PASS"
      );
    } else {
      recordCheck("Clean Up Test Record", `Failed to delete item ${testActionPointId}`, "FAIL");
    }
  } catch (err) {
    recordCheck("Clean Up Test Record", err.message, "FAIL");
  }

  // --------------------------------------------------------------------------
  // SUMMARY REPORT TABLE
  // --------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log("FINAL VERIFICATION SUMMARY TABLE");
  console.log("===============================================================================");
  console.log("CHECK | RESULT | STATUS");
  console.log("-------------------------------------------------------------------------------");
  for (const r of results) {
    console.log(`${r.check} | ${r.result} | ${r.status}`);
  }

  const allPassed = results.every((r) => r.status === "PASS");
  console.log("-------------------------------------------------------------------------------");
  if (allPassed) {
    console.log(`🎉 ALL ${results.length} VERIFICATION CHECKS PASSED WITH 100% SUCCESS!`);
  } else {
    const failCount = results.filter((r) => r.status === "FAIL").length;
    console.log(`⚠️ ${failCount} of ${results.length} checks failed.`);
  }
  console.log("===============================================================================\n");
}

runComprehensiveVerification().catch((err) => {
  console.error("Test runner encountered an error:", err);
  process.exit(1);
});
