import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { signOut } from "@/app/actions/auth";
import NavMobileToggle from "@/components/NavMobileToggle";

export default async function Nav({ active }: { active?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await ensureProfile(user) : null;
  const { data: avatarRow } = user
    ? await supabase.from("profiles").select("avatar_url, is_admin").eq("id", user.id).maybeSingle()
    : { data: null };

  const links = [
    { label: "Live Auctions", href: "/auctions" },
    { label: "Browse Birds", href: "/browse" },
    { label: "Top Breeders", href: "/breeders" },
    { label: "Pedigrees", href: "/pedigree" },
    { label: "Leaderboards", href: "/leaderboards" },
    { label: "Decade of the Spinner", href: "/decade-of-the-spinner" },
  ];

  const displayName = profile?.full_name || profile?.username || user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const avatarUrl = avatarRow?.avatar_url;

  return (
    <nav>
      <Link href="/" className="nav-logo">
        Rollers<span>Only</span>
      </Link>
      <ul className="nav-links">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} style={active === l.href ? { color: "var(--white)" } : {}}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="nav-cta" style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {user ? (
          <>
            <Link
              href="/dashboard"
              style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "var(--white)", fontSize: 13 }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--surface2)",
                  border: "1px solid var(--border-gold)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--ff-display)",
                  fontSize: 13,
                  color: "var(--gold)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {avatarUrl ? <Image src={avatarUrl} alt={displayName} fill style={{ objectFit: "cover" }} /> : initial}
              </span>
              {displayName}
            </Link>
            {avatarRow?.is_admin && (
              <>
                <Link href="/admin/certifications" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>
                  Review Queue
                </Link>
                <Link href="/admin/site-images" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>
                  Site Images
                </Link>
              </>
            )}
            <form action={signOut}>
              <button type="submit" className="btn-ghost" style={{ background: "none", cursor: "pointer" }}>
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/signin" className="btn-ghost">Sign in</Link>
            <Link href="/signup" className="btn-gold">Join Now</Link>
          </>
        )}
      </div>
      <NavMobileToggle links={links} isSignedIn={Boolean(user)} signOutAction={signOut} />
    </nav>
  );
}
