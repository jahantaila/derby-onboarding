import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function POST() {
  try {
    const supabase = getServiceClient();
    const token = randomUUID();

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        token,
        current_step: 1,
        status: "in_progress",
        form_data: {},
      })
      .select("id, token")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ token: data.token, id: data.id });
  } catch {
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
