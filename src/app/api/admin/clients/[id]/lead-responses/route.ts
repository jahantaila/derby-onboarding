import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { isAuthorized } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("lead_responses")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Failed to fetch lead responses" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("lead_responses")
      .insert({
        client_id: id,
        template_name: body.template_name,
        subject: body.subject || "",
        body_template: body.body_template || "",
        channel: body.channel || "email",
        is_active: body.is_active ?? true,
        delay_seconds: body.delay_seconds ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to create lead response" }, { status: 500 });
  }
}
