import { NextResponse } from "next/server";
import { createSupabaseAuthClient, logAudit } from "@/lib/db";
import { getConfiguredSharedEmail } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const configuredSharedEmail = getConfiguredSharedEmail();
    const isAllowed = !configuredSharedEmail || email === configuredSharedEmail;

    if (isAllowed) {
      const origin =
        process.env.NEXT_PUBLIC_APP_URL ||
        req.headers.get("origin") ||
        (req.headers.get("host")
          ? `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("host")}`
          : "https://riasat-executive-dashboard.vercel.app");

      const authClient = createSupabaseAuthClient();
      await authClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin.replace(/\/+$/, "")}/reset-password`,
      });

      await logAudit({
        userId: 1,
        userName: "RIASAT Executive Office",
        action: "PASSWORD_RESET_REQUESTED",
        departmentId: null,
        details: `Password reset email requested via Supabase Auth for ${email}.`,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "If an authorised account exists for this email address, password reset instructions have been sent.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unable to process password reset request at this time." },
      { status: 500 }
    );
  }
}
