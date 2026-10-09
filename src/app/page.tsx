import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export default async function HomePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (
    user.role === ROLES.ADMIN ||
    user.role === "Admin" ||
    user.role === "System Administrator" ||
    user.role === ROLES.EXECUTIVE ||
    user.role === "Executive" ||
    user.role === ROLES.VICE_CHAIRMAN ||
    user.role === "Vice Chairman" ||
    user.role === "Chairman"
  ) {
    redirect("/executive");
  } else if (user.role === ROLES.DEPARTMENT_HEAD || user.role === "Department Head") {
    redirect(user.department_id ? `/department/${user.department_id}` : "/executive");
  }

  redirect("/login");
}
