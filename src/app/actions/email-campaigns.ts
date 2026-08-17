"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

async function requireAdmin(): Promise<{ error: string } | { admin: Admin; userId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) return { error: "Admins only." };

  return { admin, userId: user.id };
}

export type SubscriberCounts = { members: number; newsletter: number };

export async function getSubscriberCounts(): Promise<{ error: string } | SubscriberCounts> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const [membersRes, newsletterRes] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("marketing_opt_out", false),
    admin.from("newsletter_subscribers").select("*", { count: "exact", head: true }).is("unsubscribed_at", null),
  ]);

  return { members: membersRes.count ?? 0, newsletter: newsletterRes.count ?? 0 };
}

type Recipient = { email: string; unsubscribeUrl: string };

async function collectMemberRecipients(admin: Admin, siteUrl: string): Promise<Recipient[]> {
  const { data: optedIn } = await admin.from("profiles").select("id, unsubscribe_token").eq("marketing_opt_out", false);
  const tokenById = new Map((optedIn ?? []).map((p) => [p.id, p.unsubscribe_token]));
  if (tokenById.size === 0) return [];

  const recipients: Recipient[] = [];
  let page = 1;
  const perPage = 1000;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data || data.users.length === 0) break;

    for (const u of data.users) {
      const token = tokenById.get(u.id);
      if (!token || !u.email) continue;
      recipients.push({
        email: u.email,
        unsubscribeUrl: `${siteUrl}/api/unsubscribe?type=member&id=${u.id}&t=${token}`,
      });
    }

    if (data.users.length < perPage) break;
    page += 1;
  }
  return recipients;
}

async function collectNewsletterRecipients(admin: Admin, siteUrl: string): Promise<Recipient[]> {
  const { data } = await admin.from("newsletter_subscribers").select("email, unsubscribe_token").is("unsubscribed_at", null);
  return (data ?? []).map((s) => ({
    email: s.email,
    unsubscribeUrl: `${siteUrl}/api/unsubscribe?type=newsletter&email=${encodeURIComponent(s.email)}&t=${s.unsubscribe_token}`,
  }));
}

function wrapCampaignHtml(subject: string, bodyHtml: string, unsubscribeUrl: string): string {
  return `
    <div style="font-family: Georgia, serif; background:#000; color:#fff; padding:32px;">
      <p style="color:#D4AF37; letter-spacing:0.15em; text-transform:uppercase; font-size:11px;">RollersOnly</p>
      <h1 style="font-weight:300; font-size:22px; margin-bottom:16px;">${subject}</h1>
      <div style="color:#ccc; font-size:14px; line-height:1.6;">${bodyHtml}</div>
      <p style="margin-top:32px; padding-top:16px; border-top:0.5px solid #333; font-size:11px; color:#666;">
        <a href="${unsubscribeUrl}" style="color:#666;">Unsubscribe from RollersOnly emails</a>
      </p>
    </div>
  `;
}

export async function sendBulkEmail(subject: string, bodyHtml: string): Promise<{ error: string } | { ok: true; sent: number }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin, userId } = gate;

  const trimmedSubject = subject.trim();
  const trimmedBody = bodyHtml.trim();
  if (!trimmedSubject) return { error: "Subject is required." };
  if (!trimmedBody) return { error: "Body is required." };

  if (!process.env.RESEND_API_KEY) {
    return { error: "Email sending isn't set up yet — RESEND_API_KEY is missing." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rollersonly.com";

  const [memberRecipients, newsletterRecipients] = await Promise.all([
    collectMemberRecipients(admin, siteUrl),
    collectNewsletterRecipients(admin, siteUrl),
  ]);

  const byEmail = new Map<string, Recipient>();
  for (const r of [...memberRecipients, ...newsletterRecipients]) {
    byEmail.set(r.email.toLowerCase(), r);
  }
  const recipients = Array.from(byEmail.values());

  if (recipients.length === 0) return { error: "No opted-in subscribers to send to." };

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const BATCH_SIZE = 90;
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const { error } = await resend.batch.send(
      batch.map((r) => ({
        from: "RollersOnly <news@decadeofthespinner.com>",
        to: [r.email],
        subject: trimmedSubject,
        html: wrapCampaignHtml(trimmedSubject, trimmedBody, r.unsubscribeUrl),
      }))
    );
    if (error) return { error: `Sending failed partway through (${i} of ${recipients.length} sent): ${error.message}` };
  }

  await admin.from("email_campaigns").insert({
    subject: trimmedSubject,
    body: trimmedBody,
    recipient_count: recipients.length,
    sent_by: userId,
  });

  return { ok: true, sent: recipients.length };
}

export type CampaignHistoryRow = { id: string; subject: string; recipientCount: number; sentAt: string };

export async function getCampaignHistory(): Promise<{ error: string } | CampaignHistoryRow[]> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { data } = await admin
    .from("email_campaigns")
    .select("id, subject, recipient_count, sent_at")
    .order("sent_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((c) => ({ id: c.id, subject: c.subject, recipientCount: c.recipient_count, sentAt: c.sent_at }));
}
