import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;

  // If the user is NOT authenticated and trying to access a protected route
  if (!token && !PUBLIC_PATHS.includes(pathname) && pathname !== "/") {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If the user IS authenticated and visiting login/register, send to dashboard
  if (token && PUBLIC_PATHS.includes(pathname)) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - API routes (api/)
     * - Static files (_next/static, _next/image, favicon.ico, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
