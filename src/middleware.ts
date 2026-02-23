import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const adminEmails =
  process.env.ADMIN_EMAILS?.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean) ?? [];

function isSigninPath(pathname: string) {
  // handle /admin/signin and /admin/signin/* just in case
  return pathname === "/admin/signin" || pathname.startsWith("/admin/signin/");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /admin routes (except signin)
  if (!pathname.startsWith("/admin") || isSigninPath(pathname)) {
    return NextResponse.next();
  }

  // Read NextAuth JWT (works with session: { strategy: "jwt" })
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = typeof token?.email === "string" ? token.email.toLowerCase() : "";

  // Must be signed in AND in allowlist
  const isAdmin = !!email && adminEmails.includes(email);

  if (!isAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/signin";

    // Preserve where user wanted to go, but never loop back to signin
    const desired = pathname && !isSigninPath(pathname) ? pathname : "/admin";
    url.searchParams.set("callbackUrl", desired);

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};