"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CartIcon from "@/components/CartIcon";
import ChatIcon from "@/components/ChatIcon";
import NotificationBell from "@/components/NotificationBell";

type LinkItem = { label: string; href: string };

const MARKETPLACE: LinkItem[] = [
  { label: "Live Auctions", href: "/auctions" },
  { label: "Browse Birds", href: "/browse" },
  { label: "Buy D.O.T.S Birds", href: "/dots-birds" },
];

const MAGAZINE_PUBLIC: LinkItem[] = [
  { label: "Decade of the Spinner", href: "/decade-of-the-spinner" },
  { label: "Future Issues", href: "/future-issues" },
];

const ADMIN_LINKS: LinkItem[] = [
  { label: "Review Queue", href: "/admin/certifications" },
  { label: "Site Images", href: "/admin/site-images" },
  { label: "Live Auctions", href: "/admin/live-auctions" },
  { label: "Our Breeders", href: "/admin/our-breeders" },
  { label: "Future Issues", href: "/admin/future-issues" },
  { label: "D.O.T.S Birds", href: "/admin/dots-birds" },
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
  const community: LinkItem[] = [
    { label: "Top Breeders", href: "/breeders" },
    { label: "Our Breeders", href: "/our-breeders" },
    ...(isSignedIn ? [{ label: "Members", href: "/members" }] : []),
    { label: "Leaderboards", href: "/leaderboards" },
    { label: "Family Tree", href: "/family-tree" },
  ];
  const magazine: LinkItem[] = [...MAGAZINE_PUBLIC, ...(isSignedIn ? [{ label: "The Spin Vault", href: "/spin-vault" }] : [])];

  return (
    <div className="nav-desktop">
      <div className="nav-menus">
        <Dropdown label="Marketplace" items={MARKETPLACE} active={active} />
        <Dropdown label="Community" items={community} active={active} />
        <Dropdown label="Magazine" items={magazine} active={active} />
      </div>
      <div className="nav-right">
        <CartIcon />
        {isSignedIn ? (
          <>
            <NotificationBell />
            <ChatIcon />
            <AccountMenu displayName={displayName} avatarUrl={avatarUrl} initial={initial} isAdmin={isAdmin} signOutAction={signOutAction} />
          </>
        ) : (
          <>
            <Link href="/signin" className="btn-ghost">Sign in</Link>
            <Link href="/signup" className="btn-gold">Join Now</Link>
          </>
        )}
      </div>
    </div>
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

function Dropdown({ label, items, active }: { label: string; items: LinkItem[]; active?: string }) {
  const { open, setOpen, ref, openNow, closeSoon } = useMenu();
  const isActive = items.some((it) => it.href === active);

  return (
    <div className="nav-menu" ref={ref} onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button className={`nav-menu-trigger${open ? " open" : ""}${isActive ? " active" : ""}`} onClick={() => setOpen((o) => !o)}>
        {label}
        <span className="nav-caret">⌄</span>
      </button>
      {open && (
        <div className="nav-panel">
          {items.map((it) => (
            <Link key={it.href} href={it.href} className="nav-panel-item" onClick={() => setOpen(false)}>
              {it.label}
            </Link>
          ))}
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
    <div className="nav-menu nav-account" ref={ref} onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button className={`nav-account-trigger${open ? " open" : ""}`} onClick={() => setOpen((o) => !o)}>
        <span className="nav-avatar">
          {avatarUrl ? <Image src={avatarUrl} alt={displayName} fill style={{ objectFit: "cover" }} /> : initial}
        </span>
        <span className="nav-account-name">{displayName}</span>
        <span className="nav-caret">⌄</span>
      </button>
      {open && (
        <div className="nav-panel nav-panel-right">
          <Link href="/dashboard" className="nav-panel-item" onClick={() => setOpen(false)}>Dashboard</Link>
          <Link href="/dashboard/loft" className="nav-panel-item" onClick={() => setOpen(false)}>My Loft</Link>
          <Link href="/settings" className="nav-panel-item" onClick={() => setOpen(false)}>Account Settings</Link>
          {isAdmin && (
            <>
              <div className="nav-panel-divider" />
              <div className="nav-panel-header">Manage</div>
              {ADMIN_LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="nav-panel-item nav-panel-subitem" onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              ))}
            </>
          )}
          <div className="nav-panel-divider" />
          <form action={signOutAction}>
            <button type="submit" className="nav-panel-item nav-signout">Sign out</button>
          </form>
        </div>
      )}
    </div>
  );
}
