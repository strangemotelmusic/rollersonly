import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import SubscribersAdminClient from "./SubscribersAdminClient";

export default async function AdminSubscribersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) redirect("/dashboard");

  const [membersRes, newsletterRes, campaignsRes] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("marketing_opt_out", false),
    admin.from("newsletter_subscribers").select("*", { count: "exact", head: true }).is("unsubscribed_at", null),
    admin.from("email_campaigns").select("id, subject, recipient_count, sent_at").order("sent_at", { ascending: false }).limit(50),
  ]);

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>
            Subscribers &amp; Bulk Email
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
            Send an email to every opted-in member plus everyone signed up for the newsletter. Every send includes an
            unsubscribe link automatically.
          </p>

          <SubscribersAdminClient
            initialCounts={{ members: membersRes.count ?? 0, newsletter: newsletterRes.count ?? 0 }}
            initialHistory={(campaignsRes.data ?? []).map((c) => ({
              id: c.id,
              subject: c.subject,
              recipientCount: c.recipient_count,
              sentAt: c.sent_at,
            }))}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
