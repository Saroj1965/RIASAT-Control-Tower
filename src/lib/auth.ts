import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { ROLES } from "./constants";

const JWT_SECRET = process.env.JWT_SECRET || "riasat-control-tower-jwt-secret-key-2026-production";
const COOKIE_NAME = "riasat_session";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
  department_id: number | null;
  designation: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
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

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function hasFullAccess(user: SessionUser | null): boolean {
  if (!user) return false;
  return (
    user.role === ROLES.ADMIN ||
    user.role === "Admin" ||
    user.role === "System Administrator" ||
    user.role === ROLES.VICE_CHAIRMAN ||
    user.role === "Vice Chairman" ||
    user.role === "Chairman"
  );
}

export function canEditDepartment(user: SessionUser | null, _departmentId?: number): boolean {
  if (!user) return false;
  // Every authenticated user on the Riasat Executive Dashboard can edit actions and submit updates
  return true;
}

export function canViewDepartment(user: SessionUser | null, _departmentId?: number): boolean {
  if (!user) return false;
  // Every authenticated user can view department registers and reports
  return true;
}

export function canManageForms(user: SessionUser | null): boolean {
  if (!user) return false;
  return true;
}

export function canManageUsers(user: SessionUser | null): boolean {
  if (!user) return false;
  return (
    hasFullAccess(user) ||
    user.role === ROLES.USER_ADMIN ||
    user.role === "User Admin" ||
    user.role === "Users Admin"
  );
}

export function canManageDepartments(user: SessionUser | null): boolean {
  if (!user) return false;
  return true;
}

export function canAccessAdmin(user: SessionUser | null): boolean {
  if (!user) return false;
  return (
    hasFullAccess(user) ||
    canManageForms(user) ||
    canManageUsers(user) ||
    canManageDepartments(user)
  );
}

export { COOKIE_NAME };
