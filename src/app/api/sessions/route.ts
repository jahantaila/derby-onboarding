import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("sessions")
    .insert({ form_data: {}, current_step: 0 })
    .select("token")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ token: data.token });
}
