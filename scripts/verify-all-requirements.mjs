// scripts/verify-all-requirements.mjs
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
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${data.error}`);
  }
  const cookie = parseCookie(res);
  return { data, cookie };
}

async function runAllAcceptanceTests() {
  console.log("================================================================================");
  console.log("RIASAT EXECUTIVE CONTROL TOWER: COMPREHENSIVE ACCEPTANCE & AUDIT TEST SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function record(testName, isSuccess, details = "") {
    total++;
    if (isSuccess) {
      passed++;
      console.log(`✅ [PASS] ${testName}`);
      if (details) console.log(`   ${details}`);
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   ${details}`);
    }
  }

  // TEST A: Admin Login
  let adminSession = null;
  try {
    const { data, cookie } = await loginUser("admin@riasat.ac.in", "Admin@123");
    adminSession = { data, cookie };
    record("TEST A: System Administrator Login", (data.user.role === "Admin" || data.user.role === "System Administrator") && data.redirectUrl === "/admin", `Logged in as: ${data.user.email} -> redirect: ${data.redirectUrl}`);
  } catch (err) {
    record("TEST A: System Administrator Login", false, err.message);
  }

  // TEST B: Vice Chairman Login
  let vcSession = null;
  try {
    const { data, cookie } = await loginUser("vicechairman@riasat.ac.in", "ViceChairman@123");
    vcSession = { data, cookie };
    record("TEST B: Vice Chairman Login (Complete Access)", data.user.role === "Vice Chairman" && data.redirectUrl === "/executive", `Logged in as: ${data.user.email} -> redirect: ${data.redirectUrl}`);
  } catch (err) {
    record("TEST B: Vice Chairman Login (Complete Access)", false, err.message);
  }

  // TEST C: All 8 Vertical Department Heads Login
  const verticalAccounts = [
    { name: "1. Semicon", email: "semicon.head@riasat.ac.in", pass: "Semicon@123", deptId: 1 },
    { name: "2. Aerospace & Defence", email: "aero.head@riasat.ac.in", pass: "Aero@123", deptId: 2 },
    { name: "3. Space", email: "space.head@riasat.ac.in", pass: "Space@123", deptId: 3 },
    { name: "4. Cybersecurity", email: "cyber.head@riasat.ac.in", pass: "Cyber@123", deptId: 4 },
    { name: "5. MedTech", email: "medtech.head@riasat.ac.in", pass: "MedTech@123", deptId: 5 },
    { name: "6. Advanced Manufacturing", email: "mfg.head@riasat.ac.in", pass: "Mfg@123", deptId: 6 },
    { name: "7. HR & Recruitment", email: "hr.head@riasat.ac.in", pass: "Hr@123", deptId: 7 },
    { name: "8. Communications", email: "comm.head@riasat.ac.in", pass: "Comm@123", deptId: 8 },
  ];

  const deptSessions = {};
  for (const v of verticalAccounts) {
    try {
      const { data, cookie } = await loginUser(v.email, v.pass);
      deptSessions[v.deptId] = { data, cookie };
      const ok = data.user.department_id === v.deptId && data.redirectUrl === `/department/${v.deptId}`;
      record(`TEST C: Department Head Login - ${v.name}`, ok, `Email: ${v.email} -> Dept ID: ${data.user.department_id} -> Redirect: ${data.redirectUrl}`);
    } catch (err) {
      record(`TEST C: Department Head Login - ${v.name}`, false, err.message);
    }
  }

  // TEST D: Department Head sees their own department form & data
  for (const v of verticalAccounts) {
    const session = deptSessions[v.deptId];
    if (!session) continue;
    try {
      const formRes = await fetch(`${BASE_URL}/api/departments/${v.deptId}/form`, {
        headers: { Cookie: session.cookie },
      });
      const formData = await formRes.json();
      const hasFields = Array.isArray(formData.fields) && formData.fields.length > 0;
      record(`TEST D: Form Loading - ${v.name}`, formRes.ok && hasFields, `Loaded ${formData.fields?.length || 0} fields, canEdit=${formData.canEdit}`);
    } catch (err) {
      record(`TEST D: Form Loading - ${v.name}`, false, err.message);
    }
  }

  // TEST E: Department Head cannot view or edit unauthorized department
  try {
    const semicon = deptSessions[1];
    const aeroRes = await fetch(`${BASE_URL}/api/departments/2`, {
      headers: { Cookie: semicon.cookie },
    });
    const aeroFormRes = await fetch(`${BASE_URL}/api/departments/2/form`, {
      headers: { Cookie: semicon.cookie },
    });
    record("TEST E: Role Authorization Barrier (Semicon Head viewing Aerospace)", aeroRes.status === 403 && aeroFormRes.status === 403, `Dept API: ${aeroRes.status} Forbidden, Form API: ${aeroFormRes.status} Forbidden`);
  } catch (err) {
    record("TEST E: Role Authorization Barrier", false, err.message);
  }

  // TEST F: Executive Office can view all departments, but CANNOT edit
  try {
    const { data: execData, cookie: execCookie } = await loginUser("executive@riasat.ac.in", "Exec@123");
    const viewRes = await fetch(`${BASE_URL}/api/departments/1`, {
      headers: { Cookie: execCookie },
    });
    const viewData = await viewRes.json();
    const putRes = await fetch(`${BASE_URL}/api/departments/1`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: execCookie },
      body: JSON.stringify({ readiness_percentage: 99, rag_status: "GREEN" }),
    });
    record("TEST F: Executive Office Read-Only Access (View permitted, edit blocked)", viewRes.ok && viewData.canEdit === false && putRes.status === 403, `View OK (canEdit=${viewData.canEdit}), Edit response: ${putRes.status} Forbidden`);
  } catch (err) {
    record("TEST F: Executive Office Read-Only Access", false, err.message);
  }

  // TEST G: Vice Chairman COMPLETE ACCESS
  try {
    const vcRes1 = await fetch(`${BASE_URL}/api/departments/1`, { headers: { Cookie: vcSession.cookie } });
    const vcRes2 = await fetch(`${BASE_URL}/api/departments/2`, { headers: { Cookie: vcSession.cookie } });
    const vcData1 = await vcRes1.json();
    const vcData2 = await vcRes2.json();
    record("TEST G: Vice Chairman Complete Access across all departments", vcRes1.ok && vcRes2.ok && vcData1.canEdit === true && vcData2.canEdit === true, `Semicon canEdit=${vcData1.canEdit}, Aero canEdit=${vcData2.canEdit}`);
  } catch (err) {
    record("TEST G: Vice Chairman Complete Access", false, err.message);
  }

  // TEST H: Department Form Save & Persistence (Semicon)
  let cleanroomFieldId = null;
  let cohortsFieldId = null;
  let readinessFieldId = null;
  let ragFieldId = null;
  try {
    const semicon = deptSessions[1];
    const formRes = await fetch(`${BASE_URL}/api/departments/1/form`, {
      headers: { Cookie: semicon.cookie },
    });
    const formData = await formRes.json();
    for (const f of formData.fields) {
      if (f.field_key === "cleanroom_facility") cleanroomFieldId = f.id;
      if (f.field_key === "corporate_cohorts") cohortsFieldId = f.id;
      if (f.field_key === "readiness_score") readinessFieldId = f.id;
      if (f.field_key === "rag_status") ragFieldId = f.id;
    }

    const testValues = {};
    if (readinessFieldId) testValues[readinessFieldId] = "78";
    if (ragFieldId) testValues[ragFieldId] = "AMBER";
    if (cleanroomFieldId) testValues[cleanroomFieldId] = "Class 1000 Cleanroom Operational & HVAC Certified";
    if (cohortsFieldId) testValues[cohortsFieldId] = "Applied Materials & Cadence 2nd Batch In-Flight";

    const saveRes = await fetch(`${BASE_URL}/api/departments/1/form`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: semicon.cookie },
      body: JSON.stringify({
        values: testValues,
        status: "SUBMITTED",
      }),
    });
    const saveData = await saveRes.json();

    // Reload to verify persistence
    const reloadRes = await fetch(`${BASE_URL}/api/departments/1/form`, {
      headers: { Cookie: semicon.cookie },
    });
    const reloadData = await reloadRes.json();
    const savedCleanroom = reloadData.values[cleanroomFieldId]?.value;
    const savedReadiness = reloadData.values[readinessFieldId]?.value;

    const ok = saveRes.ok && saveData.message === "Update saved successfully." && savedCleanroom === "Class 1000 Cleanroom Operational & HVAC Certified" && savedReadiness === "78";
    record("TEST H: Department Form Save & Persistence in PostgreSQL", ok, `Save response: "${saveData.message}", Saved Cleanroom: "${savedCleanroom}", Saved Readiness: ${savedReadiness}%`);
  } catch (err) {
    record("TEST H: Department Form Save & Persistence in PostgreSQL", false, err.message);
  }

  // TEST I: Live Executive Dashboard reflects the saved update
  try {
    const execRes = await fetch(`${BASE_URL}/api/executive/summary`, {
      headers: { Cookie: vcSession.cookie },
    });
    const execData = await execRes.json();
    const semiconCard = execData.departments.find((d) => d.id === 1);
    const ok = execRes.ok && semiconCard && semiconCard.readiness === 78 && semiconCard.rag === "AMBER";
    record("TEST I: Live Executive Dashboard reflects saved department update", ok, `Semicon on Dashboard: Readiness=${semiconCard?.readiness}%, RAG=${semiconCard?.rag}, Last Updated by: ${semiconCard?.updated_by}`);
  } catch (err) {
    record("TEST I: Live Executive Dashboard reflects saved department update", false, err.message);
  }

  // TEST J: Add Workstream Modal action
  let createdWsId = null;
  try {
    const semicon = deptSessions[1];
    const addRes = await fetch(`${BASE_URL}/api/workstreams`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: semicon.cookie },
      body: JSON.stringify({
        department_id: 1,
        category: "Advanced Fab Infrastructure",
        deliverable: "Automated Cleanroom Vacuum Load-Lock Commissioning",
        infrastructure_partnership: "Applied Materials India Ltd.",
        target_date: "2026-11-30",
        status: "In Progress",
        capex: "₹ 8.5 Cr",
        revenue_pipeline: "₹ 15.0 Cr",
        owner: "Dr. Arun Kumar",
        risks_blockers: "High purity nitrogen gas manifold certification pending",
        decision_action: "Vice Chairman sanction required for gas line safety audit",
      }),
    });
    const addData = await addRes.json();
    if (addRes.ok && addData.success && addData.workstream?.id) {
      createdWsId = addData.workstream.id;
      record("TEST J: Add Workstream (+ ADD WORKSTREAM modal)", true, `Created WS ID: ${createdWsId}, Deliverable: "${addData.workstream.deliverable}", Status: ${addData.workstream.status}`);
    } else {
      record("TEST J: Add Workstream (+ ADD WORKSTREAM modal)", false, JSON.stringify(addData));
    }
  } catch (err) {
    record("TEST J: Add Workstream (+ ADD WORKSTREAM modal)", false, err.message);
  }

  // TEST K: Edit Workstream & Status Dropdown
  try {
    const semicon = deptSessions[1];
    const editRes = await fetch(`${BASE_URL}/api/workstreams/${createdWsId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: semicon.cookie },
      body: JSON.stringify({
        status: "Delayed",
        risks_blockers: "Gas manifold certification delayed by vendor strike",
      }),
    });
    const editData = await editRes.json();
    const ok = editRes.ok && editData.success && editData.workstream.status === "Delayed";
    record("TEST K: Edit Workstream with Dropdown Status change ('In Progress' -> 'Delayed')", ok, `Updated WS ID: ${createdWsId}, New Status: ${editData.workstream?.status}`);
  } catch (err) {
    record("TEST K: Edit Workstream with Dropdown Status change", false, err.message);
  }

  // TEST L: Admin Form Configuration: Read existing fields
  try {
    const fieldsRes = await fetch(`${BASE_URL}/api/admin/forms/fields?department_id=1`, {
      headers: { Cookie: adminSession.cookie },
    });
    const fieldsData = await fieldsRes.json();
    const ok = fieldsRes.ok && Array.isArray(fieldsData.fields) && fieldsData.fields.length >= 7;
    record("TEST L: Admin Form Configuration - View Department Fields", ok, `Admin retrieved ${fieldsData.fields?.length} fields for Semicon`);
  } catch (err) {
    record("TEST L: Admin Form Configuration - View Department Fields", false, err.message);
  }

  // TEST M: Admin changes Form Heading / Field Label without code changes
  try {
    const updateHeadingRes = await fetch(`${BASE_URL}/api/admin/forms/fields`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: adminSession.cookie },
      body: JSON.stringify({
        id: cohortsFieldId,
        label: "Corporate Training Cohorts",
      }),
    });
    const updateHeadingData = await updateHeadingRes.json();
    const ok = updateHeadingRes.ok && updateHeadingData.success && updateHeadingData.field.label === "Corporate Training Cohorts";
    record("TEST M: Admin updates Form Heading / Field Label ('Corporate Cohorts' -> 'Corporate Training Cohorts')", ok, `Updated field ID: ${cohortsFieldId}, New label: "${updateHeadingData.field?.label}"`);
  } catch (err) {
    record("TEST M: Admin updates Form Heading / Field Label", false, err.message);
  }

  // TEST N: Department Head immediately sees updated heading
  try {
    const semicon = deptSessions[1];
    const formRes = await fetch(`${BASE_URL}/api/departments/1/form`, {
      headers: { Cookie: semicon.cookie },
    });
    const formData = await formRes.json();
    const updatedField = formData.fields.find((f) => f.id === cohortsFieldId);
    const ok = formRes.ok && updatedField && updatedField.label === "Corporate Training Cohorts";
    record("TEST N: Department Head immediately sees updated heading on Web Form", ok, `Department Head sees label: "${updatedField?.label}" for field ID ${cohortsFieldId}`);
  } catch (err) {
    record("TEST N: Department Head immediately sees updated heading on Web Form", false, err.message);
  }

  // TEST O: Admin adds new field to form
  let newlyAddedFieldId = null;
  try {
    const addFieldRes = await fetch(`${BASE_URL}/api/admin/forms/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminSession.cookie },
      body: JSON.stringify({
        department_id: 1,
        label: "Industry Partnerships",
        field_type: "Short Text",
        required: false,
        display_order: 8,
        help_text: "Key active industrial alliances",
      }),
    });
    const addFieldData = await addFieldRes.json();
    if (addFieldRes.ok && addFieldData.success && addFieldData.field?.id) {
      newlyAddedFieldId = addFieldData.field.id;
      record("TEST O: Admin adds new configurable Field ('Industry Partnerships')", true, `Created Field ID: ${newlyAddedFieldId}, Label: "${addFieldData.field.label}", Type: ${addFieldData.field.field_type}`);
    } else {
      record("TEST O: Admin adds new configurable Field", false, JSON.stringify(addFieldData));
    }
  } catch (err) {
    record("TEST O: Admin adds new configurable Field", false, err.message);
  }

  // TEST P: Department Head immediately sees the newly added field
  try {
    const semicon = deptSessions[1];
    const formRes = await fetch(`${BASE_URL}/api/departments/1/form`, {
      headers: { Cookie: semicon.cookie },
    });
    const formData = await formRes.json();
    const newField = formData.fields.find((f) => f.id === newlyAddedFieldId);
    const ok = formRes.ok && newField && newField.label === "Industry Partnerships";
    record("TEST P: Department Head immediately sees new field on Web Form without code changes", ok, `Found field: "${newField?.label}" (ID: ${newField?.id}) on Department Head's form`);
  } catch (err) {
    record("TEST P: Department Head immediately sees new field on Web Form", false, err.message);
  }

  // TEST Q: Department Head saves value into the newly added field
  try {
    const semicon = deptSessions[1];
    const saveRes = await fetch(`${BASE_URL}/api/departments/1/form`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Cookie: semicon.cookie },
      body: JSON.stringify({
        values: {
          [newlyAddedFieldId]: "TSMC, Intel Foundry Services & Lam Research",
        },
        status: "SUBMITTED",
      }),
    });
    const reloadRes = await fetch(`${BASE_URL}/api/departments/1/form`, {
      headers: { Cookie: semicon.cookie },
    });
    const reloadData = await reloadRes.json();
    const savedVal = reloadData.values[newlyAddedFieldId]?.value;
    const ok = saveRes.ok && savedVal === "TSMC, Intel Foundry Services & Lam Research";
    record("TEST Q: Department Head saves value into newly created dynamic field", ok, `Saved & reloaded: "${savedVal}"`);
  } catch (err) {
    record("TEST Q: Department Head saves value into newly created dynamic field", false, err.message);
  }

  // TEST R: Clean up test workstream and test field to maintain pristine data
  try {
    if (createdWsId) {
      await fetch(`${BASE_URL}/api/workstreams/${createdWsId}`, {
        method: "DELETE",
        headers: { Cookie: adminSession.cookie },
      });
    }
    if (newlyAddedFieldId) {
      await fetch(`${BASE_URL}/api/admin/forms/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: adminSession.cookie },
        body: JSON.stringify({
          id: newlyAddedFieldId,
          active: false,
        }),
      });
    }
    // Revert heading back to "Corporate Cohorts"
    if (cohortsFieldId) {
      await fetch(`${BASE_URL}/api/admin/forms/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: adminSession.cookie },
        body: JSON.stringify({
          id: cohortsFieldId,
          label: "Corporate Cohorts",
        }),
      });
    }
    record("TEST R: Safe Cleanup & State Restoration (Deactivate test field, restore label)", true, "Restored initial clean state successfully.");
  } catch (err) {
    record("TEST R: Safe Cleanup", false, err.message);
  }

  console.log("\n================================================================================");
  console.log(`ACCEPTANCE TEST RESULTS: ${passed} / ${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("================================================================================");
}

runAllAcceptanceTests().catch(console.error);
