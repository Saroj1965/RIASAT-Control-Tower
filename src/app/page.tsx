import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export default async function HomePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === ROLES.ADMIN) {
    redirect("/admin");
  } else if (user.role === ROLES.EXECUTIVE) {
    redirect("/executive");
  } else if (user.role === ROLES.DEPARTMENT_HEAD) {
    redirect(user.department_id ? `/department/${user.department_id}` : "/executive");
  }

  redirect("/login");
}
