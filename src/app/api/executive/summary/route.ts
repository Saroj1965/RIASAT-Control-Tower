import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { getExecutiveSummaryData } from "@/lib/executive";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === ROLES.DEPARTMENT_HEAD || user.role === "Department Head") {
      return NextResponse.json(
        { error: "Forbidden: Department Heads do not have access to the Executive Tower." },
        { status: 403 }
      );
    }

    const data = await getExecutiveSummaryData();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
