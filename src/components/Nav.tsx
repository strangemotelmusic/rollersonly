import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export default async function Nav({ active }: { active?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const links = [
    { label: "Live Auctions", href: "/auctions" },
    { label: "Browse Birds", href: "/browse" },
    { label: "Top Breeders", href: "/breeders" },
    { label: "Pedigrees", href: "/pedigree" },
    { label: "Leaderboards", href: "/leaderboards" },
    { label: "Decade of the Spinner", href: "/magazine" },
  ];

  const displayName = user?.user_metadata?.full_name || user?.email || "";
  const initial = displayName.charAt(0).toUpperCase();

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
                }}
              >
                {initial}
              </span>
              {displayName}
            </Link>
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
    </nav>
  );
}
