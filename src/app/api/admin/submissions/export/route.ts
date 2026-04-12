import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const categories = searchParams.get("categories");

    const supabase = getServiceClient();

    let query = supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10000);

    if (status && ["new", "in_progress", "active"].includes(status)) {
      query = query.eq("pipeline_status", status);
    }

    if (search) {
      query = query.or(
        `business_name.ilike.%${search}%,contact_name.ilike.%${search}%`
      );
    }

    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }

    if (dateTo) {
      query = query.lte("created_at", dateTo + "T23:59:59");
    }

    if (categories) {
      const cats = categories.split(",").filter(Boolean);
      if (cats.length > 0) {
        query = query.overlaps("service_categories", cats);
      }
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to export" }, { status: 500 });
    }

    const rows = data || [];

    // Build CSV
    const headers = [
      "Business Name", "Contact Name", "Phone", "Email",
      "Address", "City", "State", "Zip",
      "Services", "Service Area (mi)", "Weekly Budget ($)",
      "Status", "Submitted Date", "Created Date",
    ];

    const csvRows = [headers.join(",")];

    for (const row of rows) {
      const services = (row.service_categories || []).join("; ");
      const budget = row.weekly_budget_cents
        ? (row.weekly_budget_cents / 100).toFixed(2)
        : "";

      const statusMap: Record<string, string> = {
        new: "New",
        in_progress: "In Progress",
        active: "Active",
      };

      csvRows.push(
        [
          escCsv(row.business_name || ""),
          escCsv(row.contact_name || ""),
          escCsv(row.business_phone || ""),
          escCsv(row.business_email || ""),
          escCsv(row.business_address || ""),
          escCsv(row.business_city || ""),
          escCsv(row.business_state || ""),
          escCsv(row.business_zip || ""),
          escCsv(services),
          row.service_area_miles || "",
          budget,
          statusMap[row.pipeline_status] || row.pipeline_status,
          row.submitted_at || "",
          row.created_at || "",
        ].join(",")
      );
    }

    const csv = csvRows.join("\n");
    const date = new Date().toISOString().split("T")[0];

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="submissions-export-${date}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}

function escCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
