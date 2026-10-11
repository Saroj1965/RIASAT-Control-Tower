// scripts/test-browser-render.mjs
const BASE_URL = "http://localhost:3000";

async function runBrowserRenderTest() {
  console.log("===============================================================================");
  console.log("TESTING ACTUAL SERVER-RENDERED HTML OUTPUT FOR /executive");
  console.log("===============================================================================\n");

  // 1. Login as Vice Chairman
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vicechairman@riasat.ac.in", password: "ViceChairman@123" }),
  });
  const cookie = loginRes.headers.get("set-cookie");
  console.log("1. Vice Chairman Login HTTP status:", loginRes.status);
  if (!loginRes.ok) throw new Error("Login failed");

  // 2. Fetch /executive with session cookie
  const execRes = await fetch(`${BASE_URL}/executive`, {
    headers: { Cookie: cookie.split(";")[0] },
  });
  console.log("2. GET /executive HTTP status:", execRes.status);
  const html = await execRes.text();
  console.log(`3. Rendered HTML total length: ${html.length} bytes`);

  // 3. Check for page elements
  const checks = [
    { label: "RIASAT Executive Control Tower Title", test: html.includes("RIASAT Executive Control Tower") },
    { label: "Overall Readiness Tile", test: html.includes("Overall Readiness") },
    { label: "Overall RAG Status Tile", test: html.includes("Overall RAG Status") },
    { label: "Vice Chairman Decisions Required Tile", test: html.includes("Vice Chairman Decisions Required") },
    { label: "9 Strategic Verticals Header", test: html.includes("9 Strategic Verticals Overview") },
    { label: "Vertical 1: Semicon", test: html.includes("Semicon") },
    { label: "Vertical 2: Aerospace & Defence", test: html.includes("Aerospace &amp; Defence") || html.includes("Aerospace & Defence") },
    { label: "Vertical 3: Space", test: html.includes("Space") },
    { label: "Vertical 4: Cybersecurity", test: html.includes("Cybersecurity") },
    { label: "Vertical 5: MedTech", test: html.includes("MedTech") },
    { label: "Vertical 6: Advanced Manufacturing", test: html.includes("Advanced Manufacturing") },
    { label: "Vertical 7: HR & Recruitment", test: html.includes("HR &amp; Recruitment") || html.includes("HR & Recruitment") },
    { label: "Vertical 8: Communications", test: html.includes("Communications") },
    { label: "Vertical 9: Strategy & Operations", test: html.includes("Strategy &amp; Operations") || html.includes("Strategy & Operations") },
    { label: "Card Metric: Open Actions", test: html.includes("Open Action Points") || html.includes("Open Actions") },
    { label: "Card Metric: Delayed / Red", test: html.includes("Delayed / Red") },
    { label: "Card Metric: VC Decisions", test: html.includes("VC Decisions") },
    { label: "Card Metric: Workstreams", test: html.includes("Workstreams") },
    { label: "VICE CHAIRMAN / MANAGEMENT ATTENTION Table", test: html.includes("VICE CHAIRMAN / MANAGEMENT ATTENTION") },
    { label: "Valid Page Title (Not 404)", test: !html.includes("<title>404: This page could not be found") },
  ];

  console.log("\n===============================================================================");
  console.log("HTML RENDER VERIFICATION RESULTS");
  console.log("===============================================================================");
  let allPass = true;
  for (const c of checks) {
    const symbol = c.test ? "✅ [PASS]" : "❌ [FAIL]";
    if (!c.test) allPass = false;
    console.log(`${symbol} ${c.label}`);
  }

  // Also check Department Head redirect
  console.log("\n4. Testing Department Head Access Guard on /executive...");
  const dhLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "semicon.head@riasat.ac.in", password: "Semicon@123" }),
  });
  const dhCookie = dhLogin.headers.get("set-cookie");
  const dhExec = await fetch(`${BASE_URL}/executive`, {
    headers: { Cookie: dhCookie.split(";")[0] },
    redirect: "manual",
  });
  console.log(`Department Head GET /executive status: ${dhExec.status} (Location: ${dhExec.headers.get("location")})`);
  const dhRedirects = dhExec.status === 307 || dhExec.status === 302 || dhExec.status === 303;
  console.log(`${dhRedirects ? "✅ [PASS]" : "❌ [FAIL]"} Department Head correctly redirected away from /executive`);

  console.log("\n===============================================================================");
  if (allPass && dhRedirects) {
    console.log("🎉 ALL ACTUAL BROWSER RENDER CHECKS PASSED WITH 100% SUCCESS!");
  } else {
    console.log("⚠️ Some checks failed.");
  }
  console.log("===============================================================================\n");
}

runBrowserRenderTest().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
