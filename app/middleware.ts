import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

const roleRoutes = [
  {
    prefix: "/admin",
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    prefix: "/teacher",
    roles: ["TEACHER"],
  },
  {
    prefix: "/student",
    roles: ["STUDENT"],
  },
  {
    prefix: "/parent",
    roles: ["PARENT"],
  },
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const protectedRoute = roleRoutes.find((route) =>
    pathname.startsWith(route.prefix)
  );

  if (!protectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySession(token);

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (!protectedRoute.roles.includes(session.role)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/parent/:path*",
  ],
};