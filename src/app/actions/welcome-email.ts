"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Fired once, right after a new member's profile is first created (see
// src/app/signup/page.tsx). Silently no-ops if Resend isn't configured —
// same "not set up yet, skip" convention used by notifyMatchmakingParties
// in the Stripe webhook, so a missing key never blocks signup itself.
export async function sendWelcomeEmail(userId: string): Promise<{ error: string } | { ok: true } | { skipped: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) return { error: "Not authorized." };
  if (!process.env.RESEND_API_KEY) return { skipped: true };

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("full_name, username").eq("id", userId).maybeSingle();
  const firstName = (profile?.full_name || profile?.username || "there").split(" ")[0];

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: "Steven & Mike at RollersOnly <welcome@decadeofthespinner.com>",
    to: [user.email!],
    subject: "Welcome to RollersOnly — you're in.",
    html: welcomeEmailHtml(firstName),
  });

  return { ok: true };
}

function welcomeEmailHtml(firstName: string): string {
  return `
    <div style="font-family: Georgia, serif; background:#0A0A0A; color:#fff; padding:40px 32px; max-width:560px; margin:0 auto;">
      <p style="color:#D4AF37; letter-spacing:0.2em; text-transform:uppercase; font-size:11px; margin-bottom:24px;">RollersOnly</p>

      <h1 style="font-weight:300; font-size:26px; line-height:1.3; margin:0 0 20px; color:#fff;">
        Welcome to the loft, ${firstName}.
      </h1>

      <p style="color:#ccc; font-size:14px; line-height:1.8; margin-bottom:18px;">
        You just joined the world's first dedicated marketplace built for people who actually live this sport —
        real bloodlines, real competition records, and a community that's been chasing the perfect roll for
        generations.
      </p>

      <p style="color:#ccc; font-size:14px; line-height:1.8; margin-bottom:18px;">
        RollersOnly was built by two lifelong fanciers — <strong style="color:#fff;">Steven Russell Harts</strong>
        and <strong style="color:#fff;">Mike Tyson</strong> — who found each other through pigeons decades before
        either of them was known for anything else. We built this place so breeders and competitors like you could
        actually get the bloodlines you need to compete at the highest level, and so this community has a real home.
      </p>

      <div style="background:#141414; border:0.5px solid #2a2a2a; border-radius:8px; padding:20px 24px; margin:28px 0;">
        <p style="color:#D4AF37; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; margin:0 0 14px;">
          A few places to start
        </p>
        <p style="color:#ccc; font-size:13px; line-height:2; margin:0;">
          🏠 <a href="https://rollersonly.com/dashboard/loft" style="color:#fff;">Set up your loft</a> — register your birds and build your record<br>
          🔨 <a href="https://rollersonly.com/auctions" style="color:#fff;">Browse live auctions</a> — find your next great bird<br>
          🕊️ <a href="https://rollersonly.com/tysons-corner" style="color:#fff;">Tyson's Corner</a> &amp; <a href="https://rollersonly.com/dots-birds" style="color:#fff;">D.O.T.S.</a> — our own bloodlines, direct<br>
          📖 <a href="https://rollersonly.com/decade-of-the-spinner" style="color:#fff;">Decade of the Spinner</a> — the magazine made for this sport<br>
          🌍 <a href="https://rollersonly.com/our-breeders" style="color:#fff;">Our Heroes</a> — meet the breeders behind the birds
        </p>
      </div>

      <p style="color:#ccc; font-size:14px; line-height:1.8; margin-bottom:8px;">
        Glad you're here. Let's keep this community alive.
      </p>
      <p style="color:#D4AF37; font-size:14px; font-style:italic; margin-top:0;">— Steven &amp; Mike</p>

      <p style="margin-top:36px; padding-top:16px; border-top:0.5px solid #2a2a2a; font-size:11px; color:#666;">
        RollersOnly · <a href="https://rollersonly.com" style="color:#666;">rollersonly.com</a>
      </p>
    </div>
  `;
}
