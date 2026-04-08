import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { Resend } from "resend";
import type { FormData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Load session
  const { data: session, error: sessionErr } = await supabase
    .from("sessions")
    .select("id, token, form_data, status")
    .eq("token", token)
    .single();

  if (sessionErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status === "completed") {
    return NextResponse.json(
      { error: "Already submitted" },
      { status: 409 }
    );
  }

  const fd: FormData = session.form_data ?? {};

  // Insert into submissions table
  const { error: subErr } = await supabase.from("submissions").insert({
    session_id: session.id,
    business_name: fd.businessName ?? null,
    business_phone: fd.ownerPhone ?? null,
    business_email: fd.ownerEmail ?? null,
    business_address: fd.businessAddress ?? null,
    business_city: fd.businessCity ?? null,
    business_state: fd.businessState ?? null,
    business_zip: fd.businessZip ?? null,
    service_categories: fd.services ?? null,
    contact_name: fd.ownerName ?? null,
    contact_phone: fd.ownerPhone ?? null,
    contact_email: fd.ownerEmail ?? null,
  });

  if (subErr) {
    console.error("Submission insert failed:", subErr);
    return NextResponse.json(
      { error: "Failed to save submission" },
      { status: 500 }
    );
  }

  // Mark session completed
  const { error: updateErr } = await supabase
    .from("sessions")
    .update({ status: "completed" })
    .eq("id", session.id);

  if (updateErr) {
    console.error("Session status update failed:", updateErr);
  }

  // Load documents for email
  const { data: docs } = await supabase
    .from("documents")
    .select("doc_type, file_name, storage_path")
    .eq("session_id", session.id);

  // Generate signed URLs (1 week expiry)
  const docLinks: { name: string; url: string }[] = [];
  if (docs) {
    for (const doc of docs) {
      const { data: signed } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.storage_path, 60 * 60 * 24 * 7);
      if (signed?.signedUrl) {
        docLinks.push({ name: doc.file_name, url: signed.signedUrl });
      }
    }
  }

  const businessName = fd.businessName || "Unknown Business";
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Send admin notification email (best-effort — do not block the user)
  try {
    const docRows = docLinks
      .map(
        (d) =>
          `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;"><a href="${escapeHtml(d.url)}" style="color:#1A6FCC;">${escapeHtml(d.name)}</a></td></tr>`
      )
      .join("");

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#2093FF 0%,#0026FF 100%);padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:22px;">New Client Onboarding</h1>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;">${escapeHtml(businessName)}</p>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;">
          <h2 style="font-size:16px;margin:0 0 12px;">Business Info</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${row("Business Name", fd.businessName)}
            ${row("Years in Business", fd.yearsInBusiness)}
          </table>

          <h2 style="font-size:16px;margin:20px 0 12px;">Contact</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${row("Name", fd.ownerName)}
            ${row("Phone", fd.ownerPhone)}
            ${row("Email", fd.ownerEmail)}
          </table>

          <h2 style="font-size:16px;margin:20px 0 12px;">Location</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${row("Address", fd.businessAddress)}
            ${row("City", fd.businessCity)}
            ${row("State", fd.businessState)}
            ${row("Zip", fd.businessZip)}
            ${row("Service Areas", fd.serviceAreas?.join(", "))}
          </table>

          <h2 style="font-size:16px;margin:20px 0 12px;">Services</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${row("Categories", fd.services?.join(", "))}
          </table>

          <h2 style="font-size:16px;margin:20px 0 12px;">Online Presence</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${row("Google Email", fd.googleEmail)}
            ${row("Website", fd.websiteUrl)}
            ${row("Monthly Budget", fd.monthlyBudget)}
          </table>

          ${
            docLinks.length > 0
              ? `<h2 style="font-size:16px;margin:20px 0 12px;">Documents</h2>
                 <table style="width:100%;border-collapse:collapse;font-size:14px;">${docRows}</table>
                 <p style="font-size:12px;color:#888;margin-top:8px;">Links expire in 7 days.</p>`
              : ""
          }
        </div>
      </div>`;

    await resend.emails.send({
      from: "Derby Digital <onboarding@derbydigital.us>",
      to: "jahan@derbydigital.us",
      subject: `New Client Onboarding: ${businessName}`,
      html,
    });
  } catch (emailErr) {
    console.error("Admin email send failed:", emailErr);
  }

  // Send client confirmation email (best-effort — do not block the response)
  if (fd.ownerEmail) {
    try {
      const clientHtml = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0A0F1C;">
          <div style="background:linear-gradient(135deg,#2093FF 0%,#0026FF 100%);padding:32px 24px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;font-weight:bold;letter-spacing:1px;">DERBY DIGITAL</h1>
          </div>
          <div style="padding:32px 24px;color:#ffffff;">
            <h2 style="color:#ffffff;margin:0 0 8px;font-size:24px;">Welcome aboard, ${escapeHtml(businessName)}!</h2>
            <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.6;margin:0 0 28px;">
              We&rsquo;re excited to have you. Our team is already getting to work on your campaign. Here&rsquo;s what happens next:
            </p>
            <table style="width:100%;border-collapse:collapse;" role="presentation">
              <tr>
                <td style="padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                  <table style="width:100%;border-collapse:collapse;" role="presentation"><tr>
                    <td style="width:48px;vertical-align:top;"><div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#2093FF,#0026FF);color:#fff;font-size:16px;font-weight:bold;line-height:36px;text-align:center;">1</div></td>
                    <td style="vertical-align:top;"><p style="color:#ffffff;font-size:15px;font-weight:600;margin:0 0 4px;">We review your documents</p><p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">Within 24 hours</p></td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
                  <table style="width:100%;border-collapse:collapse;" role="presentation"><tr>
                    <td style="width:48px;vertical-align:top;"><div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#2093FF,#0026FF);color:#fff;font-size:16px;font-weight:bold;line-height:36px;text-align:center;">2</div></td>
                    <td style="vertical-align:top;"><p style="color:#ffffff;font-size:15px;font-weight:600;margin:0 0 4px;">We set up your ad profile</p><p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">Within 48 hours</p></td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0;">
                  <table style="width:100%;border-collapse:collapse;" role="presentation"><tr>
                    <td style="width:48px;vertical-align:top;"><div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#2093FF,#0026FF);color:#fff;font-size:16px;font-weight:bold;line-height:36px;text-align:center;">3</div></td>
                    <td style="vertical-align:top;"><p style="color:#ffffff;font-size:15px;font-weight:600;margin:0 0 4px;">Your ads go live</p><p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0;">Within 5 business days</p></td>
                  </tr></table>
                </td>
              </tr>
            </table>
            <div style="margin:28px 0;padding:20px;background:rgba(255,255,255,0.05);border-radius:8px;border:1px solid rgba(255,255,255,0.1);">
              <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 8px;">Questions? Reach out directly:</p>
              <p style="color:#ffffff;font-size:15px;margin:0;font-weight:600;">Jahan &mdash; Derby Digital</p>
              <p style="color:#2093FF;font-size:14px;margin:4px 0 0;">jahan@derbydigital.us</p>
            </div>
          </div>
          <div style="padding:20px 24px;text-align:center;border-top:1px solid rgba(255,255,255,0.1);">
            <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">&copy; Derby Digital. All rights reserved.</p>
          </div>
        </div>`;

      await resend.emails.send({
        from: "Derby Digital <onboarding@derbydigital.us>",
        to: fd.ownerEmail,
        subject: `Welcome to Derby Digital, ${businessName}!`,
        html: clientHtml,
      });
    } catch (clientEmailErr) {
      console.error("Client confirmation email failed:", clientEmailErr);
    }
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value?: string | null): string {
  if (!value) return "";
  return `<tr>
    <td style="padding:6px 12px;color:#666;border-bottom:1px solid #eee;width:40%;">${escapeHtml(label)}</td>
    <td style="padding:6px 12px;border-bottom:1px solid #eee;">${escapeHtml(value)}</td>
  </tr>`;
}
