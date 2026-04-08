import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createServiceClient();

  // Validate session exists and is completed
  const { data: session, error: sessionErr } = await supabase
    .from("sessions")
    .select("id, status")
    .eq("token", params.token)
    .single();

  if (sessionErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "completed") {
    return NextResponse.json(
      { error: "Session not yet completed" },
      { status: 400 }
    );
  }

  // Update kickoff_booked_at (idempotent — overwrites on repeat call)
  const { error: updateErr } = await supabase
    .from("submissions")
    .update({ kickoff_booked_at: new Date().toISOString() })
    .eq("session_id", session.id);

  if (updateErr) {
    console.error("Booking update failed:", updateErr);
    return NextResponse.json(
      { error: "Failed to record booking" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
