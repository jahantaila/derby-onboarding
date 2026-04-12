import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";

export interface SlaRow {
  client_id: string;
  business_name: string | null;
  total_leads: number;
  leads_with_response: number;
  avg_response_ms: number | null;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const supabase = getServiceClient();

    // Fetch all leads with response_time_ms joined to client name
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("client_id, response_time_ms");
    if (leadsError) throw leadsError;

    // Fetch submission names
    const { data: submissions, error: subError } = await supabase
      .from("submissions")
      .select("id, business_name");
    if (subError) throw subError;

    const nameMap: Record<string, string | null> = {};
    for (const s of submissions || []) {
      nameMap[s.id] = s.business_name;
    }

    // Group leads by client
    const clientMap: Record<string, { total: number; withResponse: number; totalMs: number }> = {};
    for (const l of leads || []) {
      if (!clientMap[l.client_id]) {
        clientMap[l.client_id] = { total: 0, withResponse: 0, totalMs: 0 };
      }
      clientMap[l.client_id].total += 1;
      if (l.response_time_ms != null) {
        clientMap[l.client_id].withResponse += 1;
        clientMap[l.client_id].totalMs += l.response_time_ms;
      }
    }

    const rows: SlaRow[] = Object.entries(clientMap)
      .map(([clientId, stats]) => ({
        client_id: clientId,
        business_name: nameMap[clientId] || null,
        total_leads: stats.total,
        leads_with_response: stats.withResponse,
        avg_response_ms: stats.withResponse > 0 ? Math.round(stats.totalMs / stats.withResponse) : null,
      }))
      .sort((a, b) => {
        // Sort: null (no data) last, then ascending by avg_response_ms
        if (a.avg_response_ms == null && b.avg_response_ms == null) return 0;
        if (a.avg_response_ms == null) return 1;
        if (b.avg_response_ms == null) return -1;
        return a.avg_response_ms - b.avg_response_ms;
      });

    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Failed to fetch SLA data" }, { status: 500 });
  }
}
