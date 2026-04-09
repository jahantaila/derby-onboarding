import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "derby2026";
const DEFAULT_PAGE_SIZE = 20;

function isAuthorized(request: NextRequest): boolean {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    if (token === ADMIN_PASSWORD) return true;
  }

  // Check admin_token cookie
  const cookie = request.cookies.get("admin_token");
  if (cookie?.value === ADMIN_PASSWORD) return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get("page_size") || String(DEFAULT_PAGE_SIZE), 10)));
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const supabase = getServiceClient();

    let query = supabase
      .from("submissions")
      .select("*", { count: "exact" });

    // Filter by pipeline_status
    if (status && ["new", "in_progress", "active"].includes(status)) {
      query = query.eq("pipeline_status", status);
    }

    // Search by business name or contact name
    if (search) {
      query = query.or(
        `business_name.ilike.%${search}%,contact_name.ilike.%${search}%`
      );
    }

    // Paginate and sort newest first
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
    }

    return NextResponse.json({
      submissions: data || [],
      pagination: {
        page,
        page_size: pageSize,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
