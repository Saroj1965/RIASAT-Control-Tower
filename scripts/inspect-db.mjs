// scripts/inspect-db.mjs
import { query } from "../src/lib/db.ts";

async function inspect() {
  console.log("Database URL configured:", process.env.DATABASE_URL ? (process.env.DATABASE_URL.includes("neon.tech") ? "Neon PostgreSQL Cloud" : "Local PostgreSQL / PGlite") : "PGlite Default");
  
  const ws = await query("SELECT id, item_id, department_id, deliverable, category, owner, status, timeline, supporting_departments FROM workstreams ORDER BY id");
  console.log("=== WORKSTREAMS / ACTION ITEMS (" + ws.rows.length + ") ===");
  for (const r of ws.rows) {
    console.log(`[#${r.id}] ${r.item_id || 'NO-ID'} (Dept ${r.department_id}): ${(r.deliverable || '').slice(0, 70)}... | Owner: ${r.owner} | Support: ${r.supporting_departments || 'None'} | Status: ${r.status}`);
  }

  const rec = await query("SELECT id, position_title, strategic_segment, hiring_lead, status FROM recruitment ORDER BY id");
  console.log("\n=== RECRUITMENT PIPELINE (" + rec.rows.length + ") ===");
  for (const r of rec.rows) {
    console.log(`[#${r.id}] ${r.position_title} (${r.strategic_segment}) | Lead: ${r.hiring_lead} | Status: ${r.status}`);
  }

  const ov = await query("SELECT d.id, d.name, d.code, o.readiness_percentage, o.rag_status, o.key_focus, o.submission_status FROM departments d LEFT JOIN department_overview o ON d.id = o.department_id ORDER BY d.id");
  console.log("\n=== 9 STRATEGIC VERTICALS & OVERVIEW ===");
  for (const r of ov.rows) {
    console.log(`[Dept ${r.id}] ${r.name} (${r.code}) -> Readiness: ${r.readiness_percentage}% | RAG: ${r.rag_status} | Submission: ${r.submission_status} | Focus: ${r.key_focus || 'None'}`);
  }
}

inspect().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
