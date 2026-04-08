import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ALLOWED_SORT = ["submitted_at", "business_name", "contact_name", "pipeline_status"];
const DEFAULT_LIMIT = 25;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const q = params.get("q") ?? "";
  const status = params.get("status") ?? "";
  const sort = params.get("sort") ?? "submitted_at";
  const order = params.get("order") === "asc" ? true : false; // true = ascending
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;

  const sortCol = ALLOWED_SORT.includes(sort) ? sort : "submitted_at";

  const supabase = createServiceClient();

  // Build query for count
  let countQuery = supabase
    .from("submissions")
    .select("id", { count: "exact", head: true });

  // Build query for data
  let dataQuery = supabase
    .from("submissions")
    .select("id, session_id, business_name, contact_name, contact_email, contact_phone, pipeline_status, submitted_at, documents(count)")
    .order(sortCol, { ascending: order })
    .range(offset, offset + limit - 1);

  // Apply search filter
  if (q) {
    const escaped = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
    const pattern = `%${escaped}%`;
    const filter = `business_name.ilike.${pattern},contact_name.ilike.${pattern},contact_email.ilike.${pattern}`;
    countQuery = countQuery.or(filter);
    dataQuery = dataQuery.or(filter);
  }

  // Apply status filter
  if (status && ["new", "in_progress", "active"].includes(status)) {
    countQuery = countQuery.eq("pipeline_status", status);
    dataQuery = dataQuery.eq("pipeline_status", status);
  }

  const [{ count }, { data, error }] = await Promise.all([
    countQuery,
    dataQuery,
  ]);

  if (error) {
    console.error("Admin submissions list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }

  const submissions = (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    document_count:
      Array.isArray(row.documents) && row.documents.length > 0
        ? (row.documents[0] as { count: number }).count
        : 0,
    documents: undefined,
  }));

  return NextResponse.json({
    submissions,
    total: count ?? 0,
    page,
    limit,
  });
}
