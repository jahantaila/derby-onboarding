import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";

const DEFAULT_PAGE_SIZE = 20;

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
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const categories = searchParams.get("categories");

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

    // Date range filter
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo + "T23:59:59");
    }

    // Service categories filter
    if (categories) {
      const cats = categories.split(",").filter(Boolean);
      if (cats.length > 0) {
        query = query.overlaps("service_categories", cats);
      }
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
