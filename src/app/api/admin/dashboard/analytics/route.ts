import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get("days") || "30", 10);
    const validDays = [30, 60, 90].includes(days) ? days : 30;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - validDays);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    // Fetch all campaigns with client info
    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("id, client_id, name, platform, budget_cents, status");
    if (campaignsError) throw campaignsError;

    // Fetch all campaign metrics within the time window
    const { data: metrics, error: metricsError } = await supabase
      .from("campaign_metrics")
      .select("campaign_id, date, impressions, clicks, conversions, spend_cents")
      .gte("date", cutoffStr)
      .order("date", { ascending: true });
    if (metricsError) throw metricsError;

    // Fetch submission names for campaign client lookup
    const { data: submissions, error: subError } = await supabase
      .from("submissions")
      .select("id, business_name");
    if (subError) throw subError;

    const nameMap: Record<string, string> = {};
    for (const s of submissions || []) {
      nameMap[s.id] = s.business_name || "Unnamed Client";
    }

    const campaignMap: Record<string, typeof campaigns[0]> = {};
    for (const c of campaigns || []) {
      campaignMap[c.id] = c;
    }

    const allMetrics = metrics || [];

    // Summary totals
    const activeCampaignIds = new Set(
      (campaigns || []).filter((c) => c.status === "active").map((c) => c.id)
    );
    const totalActiveCampaigns = activeCampaignIds.size;

    let totalSpendCents = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    for (const m of allMetrics) {
      totalSpendCents += m.spend_cents || 0;
      totalImpressions += m.impressions || 0;
      totalClicks += m.clicks || 0;
      totalConversions += m.conversions || 0;
    }

    // Time-series: daily spend and conversions aggregated by date
    const dateMap: Record<string, { date: string; spend_cents: number; conversions: number }> = {};
    for (const m of allMetrics) {
      if (!dateMap[m.date]) {
        dateMap[m.date] = { date: m.date, spend_cents: 0, conversions: 0 };
      }
      dateMap[m.date].spend_cents += m.spend_cents || 0;
      dateMap[m.date].conversions += m.conversions || 0;
    }
    const timeSeries = Object.values(dateMap).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // ROAS table: per campaign, sum spend and conversions from metrics
    const campaignStats: Record<
      string,
      { spend_cents: number; conversions: number; impressions: number; clicks: number }
    > = {};
    for (const m of allMetrics) {
      if (!campaignStats[m.campaign_id]) {
        campaignStats[m.campaign_id] = { spend_cents: 0, conversions: 0, impressions: 0, clicks: 0 };
      }
      campaignStats[m.campaign_id].spend_cents += m.spend_cents || 0;
      campaignStats[m.campaign_id].conversions += m.conversions || 0;
      campaignStats[m.campaign_id].impressions += m.impressions || 0;
      campaignStats[m.campaign_id].clicks += m.clicks || 0;
    }

    const roasTable = Object.entries(campaignStats)
      .map(([campaignId, stats]) => {
        const campaign = campaignMap[campaignId];
        if (!campaign) return null;
        const roas =
          stats.spend_cents > 0
            ? parseFloat((stats.conversions / (stats.spend_cents / 100)).toFixed(4))
            : 0;
        return {
          campaign_id: campaignId,
          campaign_name: campaign.name,
          client_id: campaign.client_id,
          client_name: nameMap[campaign.client_id] || "Unknown",
          platform: campaign.platform,
          status: campaign.status,
          spend_cents: stats.spend_cents,
          conversions: stats.conversions,
          impressions: stats.impressions,
          clicks: stats.clicks,
          roas,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b!.roas - a!.roas));

    return NextResponse.json({
      summary: {
        total_active_campaigns: totalActiveCampaigns,
        total_spend_cents: totalSpendCents,
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        total_conversions: totalConversions,
      },
      time_series: timeSeries,
      roas_table: roasTable,
      days: validDays,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
