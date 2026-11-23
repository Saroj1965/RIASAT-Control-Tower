import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Auto-redirect /login to /executive so user is never blocked by password prompts
  if (pathname === "/login" && searchParams.get("show") !== "true") {
    return NextResponse.redirect(new URL("/executive", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
