import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const sb = getSupabaseClient();
    const { data: dbUser } = await sb
      .from("users")
      .select("id, name, email, mobile, designation, role, department_id, status")
      .eq("id", user.id)
      .maybeSingle();

    if (!dbUser || dbUser.status !== "Active") {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    let department_name: string | null = null;
    let department_code: string | null = null;

    if (dbUser.department_id) {
      const { data: dept } = await sb
        .from("departments")
        .select("name, code")
        .eq("id", dbUser.department_id)
        .maybeSingle();
      if (dept) {
        department_name = dept.name;
        department_code = dept.code;
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        ...dbUser,
        department_name,
        department_code,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
