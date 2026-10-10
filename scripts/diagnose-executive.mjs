import http from 'http';

async function testExecutive() {
  console.log("=================================================");
  console.log("DIAGNOSING EXECUTIVE CONTROL TOWER DASHBOARD");
  console.log("=================================================\n");

  // Helper to make fetch with cookie jar
  async function loginAndCheck(email, password, expectedRole) {
    console.log(`Testing Login for ${email} (${expectedRole})...`);
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      redirect: 'manual'
    });

    const setCookie = loginRes.headers.get('set-cookie');
    const cookie = setCookie ? setCookie.split(';')[0] : '';
    const body = await loginRes.json().catch(() => ({}));

    if (!loginRes.ok) {
      console.log(`❌ Login failed for ${email}:`, body);
      return { success: false, cookie: null };
    }

    console.log(`✅ Login successful: Role = ${body.user?.role}`);

    // Now check GET /executive
    const execRes = await fetch('http://localhost:3000/executive', {
      headers: { Cookie: cookie },
      redirect: 'manual'
    });

    console.log(`   GET /executive HTTP Status: ${execRes.status} ${execRes.statusText}`);
    const location = execRes.headers.get('location');
    if (location) {
      console.log(`   Redirect Location: ${location}`);
    }

    // Now check GET /api/executive/summary
    const summaryRes = await fetch('http://localhost:3000/api/executive/summary', {
      headers: { Cookie: cookie }
    });

    console.log(`   GET /api/executive/summary HTTP Status: ${summaryRes.status}`);
    const summaryData = await summaryRes.json().catch(() => ({}));
    
    return {
      success: true,
      cookie,
      user: body.user,
      execStatus: execRes.status,
      execLocation: location,
      summaryStatus: summaryRes.status,
      summaryData
    };
  }

  // 1. Test Executive Role
  const execResult = await loginAndCheck('executive@riasat.ac.in', 'Exec@123', 'Executive/Management');
  
  // 2. Test Admin Role
  const adminResult = await loginAndCheck('admin@riasat.ac.in', 'Admin@123', 'System Administrator');

  // 3. Test Department Head Role (Semicon Head)
  const deptHeadResult = await loginAndCheck('semicon.head@riasat.ac.in', 'Semicon@123', 'Department Head');

  // Verify Summary Data & 9 Verticals
  console.log("\n-------------------------------------------------");
  console.log("VERIFYING 9 VERTICALS IN EXECUTIVE SUMMARY");
  console.log("-------------------------------------------------");
  if (execResult.summaryData && execResult.summaryData.departments) {
    const depts = execResult.summaryData.departments;
    console.log(`Total verticals returned from DB: ${depts.length}`);
    depts.forEach((d, idx) => {
      console.log(`  ${idx + 1}. [${d.code}] ${d.name} -> Readiness: ${d.readiness}%, RAG: ${d.rag}, Open: ${d.open_items}, Delayed/Red: ${d.critical_issues}, VC Req: ${d.pending_vc}, Last Updated: ${d.last_updated || 'None'}`);
    });
  } else {
    console.log("❌ Could not get departments from executive summary:", execResult.summaryData);
  }

  console.log("\n-------------------------------------------------");
  console.log("MANAGEMENT ATTENTION ITEMS");
  console.log("-------------------------------------------------");
  if (execResult.summaryData && execResult.summaryData.management_attention) {
    const items = execResult.summaryData.management_attention;
    console.log(`Total attention items: ${items.length}`);
    items.forEach((item, idx) => {
      console.log(`  ${idx + 1}. Dept: ${item.department_name} | Action: ${item.item} | Owner: ${item.owner} | VC Required: ${item.vc_decision_required}`);
    });
  }
}

testExecutive().catch(console.error);
