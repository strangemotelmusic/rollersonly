"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function reserveMagazineCopy(email: string) {
  const normalized = email.trim().toLowerCase();

  if (!EMAIL_RE.test(normalized)) {
    return { error: "Enter a valid email address." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("magazine_reservations").insert({ email: normalized });

  if (error) {
    if (error.code === "23505") {
      return { ok: true, alreadyReserved: true };
    }
    return { error: "Something went wrong. Please try again." };
  }

  return { ok: true, alreadyReserved: false };
}
