import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  SB_ACCESS_COOKIE,
  SB_REFRESH_COOKIE,
  getSessionUser,
} from "@/lib/auth";
import { createSupabaseAuthClient, logAudit } from "@/lib/db";

export async function POST() {
  try {
    const cookieStore = cookies();
    const sbAccessToken = cookieStore.get(SB_ACCESS_COOKIE)?.value;
    const user = await getSessionUser();

    if (sbAccessToken) {
      try {
        const authClient = createSupabaseAuthClient(sbAccessToken);
        await authClient.auth.signOut();
      } catch {
        // Ignore signOut token expiry errors
      }
    }

    if (user) {
      await logAudit({
        userId: user.id,
        userName: user.name,
        action: "USER_LOGOUT",
        departmentId: user.department_id,
        details: `${user.name} (${user.email}) signed out of RIASAT Executive Dashboard.`,
      });
    }
  } catch {
    // Proceed to clear cookies even if audit logging fails
  }

  const response = NextResponse.json({
    success: true,
    message: "Signed out successfully",
  });

  response.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set(SB_ACCESS_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set(SB_REFRESH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });

  return response;
}
