"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin(): Promise<{ error: string } | { admin: ReturnType<typeof createAdminClient> }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!profile?.is_admin) return { error: "Admins only." };

  return { admin };
}

export async function deleteFamilyTreeBird(id: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin.from("family_tree_birds").delete().eq("id", id);
  if (error) {
    if (error.message.includes("foreign key")) {
      return { error: "Cannot delete — this bird is used as a sire or dam in a breeding pair. Remove the pair first." };
    }
    return { error: error.message };
  }
  return { ok: true };
}

export async function deleteFamilyTreeSeason(id: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin.from("family_tree_seasons").delete().eq("id", id);
  if (error) {
    if (error.message.includes("foreign key")) {
      return { error: "Cannot delete — this season still has breeding pairs. Remove them first." };
    }
    return { error: error.message };
  }
  return { ok: true };
}

export async function deleteFamilyTreePair(id: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin.from("family_tree_pairs").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteFamilyTreeFlyLogEntry(id: string): Promise<{ error: string } | { ok: true }> {
  const gate = await requireAdmin();
  if ("error" in gate) return gate;
  const { admin } = gate;

  const { error } = await admin.from("family_tree_fly_log").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
