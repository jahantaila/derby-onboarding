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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = getServiceClient();

    // Get session_id before deleting so we can clean up storage
    const { data: submission, error: fetchError } = await supabase
      .from("submissions")
      .select("session_id")
      .eq("id", id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Delete associated documents from storage and DB
    const { data: documents } = await supabase
      .from("documents")
      .select("storage_path")
      .eq("session_id", submission.session_id);

    if (documents && documents.length > 0) {
      const paths = documents.map((d) => d.storage_path);
      await supabase.storage.from("documents").remove(paths);
      await supabase.from("documents").delete().eq("session_id", submission.session_id);
    }

    // Delete the submission
    const { error: deleteError } = await supabase
      .from("submissions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
  }
}
