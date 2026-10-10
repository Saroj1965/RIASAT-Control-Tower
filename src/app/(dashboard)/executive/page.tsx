import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { getExecutiveSummaryData } from "@/lib/executive";
import ExecutiveControlTowerClient from "@/components/ExecutiveControlTowerClient";

export const dynamic = "force-dynamic";

export default async function ExecutiveControlTowerPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  // Department Heads are restricted to their assigned department
  if (user.role === ROLES.DEPARTMENT_HEAD || user.role === "Department Head") {
    redirect(user.department_id ? `/department/${user.department_id}` : "/login");
  }

  const initialData = await getExecutiveSummaryData();

  return <ExecutiveControlTowerClient initialData={initialData} />;
}
