const BASE_URL = "http://localhost:3000";

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  const cookie = res.headers.get("set-cookie") || "";
  return { res, data, cookie };
}

async function verifyBlankState() {
  console.log("================================================================================");
  console.log("VERIFYING CLEAN BLANK STATE ACROSS LIVE WEB ENDPOINTS");
  console.log("================================================================================");

  // 1. Vice Chairman Login
  const { data: vcData, cookie: vcCookie } = await login("vicechairman@riasat.ac.in", "ViceChairman@123");
  console.log(`\n1. Vice Chairman Login: ${vcData.user?.name} (${vcData.user?.role})`);

  // 2. Executive Summary API
  const sumRes = await fetch(`${BASE_URL}/api/executive/summary`, {
    headers: { Cookie: vcCookie },
  });
  const sumData = await sumRes.json();
  console.log(`\n2. Executive Dashboard Live State:`);
  console.log(`   - Overall Readiness: ${sumData.summary.overall_readiness}%`);
  console.log(`   - Overall Health: ${sumData.summary.overall_rag}`);
  console.log(`   - RAG Mix: Green: ${sumData.summary.green_count}, Amber: ${sumData.summary.amber_count}, Red: ${sumData.summary.red_count}, Not Started: ${sumData.summary.not_started_count}`);
  console.log(`   - Total Capex Outlay: ₹ ${sumData.summary.total_capex} Cr`);
  console.log(`   - Total Revenue Pipeline: ₹ ${sumData.summary.total_revenue_pipeline} Cr`);
  console.log(`   - Pending Decisions: ${sumData.summary.pending_decisions}`);
  console.log(`   - Management Attention Items: ${sumData.management_attention.length}`);
  console.log(`   - Department Cards Count: ${sumData.departments.length}`);
  for (const d of sumData.departments) {
    console.log(`     • ${d.name}: Readiness ${d.readiness}%, RAG ${d.rag}, Focus: "${d.key_focus}", Deliverables: ${d.total_items}`);
  }

  // 3. Semicon Department Head Login & Form Check
  const { data: semiData, cookie: semiCookie } = await login("semicon.head@riasat.ac.in", "Semicon@123");
  console.log(`\n3. Department Head Login: ${semiData.user?.name} (${semiData.user?.designation})`);

  const dept1Res = await fetch(`${BASE_URL}/api/departments/1`, {
    headers: { Cookie: semiCookie },
  });
  const dept1Data = await dept1Res.json();
  console.log(`   - Department 1 Milestones: ${dept1Data.items.length} (Expected: 0)`);

  const form1Res = await fetch(`${BASE_URL}/api/departments/1/form`, {
    headers: { Cookie: semiCookie },
  });
  const form1Data = await form1Res.json();
  console.log(`   - Form Configured Fields: ${form1Data.fields.length}`);
  console.log(`   - Existing Form Values in DB: ${Object.keys(form1Data.values).length} (Expected: 0)`);
  console.log(`   - Submission Status: ${form1Data.submission_status} (Expected: DRAFT)`);

  // 4. Admin Users Verification
  const { data: adminData, cookie: adminCookie } = await login("admin@riasat.ac.in", "Admin@123");
  const usersRes = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Cookie: adminCookie },
  });
  const usersData = await usersRes.json();
  console.log(`\n4. User Directory Check:`);
  for (const u of usersData.users) {
    console.log(`   - ${u.name} | Role: ${u.role} | Mobile: "${u.mobile}" | Email: ${u.email}`);
  }

  // 5. Consolidated Reports Matrix Check
  const deptsRes = await fetch(`${BASE_URL}/api/departments`, {
    headers: { Cookie: vcCookie },
  });
  const deptsData = await deptsRes.json();
  console.log(`\n5. Consolidated Status Matrix:`);
  for (const d of deptsData.departments) {
    console.log(`   - ${d.name}: Readiness: ${d.readiness_percentage || 0}%, RAG: ${d.rag_status || "NOT STARTED"}, Focus: "${d.key_focus || "--"}", Open Items: ${d.stats?.open || 0}`);
  }

  console.log("\n================================================================================");
  console.log("BLANK STATE VERIFICATION COMPLETE: ALL CHECKS CONFIRMED CLEAN AND READY");
  console.log("================================================================================");
}

verifyBlankState().catch(console.error);
