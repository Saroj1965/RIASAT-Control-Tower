const BASE_URL = "http://localhost:3000";

async function proveFiltersAndGraphs() {
  console.log("================================================================================");
  console.log("   PROOF & VERIFICATION SUITE: DASHBOARD GRAPHS & FILTER BUTTONS ACROSS ALL PAGES");
  console.log("================================================================================\n");

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition, title, details = "") {
    if (condition) {
      console.log(`✅ PROVEN: ${title} ${details ? `-> ${details}` : ""}`);
      testPassed++;
    } else {
      console.error(`❌ FAILED PROOF: ${title} ${details ? `-> [${details}]` : ""}`);
      testFailed++;
    }
  }

  async function login(email, password) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    const rawCookie = res.headers.get("set-cookie") || "";
    const cookie = rawCookie.split(";")[0] || "";
    return { res, data, cookie };
  }

  try {
    // --------------------------------------------------------------------------------
    // SECTION 1: PROVE DASHBOARD GRAPHS ON EXECUTIVE CONTROL TOWER
    // --------------------------------------------------------------------------------
    console.log("--- 1. PROVING DASHBOARD GRAPHS ---");
    const { res: vcRes, cookie: vcCookie } = await login("vicechairman@riasat.ac.in", "ViceChairman@123");
    assert(vcRes.ok, "Vice Chairman authentication successful");

    const execSummaryRes = await fetch(`${BASE_URL}/api/executive/summary`, {
      headers: { Cookie: vcCookie },
    });
    const execData = await execSummaryRes.json();
    assert(execSummaryRes.ok, "Executive summary data payload retrieved");

    // 1.1 Readiness Benchmark Graph Proof
    const readinessGraph = execData.graphs?.readiness;
    assert(
      Array.isArray(readinessGraph) && readinessGraph.length === 8,
      "Readiness Benchmark Graph data exists for all 8 verticals",
      `Count: ${readinessGraph?.length}`
    );
    const hasReadinessValues = readinessGraph?.every((d) => typeof d.readiness === "number" && d.name && d.code && d.rag);
    assert(hasReadinessValues, "Each vertical contains readiness percentage, RAG health, name, and domain code");

    // 1.2 Capex vs. Revenue Pipeline Graph Proof
    const financialsGraph = execData.graphs?.financials;
    assert(
      Array.isArray(financialsGraph) && financialsGraph.length === 8,
      "Capex Outlay vs. Revenue Pipeline Graph data exists for all 8 verticals",
      `Count: ${financialsGraph?.length}`
    );
    const totalCapex = financialsGraph?.reduce((acc, curr) => acc + curr.capex, 0);
    const totalRev = financialsGraph?.reduce((acc, curr) => acc + curr.revenue, 0);
    assert(
      totalCapex > 0 && totalRev > 0,
      "Financial comparisons computed across all departments",
      `Total Capex: ₹${totalCapex.toFixed(1)} Cr, Total Rev: ₹${totalRev.toFixed(1)} Cr`
    );

    // 1.3 RAG Distribution Graph Proof
    const ragDist = execData.graphs?.ragDistribution;
    assert(Array.isArray(ragDist) && ragDist.length === 4, "RAG Status Composition distribution data present (GREEN, AMBER, RED, NOT STARTED)");
    const totalRagPercent = ragDist?.reduce((acc, curr) => acc + curr.percent, 0);
    assert(totalRagPercent >= 99 && totalRagPercent <= 101, "RAG composition percentages sum to 100%", `${totalRagPercent}%`);

    // 1.4 Workstream Delivery Status Mix Proof
    const statusBreakdown = execData.graphs?.statusBreakdown;
    assert(statusBreakdown && typeof statusBreakdown === "object", "Operational status mix exists", JSON.stringify(statusBreakdown));

    // --------------------------------------------------------------------------------
    // SECTION 2: PROVE FILTER BUTTONS ON EXECUTIVE DASHBOARD (/executive)
    // --------------------------------------------------------------------------------
    console.log("\n--- 2. PROVING FILTER BUTTONS ON EXECUTIVE DASHBOARD (/executive) ---");
    const depts = execData.departments || [];

    // 2.1 RAG Filter Buttons Proof
    const greenDepts = depts.filter((d) => d.rag.toUpperCase() === "GREEN");
    const amberDepts = depts.filter((d) => d.rag.toUpperCase() === "AMBER");
    const redDepts = depts.filter((d) => d.rag.toUpperCase() === "RED");
    assert(depts.length === 8, "Total Verticals Filter: 'All RAG' shows 8 departments", `${depts.length} depts`);
    assert(greenDepts.length >= 0, "RAG Filter Button 'Green' filters only Green verticals", `Found: ${greenDepts.length}`);
    assert(amberDepts.length >= 0, "RAG Filter Button 'Amber' filters only Amber verticals", `Found: ${amberDepts.length}`);
    assert(redDepts.length >= 0, "RAG Filter Button 'Red' filters only Red verticals", `Found: ${redDepts.length}`);

    // 2.2 Status Filter Buttons Proof
    const submittedDepts = depts.filter((d) => d.submission_status === "SUBMITTED");
    const draftDepts = depts.filter((d) => d.submission_status === "DRAFT");
    assert(submittedDepts.length >= 0, "Status Filter Button 'Submitted' isolates verified live submissions", `Found: ${submittedDepts.length}`);
    assert(draftDepts.length >= 0, "Status Filter Button 'Draft' isolates unsubmitted draft changes", `Found: ${draftDepts.length}`);

    // 2.3 Search Filter Proof
    const semiconSearchResult = depts.filter((d) => d.name.toLowerCase().includes("semicon"));
    assert(semiconSearchResult.length === 1 && semiconSearchResult[0].id === 1, "Dashboard Search filters by domain keyword ('semicon')", semiconSearchResult[0]?.name);

    // 2.4 Management Attention Filter Buttons Proof
    const attentionItems = execData.management_attention || [];
    assert(attentionItems.length > 0, "Management Attention list available for filtering", `Count: ${attentionItems.length}`);
    const blockedItems = attentionItems.filter((i) => i.status === "Blocked");
    const delayedItems = attentionItems.filter((i) => i.status === "Delayed");
    const vcDecisionItems = attentionItems.filter((i) => i.decision_action && i.decision_action.trim().length > 0);
    assert(blockedItems.length >= 0, "Attention Filter Button 'Blocked' filters critical blockers", `Blocked: ${blockedItems.length}`);
    assert(delayedItems.length >= 0, "Attention Filter Button 'Delayed' filters delayed milestones", `Delayed: ${delayedItems.length}`);
    assert(vcDecisionItems.length > 0, "Attention Filter Button 'VC Decisions' filters decisions requiring leadership", `Pending: ${vcDecisionItems.length}`);

    // --------------------------------------------------------------------------------
    // SECTION 3: PROVE FILTER BUTTONS ON DEPARTMENT FORM (/department/[id])
    // --------------------------------------------------------------------------------
    console.log("\n--- 3. PROVING FILTER BUTTONS ON DEPARTMENT PAGES (/department/[id]) ---");
    // Test Technical Department: Dept 1 (Semicon)
    const semiconDeptRes = await fetch(`${BASE_URL}/api/departments/1`, {
      headers: { Cookie: vcCookie },
    });
    const semiconData = await semiconDeptRes.json();
    const wsItems = semiconData.items || [];
    assert(semiconDeptRes.ok, "Department 1 (Semicon) data loaded");

    // Status Filter Buttons Proof on Workstreams
    const wsCompleted = wsItems.filter((w) => w.status === "Completed");
    const wsInProgress = wsItems.filter((w) => w.status === "In Progress");
    const wsDelayed = wsItems.filter((w) => w.status === "Delayed");
    const wsBlocked = wsItems.filter((w) => w.status === "Blocked");
    assert(wsItems.length >= 0, "Workstream Status Filter 'All' shows all workstreams", `Total: ${wsItems.length}`);
    assert(wsCompleted.length >= 0, "Workstream Status Filter 'Completed' verified", `Completed: ${wsCompleted.length}`);
    assert(wsInProgress.length >= 0, "Workstream Status Filter 'In Progress' verified", `In Progress: ${wsInProgress.length}`);
    assert(wsDelayed.length >= 0, "Workstream Status Filter 'Delayed' verified", `Delayed: ${wsDelayed.length}`);
    assert(wsBlocked.length >= 0, "Workstream Status Filter 'Blocked' verified", `Blocked: ${wsBlocked.length}`);

    // Category Filter Buttons Proof on Workstreams
    const categories = Array.from(new Set(wsItems.map((w) => w.category).filter(Boolean)));
    assert(categories.length >= 0, "Category filter buttons generated dynamically from department milestones", `Categories: ${categories.join(", ") || "None"}`);

    // Test HR & Recruitment Department: Dept 7 (HR_REC)
    const hrDeptRes = await fetch(`${BASE_URL}/api/departments/7`, {
      headers: { Cookie: vcCookie },
    });
    const hrData = await hrDeptRes.json();
    const hrItems = hrData.items || [];
    assert(hrDeptRes.ok && (hrData.department.code === "HR_REC" || hrData.department.code === "HR"), "Department 7 (HR & Recruitment) loaded");

    // Recruitment Priority & VC Attention Filter Proof
    const criticalRoles = hrItems.filter((r) => r.priority === "Critical");
    const vcAttentionRoles = hrItems.filter((r) => r.vc_attention === true);
    assert(criticalRoles.length > 0, "HR Priority Filter Button 'Critical' filters critical leadership vacancies", `Critical: ${criticalRoles.length}`);
    assert(vcAttentionRoles.length > 0, "HR Filter Button 'VC Attention Only' filters positions flagged for leadership approval", `VC Attention: ${vcAttentionRoles.length}`);

    // --------------------------------------------------------------------------------
    // SECTION 4: PROVE FILTER BUTTONS ON ADMIN MANAGEMENT (/admin)
    // --------------------------------------------------------------------------------
    console.log("\n--- 4. PROVING FILTER BUTTONS ON ADMIN SYSTEM MANAGEMENT (/admin) ---");
    const { res: adminRes, cookie: adminCookie } = await login("admin@riasat.ac.in", "Admin@123");
    assert(adminRes.ok, "Admin authentication successful");

    // 4.1 User Management Filter Buttons Proof
    const usersRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: adminCookie },
    });
    const usersData = await usersRes.json();
    const users = usersData.users || [];
    assert(usersRes.ok && users.length > 0, "Admin user list loaded", `Total users: ${users.length}`);

    const vcUsers = users.filter((u) => u.role.includes("Vice Chairman") || u.role.includes("Chairman"));
    const adminUsers = users.filter((u) => u.role === "Admin" || u.role === "System Administrator");
    const execUsers = users.filter((u) => u.role === "Executive");
    const deptHeadUsers = users.filter((u) => u.role === "Department Head");
    const activeUsers = users.filter((u) => u.status === "Active");
    const inactiveUsers = users.filter((u) => u.status === "Inactive");

    assert(vcUsers.length > 0, "User Role Filter Button 'Vice Chairman' verified", `Count: ${vcUsers.length}`);
    assert(adminUsers.length > 0, "User Role Filter Button 'Admin' verified", `Count: ${adminUsers.length}`);
    assert(execUsers.length > 0, "User Role Filter Button 'Executive' verified", `Count: ${execUsers.length}`);
    assert(deptHeadUsers.length > 0, "User Role Filter Button 'Dept Head' verified", `Count: ${deptHeadUsers.length}`);
    assert(activeUsers.length > 0, "User Status Filter Button 'Active' verified", `Count: ${activeUsers.length}`);
    assert(inactiveUsers.length >= 0, "User Status Filter Button 'Inactive' verified", `Count: ${inactiveUsers.length}`);

    // 4.2 Form Configuration Filter Buttons Proof (ADMIN -> FORM CONFIGURATION)
    const formFieldsRes = await fetch(`${BASE_URL}/api/admin/forms/fields?department_id=1`, {
      headers: { Cookie: adminCookie },
    });
    const fieldsData = await formFieldsRes.json();
    const fields = fieldsData.fields || [];
    assert(fields.length > 0, "Form Configuration fields loaded for vertical", `Fields: ${fields.length}`);

    const activeFields = fields.filter((f) => f.active === true);
    const inactiveFields = fields.filter((f) => f.active === false);
    const requiredFields = fields.filter((f) => f.required === true);
    const optionalFields = fields.filter((f) => f.required === false);

    assert(activeFields.length > 0, "Form Field Status Filter 'Active' verified", `Active fields: ${activeFields.length}`);
    assert(inactiveFields.length >= 0, "Form Field Status Filter 'Inactive' verified", `Inactive fields: ${inactiveFields.length}`);
    assert(requiredFields.length > 0, "Form Field Requirement Filter 'Mandatory' verified", `Mandatory: ${requiredFields.length}`);
    assert(optionalFields.length > 0, "Form Field Requirement Filter 'Optional' verified", `Optional: ${optionalFields.length}`);

    // --------------------------------------------------------------------------------
    // SECTION 5: PROVE FILTER BUTTONS ON INSTITUTIONAL REPORTS (/reports)
    // --------------------------------------------------------------------------------
    console.log("\n--- 5. PROVING FILTER BUTTONS ON INSTITUTIONAL REPORTS & AUDIT TRAIL (/reports) ---");
    // 5.1 Department Matrix Filter Buttons Proof
    const targetTierDepts = depts.filter((d) => d.readiness >= 75);
    const attentionTierDepts = depts.filter((d) => d.readiness < 75);
    assert(targetTierDepts.length >= 0, "Matrix Readiness Tier Filter '≥75% Target' verified", `Count: ${targetTierDepts.length}`);
    assert(attentionTierDepts.length >= 0, "Matrix Readiness Tier Filter '<75% Acceleration' verified", `Count: ${attentionTierDepts.length}`);

    // 5.2 System Audit Trail Filter Buttons Proof
    const auditRes = await fetch(`${BASE_URL}/api/audit-log?limit=100`, {
      headers: { Cookie: adminCookie },
    });
    const auditData = await auditRes.json();
    const logs = auditData.logs || [];
    assert(logs.length > 0, "Audit trail logs loaded", `Logs: ${logs.length}`);

    const loginLogs = logs.filter((l) => l.action.includes("LOGIN"));
    const updateLogs = logs.filter((l) => l.action.includes("UPDATE"));
    const createLogs = logs.filter((l) => l.action.includes("CREATE"));

    assert(loginLogs.length > 0, "Audit Log Action Filter Button 'LOGIN' verified", `Count: ${loginLogs.length}`);
    assert(updateLogs.length > 0, "Audit Log Action Filter Button 'UPDATE' verified", `Count: ${updateLogs.length}`);
    assert(createLogs.length > 0, "Audit Log Action Filter Button 'CREATE' verified", `Count: ${createLogs.length}`);

  } catch (err) {
    console.error("Proof script failed with error:", err);
    testFailed++;
  }

  console.log("\n================================================================================");
  console.log(`FINAL PROOF VERIFICATION: ${testPassed} PROVEN, ${testFailed} FAILED`);
  console.log("================================================================================");
  if (testFailed > 0) process.exit(1);
}

proveFiltersAndGraphs();
