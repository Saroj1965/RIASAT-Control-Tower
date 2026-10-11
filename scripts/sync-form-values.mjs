// scripts/sync-form-values.mjs
const BASE_URL = "http://localhost:3000";

function parseCookie(res) {
  const raw = res.headers.get("set-cookie");
  if (!raw) return "";
  return raw.split(";")[0];
}

async function run() {
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@riasat.ac.in", password: "Admin@123" }),
  });
  const cookie = parseCookie(loginRes);

  console.log("Syncing dynamic form values for all 9 departments...\n");

  for (let id = 1; id <= 9; id++) {
    const formRes = await fetch(`${BASE_URL}/api/departments/${id}/form`, {
      headers: { Cookie: cookie },
    });
    const formData = await formRes.json();
    const deptRes = await fetch(`${BASE_URL}/api/departments/${id}`, {
      headers: { Cookie: cookie },
    });
    const deptData = await deptRes.json();

    const fields = formData.fields || [];
    const values = {};
    for (const f of fields) {
      if (f.field_key === "readiness_score") {
        values[f.id.toString()] = (deptData.overview?.readiness_percentage || 0).toString();
      } else if (f.field_key === "rag_status") {
        values[f.id.toString()] = deptData.overview?.rag_status || "GREEN";
      } else if (f.field_key === "vc_focus_decision") {
        values[f.id.toString()] = deptData.overview?.key_focus || "";
      } else {
        values[f.id.toString()] = "";
      }
    }

    const saveRes = await fetch(`${BASE_URL}/api/departments/${id}/form`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({
        values,
        status: "SUBMITTED",
      }),
    });

    if (saveRes.ok) {
      console.log(`✅ Dept ${id} [${deptData.department?.name}]: Dynamic form synced with ${Object.keys(values).length} fields`);
    } else {
      console.error(`❌ Dept ${id} failed:`, await saveRes.text());
    }
  }
}

run().catch(console.error);
