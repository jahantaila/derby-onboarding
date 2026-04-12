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

    // Get session_id from submission
    const { data: submission, error: subError } = await supabase
      .from("submissions")
      .select("session_id")
      .eq("id", id)
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Fetch documents for this session
    const { data: documents, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("session_id", submission.session_id)
      .order("created_at", { ascending: true });

    if (docError) {
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }

    // Generate signed URLs for each document
    const docsWithUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        const { data: signedData } = await supabase.storage
          .from("documents")
          .createSignedUrl(doc.storage_path, 3600); // 1 hour expiry

        return {
          ...doc,
          signed_url: signedData?.signedUrl || null,
        };
      })
    );

    return NextResponse.json(docsWithUrls);
  } catch {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}
