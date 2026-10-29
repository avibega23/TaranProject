import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/report-item", "/my-reports", "/claims", "/profile", "/admin"];

export function middleware(request: NextRequest) {
  const cookieName = process.env.SESSION_COOKIE_NAME || "findit_session";
  const hasSession = Boolean(request.cookies.get(cookieName)?.value);
  const { pathname } = request.nextUrl;
  const needsAuth = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (needsAuth && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if ((pathname === "/login" || pathname === "/register") && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/report-item",
    "/report-item/:path*",
    "/my-reports",
    "/my-reports/:path*",
    "/claims",
    "/claims/:path*",
    "/profile",
    "/profile/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
