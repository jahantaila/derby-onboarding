import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";

const STAGES = ["new", "contacted", "qualified", "converted", "lost"] as const;

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");
    const dateRange = url.searchParams.get("dateRange") || "all"; // "7d", "30d", "all"

    let query = supabase.from("leads").select("id, client_id, status, created_at");

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    if (dateRange !== "all") {
      const days = dateRange === "7d" ? 7 : 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      query = query.gte("created_at", cutoff.toISOString());
    }

    const { data: leads, error } = await query;
    if (error) throw error;

    const all = leads || [];

    // Count per stage
    const stageCounts: Record<string, number> = {};
    for (const stage of STAGES) {
      stageCounts[stage] = all.filter((l) => l.status === stage).length;
    }

    // Conversion rates between adjacent stages (excluding "lost")
    const funnelStages = ["new", "contacted", "qualified", "converted"] as const;
    const conversionRates: { from: string; to: string; rate: number }[] = [];
    for (let i = 0; i < funnelStages.length - 1; i++) {
      const fromStage = funnelStages[i];
      const toStage = funnelStages[i + 1];
      // Count leads that made it to toStage or beyond (among those that passed fromStage)
      const passedFrom = all.filter((l) => {
        const idx = funnelStages.indexOf(l.status as typeof funnelStages[number]);
        return idx >= i;
      }).length;
      const passedTo = all.filter((l) => {
        const idx = funnelStages.indexOf(l.status as typeof funnelStages[number]);
        return idx > i;
      }).length;
      const rate = passedFrom > 0 ? Math.round((passedTo / passedFrom) * 100) : 0;
      conversionRates.push({ from: fromStage, to: toStage, rate });
    }

    // Weekly count (this week)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    const thisWeek = all.filter((l) => new Date(l.created_at) >= weekStart).length;

    // Monthly count
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = all.filter((l) => new Date(l.created_at) >= monthStart).length;

    // Trend: compare this month vs last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = all.filter((l) => {
      const d = new Date(l.created_at);
      return d >= lastMonthStart && d < lastMonthEnd;
    }).length;
    const monthTrend =
      lastMonth > 0
        ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
        : thisMonth > 0
        ? 100
        : 0;

    // Client list for filter dropdown
    const { data: submissions } = await supabase
      .from("submissions")
      .select("id, business_name")
      .in("pipeline_status", ["active", "in_progress"]);
    const clientOptions = (submissions || []).map((s) => ({
      id: s.id,
      name: s.business_name || "Unnamed",
    }));

    return NextResponse.json({
      stage_counts: stageCounts,
      conversion_rates: conversionRates,
      total: all.length,
      this_week: thisWeek,
      this_month: thisMonth,
      month_trend: monthTrend,
      client_options: clientOptions,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch lead pipeline" }, { status: 500 });
  }
}
