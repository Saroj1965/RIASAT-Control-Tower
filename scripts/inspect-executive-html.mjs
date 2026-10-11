// scripts/inspect-executive-html.mjs
async function run() {
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vicechairman@riasat.ac.in", password: "VC@123" }),
  });
  const cookie = loginRes.headers.get("set-cookie")?.split(";")[0];
  
  const execRes = await fetch("http://localhost:3000/executive", {
    headers: { Cookie: cookie }
  });
  
  const html = await execRes.text();
  console.log("Status:", execRes.status);
  console.log("HTML length:", html.length);
  
  // Check for key elements in HTML
  console.log("Has RIASAT logo img:", html.includes("riasat_logo.jpg"));
  console.log("Has Executive Control Tower:", html.includes("RIASAT Executive Control Tower"));
  console.log("Has 9 verticals:", html.includes("Semicon") && html.includes("Aerospace &amp; Defence") || html.includes("Aerospace & Defence"));
  console.log("Has Strategy & Operations:", html.includes("Strategy &amp; Operations") || html.includes("Strategy & Operations"));
  console.log("Has Sidebar:", html.includes("aside") || html.includes("SidebarNav"));

  // Check the first 500 chars and last 500 chars
  console.log("\n--- HTML PREVIEW (First 500 chars) ---");
  console.log(html.slice(0, 500));
}

run().catch(console.error);
