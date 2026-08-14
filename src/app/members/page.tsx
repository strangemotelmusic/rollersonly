import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");
  await ensureProfile(user);

  const [{ data: profiles }, { data: phoneRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, location, tier")
      .neq("id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("profile_phones").select("user_id, phone"),
  ]);

  const phoneByUserId = new Map((phoneRows ?? []).map((r) => [r.user_id, r.phone]));
  const members = (profiles ?? []).map((p) => ({ ...p, phone: phoneByUserId.get(p.id) ?? null }));

  return (
    <>
      <Nav active="/members" />
      <MembersClient members={members} />
      <Footer />
    </>
  );
}
