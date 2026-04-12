import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();
    const now = new Date();

    // Current month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    // Fetch campaigns with budget and client
    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("id, client_id, name, budget_cents, status");
    if (campaignsError) throw campaignsError;

    // Fetch campaign metrics for this month
    const { data: thisMonthMetrics, error: thisError } = await supabase
      .from("campaign_metrics")
      .select("campaign_id, spend_cents")
      .gte("date", thisMonthStart);
    if (thisError) throw thisError;

    // Fetch campaign metrics for last month
    const { data: lastMonthMetrics, error: lastError } = await supabase
      .from("campaign_metrics")
      .select("campaign_id, spend_cents")
      .gte("date", lastMonthStart)
      .lt("date", lastMonthEnd);
    if (lastError) throw lastError;

    // Fetch client names
    const { data: submissions, error: subError } = await supabase
      .from("submissions")
      .select("id, business_name");
    if (subError) throw subError;

    const nameMap: Record<string, string> = {};
    for (const s of submissions || []) {
      nameMap[s.id] = s.business_name || "Unnamed";
    }

    // Build campaign -> client map + budget
    const campaignClientMap: Record<string, { client_id: string; budget_cents: number; status: string }> = {};
    for (const c of campaigns || []) {
      campaignClientMap[c.id] = {
        client_id: c.client_id,
        budget_cents: c.budget_cents || 0,
        status: c.status,
      };
    }

    // Per-client: this month spend, last month spend, budget
    const clientStats: Record<
      string,
      { this_month_cents: number; last_month_cents: number; budget_cents: number }
    > = {};

    for (const m of thisMonthMetrics || []) {
      const camp = campaignClientMap[m.campaign_id];
      if (!camp) continue;
      if (!clientStats[camp.client_id]) clientStats[camp.client_id] = { this_month_cents: 0, last_month_cents: 0, budget_cents: 0 };
      clientStats[camp.client_id].this_month_cents += m.spend_cents || 0;
    }
    for (const m of lastMonthMetrics || []) {
      const camp = campaignClientMap[m.campaign_id];
      if (!camp) continue;
      if (!clientStats[camp.client_id]) clientStats[camp.client_id] = { this_month_cents: 0, last_month_cents: 0, budget_cents: 0 };
      clientStats[camp.client_id].last_month_cents += m.spend_cents || 0;
    }
    // Aggregate budget per client (sum of active/paused campaign budgets)
    for (const c of campaigns || []) {
      if (!clientStats[c.client_id]) clientStats[c.client_id] = { this_month_cents: 0, last_month_cents: 0, budget_cents: 0 };
      if (["active", "paused"].includes(c.status)) {
        clientStats[c.client_id].budget_cents += c.budget_cents || 0;
      }
    }

    // Build per-client rows
    const clients = Object.entries(clientStats).map(([clientId, stats]) => {
      const mom =
        stats.last_month_cents > 0
          ? Math.round(((stats.this_month_cents - stats.last_month_cents) / stats.last_month_cents) * 100)
          : stats.this_month_cents > 0
          ? 100
          : 0;
      const utilization =
        stats.budget_cents > 0
          ? Math.min(100, Math.round((stats.this_month_cents / stats.budget_cents) * 100))
          : null;
      return {
        client_id: clientId,
        client_name: nameMap[clientId] || "Unknown",
        this_month_cents: stats.this_month_cents,
        last_month_cents: stats.last_month_cents,
        budget_cents: stats.budget_cents,
        mom_change: mom,
        budget_utilization: utilization,
      };
    }).sort((a, b) => b.this_month_cents - a.this_month_cents);

    // Portfolio totals
    const totalThisMonth = clients.reduce((s, c) => s + c.this_month_cents, 0);
    const totalLastMonth = clients.reduce((s, c) => s + c.last_month_cents, 0);
    const totalBudget = clients.reduce((s, c) => s + c.budget_cents, 0);
    const portfolioMom =
      totalLastMonth > 0
        ? Math.round(((totalThisMonth - totalLastMonth) / totalLastMonth) * 100)
        : totalThisMonth > 0
        ? 100
        : 0;

    return NextResponse.json({
      clients,
      portfolio: {
        this_month_cents: totalThisMonth,
        last_month_cents: totalLastMonth,
        budget_cents: totalBudget,
        mom_change: portfolioMom,
        budget_utilization: totalBudget > 0 ? Math.min(100, Math.round((totalThisMonth / totalBudget) * 100)) : null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch spend data" }, { status: 500 });
  }
}
