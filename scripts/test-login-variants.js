async function testLogin(pass) {
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@riasat.ac.in", password: pass }),
  });
  const data = await res.json();
  const hasCookie = Boolean(res.headers.get("set-cookie"));
  console.log(`Password "${pass}": Status = ${res.status}, Redirect = ${data.redirectUrl}, Cookie = ${hasCookie ? "✅ Set" : "❌ None"}`);
}

async function run() {
  console.log("Testing Admin login variations:");
  await testLogin("Admin@123");
  await testLogin("admin123");
  await testLogin("Admin123");
  await testLogin("admin");
  await testLogin("password");

  console.log("\nTesting Vice Chairman login variations:");
  const vcRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vicechairman@riasat.ac.in", password: "ViceChairman@123" }),
  });
  const vcData = await vcRes.json();
  console.log(`Vice Chairman: Status = ${vcRes.status}, Redirect = ${vcData.redirectUrl}`);
}

run().catch(console.error);
