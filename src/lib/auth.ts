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

export const DEFAULT_EXECUTIVE_USER: SessionUser = {
  id: 1,
  name: "Mr. Venkatesh Valluri",
  email: "vicechairman@riasat.ac.in",
  role: ROLES.VICE_CHAIRMAN,
  department_id: null,
  designation: "Vice Chairman & Executive Director",
};

/**
 * Validates the current request's session using cookies or defaults to Vice Chairman executive access.
 * Login with passwords is removed so any visitor has instant, full executive access.
 */
export async function getSessionUser(): Promise<SessionUser> {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get(COOKIE_NAME)?.value;
    if (sessionToken) {
      const decoded = verifyToken(sessionToken);
      if (decoded) {
        return decoded;
      }
    }

    const sbAccessToken = cookieStore.get(SB_ACCESS_COOKIE)?.value;
    if (sbAccessToken) {
      const authClient = createSupabaseAuthClient(sbAccessToken);
      const { data: authData, error: authErr } = await authClient.auth.getUser(sbAccessToken);
      if (!authErr && authData?.user?.email) {
        const meta = authData.user.user_metadata || {};
        return {
          id: Number(meta.app_user_id) || 1,
          name: meta.name || "Mr. Venkatesh Valluri",
          email: authData.user.email,
          role: ROLES.VICE_CHAIRMAN,
          department_id: null,
          designation: meta.designation || "Vice Chairman & Executive Director",
          auth_uid: authData.user.id,
        };
      }
    }
  } catch {
    // Ignore cookie/session errors
  }

  // Password-free direct access: default to full Vice Chairman executive permissions
  return DEFAULT_EXECUTIVE_USER;
}

export function hasFullAccess(_user: SessionUser | null): boolean {
  return true;
}

export function canEditDepartment(_user: SessionUser | null, _departmentId?: number): boolean {
  return true;
}

export function canViewDepartment(_user: SessionUser | null, _departmentId?: number): boolean {
  return true;
}

export function canManageForms(_user: SessionUser | null): boolean {
  return true;
}

export function canManageUsers(_user: SessionUser | null): boolean {
  return true;
}

export function canManageDepartments(_user: SessionUser | null): boolean {
  return true;
}

export function canAccessAdmin(_user: SessionUser | null): boolean {
  return true;
}

export { COOKIE_NAME, SB_ACCESS_COOKIE, SB_REFRESH_COOKIE };
