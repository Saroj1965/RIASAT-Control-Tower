import { DEPARTMENTS, ROLES } from "./constants";
import { getSupabaseClient, getSupabaseAdmin, getSupabase, isSupabaseConfigured } from "./supabase";

export interface DbResult<T = any> {
  rows: T[];
  rowCount?: number;
}

export { getSupabaseClient, getSupabaseAdmin, getSupabase, isSupabaseConfigured };

declare global {
  var __riasat_supabase_seeded: boolean;
}

let isInitialized = globalThis.__riasat_supabase_seeded || false;

export const OFFICIAL_SEED_USERS = [
  { id: 1, name: "Mr. Venkatesh Valluri", email: "vicechairman@riasat.ac.in", pass: "ViceChairman@123", hash: "$2a$10$KLBL2bnQS.P7F9UUAjQgROB07HVRDF.IVF208bswpJtrz28a6UjjO", role: ROLES.VICE_CHAIRMAN, deptId: 11, desig: "Vice Chairman & Executive Director", mobile: "+91 98450 11000" },
  { id: 2, name: "System Administrator", email: "admin@riasat.ac.in", pass: "Admin@123", hash: "$2a$10$ueuukLVZ5apS05o9ruCZ7.fZw9O29vpGtZUR/psN.yViAwDgcbbJi", role: ROLES.ADMIN, deptId: null, desig: "System Administrator", mobile: "+91 98450 11001" },
  { id: 3, name: "Ms. Sarojini Mangalam", email: "executive@riasat.ac.in", pass: "Exec@123", hash: "$2a$10$Mem8sQkw2Cw6ZFoNJqBJjugadAzF880r.jTwTDDg5vRvYI3Rbqj7W", role: ROLES.EXECUTIVE, deptId: 10, desig: "Head - Executive Administration", mobile: "+91 98450 11002" },
  { id: 4, name: "Form Configuration Admin", email: "forms.admin@riasat.ac.in", pass: "Forms@123", hash: "$2a$10$q4QqRmh7t8vNa9OfgxFSiO1rjsDw4pJkJ6ClCW2NczUmOz75xzg3i", role: ROLES.FORM_ADMIN, deptId: null, desig: "Forms & Schema Administrator", mobile: "+91 98450 11003" },
  { id: 5, name: "User Management Admin", email: "users.admin@riasat.ac.in", pass: "Users@123", hash: "$2a$10$p4z9bv6zIcGOTjymBCjLEOf1kl5pYGCIUzVhsHFDxuWWAdFiU3sM2", role: ROLES.USER_ADMIN, deptId: null, desig: "User Access Administrator", mobile: "+91 98450 11004" },
  { id: 6, name: "Departments Master Admin", email: "dept.admin@riasat.ac.in", pass: "Dept@123", hash: "$2a$10$uYzIYr8LOQIh2p12eIjrQeQ5v.my6GzYmZLzfJFeyAPx3cZ7He11u", role: ROLES.DEPT_ADMIN, deptId: null, desig: "Departments Master Administrator", mobile: "+91 98450 11005" },
  { id: 7, name: "To be hired", email: "semicon.head@riasat.ac.in", pass: "Semicon@123", hash: "$2a$10$CHQKEiBU1ANGUjx7KjaadeeBgMjb1/ise9FvchqH9pkn5ndK8t35i", role: ROLES.DEPARTMENT_HEAD, deptId: 1, desig: "Head - Semicon", mobile: "+91 98450 11006" },
  { id: 8, name: "To be hired", email: "aero.head@riasat.ac.in", pass: "Aero@123", hash: "$2a$10$MhOzHyrRRlq4EDRvHI9NsOJLMZbdEDmuH0zyzlinH/PHZ0pvVlXWO", role: ROLES.DEPARTMENT_HEAD, deptId: 2, desig: "Head - Aerospace & Defence", mobile: "+91 98450 11007" },
  { id: 9, name: "To be hired", email: "space.head@riasat.ac.in", pass: "Space@123", hash: "$2a$10$wITRGTQJ1sDoBMzq4TlPpeJA7MydSkjNuTiUEIacenReq231y6FHe", role: ROLES.DEPARTMENT_HEAD, deptId: 3, desig: "Head - Space", mobile: "+91 98450 11008" },
  { id: 10, name: "To be hired", email: "cyber.head@riasat.ac.in", pass: "Cyber@123", hash: "$2a$10$gziJspang8msoJvsX4flv.8LmqgjdbKU.ewZqD5vDIgIkis3uOLmu", role: ROLES.DEPARTMENT_HEAD, deptId: 4, desig: "Head - Cybersecurity", mobile: "+91 98450 11009" },
  { id: 11, name: "To be hired", email: "medtech.head@riasat.ac.in", pass: "MedTech@123", hash: "$2a$10$7VQc.OY7HGMDVgk7ieD07.xgD/9DSLQL0GJWxExFFKUsW4hKCUa0a", role: ROLES.DEPARTMENT_HEAD, deptId: 5, desig: "Head - MedTech", mobile: "+91 98450 11010" },
  { id: 12, name: "To be hired", email: "mfg.head@riasat.ac.in", pass: "Mfg@123", hash: "$2a$10$FZhubQGBfsO3WJAo/yxhvOP6rXDEnHTPZX7KW0cVZ1GMqtbfuM/Ze", role: ROLES.DEPARTMENT_HEAD, deptId: 6, desig: "Head - Advanced Manufacturing", mobile: "+91 98450 11011" },
  { id: 13, name: "Ms. Anamika Sahay", email: "hr.head@riasat.ac.in", pass: "Hr@123", hash: "$2a$10$c469R9oPc..WqyZQJI5DFuDLSdujpKMqs2BjF2wltM/Bcj5hCZvjy", role: ROLES.DEPARTMENT_HEAD, deptId: 7, desig: "Head - HR & Recruitment", mobile: "+91 98450 11012" },
  { id: 14, name: "Ms. Vinila Kalive", email: "comm.head@riasat.ac.in", pass: "Comm@123", hash: "$2a$10$X4MJ0o5D2NQ4ncCj.cwYsunx69RP7ScESeUBy5spa1ORHOk8ziNEC", role: ROLES.DEPARTMENT_HEAD, deptId: 8, desig: "Head - Communications", mobile: "+91 98450 11013" },
  { id: 15, name: "Mr. Avinash Ghodgaonkar", email: "ops.head@riasat.ac.in", pass: "Ops@123", hash: "$2a$10$pqMkSux5M2OWpIWV/eKofOTVfNRFx8jVFVIsmrCWdf9N1GQwzFKbC", role: ROLES.DEPARTMENT_HEAD, deptId: 9, desig: "Head - Strategy & Process", mobile: "+91 98450 11014" },
];

