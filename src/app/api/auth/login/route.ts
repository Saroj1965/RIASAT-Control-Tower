import { NextResponse } from "next/server";
import {
  getSupabaseClient,
  createSupabaseAuthClient,
  logAudit,
} from "@/lib/db";
import {
  signToken,
  getConfiguredSharedEmail,
  COOKIE_NAME,
  SB_ACCESS_COOKIE,
  SB_REFRESH_COOKIE,
} from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email address and password are required." },
        { status: 400 }
      );
    }

    // 1. If SHARED_LOGIN_EMAIL is configured in server environment variables,
    //    restrict sign-in strictly to that single shared login email.
    const configuredSharedEmail = getConfiguredSharedEmail();
    if (configuredSharedEmail && email !== configuredSharedEmail) {
      return NextResponse.json(
        { error: "Invalid email address or password." },
        { status: 401 }
      );
    }

    // 2. Authenticate directly against Supabase Auth
    const authClient = createSupabaseAuthClient();
    const { data: authData, error: authError } =
      await authClient.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData?.session?.access_token) {
      return NextResponse.json(
        { error: "Invalid email address or password." },
        { status: 401 }
      );
    }

    const sb = getSupabaseClient(authData.session.access_token);
    const meta = authData.user?.user_metadata || {};

    const sessionUser = {
      id: Number(meta.app_user_id) || 1,
      name: meta.name || "RIASAT Executive Office",
      email: authData.user?.email || email,
      role: ROLES.VICE_CHAIRMAN,
      department_id: null,
      designation: meta.designation || "Authorised Dashboard Access",
      auth_uid: authData.user?.id,
    };

    const token = signToken(sessionUser);
    const redirectUrl = "/executive";

    // Log sign-in event (non-blocking and without requiring foreign key in public.users)
    await Promise.allSettled([
      sb.from("login_logs").insert({
        user_id: null,
        email: sessionUser.email,
        user_name: sessionUser.name,
        role: sessionUser.role,
        department_id: null,
        status: "SUCCESS",
        details: `Shared account authenticated via Supabase Auth (${authData.user?.id || "session"})`,
      }),
      logAudit({
        userId: sessionUser.id,
        userName: sessionUser.name,
        action: "USER_LOGIN",
        departmentId: null,
        details: `Authorised user signed in via shared Supabase Auth account (${sessionUser.email}).`,
      }),
    ]);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      redirectUrl,
    });

    const isHttps =
      req.headers.get("x-forwarded-proto") === "https" ||
      req.url.startsWith("https://");

    const cookieOptions = {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    response.cookies.set(COOKIE_NAME, token, cookieOptions);
    response.cookies.set(
      SB_ACCESS_COOKIE,
      authData.session.access_token,
      cookieOptions
    );
    if (authData.session.refresh_token) {
      response.cookies.set(
        SB_REFRESH_COOKIE,
        authData.session.refresh_token,
        cookieOptions
      );
    }

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign in." },
      { status: 500 }
    );
  }
}
