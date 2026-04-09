import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_DOC_TYPES = ["business_license", "insurance", "government_id", "utility_bill"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sessionToken = formData.get("session_token") as string | null;
    const docType = formData.get("doc_type") as string | null;

    if (!file || !sessionToken || !docType) {
      return NextResponse.json(
        { error: "Missing required fields: file, session_token, doc_type" },
        { status: 400 }
      );
    }

    if (!VALID_DOC_TYPES.includes(docType)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Please upload PDF, JPG, or PNG." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Get session to verify it exists and get session ID
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id")
      .eq("token", sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Build storage path
    const ext = file.name.split(".").pop() || "bin";
    const storagePath = `${session.id}/${docType}.${ext}`;

    // Upload file to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true, // Allow re-upload to replace existing
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Delete existing document record for this session + doc_type (re-upload case)
    await supabase
      .from("documents")
      .delete()
      .eq("session_id", session.id)
      .eq("doc_type", docType);

    // Save metadata to documents table
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        session_id: session.id,
        doc_type: docType,
        file_name: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (docError) {
      return NextResponse.json(
        { error: "Failed to save document metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: doc.id,
      doc_type: doc.doc_type,
      file_name: doc.file_name,
      file_size: doc.file_size,
      mime_type: doc.mime_type,
    });
  } catch {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
