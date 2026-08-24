import { NextResponse, type NextRequest } from "next/server";
import { requireMobileAdmin } from "@/lib/mobile-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;
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
      recipients.push({ email: u.email, unsubscribeUrl: `${siteUrl}/api/unsubscribe?type=member&id=${u.id}&t=${token}` });
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

export async function GET(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin } = auth;

  const [membersRes, newsletterRes, historyRes] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("marketing_opt_out", false),
    admin.from("newsletter_subscribers").select("*", { count: "exact", head: true }).is("unsubscribed_at", null),
    admin.from("email_campaigns").select("id, subject, recipient_count, sent_at").order("sent_at", { ascending: false }).limit(50),
  ]);

  return NextResponse.json({
    counts: { members: membersRes.count ?? 0, newsletter: newsletterRes.count ?? 0 },
    history: (historyRes.data ?? []).map((c) => ({ id: c.id, subject: c.subject, recipientCount: c.recipient_count, sentAt: c.sent_at })),
  });
}

// A real, irreversible bulk send - every recipient with marketing_opt_out
// false plus every active newsletter subscriber, deduplicated by email.
// The RN client is expected to show its own two-step confirmation before
// ever calling this; nothing here holds it back a second time.
export async function POST(request: NextRequest) {
  const auth = await requireMobileAdmin(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin, userId } = auth;

  const body = await request.json().catch(() => null);
  const subject = String(body?.subject || "").trim();
  const bodyHtml = String(body?.bodyHtml || "").trim();
  if (!subject) return NextResponse.json({ error: "Subject is required." }, { status: 400 });
  if (!bodyHtml) return NextResponse.json({ error: "Body is required." }, { status: 400 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "Email sending isn't set up yet." }, { status: 500 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://rollersonly.com";

  const [memberRecipients, newsletterRecipients] = await Promise.all([
    collectMemberRecipients(admin, siteUrl),
    collectNewsletterRecipients(admin, siteUrl),
  ]);

  const byEmail = new Map<string, Recipient>();
  for (const r of [...memberRecipients, ...newsletterRecipients]) byEmail.set(r.email.toLowerCase(), r);
  const recipients = Array.from(byEmail.values());

  if (recipients.length === 0) return NextResponse.json({ error: "No opted-in subscribers to send to." }, { status: 400 });

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const BATCH_SIZE = 90;
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const { error } = await resend.batch.send(
      batch.map((r) => ({
        from: "RollersOnly <news@decadeofthespinner.com>",
        to: [r.email],
        subject,
        html: wrapCampaignHtml(subject, bodyHtml, r.unsubscribeUrl),
      }))
    );
    if (error) {
      return NextResponse.json({ error: `Sending failed partway through (${i} of ${recipients.length} sent): ${error.message}` }, { status: 500 });
    }
  }

  await admin.from("email_campaigns").insert({ subject, body: bodyHtml, recipient_count: recipients.length, sent_by: userId });

  return NextResponse.json({ ok: true, sent: recipients.length });
}
