import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["new", "in_progress", "active"];

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServiceClient();

  const { data: submission, error } = await supabase
    .from("submissions")
    .select("*, sessions(form_data)")
    .eq("id", params.id)
    .single();

  if (error || !submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 }
    );
  }

  // Load documents with signed URLs
  const { data: docs } = await supabase
    .from("documents")
    .select("id, doc_type, file_name, storage_path, file_size, mime_type")
    .eq("session_id", submission.session_id);

  const documents = await Promise.all(
    (docs ?? []).map(async (doc) => {
      const { data: signed } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.storage_path, 3600); // 1h expiry
      return {
        ...doc,
        signed_url: signed?.signedUrl ?? null,
      };
    })
  );

  // Merge session form_data for fields not in submissions table
  const formData = (submission.sessions as { form_data: Record<string, unknown> } | null)?.form_data ?? {};

  return NextResponse.json({
    ...submission,
    sessions: undefined,
    form_data: formData,
    documents,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { pipeline_status } = await req.json();

  if (!pipeline_status || !VALID_STATUSES.includes(pipeline_status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("submissions")
    .update({ pipeline_status })
    .eq("id", params.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
