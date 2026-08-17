"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { startDirectMessage } from "./chat";

// Explicit return-type annotation is required for `"error" in gate` to
// narrow correctly downstream — see the matching note in src/app/actions/chat.ts.
async function requireUser(): Promise<{ error: string } | { user: { id: string } }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  return { user: { id: user.id } };
}

/**
 * Shares a pedigree PDF with another RollersOnly member over the existing
 * DM system (reuses startDirectMessage from chat.ts) — no new tables, the
 * link goes in the message body since chat_messages.media_type only allows
 * 'image'/'video', not 'pdf'.
 */
export async function sendPedigreeToSubscriber(
  otherUserId: string,
  birdName: string,
  pdfUrl: string
): Promise<{ error: string } | { ok: true }> {
  const gate = await requireUser();
  if ("error" in gate) return { error: gate.error };

  const convo = await startDirectMessage(otherUserId);
  if ("error" in convo) return { error: convo.error };

  const admin = createAdminClient();
  const { error } = await admin.from("chat_messages").insert({
    conversation_id: convo.conversationId,
    sender_id: gate.user.id,
    body: `📋 Pedigree: ${birdName} — ${pdfUrl}`,
  });
  if (error) return { error: error.message };

  return { ok: true };
}

/**
 * Sends a real email with the pedigree PDF attached via Resend, from
 * decadeofthespinner.com. Inactive (returns a clear error) until
 * RESEND_API_KEY is set — the client falls back to a mailto: share link
 * in that case, which needs no server call at all.
 */
export async function emailPedigreePdf(
  toEmail: string,
  birdName: string,
  pdfUrl: string
): Promise<{ error: string } | { ok: true }> {
  const gate = await requireUser();
  if ("error" in gate) return { error: gate.error };

  if (!process.env.RESEND_API_KEY) {
    return { error: "Direct email sending isn't set up yet — use the share link instead." };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: "RollersOnly Pedigrees <pedigrees@decadeofthespinner.com>",
    to: [toEmail],
    subject: `Pedigree — ${birdName}`,
    html: `
      <div style="font-family: Georgia, serif; background:#000; color:#fff; padding:32px;">
        <p style="color:#D4AF37; letter-spacing:0.15em; text-transform:uppercase; font-size:11px;">RollersOnly Pedigree Vault</p>
        <h1 style="font-weight:300; font-size:24px;">${birdName}</h1>
        <p style="color:#ccc; font-size:14px; line-height:1.6;">
          A pedigree record has been shared with you from RollersOnly. The full document is attached as a PDF,
          and you can also view it online below.
        </p>
        <p><a href="${pdfUrl}" style="color:#D4AF37;">View pedigree online →</a></p>
      </div>
    `,
    attachments: [{ filename: `${birdName.replace(/[^a-z0-9]+/gi, "-")}-pedigree.pdf`, path: pdfUrl }],
  });

  if (error) return { error: error.message };
  return { ok: true };
}
