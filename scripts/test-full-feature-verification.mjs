const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("==========================================================");
  console.log("   RIASAT EXECUTIVE CONTROL TOWER ACCEPTANCE TEST SUITE   ");
  console.log("==========================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${details ? `(${details})` : ""}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details ? `[Details: ${details}]` : ""}`);
      failed++;
    }
  }

  // Helper to login and get cookies
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
    // 1. TEST EXECUTIVE SUMMARY & DASHBOARD GRAPHS
    console.log("\n--- TEST 1: Executive Dashboard Graphs & Financial Metrics ---");
    const { res: loginVcRes, data: vcData, cookie: vcCookie } = await login("vicechairman@riasat.ac.in", "ViceChairman@123");
    assert(loginVcRes.ok && vcData.user?.role?.includes("Vice Chairman"), "Vice Chairman Login", `Role: ${vcData.user?.role}`);

    const summaryRes = await fetch(`${BASE_URL}/api/executive/summary`, {
      headers: { Cookie: vcCookie },
    });
    const summaryData = await summaryRes.json();
    assert(summaryRes.ok, "Fetch Executive Summary API");
    assert(summaryData.graphs !== undefined, "Dashboard Graphs payload present");
    assert(Array.isArray(summaryData.graphs?.readiness) && summaryData.graphs.readiness.length === 8, "Readiness Graph has all 8 verticals", `Count: ${summaryData.graphs?.readiness?.length}`);
    assert(Array.isArray(summaryData.graphs?.financials) && summaryData.graphs.financials.length === 8, "Capex vs Revenue Graph present for all 8 verticals", `Count: ${summaryData.graphs?.financials?.length}`);
    assert(summaryData.summary?.total_capex !== undefined && summaryData.summary?.total_revenue_pipeline !== undefined, "Financial aggregates calculated", `Capex: ₹${summaryData.summary?.total_capex} Cr, Rev: ₹${summaryData.summary?.total_revenue_pipeline} Cr`);
    assert(Array.isArray(summaryData.management_attention) && summaryData.management_attention.length > 0, "Management Attention items list present for filtering", `Items: ${summaryData.management_attention.length}`);

    // 2. TEST ADMIN DYNAMIC FORM CONFIGURATION
    console.log("\n--- TEST 2: Admin Dynamic Form Headings Configuration ---");
    const { res: loginAdminRes, data: adminData, cookie: adminCookie } = await login("admin@riasat.ac.in", "Admin@123");
    assert(loginAdminRes.ok, "Admin Login", adminData.user?.name);

    // Fetch fields for Semicon (Dept ID: 1)
    const getFieldsRes = await fetch(`${BASE_URL}/api/admin/forms/fields?department_id=1`, {
      headers: { Cookie: adminCookie },
    });
    const getFieldsData = await getFieldsRes.json();
    assert(getFieldsRes.ok, "Fetch Form Fields for Semicon (Vertical 1)");
    assert(Array.isArray(getFieldsData.fields) && getFieldsData.fields.length >= 7, "Semicon has seeded dynamic overview fields", `Field count: ${getFieldsData.fields.length}`);

    // Create a new dynamic field
    const testFieldLabel = `Automated Partner Metric ${Date.now()}`;
    const addFieldRes = await fetch(`${BASE_URL}/api/admin/forms/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        department_id: "1",
        label: testFieldLabel,
        field_type: "Short Text",
        required: true,
        display_order: 99,
        help_text: "Created via automated acceptance test",
      }),
    });
    const addFieldData = await addFieldRes.json();
    assert(addFieldRes.ok && addFieldData.field?.id, "Admin adds new dynamic form field without code changes", `Field ID: ${addFieldData.field?.id}`);

    const newFieldId = addFieldData.field?.id;

    // Modify the heading / label of the field dynamically
    const updatedHeading = `Updated Cleanroom Heading ${Date.now()}`;
    const updateFieldRes = await fetch(`${BASE_URL}/api/admin/forms/fields`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        id: newFieldId,
        label: updatedHeading,
        help_text: "Updated heading label test",
      }),
    });
    const updateFieldData = await updateFieldRes.json();
    assert(updateFieldRes.ok && updateFieldData.field?.label === updatedHeading, "Admin updates form heading dynamically", `New Label: ${updateFieldData.field?.label}`);

    // 3. TEST DEPARTMENT HEAD ACCESS & FORM SUBMISSION (DRAFT VS SUBMITTED)
    console.log("\n--- TEST 3: Department Head Dynamic Form & Save Draft / Submit ---");
    // Admin provisions a fresh Semicon department head to ensure clean testing
    const deptHeadEmail = `semicon.head.test.${Date.now()}@riasat.ac.in`;
    const createHeadRes = await fetch(`${BASE_URL}/api/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        name: "Dr. Arun Kumar (Semicon Head)",
        email: deptHeadEmail,
        mobile: "+91 98888 12345",
        designation: "Semiconductor Vertical Director",
        role: "Department Head",
        department_id: 1,
        status: "Active",
        password: "HeadPassword@123",
      }),
    });
    const createHeadData = await createHeadRes.json();
    assert(createHeadRes.ok && createHeadData.user?.id, "Admin provisions active Department Head for Semicon", deptHeadEmail);

    const { res: loginDeptRes, data: deptUserData, cookie: deptCookie } = await login(deptHeadEmail, "HeadPassword@123");
    assert(loginDeptRes.ok, "Semicon Department Head Login", deptUserData.user?.name);

    // Fetch department form as Dept Head
    const deptFormRes = await fetch(`${BASE_URL}/api/departments/1/form`, {
      headers: { Cookie: deptCookie },
    });
    const deptFormData = await deptFormRes.json();
    assert(deptFormRes.ok, "Dept Head fetches dynamic form fields");
    const foundUpdatedField = deptFormData.fields?.find((f) => f.id === newFieldId);
    assert(Boolean(foundUpdatedField), "Dept Head sees dynamically modified heading from Admin", foundUpdatedField?.label);

    // Submit Draft
    const draftRes = await fetch(`${BASE_URL}/api/departments/1/form`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: deptCookie },
      body: JSON.stringify({
        status: "DRAFT",
        values: {
          [newFieldId]: "Draft Partner Details Value",
        },
      }),
    });
    const draftData = await draftRes.json();
    assert(draftRes.ok && draftData.status === "DRAFT", "Save Draft workflow succeeds", `Status: ${draftData.status}`);

    // Submit Live Update (Readiness score 88%, RAG GREEN)
    const readinessField = deptFormData.fields.find((f) => f.field_key === "readiness_score");
    const ragField = deptFormData.fields.find((f) => f.field_key === "rag_status");

    const submitRes = await fetch(`${BASE_URL}/api/departments/1/form`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: deptCookie },
      body: JSON.stringify({
        status: "SUBMITTED",
        values: {
          [newFieldId]: "Final Verified Partner Value",
          [readinessField.id]: "88",
          [ragField.id]: "GREEN",
        },
      }),
    });
    const submitData = await submitRes.json();
    assert(submitRes.ok && submitData.status === "SUBMITTED", "Submit Update workflow succeeds and syncs to overview", `Status: ${submitData.status}`);

    // Verify Executive Tower reflects the submitted update immediately
    const verifySummaryRes = await fetch(`${BASE_URL}/api/executive/summary`, {
      headers: { Cookie: vcCookie },
    });
    const verifySummaryData = await verifySummaryRes.json();
    const semiconCard = verifySummaryData.departments.find((d) => d.id === 1);
    assert(semiconCard && semiconCard.readiness === 88 && semiconCard.rag === "GREEN" && semiconCard.submission_status === "SUBMITTED", "Live Executive Dashboard immediately reflects Semicon 88% Green", `Readiness: ${semiconCard?.readiness}%, Status: ${semiconCard?.submission_status}`);

    // 4. TEST AUDIT LOGS RECORDING
    console.log("\n--- TEST 4: Verifiable Audit Trail ---");
    const auditRes = await fetch(`${BASE_URL}/api/audit-log?limit=10`, {
      headers: { Cookie: adminCookie },
    });
    const auditData = await auditRes.json();
    assert(auditRes.ok, "Fetch Audit Trail API");
    const hasFormFieldAudit = auditData.logs.some((l) => l.action.includes("FORM") || l.action.includes("UPDATE") || l.action.includes("CREATE"));
    assert(hasFormFieldAudit, "Audit log records dynamic form modifications and submission actions");

  } catch (err) {
    console.error("Test execution encountered an error:", err);
    failed++;
  }

  console.log("\n==========================================================");
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================");
  if (failed > 0) process.exit(1);
}

runTests();
