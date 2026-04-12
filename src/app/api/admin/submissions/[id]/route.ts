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

    // Editable client fields
    const editableFields = [
      "business_name", "contact_name", "business_phone", "business_email",
      "business_address", "business_city", "business_state", "business_zip",
      "contact_phone", "contact_email", "service_categories", "service_area_miles",
    ];
    for (const field of editableFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Fetch old values for activity logging
    const { data: oldSub } = await supabase
      .from("submissions")
      .select("pipeline_status, notes")
      .eq("id", id)
      .single();

    const { data, error } = await supabase
      .from("submissions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
    }

    // Log activity (non-blocking)
    if (oldSub) {
      const logs: { submission_id: string; action: string; details: Record<string, unknown> }[] = [];

      if (body.pipeline_status && oldSub.pipeline_status !== body.pipeline_status) {
        logs.push({
          submission_id: id,
          action: "status_change",
          details: { from: oldSub.pipeline_status, to: body.pipeline_status },
        });
      }

      if (body.notes !== undefined) {
        const newNote = typeof body.notes === "object" ? body.notes?.internal : "";
        logs.push({
          submission_id: id,
          action: "note_edit",
          details: { note_preview: (newNote || "").slice(0, 100) },
        });
      }

      // Check if any client fields were edited
      const editedClientFields = editableFields.filter((f) => body[f] !== undefined);
      if (editedClientFields.length > 0 && !body.pipeline_status && body.notes === undefined) {
        logs.push({
          submission_id: id,
          action: "info_edit",
          details: { fields: editedClientFields },
        });
      }

      if (logs.length > 0) {
        supabase.from("activity_log").insert(logs).then(() => {});
      }
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
