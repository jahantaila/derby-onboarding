import { NextRequest } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "derby2026";

export function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    if (token === ADMIN_PASSWORD) return true;
  }
  const cookie = request.cookies.get("admin_token");
  if (cookie?.value === ADMIN_PASSWORD) return true;
  return false;
}
