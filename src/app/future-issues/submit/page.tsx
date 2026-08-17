import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import SubmitVideoClient from "./SubmitVideoClient";

export default async function SubmitVideoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");
  await ensureProfile(user);

  const { data: submissions } = await supabase
    .from("video_submissions")
    .select("id, title, status, rejection_note, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Nav active="/future-issues" />
      <SubmitVideoClient initialSubmissions={submissions ?? []} />
      <Footer />
    </>
  );
}
