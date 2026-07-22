import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const profile = await ensureProfile(user);
  const { data: fullProfile } = await supabase
    .from("profiles")
    .select("username, full_name, bio, location, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <Nav active="/settings" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "64px 32px" }}>
          <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 36, fontWeight: 300, color: "var(--white)", marginBottom: 40 }}>Account Settings</h1>
          <SettingsForm
            userId={user.id}
            initial={{
              username: fullProfile?.username || profile?.username || "",
              fullName: fullProfile?.full_name || profile?.full_name || "",
              bio: fullProfile?.bio || "",
              location: fullProfile?.location || "",
              avatarUrl: fullProfile?.avatar_url || null,
            }}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
