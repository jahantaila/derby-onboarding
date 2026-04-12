import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();

    // Fetch all submissions with service_categories for analytics
    const { data: submissions, error } = await supabase
      .from("submissions")
      .select("pipeline_status, created_at, submitted_at, service_categories");

    if (error) {
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }

    const all = submissions || [];

    // Counts by status
    const total = all.length;
    const newCount = all.filter((s) => s.pipeline_status === "new").length;
    const inProgressCount = all.filter((s) => s.pipeline_status === "in_progress").length;
    const activeCount = all.filter((s) => s.pipeline_status === "active").length;

    // This week (Monday to now)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const thisWeek = all.filter((s) => new Date(s.created_at) >= weekStart).length;

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = all.filter((s) => new Date(s.created_at) >= monthStart).length;

    // Weekly chart data: last 8 weeks
    const weeklyData: { week: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const wStart = new Date(weekStart);
      wStart.setDate(wStart.getDate() - i * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 7);

      const count = all.filter((s) => {
        const d = new Date(s.created_at);
        return d >= wStart && d < wEnd;
      }).length;

      const label = `${wStart.getMonth() + 1}/${wStart.getDate()}`;
      weeklyData.push({ week: label, count });
    }

    // Conversion funnel
    const funnel = {
      new: newCount,
      in_progress: inProgressCount,
      active: activeCount,
      new_to_ip_rate: total > 0 ? Math.round(((inProgressCount + activeCount) / total) * 100) : 0,
      ip_to_active_rate: (inProgressCount + activeCount) > 0 ? Math.round((activeCount / (inProgressCount + activeCount)) * 100) : 0,
    };

    // Service category breakdown
    const categoryMap: Record<string, number> = {};
    for (const sub of all) {
      if (sub.service_categories) {
        for (const cat of sub.service_categories) {
          categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        }
      }
    }
    const service_breakdown = Object.entries(categoryMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Monthly trends: last 6 months
    const monthly_trends: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = all.filter((s) => {
        const d = new Date(s.submitted_at || s.created_at);
        return d >= mStart && d < mEnd;
      }).length;
      const label = mStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      monthly_trends.push({ month: label, count });
    }

    // Average time in stage (simplified: avg days since submission for each current status)
    const statusGroups: Record<string, number[]> = { new: [], in_progress: [], active: [] };
    for (const sub of all) {
      const created = new Date(sub.submitted_at || sub.created_at);
      const days = Math.max(0, Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
      if (statusGroups[sub.pipeline_status]) {
        statusGroups[sub.pipeline_status].push(days);
      }
    }
    const avg_time_in_stage = Object.entries(statusGroups).map(([status, days]) => ({
      status,
      avg_days: days.length > 0 ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0,
    }));

    return NextResponse.json({
      total,
      new: newCount,
      in_progress: inProgressCount,
      active: activeCount,
      this_week: thisWeek,
      this_month: thisMonth,
      weekly_chart: weeklyData,
      funnel,
      service_breakdown,
      monthly_trends,
      avg_time_in_stage,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
