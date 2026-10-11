// scripts/test-css-delivery.mjs
async function test() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vicechairman@riasat.ac.in", password: "VC@123" }),
  });
  const cookie = loginRes.headers.get("set-cookie")?.split(";")[0];
  console.log("Login status:", loginRes.status, "Cookie acquired:", Boolean(cookie));

  const execPage = await fetch("http://localhost:3000/executive", {
    headers: { Cookie: cookie },
  });
  console.log("Executive page status:", execPage.status, execPage.statusText);
  const html = await execPage.text();
  console.log("HTML length:", html.length);

  // Extract CSS links
  const regex = /href="(\/_next\/static\/css\/[^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const cssUrl = match[1];
    const cssRes = await fetch("http://localhost:3000" + cssUrl);
    const cssText = await cssRes.text();
    console.log(`CSS ${cssUrl} -> HTTP ${cssRes.status}, Size: ${cssText.length} bytes`);
  }

  // Extract JS chunks
  const jsRegex = /src="(\/_next\/static\/[^"]+)"/g;
  let jsCount = 0;
  while ((match = jsRegex.exec(html)) !== null) {
    const jsUrl = match[1];
    const jsRes = await fetch("http://localhost:3000" + jsUrl);
    if (jsRes.status === 200) jsCount++;
    else console.error(`JS ${jsUrl} FAILED: HTTP ${jsRes.status}`);
  }
  console.log(`All ${jsCount} JS static script chunks loaded with HTTP 200 OK!`);
}

test().catch(console.error);
