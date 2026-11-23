import { NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  createSupabaseAuthClient,
  logAudit,
} from "@/lib/db";
import { getConfiguredSharedEmail } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const accessToken = String(body?.accessToken || "").trim();
    const newPassword = String(body?.newPassword || "").trim();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Invalid or expired password recovery session. Please request a new reset link." },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const authClient = createSupabaseAuthClient(accessToken);
    const { data: userData, error: userErr } = await authClient.auth.getUser(accessToken);

    if (userErr || !userData?.user?.email) {
      return NextResponse.json(
        { error: "Recovery token is invalid or has expired. Please request a new password reset." },
        { status: 401 }
      );
    }

    const email = userData.user.email.toLowerCase();
    const configuredSharedEmail = getConfiguredSharedEmail();

    if (configuredSharedEmail && email !== configuredSharedEmail) {
      return NextResponse.json(
        { error: "This account is not authorised to access the dashboard." },
        { status: 403 }
      );
    }

    // Update password in Supabase Auth using the user's recovery token (or admin client if available)
    const { error: updErr } = await authClient.auth.updateUser({
      password: newPassword,
    });

    if (updErr) {
      const adminSb = getSupabaseAdmin();
      if (adminSb) {
        const { error: adminErr } = await adminSb.auth.admin.updateUserById(userData.user.id, {
          password: newPassword,
          email_confirm: true,
        });
        if (adminErr) {
          return NextResponse.json({ error: adminErr.message }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: updErr.message }, { status: 400 });
      }
    }

    await logAudit({
      userId: 1,
      userName: "RIASAT Executive Office",
      action: "PASSWORD_RESET_COMPLETED",
      departmentId: null,
      details: `Shared account (${email}) completed password reset via Supabase Auth.`,
    });

    return NextResponse.json({
      success: true,
      message: "Your password has been updated successfully. You may now sign in.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
