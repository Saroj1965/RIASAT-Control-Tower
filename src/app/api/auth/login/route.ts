import { NextResponse } from "next/server";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();

    // Password-free login: issue authenticated session token directly
    const sessionUser = {
      id: Number(body?.id) || 1,
      name: body?.name || "Mr. Venkatesh Valluri",
      email: email || "vicechairman@riasat.ac.in",
      role: body?.role || ROLES.VICE_CHAIRMAN,
      department_id: body?.department_id ?? null,
      designation: body?.designation || "Vice Chairman & Executive Director",
    };

    const token = signToken(sessionUser);
    const redirectUrl = "/executive";

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

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign in." },
      { status: 500 }
    );
  }
}
