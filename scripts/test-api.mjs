async function test() {
  const loginRes = await fetch("http://127.0.0.1:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vicechairman@riasat.ac.in", password: "ViceChairman@123" }),
  });
  const cookie = loginRes.headers.get("set-cookie");
  console.log("Login status:", loginRes.status, "Cookie obtained:", !!cookie);

  const sumRes = await fetch("http://127.0.0.1:3000/api/executive/summary", {
    headers: { cookie: cookie || "" }
  });
  const sumData = await sumRes.json();
  console.log("Summary Metrics:", {
    total_actions: sumData.summary?.total_actions,
    open_actions: sumData.summary?.open_actions,
    urgent_actions: sumData.summary?.urgent_actions,
    closed_actions: sumData.summary?.closed_actions,
    pending_decisions: sumData.summary?.pending_decisions,
    overall_rag: sumData.summary?.overall_rag,
  });
  console.log("Actions Distribution:");
  console.table(sumData.graphs?.actionsDistribution);
  console.log("Total Management Attention items:", sumData.management_attention?.length);
  if (sumData.management_attention?.length > 0) {
    console.log("Sample Management Attention item:", {
      item_id: sumData.management_attention[0].item_id,
      item: sumData.management_attention[0].item?.substring(0, 50) + "...",
      owner: sumData.management_attention[0].owner,
      status: sumData.management_attention[0].status,
      vc_decision_required: sumData.management_attention[0].vc_decision_required,
      supporting: sumData.management_attention[0].supporting_departments
    });
  }
}
test().catch(console.error);
