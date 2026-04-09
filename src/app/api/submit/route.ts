import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { SUBMISSION_FIELD_MAP } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { session_token } = await request.json();
    if (!session_token) {
      return NextResponse.json({ error: "session_token is required" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("token", session_token)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "complete") {
      return NextResponse.json({ error: "Session already submitted" }, { status: 400 });
    }

    const fd = session.form_data || {};

    // Map form_data fields to submissions table columns
    const submissionData: Record<string, unknown> = {
      session_id: session.id,
      [SUBMISSION_FIELD_MAP.business_name]: fd.business_name || null,
      [SUBMISSION_FIELD_MAP.owner_name]: fd.owner_name || null,
      [SUBMISSION_FIELD_MAP.phone]: fd.phone || null,
      [SUBMISSION_FIELD_MAP.email]: fd.email || null,
      [SUBMISSION_FIELD_MAP.address]: fd.address || null,
      [SUBMISSION_FIELD_MAP.city]: fd.city || null,
      [SUBMISSION_FIELD_MAP.state]: fd.state || null,
      [SUBMISSION_FIELD_MAP.zip]: fd.zip || null,
      [SUBMISSION_FIELD_MAP.service_categories]: fd.service_categories || [],
      contact_phone: fd.phone || null,
      contact_email: fd.email || null,
      pipeline_status: "new",
      submitted_at: new Date().toISOString(),
    };

    // Insert submission
    const { error: submitError } = await supabase
      .from("submissions")
      .insert(submissionData);

    if (submitError) {
      return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
    }

    // Mark session as complete
    await supabase
      .from("sessions")
      .update({ status: "complete", current_step: 7, updated_at: new Date().toISOString() })
      .eq("token", session_token);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
