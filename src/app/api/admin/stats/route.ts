import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "derby2026";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    if (token === ADMIN_PASSWORD) return true;
  }
  const cookie = request.cookies.get("admin_token");
  if (cookie?.value === ADMIN_PASSWORD) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();

    // Fetch all submissions
    const { data: submissions, error } = await supabase
      .from("submissions")
      .select("pipeline_status, created_at");

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

    return NextResponse.json({
      total,
      new: newCount,
      in_progress: inProgressCount,
      active: activeCount,
      this_week: thisWeek,
      this_month: thisMonth,
      weekly_chart: weeklyData,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
