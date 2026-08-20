import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { signOut } from "@/app/actions/auth";
import NavMobileToggle from "@/components/NavMobileToggle";
import NavClient from "@/components/NavClient";

export default async function Nav({ active }: { active?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await ensureProfile(user) : null;
  const { data: avatarRow } = user
    ? await supabase.from("profiles").select("avatar_url, is_admin").eq("id", user.id).maybeSingle()
    : { data: null };

  // Flat list still used by the mobile hamburger panel.
  const links = [
    { label: "Live Auctions", href: "/auctions" },
    { label: "Browse Birds", href: "/browse" },
    { label: "Buy D.O.T.S Birds", href: "/dots-birds" },
    { label: "Top Breeders", href: "/breeders" },
    { label: "Our Breeders", href: "/our-breeders" },
    { label: "Leaderboards", href: "/leaderboards" },
    { label: "Family Tree", href: "/family-tree" },
    { label: "Decade of the Spinner", href: "/decade-of-the-spinner" },
    { label: "Future Issues", href: "/future-issues" },
  ];

  const displayName = profile?.full_name || profile?.username || user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = avatarRow?.avatar_url ?? null;

  return (
    <nav className="site-nav">
      <Link href="/" className="nav-logo">
        Rollers<span>Only</span>
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
    </nav>
  );
}
