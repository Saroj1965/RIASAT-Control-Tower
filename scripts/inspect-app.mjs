// scripts/inspect-app.mjs
const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("=== PHASE 1: INSPECTION OF APPLICATION & TRACKERS ===\n");

  // 1. Admin login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@riasat.ac.in", password: "Admin@123" }),
  });
  const cookie = loginRes.headers.get("set-cookie")?.split(";")[0];
  console.log("Admin Login Status:", loginRes.status);

  // 2. Fetch Departments
  const deptRes = await fetch(`${BASE_URL}/api/departments`, {
    headers: { Cookie: cookie },
  });
  const deptData = await deptRes.json();
  const depts = deptData.departments || deptData;
  console.log(`\nDepartments found (${depts.length}):`);
  depts.forEach((d) => console.log(`  - [ID ${d.id}] ${d.name} (${d.code})`));

  // 3. For each department, inspect current workstreams
  console.log("\nWorkstreams per department:");
  for (const d of depts) {
    const wsRes = await fetch(`${BASE_URL}/api/workstreams?department_id=${d.id}`, {
      headers: { Cookie: cookie },
    });
    if (wsRes.ok) {
      const ws = await wsRes.json();
      console.log(`  - Dept ${d.id} (${d.name}): ${ws.length} items`);
      if (ws.length > 0) {
        console.log("    Sample item keys:", Object.keys(ws[0]));
        console.log("    Sample item:", ws[0]);
      }
    }
  }

  // 4. Recruitment
  const recRes = await fetch(`${BASE_URL}/api/recruitment`, {
    headers: { Cookie: cookie },
  });
  console.log("\nRecruitment API status:", recRes.status);
  if (recRes.ok) {
    const rec = await recRes.json();
    console.log(`Recruitment items found: ${rec.length}`);
    if (rec.length > 0) {
      console.log("Sample recruitment keys:", Object.keys(rec[0]));
      console.log("Sample recruitment item:", rec[0]);
    }
  }

  // 5. Executive Summary
  const execRes = await fetch(`${BASE_URL}/api/executive/summary`, {
    headers: { Cookie: cookie },
  });
  if (execRes.ok) {
    const exec = await execRes.json();
    console.log("\nExecutive Summary Departments count:", exec.departments?.length);
    console.log("Pending Decisions total:", exec.summary?.pending_decisions);
  }
}

run().catch(console.error);
