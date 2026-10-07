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

export function canEditDepartment(user: SessionUser | null, departmentId: number): boolean {
  if (!user) return false;
  // Vice Chairman and Admin have complete access across the entire dashboard
  if (hasFullAccess(user)) return true;
  if (user.role === ROLES.EXECUTIVE) return false;
  if (user.role === ROLES.DEPARTMENT_HEAD) {
    return Number(user.department_id) === Number(departmentId);
  }
  return false;
}

export function canViewDepartment(user: SessionUser | null, departmentId: number): boolean {
  if (!user) return false;
  // Vice Chairman, Executive, and Admin can view all departments
  if (hasFullAccess(user) || user.role === ROLES.EXECUTIVE) return true;
  if (user.role === ROLES.DEPARTMENT_HEAD) {
    return Number(user.department_id) === Number(departmentId);
  }
  return false;
}

export { COOKIE_NAME };
