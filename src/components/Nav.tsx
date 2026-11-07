import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { signOut } from "@/app/actions/auth";
import { getSiteImages } from "@/lib/site-images";
import NavMobileToggle from "@/components/NavMobileToggle";
import NavClient from "@/components/NavClient";
import styles from "@/styles/PreviewTheme.module.css";

export default async function Nav({ active }: { active?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const siteImages = await getSiteImages();

  const profile = user ? await ensureProfile(user) : null;
  const { data: avatarRow } = user
    ? await supabase.from("profiles").select("avatar_url, is_admin").eq("id", user.id).maybeSingle()
    : { data: null };

  // Flat list still used by the mobile hamburger panel.
  const links = [
    { label: "Live Auctions", href: "/auctions" },
    { label: "Browse Birds", href: "/browse" },
    { label: "Buy D.O.T.S Birds", href: "/dots-birds" },
    { label: "Tyson's Corner", href: "/tysons-corner" },
    { label: "Our Heroes", href: "/our-breeders" },
    { label: "Leaderboards", href: "/leaderboards" },
    { label: "Master Fliers", href: "/master-fliers" },
    { label: "Family Tree", href: "/family-tree" },
    { label: "Decade of the Spinner", href: "/decade-of-the-spinner" },
    ...(user ? [{ label: "Read the Magazine", href: "/magazine" }] : []),
    { label: "Future Issues", href: "/future-issues" },
  ];

  const displayName = profile?.full_name || profile?.username || user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = avatarRow?.avatar_url ?? null;

  return (
    <header className={styles["site-header"]}>
      <div className={`${styles.container} ${styles["header-inner"]}`}>
        <Link href="/" className={styles.brand} aria-label="Rollers Only home">
          <Image src={siteImages.logo} alt="" width={44} height={44} className={styles["brand-mark"]} aria-hidden />
          <span className={styles["brand-text"]}>
            ROLLERS
            <span>ONLY</span>
          </span>
        </Link>
        <NavClient
          isSignedIn={Boolean(user)}
          isAdmin={Boolean(avatarRow?.is_admin)}
          displayName={displayName}
          avatarUrl={avatarUrl}
          initial={initial}
          active={active}
          signOutAction={signOut}
        />
        <NavMobileToggle links={links} isSignedIn={Boolean(user)} isAdmin={Boolean(avatarRow?.is_admin)} signOutAction={signOut} />
      </div>
    </header>
  );
}
