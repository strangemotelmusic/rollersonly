import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PreviewIcon from "@/components/PreviewIcon";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import LoftDashboardClient, { type Bird } from "./LoftDashboardClient";
import styles from "@/styles/PreviewTheme.module.css";

export default async function LoftDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");
  const profile = await ensureProfile(user);

  const { data: loft } = await supabase.from("lofts").select("id, name").eq("owner_id", user.id).maybeSingle();

  const { data: birds } = await supabase
    .from("birds")
    .select("id, name, ring_number, sex, color, birth_year, primary_photo_url, is_active, available_for_matchmaking, auctions(id, status)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const birdRows = (birds ?? []) as Bird[];
  const displayName = profile?.full_name || profile?.username || "";

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72 }}>
        <div className={`${styles["page-heading"]} ${styles.container}`}>
          <div className={styles.breadcrumb}>
            <PreviewIcon name="home" className={styles.icon} />
            <span>My Loft</span>
          </div>
          <div className={styles["page-heading-row"]}>
            <div>
              <div className={styles.eyebrow}>{loft?.name || "Your personal space"}</div>
              <h1>{displayName ? `Welcome to your loft, ${displayName}.` : "Your loft. All in one place."}</h1>
              <p>Track every bird you keep, not just the ones for sale — register birds and manage listings independently of your auctions.</p>
            </div>
          </div>
        </div>

        <section className={`${styles.container} ${styles["page-section"]}`}>
          <div className={styles["stat-grid"]}>
            <div className={styles["stat-box"]}>
              <span>Bird records</span>
              <strong>{String(birdRows.length).padStart(2, "0")}</strong>
              <small>In your loft</small>
            </div>
            <div className={styles["stat-box"]}>
              <span>Listed for sale</span>
              <strong>{String(birdRows.filter((b) => b.auctions?.some((a) => a.status === "live")).length).padStart(2, "0")}</strong>
              <small>Currently live</small>
            </div>
            <div className={styles["stat-box"]}>
              <span>Matchmaking</span>
              <strong>{String(birdRows.filter((b) => b.available_for_matchmaking).length).padStart(2, "0")}</strong>
              <small>Available for pairing</small>
            </div>
            <div className={styles["stat-box"]}>
              <span>Membership</span>
              <strong style={{ fontSize: 22, textTransform: "capitalize" }}>{profile?.tier ?? "browse"}</strong>
              <small>Your current tier</small>
            </div>
          </div>

          <LoftDashboardClient
            ownerId={user.id}
            loftId={loft?.id ?? null}
            initialBirds={birdRows}
            canOfferMatchmaking={profile?.tier !== "browse"}
          />
        </section>
      </div>
      <Footer />
    </>
  );
}
