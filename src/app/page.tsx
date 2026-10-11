import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export default async function HomePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === ROLES.FORM_ADMIN || user.role === "Form Admin") {
    redirect("/admin?tab=form_config");
  } else if (user.role === ROLES.USER_ADMIN || user.role === "User Admin") {
    redirect("/admin?tab=users");
  } else if (user.role === ROLES.DEPT_ADMIN || user.role === "Department Admin") {
    redirect("/admin?tab=departments");
  } else if (
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
