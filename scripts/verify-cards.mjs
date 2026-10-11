// scripts/verify-cards.mjs
async function run() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vicechairman@riasat.ac.in', password: 'ViceChairman@123' })
  });
  const cookie = loginRes.headers.get('set-cookie');
  const res = await fetch('http://localhost:3000/executive', {
    headers: { Cookie: cookie.split(';')[0] }
  });
  const html = await res.text();

  console.log('--- CARD LINK VERIFICATION ---');
  for (let i = 1; i <= 9; i++) {
    const hasDeptLink = html.includes(`/department/${i}`);
    console.log(`Vertical ${i} has link to /department/${i}: ${hasDeptLink ? 'YES' : 'NO'}`);
  }

  console.log('\n--- 6 REQUIRED METRICS VERIFICATION PER VERTICAL CARD ---');
  const requiredMetrics = [
    'Readiness',
    'RAG Status',
    'Open Action Points',
    'Delayed / Red Action Points',
    'VC Decisions Required',
    'Last Updated'
  ];

  for (const m of requiredMetrics) {
    const found = html.includes(m);
    console.log(`Metric '${m}' present in rendered cards: ${found ? 'YES' : 'NO'}`);
  }
}

run();
