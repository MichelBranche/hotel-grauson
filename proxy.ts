import { NextResponse, type NextRequest } from "next/server";

import { readSession, SESSION_COOKIE } from "@pms-core/auth/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPmsApp = pathname === "/pms" || pathname.startsWith("/pms/");
  if (!isPmsApp || pathname.startsWith("/pms/login")) {
    return NextResponse.next();
  }

  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const login = new URL("/pms/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const proxyConfig = {
  matcher: ["/pms/:path*"],
};
