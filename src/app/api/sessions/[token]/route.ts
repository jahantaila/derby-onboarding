import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("token", params.token)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = getServiceClient();
    const body = await request.json();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.form_data !== undefined) {
      // Merge new form_data with existing
      const { data: existing } = await supabase
        .from("sessions")
        .select("form_data")
        .eq("token", params.token)
        .single();

      updateData.form_data = {
        ...(existing?.form_data || {}),
        ...body.form_data,
      };
    }

    if (body.current_step !== undefined) {
      updateData.current_step = body.current_step;
    }

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    const { data, error } = await supabase
      .from("sessions")
      .update(updateData)
      .eq("token", params.token)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
