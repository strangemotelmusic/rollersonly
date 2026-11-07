"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CartIcon from "@/components/CartIcon";
import ChatIcon from "@/components/ChatIcon";
import NotificationBell from "@/components/NotificationBell";
import PreviewIcon from "@/components/PreviewIcon";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "@/styles/PreviewTheme.module.css";

type MegaItem = { label: string; desc: string; href: string; icon: Parameters<typeof PreviewIcon>[0]["name"] };
type LinkItem = { label: string; href: string };

const COMMUNITY_MENU: MegaItem[] = [
  { label: "Our Heroes", desc: "The breeders behind the birds", href: "/our-breeders", icon: "globe" },
  { label: "Tyson's Corner", desc: "South African bloodline storefront", href: "/tysons-corner", icon: "gavel" },
  { label: "Leaderboards", desc: "The World Cup Top Ten", href: "/leaderboards", icon: "grid" },
  { label: "Master Fliers", desc: "NBRC ranked competitors", href: "/master-fliers", icon: "tree" },
  { label: "Family Tree", desc: "Pedigree and breeding software", href: "/family-tree", icon: "home" },
];

const MAGAZINE_MENU_PUBLIC: MegaItem[] = [
  { label: "Decade of the Spinner", desc: "The magazine for the sport", href: "/decade-of-the-spinner", icon: "book" },
  { label: "Future Issues", desc: "What's coming next", href: "/future-issues", icon: "arrowUp" },
];

const EXPLORE_MENU: MegaItem[] = [
  { label: "Browse Birds", desc: "Every listing, filterable", href: "/browse", icon: "gavel" },
  { label: "Buy D.O.T.S Birds", desc: "Curated bloodline storefront", href: "/dots-birds", icon: "heart" },
  { label: "My Loft", desc: "Your birds, listings and records", href: "/dashboard/loft", icon: "home" },
  { label: "How it Works", desc: "A better way to get started", href: "/how-it-works", icon: "globe" },
];

const ADMIN_LINKS: LinkItem[] = [
  { label: "Review Queue", href: "/admin/certifications" },
  { label: "Family Tree", href: "/admin/family-tree" },
  { label: "Subscribers", href: "/admin/subscribers" },
  { label: "Site Images", href: "/admin/site-images" },
  { label: "Live Auctions", href: "/admin/live-auctions" },
  { label: "Our Heroes", href: "/admin/our-breeders" },
  { label: "Future Issues", href: "/admin/future-issues" },
  { label: "D.O.T.S Birds", href: "/admin/dots-birds" },
  { label: "Tyson's Corner", href: "/admin/tysons-corner" },
  { label: "Magazine", href: "/admin/magazine" },
  { label: "The Spin Vault", href: "/admin/archive" },
];

export default function NavClient({
  isSignedIn,
  isAdmin,
  displayName,
  avatarUrl,
  initial,
  active,
  signOutAction,
}: {
  isSignedIn: boolean;
  isAdmin: boolean;
  displayName: string;
  avatarUrl: string | null;
  initial: string;
  active?: string;
  signOutAction: () => void;
}) {
  const magazineMenu: MegaItem[] = [
    MAGAZINE_MENU_PUBLIC[0],
    ...(isSignedIn ? [{ label: "Read the Magazine", desc: "Full issues for members", href: "/magazine", icon: "book" as const }] : []),
    MAGAZINE_MENU_PUBLIC[1],
    ...(isSignedIn ? [{ label: "The Spin Vault", desc: "Photo & video archive", href: "/spin-vault", icon: "grid" as const }] : []),
  ];
  const communityMenu: MegaItem[] = isSignedIn
    ? [...COMMUNITY_MENU.slice(0, 2), { label: "Members", desc: "Find fellow fanciers", href: "/members", icon: "heart" as const }, ...COMMUNITY_MENU.slice(2)]
    : COMMUNITY_MENU;

  return (
    <>
      <nav className={styles["primary-nav"]} aria-label="Main navigation">
        <Link href="/" aria-current={active === "/" ? "page" : undefined}>
          Discover
        </Link>
        <Link href="/auctions" aria-current={active === "/auctions" ? "page" : undefined}>
          Auctions
        </Link>
        <MegaMenu label="Community" items={communityMenu} />
        <MegaMenu label="D.O.T.S." items={magazineMenu} footer="One magazine. The whole sport." />
        <MegaMenu label="Explore" items={EXPLORE_MENU} footer="One community. Every part of the sport." />
      </nav>

      <div className={styles["header-actions"]}>
        <ThemeToggle />
        <Link href="/browse" className={styles["icon-btn"]} aria-label="Search / browse birds">
          <PreviewIcon name="search" className={styles.icon} />
        </Link>
        <div className={styles["icon-btn"]} style={{ width: "auto", padding: "0 10px" }}>
          <CartIcon />
        </div>
        <Link href="/list-bird" className={`${styles.btn} ${styles["btn-primary"]} ${styles["btn-small"]} ${styles["sell-header"]}`}>
          <PreviewIcon name="arrowUp" className={styles.icon} /> Sell a bird
        </Link>
        {isSignedIn ? (
          <>
            <NotificationBell />
            <ChatIcon />
            <AccountMenu displayName={displayName} avatarUrl={avatarUrl} initial={initial} isAdmin={isAdmin} signOutAction={signOutAction} />
          </>
        ) : (
          <>
            <Link href="/signin" className={styles.btn}>
              Sign in
            </Link>
            <Link href="/signup" className={`${styles.btn} ${styles["btn-primary"]}`}>
              Join Now
            </Link>
          </>
        )}
      </div>
    </>
  );
}

function useMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openNow() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  }
  function closeSoon() {
    timer.current = setTimeout(() => setOpen(false), 130);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, ref, openNow, closeSoon };
}

function MegaMenu({ label, items, footer }: { label: string; items: MegaItem[]; footer?: string }) {
  const { open, setOpen, ref, openNow, closeSoon } = useMenu();

  return (
    <div className={styles["more-wrap"]} ref={ref} onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label} <PreviewIcon name="down" className={styles.icon} />
      </button>
      {open && (
        <div className={styles["mega-menu"]} style={{ display: "grid" }}>
          {items.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              <PreviewIcon name={item.icon} className={styles.icon} />
              <span>
                <strong>{item.label}</strong>
                <small>{item.desc}</small>
              </span>
            </Link>
          ))}
          {footer && <div className={styles["mega-menu-foot"]}>{footer}</div>}
        </div>
      )}
    </div>
  );
}

function AccountMenu({
  displayName,
  avatarUrl,
  initial,
  isAdmin,
  signOutAction,
}: {
  displayName: string;
  avatarUrl: string | null;
  initial: string;
  isAdmin: boolean;
  signOutAction: () => void;
}) {
  const { open, setOpen, ref, openNow, closeSoon } = useMenu();

  return (
    <div ref={ref} onMouseEnter={openNow} onMouseLeave={closeSoon} style={{ position: "relative" }}>
      <button
        className={`${styles["icon-btn"]} ${styles["account-header"]}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={displayName || "Account"}
        style={{ background: "var(--gold-dim, rgba(212,175,55,.15))", borderColor: "var(--border-gold, rgba(212,175,55,.3))" }}
      >
        {avatarUrl ? (
          <span style={{ position: "relative", width: 26, height: 26, borderRadius: "50%", overflow: "hidden", display: "block" }}>
            <Image src={avatarUrl} alt={displayName} fill style={{ objectFit: "cover" }} />
          </span>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>{initial}</span>
        )}
      </button>
      {open && (
        <div className={styles["mega-menu"]} style={{ display: "flex", flexDirection: "column", left: "auto", right: 0, minWidth: 220, position: "absolute" }}>
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            <PreviewIcon name="home" className={styles.icon} />
            <span>
              <strong>Dashboard</strong>
            </span>
          </Link>
          <Link href="/dashboard/loft" onClick={() => setOpen(false)}>
            <PreviewIcon name="tree" className={styles.icon} />
            <span>
              <strong>My Loft</strong>
            </span>
          </Link>
          <Link href="/settings" onClick={() => setOpen(false)}>
            <PreviewIcon name="grid" className={styles.icon} />
            <span>
              <strong>Account Settings</strong>
            </span>
          </Link>
          {isAdmin && (
            <>
              <div className={styles["mega-menu-foot"]}>Manage</div>
              {ADMIN_LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
                  <span>{l.label}</span>
                </Link>
              ))}
            </>
          )}
          <form action={signOutAction}>
            <button type="submit" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, width: "100%", background: "none", border: "none", color: "#e8a3a3", cursor: "pointer", textAlign: "left" }}>
              <PreviewIcon name="arrow" className={styles.icon} /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
