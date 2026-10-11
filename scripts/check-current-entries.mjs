// scripts/check-current-entries.mjs
const BASE_URL = "http://localhost:3000";

function parseCookie(res) {
  const raw = res.headers.get("set-cookie");
  if (!raw) return "";
  return raw.split(";")[0];
}

async function check() {
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@riasat.ac.in", password: "Admin@123" }),
  });
  const cookie = parseCookie(loginRes);
  if (!cookie) {
    console.error("Login failed:", await loginRes.text());
    process.exit(1);
  }

  console.log("Logged in as Admin. Checking departments 1 through 9...\n");

  for (let id = 1; id <= 9; id++) {
    const deptRes = await fetch(`${BASE_URL}/api/departments/${id}`, {
      headers: { Cookie: cookie },
    });
    const data = await deptRes.json();
    console.log(`Dept ${id} [${data.department?.name}] (Code: ${data.department?.code}):`);
    console.log(`  Readiness: ${data.overview?.readiness_percentage}%, RAG: ${data.overview?.rag_status}`);
    console.log(`  Items count: ${data.items?.length || 0}`);
    if (data.items?.length > 0) {
      data.items.forEach((it, idx) => {
        if (id === 7) {
          console.log(`    [${idx + 1}] Role: "${it.position_title}", Status: "${it.status}", VC: ${it.vc_decision_required}`);
        } else {
          console.log(`    [${idx + 1}] Action: "${it.deliverable || it.action_point}", Status: "${it.status}", VC: ${it.vc_decision_required}`);
        }
      });
    }
  }
}

check().catch(console.error);
