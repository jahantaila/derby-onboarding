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

    // Fetch submission
    const { data: submission, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Fetch session form_data for ad preferences
    const { data: session } = await supabase
      .from("sessions")
      .select("form_data")
      .eq("id", submission.session_id)
      .single();

    return NextResponse.json({
      submission,
      form_data: session?.form_data || {},
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}

export async function PATCH(
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

    const updates: Record<string, unknown> = {};
    if (body.pipeline_status !== undefined) {
      if (!["new", "in_progress", "active"].includes(body.pipeline_status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.pipeline_status = body.pipeline_status;
    }
    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("submissions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
    }

    return NextResponse.json({ submission: data });
  } catch {
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}
