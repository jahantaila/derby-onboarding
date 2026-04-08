import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("sessions")
    .select("id, token, current_step, form_data, status")
    .eq("token", params.token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createServiceClient();
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (body.form_data !== undefined) update.form_data = body.form_data;
  if (body.current_step !== undefined) update.current_step = body.current_step;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sessions")
    .update(update)
    .eq("token", params.token)
    .select("id, token, current_step, form_data, status")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Session not found" },
      { status: error ? 500 : 404 }
    );
  }

  return NextResponse.json(data);
}
