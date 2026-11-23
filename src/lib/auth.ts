import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { ROLES } from "./constants";
import { createSupabaseAuthClient } from "./supabase";

const JWT_SECRET = process.env.JWT_SECRET || "riasat-control-tower-jwt-secret-key-2026-production";
const COOKIE_NAME = "riasat_session";
const SB_ACCESS_COOKIE = "sb-access-token";
const SB_REFRESH_COOKIE = "sb-refresh-token";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
  department_id: number | null;
  designation: string;
  auth_uid?: string;
}

export function getConfiguredSharedEmail(): string | null {
  const raw = (process.env.SHARED_LOGIN_EMAIL || "").trim().replace(/^["']|["']$/g, "");
  return raw ? raw.toLowerCase() : null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      designation: user.designation,
      auth_uid: user.auth_uid,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Validates the current request's session using Supabase Auth (`sb-access-token`).
 * Designed for a single shared Supabase Auth login: any valid authenticated session
 * for the authorised shared account receives full dashboard access without requiring
 * individual user accounts in `public.users`.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const sbAccessToken = cookieStore.get(SB_ACCESS_COOKIE)?.value;
    const sessionToken = cookieStore.get(COOKIE_NAME)?.value;

    if (!sbAccessToken) {
      return null;
    }

    // 1. Verify the access token directly against Supabase Auth
    const authClient = createSupabaseAuthClient(sbAccessToken);
    const { data: authData, error: authErr } = await authClient.auth.getUser(sbAccessToken);
    if (authErr || !authData?.user?.email) {
      return null;
    }

    const verifiedEmail = authData.user.email.toLowerCase();
    const authUid = authData.user.id;

    // 2. If a specific SHARED_LOGIN_EMAIL is configured in server env, enforce it strictly
    const sharedEmail = getConfiguredSharedEmail();
    if (sharedEmail && verifiedEmail !== sharedEmail) {
      return null;
    }

    const decodedSession = sessionToken ? verifyToken(sessionToken) : null;
    const meta = authData.user.user_metadata || {};

    return {
      id: decodedSession?.id || Number(meta.app_user_id) || 1,
      name: decodedSession?.name || meta.name || "RIASAT Executive Office",
      email: authData.user.email,
      role: ROLES.VICE_CHAIRMAN,
      department_id: null,
      designation: decodedSession?.designation || meta.designation || "Authorised Dashboard Access",
      auth_uid: authUid,
    };
  } catch {
    return null;
  }
}

export function hasFullAccess(user: SessionUser | null): boolean {
  if (!user) return false;
  return true;
}

export function canEditDepartment(user: SessionUser | null, _departmentId?: number): boolean {
  if (!user) return false;
  return true;
}

export function canViewDepartment(user: SessionUser | null, _departmentId?: number): boolean {
  if (!user) return false;
  return true;
}

export function canManageForms(user: SessionUser | null): boolean {
  if (!user) return false;
  return true;
}

export function canManageUsers(user: SessionUser | null): boolean {
  if (!user) return false;
  return true;
}

export function canManageDepartments(user: SessionUser | null): boolean {
  if (!user) return false;
  return true;
}

export function canAccessAdmin(user: SessionUser | null): boolean {
  if (!user) return false;
  return true;
}

export { COOKIE_NAME, SB_ACCESS_COOKIE, SB_REFRESH_COOKIE };
