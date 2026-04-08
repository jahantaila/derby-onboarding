import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createServiceClient();

  // Look up session by token
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id")
    .eq("token", params.token)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Fetch all documents for this session
  const { data: docs, error: docsError } = await supabase
    .from("documents")
    .select("id, doc_type, file_name, storage_path, file_size, mime_type")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  if (docsError) {
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }

  const documents = (docs ?? []).map((doc) => ({
    id: doc.id,
    docType: doc.doc_type,
    fileName: doc.file_name,
    storagePath: doc.storage_path,
    fileSize: doc.file_size,
    mimeType: doc.mime_type,
  }));

  return NextResponse.json(documents);
}
