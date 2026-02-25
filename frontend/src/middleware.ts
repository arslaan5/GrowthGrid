import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;

  // Only redirect authenticated users away from login/register pages.
  // Don't redirect unauthenticated users from protected routes - let client-side
  // auth checks handle that. This prevents issues when the cookie is set by
  // a different domain (API) and the middleware can't see it.
  if (token && PUBLIC_PATHS.includes(pathname)) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export default middleware;

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
