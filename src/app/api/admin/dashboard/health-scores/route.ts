import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";

export interface ClientHealthScore {
  client_id: string;
  business_name: string;
  score: number; // 0-100
  tier: "healthy" | "attention" | "at_risk";
  factors: {
    sla_compliance: number; // 0-100
    has_active_campaign: boolean;
    lead_conversion_rate: number; // 0-100
    days_since_activity: number | null;
  };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();

    // Fetch all active/in_progress submissions
    const { data: submissions, error: subError } = await supabase
      .from("submissions")
      .select("id, business_name, pipeline_status, created_at")
      .in("pipeline_status", ["active", "in_progress"]);
    if (subError) throw subError;

    const clients = submissions || [];
    if (clients.length === 0) {
      return NextResponse.json({ clients: [] });
    }

    // Fetch leads for all clients
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("client_id, status, response_time_ms, created_at, updated_at");
    if (leadsError) throw leadsError;

    // Fetch campaigns for all clients
    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("id, client_id, status, updated_at");
    if (campaignsError) throw campaignsError;

    // Fetch most recent campaign_metrics date per client (via campaign join)
    const { data: recentMetrics, error: metricsError } = await supabase
      .from("campaign_metrics")
      .select("campaign_id, date")
      .order("date", { ascending: false });
    if (metricsError) throw metricsError;

    // Build campaign id -> client_id map
    const campaignClientMap: Record<string, string> = {};
    for (const c of campaigns || []) {
      campaignClientMap[c.id] = c.client_id;
    }

    // Most recent metric date per client
    const latestMetricDate: Record<string, string> = {};
    for (const m of recentMetrics || []) {
      const clientId = campaignClientMap[m.campaign_id];
      if (clientId && !latestMetricDate[clientId]) {
        latestMetricDate[clientId] = m.date;
      }
    }

    type LeadRow = { client_id: string; status: string; response_time_ms: number | null; created_at: string; updated_at: string };
    type CampaignRow = { id: string; client_id: string; status: string; updated_at: string };

    // Group leads by client
    const leadsByClient: Record<string, LeadRow[]> = {};
    for (const l of leads || []) {
      if (!leadsByClient[l.client_id]) leadsByClient[l.client_id] = [];
      leadsByClient[l.client_id].push(l as LeadRow);
    }

    // Group campaigns by client
    const campaignsByClient: Record<string, CampaignRow[]> = {};
    for (const c of campaigns || []) {
      if (!campaignsByClient[c.client_id]) campaignsByClient[c.client_id] = [];
      campaignsByClient[c.client_id].push(c as CampaignRow);
    }

    const now = new Date();
    const SLA_THRESHOLD_MS = 30 * 60 * 1000; // 30 min

    const result: ClientHealthScore[] = clients.map((client) => {
      const clientLeads = leadsByClient[client.id] || [];
      const clientCampaigns = campaignsByClient[client.id] || [];

      // 1. SLA compliance: % of leads with response_time_ms < 30 min (among those with a response)
      const leadsWithResponse = clientLeads.filter((l) => l.response_time_ms != null);
      const slaCompliant = leadsWithResponse.filter(
        (l) => l.response_time_ms! <= SLA_THRESHOLD_MS
      );
      const sla_compliance =
        leadsWithResponse.length > 0
          ? Math.round((slaCompliant.length / leadsWithResponse.length) * 100)
          : 50; // neutral if no data

      // 2. Has active campaign
      const has_active_campaign = clientCampaigns.some((c) => c.status === "active");

      // 3. Lead conversion rate
      const convertedLeads = clientLeads.filter((l) => l.status === "converted").length;
      const lead_conversion_rate =
        clientLeads.length > 0
          ? Math.round((convertedLeads / clientLeads.length) * 100)
          : 0;

      // 4. Days since last activity (most recent: lead updated_at, campaign updated_at, metric date)
      const timestamps: Date[] = [];
      for (const l of clientLeads) {
        if (l.updated_at) timestamps.push(new Date(l.updated_at));
      }
      for (const c of clientCampaigns) {
        if (c.updated_at) timestamps.push(new Date(c.updated_at));
      }
      if (latestMetricDate[client.id]) {
        timestamps.push(new Date(latestMetricDate[client.id]));
      }

      let days_since_activity: number | null = null;
      if (timestamps.length > 0) {
        const latest = new Date(Math.max(...timestamps.map((t) => t.getTime())));
        days_since_activity = Math.floor(
          (now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      // Composite score (weighted):
      // SLA compliance: 30%
      // Campaign active: 25% (binary)
      // Lead conversion rate: 25%
      // Recency (days since activity): 20%
      const slaScore = sla_compliance * 0.3;
      const campaignScore = has_active_campaign ? 25 : 0;
      const conversionScore = Math.min(lead_conversion_rate, 100) * 0.25;

      let recencyScore = 0;
      if (days_since_activity === null) {
        recencyScore = 10; // neutral/unknown
      } else if (days_since_activity <= 3) {
        recencyScore = 20;
      } else if (days_since_activity <= 7) {
        recencyScore = 16;
      } else if (days_since_activity <= 14) {
        recencyScore = 12;
      } else if (days_since_activity <= 30) {
        recencyScore = 6;
      } else {
        recencyScore = 0;
      }

      const score = Math.round(slaScore + campaignScore + conversionScore + recencyScore);

      const tier: ClientHealthScore["tier"] =
        score >= 70 ? "healthy" : score >= 40 ? "attention" : "at_risk";

      return {
        client_id: client.id,
        business_name: client.business_name || "Unnamed Client",
        score,
        tier,
        factors: {
          sla_compliance,
          has_active_campaign,
          lead_conversion_rate,
          days_since_activity,
        },
      };
    });

    // Sort by score descending
    result.sort((a, b) => b.score - a.score);

    return NextResponse.json({ clients: result });
  } catch {
    return NextResponse.json({ error: "Failed to compute health scores" }, { status: 500 });
  }
}
