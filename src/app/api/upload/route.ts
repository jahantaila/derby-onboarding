import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/types";

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();

  let formData: globalThis.FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const sessionToken = formData.get("sessionToken") as string | null;
  const docType = formData.get("docType") as string | null;

  if (!file || !sessionToken || !docType) {
    return NextResponse.json(
      { error: "Missing file, sessionToken, or docType" },
      { status: 400 }
    );
  }

  // Validate MIME type server-side
  if (
    !ALLOWED_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_MIME_TYPES)[number]
    )
  ) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: PDF, JPG, PNG, WebP" },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File exceeds 10MB limit" },
      { status: 400 }
    );
  }

  // Validate docType against known types
  const validDocTypes = [
    "business_license",
    "insurance",
    "utility_bill",
    "gov_id",
  ];
  if (!validDocTypes.includes(docType)) {
    return NextResponse.json(
      { error: "Invalid document type" },
      { status: 400 }
    );
  }

  // Look up session by token
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id")
    .eq("token", sessionToken)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Delete existing document of same type for this session (duplicate handling)
  const { data: existing } = await supabase
    .from("documents")
    .select("id, storage_path")
    .eq("session_id", session.id)
    .eq("doc_type", docType);

  if (existing && existing.length > 0) {
    const pathsToDelete = existing.map((doc) => doc.storage_path);
    await supabase.storage.from("documents").remove(pathsToDelete);
    const idsToDelete = existing.map((doc) => doc.id);
    await supabase.from("documents").delete().in("id", idsToDelete);
  }

  // Build a safe storage path (no user-controlled path segments)
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExt = ext.replace(/[^a-z0-9]/g, "");
  const storagePath = `${session.id}/${docType}.${safeExt}`;

  // Read file bytes
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Verify magic bytes match declared MIME type
  if (!verifyMagicBytes(buffer, file.type)) {
    return NextResponse.json(
      { error: "File content does not match declared type" },
      { status: 400 }
    );
  }

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Upload failed: " + uploadError.message },
      { status: 500 }
    );
  }

  // Insert metadata into documents table
  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({
      session_id: session.id,
      doc_type: docType,
      file_name: file.name,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
    })
    .select("id, doc_type, file_name, storage_path, file_size, mime_type")
    .single();

  if (insertError || !doc) {
    return NextResponse.json(
      { error: "Failed to save document metadata" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: doc.id,
    docType: doc.doc_type,
    fileName: doc.file_name,
    storagePath: doc.storage_path,
    fileSize: doc.file_size,
    mimeType: doc.mime_type,
  });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServiceClient();

  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("id");
  const sessionToken = searchParams.get("sessionToken");

  if (!docId || !sessionToken) {
    return NextResponse.json(
      { error: "Missing id or sessionToken" },
      { status: 400 }
    );
  }

  // Verify session ownership
  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("token", sessionToken)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("id, storage_path, session_id")
    .eq("id", docId)
    .single();

  if (!doc || doc.session_id !== session.id) {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 }
    );
  }

  // Delete from storage and database
  await supabase.storage.from("documents").remove([doc.storage_path]);
  await supabase.from("documents").delete().eq("id", doc.id);

  return NextResponse.json({ success: true });
}

/** Verify file content magic bytes match the declared MIME type */
function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  switch (mimeType) {
    case "application/pdf":
      // PDF: starts with %PDF
      return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    case "image/jpeg":
      // JPEG: starts with FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/png":
      // PNG: starts with 89 50 4E 47
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    case "image/webp":
      // WebP: starts with RIFF....WEBP
      return (
        buffer.length >= 12 &&
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
      );
    default:
      return false;
  }
}
