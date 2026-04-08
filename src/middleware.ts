import { NextRequest, NextResponse } from "next/server";
import { verifyCookie, COOKIE_NAME } from "@/lib/admin-auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page and auth endpoint through without cookie
  if (pathname === "/admin" || pathname === "/api/admin/auth") {
    return NextResponse.next();
  }

  // Check for ADMIN_PASSWORD configuration
  if (!process.env.ADMIN_PASSWORD) {
    return new NextResponse("Admin not configured", { status: 500 });
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value;

  if (!cookie || !(await verifyCookie(cookie))) {
    // API routes get 401; pages get redirect to login
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/admin";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path+", "/api/admin/:path+"],
};
