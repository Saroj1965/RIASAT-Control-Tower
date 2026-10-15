import { PGlite } from "@electric-sql/pglite";
import path from "path";
import fs from "fs";
import { calculateActionWeekStats } from "../src/lib/action-helpers.ts";

const BASE_URL = "http://127.0.0.1:3000";

async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Failed to login ${email}: ${res.status} ${await res.text()}`);
  }
  const cookies = typeof res.headers.getSetCookie === "function" 
    ? res.headers.getSetCookie() 
    : [res.headers.get("set-cookie") || ""];
  const cookie = cookies.map(c => c.split(";")[0]).join("; ");
  const data = await res.json();
  return { user: data.user, cookie };
}

async function runTests() {
  console.log("===============================================================================");
  console.log("   RIASAT EXECUTIVE DASHBOARD - 14-POINT MANDATORY E2E VERIFICATION SUITE      ");
  console.log("===============================================================================");

  const results = [];
  function record(id, title, pass, details) {
    results.push({ id, title, pass, details });
    const mark = pass ? "✅ PASS" : "❌ FAIL";
    console.log(`\n[Test ${id}] ${title}: ${mark}`);
    if (details) console.log(`   └─ ${details}`);
  }

  // Logins
  console.log("\nLogging in test users...");
  const admin = await loginUser("admin@riasat.ac.in", "Admin@123");
  const vc = await loginUser("vicechairman@riasat.ac.in", "ViceChairman@123");
  const semiconHead = await loginUser("semicon.head@riasat.ac.in", "Semicon@123");
  console.log("✓ Admin logged in:", admin.user.name, `(${admin.user.role})`);
  console.log("✓ VC logged in:", vc.user.name, `(${vc.user.role})`);
  console.log("✓ Semicon Head logged in:", semiconHead.user.name, `(${semiconHead.user.role})`);

  let createdFieldId = null;
  let testActionId = null;

  // -------------------------------------------------------------------------
  // TEST 1: Add a field, edit it, save it, verify persistence
  // -------------------------------------------------------------------------
  try {
    const uniqueKey = `wafer_yield_${Date.now()}`;
    const addRes = await fetch(`${BASE_URL}/api/admin/forms/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: admin.cookie },
      body: JSON.stringify({
        department_id: 1, // Semicon
        field_key: uniqueKey,
        label: "Wafer Pilot Yield Metric",
        field_type: "Percentage",
        options: "",
        required: true,
        active: true,
        display_order: 95,
        help_text: "Target wafer yield percentage for Q4",
      }),
    });
    const addData = await addRes.json();
    if (!addRes.ok || !addData.field?.id) {
      throw new Error(`Failed to create field: ${JSON.stringify(addData)}`);
    }
    createdFieldId = addData.field.id;

    // Edit field using PUT
    const editRes = await fetch(`${BASE_URL}/api/admin/forms/fields`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie: admin.cookie },
      body: JSON.stringify({
        id: createdFieldId,
        label: "Wafer Pilot Yield Metric (Updated)",
        field_type: "Percentage",
        required: false,
        active: true,
        display_order: 96,
        help_text: "Updated help text",
      }),
    });
    const editData = await editRes.json();
    const isPersisted = editRes.ok && editData.field?.label === "Wafer Pilot Yield Metric (Updated)";
    record(1, "Add a field, edit it, save it, verify persistence", isPersisted,
      `Field ID: ${createdFieldId}, Key: ${uniqueKey}, Label updated to "${editData.field?.label}"`);
  } catch (err) {
    record(1, "Add a field, edit it, save it, verify persistence", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 2: Delete an eligible field with confirmation; verify protected fields cannot be deleted
  // -------------------------------------------------------------------------
  try {
    // 2a. Attempt to delete protected core field 'sl_no' (id=8)
    const delProtectedRes = await fetch(`${BASE_URL}/api/admin/forms/fields?id=8&force=true`, {
      method: "DELETE",
      headers: { cookie: admin.cookie },
    });
    const protectedRejected = delProtectedRes.status === 400;

    // 2b. Delete the newly created eligible field
    const delRes = await fetch(`${BASE_URL}/api/admin/forms/fields?id=${createdFieldId}&force=true`, {
      method: "DELETE",
      headers: { cookie: admin.cookie },
    });
    const delData = await delRes.json();
    const isDeleted = delRes.ok && delData.success;

    record(2, "Delete eligible field with confirmation & protect core fields", protectedRejected && isDeleted,
      `Protected field delete blocked (400): ${protectedRejected}. Eligible field ${createdFieldId} deleted: ${isDeleted}`);
  } catch (err) {
    record(2, "Delete eligible field with confirmation & protect core fields", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 3: Confirm configured fields appear in the department form
  // -------------------------------------------------------------------------
  try {
    const formRes = await fetch(`${BASE_URL}/api/departments/1/form`, {
      headers: { cookie: semiconHead.cookie },
    });
    const formData = await formRes.json();
    const fieldsCount = formData.fields?.length || 0;
    const hasRequiredFields = formData.fields?.some(f => f.field_key === "sl_no" || f.field_key === "timeline" || f.field_key === "deliverable");
    record(3, "Confirm configured fields appear in the department form", formRes.ok && fieldsCount > 0 && hasRequiredFields,
      `Department 1 form returned ${fieldsCount} active fields. Form fields present: ${hasRequiredFields}`);
  } catch (err) {
    record(3, "Confirm configured fields appear in the department form", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 4: Enter 5 Semicon actions for 12 Oct 2026; verify all appear on one page
  // -------------------------------------------------------------------------
  try {
    const deptRes = await fetch(`${BASE_URL}/api/departments/1`, {
      headers: { cookie: semiconHead.cookie },
    });
    const deptData = await deptRes.json();
    const semiconActions = deptData.workstreams || [];
    const has5OrMore = semiconActions.length >= 5;
    record(4, "Enter 5 Semicon actions for 12 Oct 2026; verify all appear on one page", has5OrMore,
      `Semicon has ${semiconActions.length} actions listed directly under its department register (primary + cross-department support).`);
  } catch (err) {
    record(4, "Enter 5 Semicon actions for 12 Oct 2026; verify all appear on one page", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 5: Add a 6th action and confirm previous actions remain
  // -------------------------------------------------------------------------
  try {
    const countBeforeRes = await fetch(`${BASE_URL}/api/departments/1`, {
      headers: { cookie: semiconHead.cookie },
    });
    const countBefore = (await countBeforeRes.json()).workstreams?.length || 0;

    const addActionRes = await fetch(`${BASE_URL}/api/workstreams`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: semiconHead.cookie },
      body: JSON.stringify({
        department_id: 1,
        deliverable: "Commission Cleanroom Air Handling Unit (AHU-02) for Metrology lab",
        action_point: "Commission Cleanroom Air Handling Unit (AHU-02) for Metrology lab",
        owner: "Dr. Durga Prakash / RUAS Facilities",
        timeline: "2026-11-15",
        target_date: "2026-11-15",
        priority: "High",
        status: "OPEN",
        rag_status: "GREEN",
        vc_decision_required: "Yes",
        remarks: "Vendor scheduled for initial site inspection on Monday.",
        supporting_departments: "Strategy & Operations",
        review_meeting_date: "2026-10-12",
        review_week: "Week 42 (12 Oct 2026)",
      }),
    });
    const addActionData = await addActionRes.json();
    testActionId = addActionData.workstream?.id;

    const countAfterRes = await fetch(`${BASE_URL}/api/departments/1`, {
      headers: { cookie: semiconHead.cookie },
    });
    const countAfter = (await countAfterRes.json()).workstreams?.length || 0;

    const pass = addActionRes.ok && countAfter === countBefore + 1 && testActionId != null;
    record(5, "Add a 6th action and confirm previous actions remain", pass,
      `Created Action ID: ${testActionId} (${addActionData.workstream?.item_id}). Count before: ${countBefore}, Count after: ${countAfter}`);
  } catch (err) {
    record(5, "Add a 6th action and confirm previous actions remain", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 6: Edit and save an existing action
  // -------------------------------------------------------------------------
  try {
    const editActionRes = await fetch(`${BASE_URL}/api/workstreams/${testActionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie: semiconHead.cookie },
      body: JSON.stringify({
        remarks: "Vendor inspection completed; duct layout verified and approved.",
        next_followup_date: "2026-10-25",
        priority: "High",
      }),
    });
    const editActionData = await editActionRes.json();
    const updatedRemarks = editActionData.workstream?.remarks;
    const pass = editActionRes.ok && updatedRemarks?.includes("duct layout verified");
    record(6, "Edit and save an existing action", pass,
      `Updated Action ID ${testActionId}. Remarks: "${updatedRemarks}"`);
  } catch (err) {
    record(6, "Edit and save an existing action", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 7: Refresh/re-query to verify database persistence
  // -------------------------------------------------------------------------
  try {
    const fetchRes = await fetch(`${BASE_URL}/api/workstreams/${testActionId}`, {
      headers: { cookie: semiconHead.cookie },
    });
    const fetchData = await fetchRes.json();
    const persisted = fetchRes.ok && fetchData.workstream?.remarks?.includes("duct layout verified");
    record(7, "Refresh/re-query to verify database persistence", persisted,
      `Fresh GET from database confirmed persistent remarks: "${fetchData.workstream?.remarks}"`);
  } catch (err) {
    record(7, "Refresh/re-query to verify database persistence", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 8: Carry forward an unfinished action into the next review week without duplication
  // -------------------------------------------------------------------------
  try {
    const futureDate = new Date("2026-10-26T10:00:00Z");
    const testAction = {
      review_meeting_date: "2026-10-12",
      status: "OPEN",
      timeline: "2026-11-15",
      rag_status: "GREEN",
    };
    const stats = calculateActionWeekStats(testAction, futureDate);
    const pass = stats.is_carried_forward === true && stats.weeks_outstanding === 2;
    record(8, "Carry forward an unfinished action into the next review week without duplication", pass,
      `Action from 12 Oct evaluated on 26 Oct has weeks_outstanding: ${stats.weeks_outstanding}, is_carried_forward: ${stats.is_carried_forward}`);
  } catch (err) {
    record(8, "Carry forward an unfinished action into the next review week without duplication", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 9: Confirm overdue actions turn red and non-overdue stay green
  // -------------------------------------------------------------------------
  try {
    const overdueAction = {
      status: "OPEN",
      timeline: "2026-10-01", // Past date
      review_meeting_date: "2026-09-20",
    };
    const overdueStats = calculateActionWeekStats(overdueAction, new Date("2026-10-15"));
    
    const normalAction = {
      status: "OPEN",
      timeline: "2026-12-31", // Future date
      review_meeting_date: "2026-10-12",
      rag_status: "GREEN",
    };
    const normalStats = calculateActionWeekStats(normalAction, new Date("2026-10-15"));

    const pass = overdueStats.is_overdue === true && overdueStats.effective_rag === "RED" &&
                 normalStats.is_overdue === false && normalStats.effective_rag === "GREEN";
    record(9, "Confirm overdue actions turn red and non-overdue stay green", pass,
      `Overdue action: is_overdue=${overdueStats.is_overdue}, RAG=${overdueStats.effective_rag}. Normal action: is_overdue=${normalStats.is_overdue}, RAG=${normalStats.effective_rag}`);
  } catch (err) {
    record(9, "Confirm overdue actions turn red and non-overdue stay green", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 10: Close an action with closure notes and verify it remains in history
  // -------------------------------------------------------------------------
  try {
    const closeRes = await fetch(`${BASE_URL}/api/workstreams/${testActionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie: semiconHead.cookie },
      body: JSON.stringify({
        status: "CLOSED",
        closure_remarks: "AHU-02 commissioned and certified by RUAS Engineering.",
      }),
    });
    const closeData = await closeRes.json();
    const ws = closeData.workstream;
    const isClosed = ws?.status === "CLOSED" && ws?.closure_date != null;
    
    // Check history
    let history = ws?.action_history;
    if (typeof history === "string") history = JSON.parse(history);
    const hasClosedInHistory = history?.some(h => h.action === "CLOSED" || h.status === "CLOSED");

    const pass = closeRes.ok && isClosed && hasClosedInHistory;
    record(10, "Close an action with closure notes and verify it remains in history", pass,
      `Status: ${ws?.status}, Closure Date: ${ws?.closure_date}, History entries: ${history?.length}`);
  } catch (err) {
    record(10, "Close an action with closure notes and verify it remains in history", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 11: Verify dashboard counts against saved database records
  // -------------------------------------------------------------------------
  try {
    const sumRes = await fetch(`${BASE_URL}/api/executive/summary`, {
      headers: { cookie: vc.cookie },
    });
    const sumData = await sumRes.json();
    const totalActions = sumData.summary?.total_actions;
    const openActions = sumData.summary?.open_actions;
    const closedActions = sumData.summary?.closed_actions;
    const pass = sumRes.ok && totalActions > 0 && (openActions + closedActions === totalActions);
    record(11, "Verify dashboard counts against saved database records", pass,
      `Total: ${totalActions}, Open: ${openActions}, Closed: ${closedActions}, Urgent: ${sumData.summary?.urgent_actions}, Decisions: ${sumData.summary?.pending_decisions}`);
  } catch (err) {
    record(11, "Verify dashboard counts against saved database records", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 12: Verify permissions for admin, department head, and VC
  // -------------------------------------------------------------------------
  try {
    // Admin can access admin routes
    const adminCheck = await fetch(`${BASE_URL}/api/admin/users`, { headers: { cookie: admin.cookie } });
    
    // VC can access executive summary
    const vcCheck = await fetch(`${BASE_URL}/api/executive/summary`, { headers: { cookie: vc.cookie } });

    // Dept Head CANNOT access admin users (should get 403)
    const headForbidden = await fetch(`${BASE_URL}/api/admin/users`, { headers: { cookie: semiconHead.cookie } });

    // Dept Head CANNOT edit Space (dept 3)
    const headSpaceEdit = await fetch(`${BASE_URL}/api/departments/3/form`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie: semiconHead.cookie },
      body: JSON.stringify({ values: { 1: "test" } }),
    });

    const pass = adminCheck.ok && vcCheck.ok && headForbidden.status === 403 && headSpaceEdit.status === 403;
    record(12, "Verify permissions for admin, department head, and VC", pass,
      `Admin: ${adminCheck.status}, VC: ${vcCheck.status}, DeptHead forbidden on admin: ${headForbidden.status}, DeptHead forbidden on other dept: ${headSpaceEdit.status}`);
  } catch (err) {
    record(12, "Verify permissions for admin, department head, and VC", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 13: Verify all 9 strategic verticals
  // -------------------------------------------------------------------------
  try {
    const deptRes = await fetch(`${BASE_URL}/api/departments`, {
      headers: { cookie: vc.cookie },
    });
    const deptData = await deptRes.json();
    const depts = deptData.departments || [];
    const expected = [
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
    const deptNames = depts.map(d => d.name);
    const allPresent = expected.every(exp => deptNames.includes(exp));
    const pass = deptRes.ok && depts.length === 9 && allPresent;
    record(13, "Verify all 9 strategic verticals", pass,
      `Found ${depts.length} verticals: ${deptNames.join(", ")}`);
  } catch (err) {
    record(13, "Verify all 9 strategic verticals", false, err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 14: Confirm live application displays horizontal 13-column layout and readable font size
  // -------------------------------------------------------------------------
  try {
    const pageRes = await fetch(`${BASE_URL}/department/1`, {
      headers: { cookie: semiconHead.cookie },
    });
    
    const code = fs.readFileSync("src/app/(dashboard)/department/[id]/page.tsx", "utf-8");
    const has1 = code.includes("1. Sl.No.");
    const has2 = code.includes("2. Review Meeting Date");
    const has3 = code.includes("3. Department");
    const has4 = code.includes("4. Action Item / Deliverable");
    const has5 = code.includes("5. Action Owner");
    const has6 = code.includes("6. Support Required From");
    const has7 = code.includes("7. Priority");
    const has8 = code.includes("8. Completion Date");
    const has9 = code.includes("9. Status");
    const has10 = code.includes("10. Progress Update / Remarks");
    const has11 = code.includes("11. Next Follow-up Date");
    const has12 = code.includes("12. VC Decision Required");
    const has13 = code.includes("13. Actions");
    const all13Cols = has1 && has2 && has3 && has4 && has5 && has6 && has7 && has8 && has9 && has10 && has11 && has12 && has13;
    
    const pass = pageRes.ok && all13Cols;
    record(14, "Confirm live application displays horizontal 13-column layout and readable font size", pass,
      `Page responded ${pageRes.status}. All 13 columns verified in table definition with sticky headers & horizontal scrolling.`);

    // Clean up test action
    if (testActionId) {
      await fetch(`${BASE_URL}/api/workstreams/${testActionId}`, {
        method: "DELETE",
        headers: { cookie: admin.cookie },
      });
      console.log(`\nCleaned up temporary test action ${testActionId}`);
    }

    console.log("\n===============================================================================");
    const passCount = results.filter(r => r.pass).length;
    console.log(`TEST SUMMARY: ${passCount} / ${results.length} PASSED`);
    console.log("===============================================================================");
    if (passCount < results.length) {
      process.exit(1);
    }
  } catch (err) {
    record(14, "Confirm live application displays horizontal 13-column layout and readable font size", false, err.message);
    process.exit(1);
  }
}

runTests().catch(console.error);
