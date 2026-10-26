import { NextResponse } from "next/server";
import { getSupabaseClient, OFFICIAL_SEED_USERS } from "@/lib/db";
import { ROLES } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_PASSWORDS: Record<string, string> = {
  "vicechairman@riasat.ac.in": "ViceChairman@123",
  "admin@riasat.ac.in": "Admin@123",
  "executive@riasat.ac.in": "Exec@123",
  "forms.admin@riasat.ac.in": "Forms@123",
  "users.admin@riasat.ac.in": "Users@123",
  "dept.admin@riasat.ac.in": "Dept@123",
  "semicon.head@riasat.ac.in": "Semicon@123",
  "aero.head@riasat.ac.in": "Aero@123",
  "space.head@riasat.ac.in": "Space@123",
  "cyber.head@riasat.ac.in": "Cyber@123",
  "medtech.head@riasat.ac.in": "MedTech@123",
  "mfg.head@riasat.ac.in": "Mfg@123",
  "hr.head@riasat.ac.in": "Hr@123",
  "comm.head@riasat.ac.in": "Comm@123",
  "ops.head@riasat.ac.in": "Ops@123",
};

export async function GET() {
  try {
    const sb = getSupabaseClient();

    const [{ data: deptsData }, { data: usersData }] = await Promise.all([
      sb.from("departments").select("id, name, code, head_of_department, display_order, active").eq("active", true).order("display_order"),
      sb.from("users").select("id, name, email, mobile, designation, role, department_id, status, last_login, created_at, updated_at").order("id"),
    ]);

    const deptMap = new Map<number, any>();
    for (const d of deptsData || []) {
      deptMap.set(Number(d.id), d);
    }

    const rawUsers = usersData && usersData.length > 0 ? usersData : OFFICIAL_SEED_USERS;

    const credentials = rawUsers.map((u: any) => {
      const emailLower = String(u.email || "").toLowerCase().trim();
      const deptId = u.department_id ? Number(u.department_id) : null;
      const dept = deptId ? deptMap.get(deptId) : null;

      let category: "Leadership" | "Administration" | "Department Heads" = "Department Heads";
      let badgeColor = "bg-blue-600 text-white";

      if (
        u.role === ROLES.VICE_CHAIRMAN ||
        u.role === "Vice Chairman" ||
        u.role === ROLES.ADMIN ||
        u.role === "Admin" ||
        u.role === ROLES.EXECUTIVE ||
        u.role === "Executive"
      ) {
        category = "Leadership";
        badgeColor =
          u.role === ROLES.VICE_CHAIRMAN || u.role === "Vice Chairman"
            ? "bg-[#003B71] text-white"
            : u.role === ROLES.ADMIN || u.role === "Admin"
            ? "bg-slate-950 text-white"
            : "bg-[#D81B60] text-white";
      } else if (
        u.role === ROLES.FORM_ADMIN ||
        u.role === "Form Admin" ||
        u.role === ROLES.USER_ADMIN ||
        u.role === "User Admin" ||
        u.role === ROLES.DEPT_ADMIN ||
        u.role === "Department Admin"
      ) {
        category = "Administration";
        badgeColor =
          u.role === ROLES.FORM_ADMIN || u.role === "Form Admin"
            ? "bg-[#F37021] text-white"
            : u.role === ROLES.USER_ADMIN || u.role === "User Admin"
            ? "bg-indigo-700 text-white"
            : "bg-[#D81B60] text-white";
      }

      const defaultPass =
        DEFAULT_PASSWORDS[emailLower] ||
        (emailLower.split("@")[0].split(".")[0]
          ? emailLower.split("@")[0].split(".")[0].charAt(0).toUpperCase() +
            emailLower.split("@")[0].split(".")[0].slice(1) +
            "@123"
          : "Welcome@RIASAT1");

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        mobile: u.mobile || "",
        pass: defaultPass,
        role: u.role,
        department_id: deptId,
        department_name: dept?.name || (deptId === null ? "Global Executive / Admin" : "Department"),
        department_code: dept?.code || "GLOBAL",
        head_of_department: dept?.head_of_department || "To be hired",
        designation: u.designation || "",
        status: u.status || "Active",
        last_login: u.last_login || null,
        category,
        badgeColor,
        scope:
          dept?.name
            ? `${dept.name} Strategic Vertical & Governance`
            : u.role === "Vice Chairman"
            ? "Complete Executive Control & Action Sign-off"
            : u.role === "Admin"
            ? "Full System Access & Configuration"
            : "Institutional Governance & Dashboard Oversight",
      };
    });

    return NextResponse.json({
      success: true,
      credentials,
      departments: deptsData || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
