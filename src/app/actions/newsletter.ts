"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function subscribeToNewsletter(email: string): Promise<{ error: string } | { ok: true }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return { error: "Enter a valid email address." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("newsletter_subscribers")
    .upsert({ email: trimmed, unsubscribed_at: null }, { onConflict: "email" });

  if (error) return { error: "Could not subscribe — try again." };
  return { ok: true };
}