export async function ensureDbInitialized() {
  if (isInitialized) return;
  try {
    const sb = getSupabaseClient();
    const { count } = await sb.from("users").select("*", { count: "exact", head: true });
    if (count && count >= 15) {
      isInitialized = true;
      globalThis.__riasat_supabase_seeded = true;
      return;
    }

    // Ensure 9 core departments exist in Supabase
    for (const dept of DEPARTMENTS) {
      await sb.from("departments").upsert(
        { id: dept.id, name: dept.name, code: dept.code, active: true },
        { onConflict: "id" }
      );
    }

    // Ensure 15 seed users exist in Supabase
    for (const u of OFFICIAL_SEED_USERS) {
      await sb.from("users").upsert(
        {
          name: u.name,
          email: u.email,
          password_hash: u.hash,
          mobile: u.mobile,
          designation: u.desig,
          role: u.role,
          department_id: u.deptId,
          status: "Active",
        },
        { onConflict: "email" }
      );
    }

    isInitialized = true;
    globalThis.__riasat_supabase_seeded = true;
  } catch (err) {
    console.warn("Supabase initialization check warning:", err);
  }
}

/**
 * Logs authentication and administrative actions directly into Supabase `audit_log` table.
 */
export async function logAudit(params: {
  userId?: number | null;
  userName: string;
  action: string;
  departmentId?: number | null;
  departmentName?: string;
  recordId?: number | null;
  oldValue?: string;
  newValue?: string;
  details: string;
}) {
  try {
    const sb = getSupabaseClient();
    await sb.from("audit_log").insert({
      user_id: params.userId || null,
      user_name: params.userName,
      action: params.action,
      department_id: params.departmentId || null,
      department_name: params.departmentName || null,
      record_id: params.recordId || null,
      old_value: params.oldValue || null,
      new_value: params.newValue || null,
      details: params.details,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Non-blocking audit log write
  }
}

/**
 * Pure Supabase compatibility query adapter for any legacy callers of `query(sql, params)`.
 * Executes operations exclusively via `@supabase/supabase-js` REST client (zero PostgreSQL / PGlite / filesystem).
 */
export async function query<T = any>(text: string, params: any[] = []): Promise<DbResult<T>> {
  const sb = getSupabaseClient();
  const sql = text.replace(/\s+/g, " ").trim();
  const sqlLower = sql.toLowerCase();

  // Ignore sequence setval or DDL statements
  if (sqlLower.includes("setval(") || sqlLower.startsWith("create table")) {
    return { rows: [], rowCount: 0 };
  }

  // COALESCE(MAX(id), 0) + 1 AS next_id FROM <table>
  const nextIdMatch = sql.match(/max\(id\).*from\s+([a-z_]+)/i);
  if (nextIdMatch) {
    const table = nextIdMatch[1].toLowerCase();
    const { data } = await sb.from(table).select("id").order("id", { ascending: false }).limit(1);
    const maxId = data && data.length > 0 ? Number(data[0].id) : 0;
    return { rows: [{ next_id: maxId + 1 } as any], rowCount: 1 };
  }

  // SELECT COUNT(*) FROM <table>
  if (sqlLower.startsWith("select count(*)")) {
    if (sqlLower.includes("from department_form_values") && params.length > 0) {
      const { data } = await sb
        .from("department_form_values")
        .select("id, text_value")
        .eq("field_id", params[0]);
      const count = (data || []).filter((r: any) => r.text_value !== null && r.text_value !== "").length;
      return { rows: [{ count: String(count), cnt: count } as any], rowCount: 1 };
    }
    const tblMatch = sql.match(/from\s+([a-z_]+)/i);
    const table = tblMatch ? tblMatch[1].toLowerCase() : "users";
    const { count } = await sb.from(table).select("*", { count: "exact", head: true });
    return { rows: [{ count: String(count || 0), cnt: count || 0 } as any], rowCount: 1 };
  }

  // USERS queries
  if (sqlLower.includes("from users")) {
    if (sqlLower.includes("where lower(email) =")) {
      const email = String(params[0] || "").trim().toLowerCase();
      const { data } = await sb.from("users").select("*").ilike("email", email).limit(1);
      return { rows: (data || []) as T[], rowCount: data?.length || 0 };
    }
    if (sqlLower.includes("where u.id =") || sqlLower.includes("where id =")) {
      const id = Number(params[0]);
      const { data: users } = await sb.from("users").select("*").eq("id", id).limit(1);
      if (!users || users.length === 0) return { rows: [], rowCount: 0 };
      const u = users[0];
      if (sqlLower.includes("join departments")) {
        let dept: any = null;
        if (u.department_id) {
          const { data: dData } = await sb.from("departments").select("name, code").eq("id", u.department_id).maybeSingle();
          dept = dData;
        }
        return {
          rows: [{ ...u, department_name: dept?.name || null, department_code: dept?.code || null } as any],
          rowCount: 1,
        };
      }
      return { rows: [u as any], rowCount: 1 };
    }
    // All users with department join
    const [{ data: users }, { data: depts }] = await Promise.all([
      sb.from("users").select("*").order("id", { ascending: true }),
      sb.from("departments").select("id, name, code"),
    ]);
    const deptMap = new Map((depts || []).map((d: any) => [Number(d.id), d]));
    const rows = (users || []).map((u: any) => {
      const d = u.department_id ? deptMap.get(Number(u.department_id)) : null;
      return { ...u, department_name: d?.name || null, department_code: d?.code || null };
    });
    return { rows: rows as T[], rowCount: rows.length };
  }

  if (sqlLower.startsWith("update users set last_login")) {
    const id = Number(params[0]);
    const { data } = await sb.from("users").update({ last_login: new Date().toISOString() }).eq("id", id).select();
    return { rows: (data || []) as T[], rowCount: data?.length || 0 };
  }

  // Fallback generic table select for simple `SELECT * FROM <table>`
  const simpleSelect = sql.match(/^select\s+\*\s+from\s+([a-z_]+)/i);
  if (simpleSelect) {
    const table = simpleSelect[1].toLowerCase();
    let q: any = sb.from(table).select("*");
    if (sqlLower.includes("where id = $1")) {
      q = q.eq("id", params[0]);
    } else if (sqlLower.includes("where department_id = $1")) {
      q = q.eq("department_id", params[0]);
    } else if (sqlLower.includes("where field_id = $1")) {
      q = q.eq("field_id", params[0]);
    }
    if (sqlLower.includes("and active = true") || sqlLower.includes("where active = true")) {
      q = q.eq("active", true);
    }
    if (sqlLower.includes("order by display_order asc")) {
      q = q.order("display_order", { ascending: true });
    } else if (sqlLower.includes("order by department_id asc")) {
      q = q.order("department_id", { ascending: true });
    } else if (sqlLower.includes("order by id asc")) {
      q = q.order("id", { ascending: true });
    }
    const { data } = await q;
    return { rows: (data || []) as T[], rowCount: data?.length || 0 };
  }

  // Generic DELETE FROM <table> WHERE <col> = $1
  const simpleDelete = sql.match(/^delete\s+from\s+([a-z_]+)\s+where\s+([a-z_]+)\s*=\s*\$1/i);
  if (simpleDelete) {
    const table = simpleDelete[1].toLowerCase();
    const col = simpleDelete[2].toLowerCase();
    await sb.from(table).delete().eq(col, params[0]);
    return { rows: [], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}
