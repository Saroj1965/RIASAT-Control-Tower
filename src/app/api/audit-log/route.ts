import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const sb = getSupabaseClient();
    const [{ data: deptsRows }, { data: logsRows }] = await Promise.all([
      sb.from("departments").select("id, name"),
      sb.from("audit_log").select("*").order("timestamp", { ascending: false }).limit(Math.max(limit * 2, 100)),
    ]);

    const deptMap = new Map<number, string>();
    for (const d of deptsRows || []) {
      deptMap.set(Number(d.id), d.name);
    }

    let filtered = logsRows || [];
    if (user.role !== ROLES.ADMIN && user.role !== ROLES.EXECUTIVE && user.role !== ROLES.VICE_CHAIRMAN) {
      filtered = filtered.filter(
        (a: any) => Number(a.department_id) === Number(user.department_id) || Number(a.user_id) === Number(user.id)
      );
    }

    const logs = filtered.slice(0, limit).map((a: any) => ({
      ...a,
      department_name_full: a.department_id ? deptMap.get(Number(a.department_id)) || a.department_name : a.department_name,
    }));

    return NextResponse.json({ logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
