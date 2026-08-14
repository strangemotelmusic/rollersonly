"use client";
import { useState } from "react";
import Link from "next/link";

export default function NavMobileToggle({
  links,
  isSignedIn,
  isAdmin,
  signOutAction,
}: {
  links: { label: string; href: string }[];
  isSignedIn: boolean;
  isAdmin: boolean;
  signOutAction: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="nav-hamburger" onClick={() => setOpen((o) => !o)} aria-label={open ? "Close menu" : "Open menu"}>
        {open ? "✕" : "☰"}
      </button>
      {open && (
        <div className="nav-mobile-panel">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="/cart" onClick={() => setOpen(false)}>Cart</Link>
          {isSignedIn ? (
            <>
              <Link href="/chat" onClick={() => setOpen(false)}>Chat</Link>
              <Link href="/spin-vault" onClick={() => setOpen(false)}>The Spin Vault</Link>
              <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
              <Link href="/settings" onClick={() => setOpen(false)}>Account Settings</Link>
              {isAdmin && (
                <>
                  <Link href="/admin/certifications" onClick={() => setOpen(false)}>Review Queue</Link>
                  <Link href="/admin/site-images" onClick={() => setOpen(false)}>Site Images</Link>
                  <Link href="/admin/dots-birds" onClick={() => setOpen(false)}>Manage D.O.T.S Birds</Link>
                  <Link href="/admin/magazine" onClick={() => setOpen(false)}>Manage Magazine</Link>
                  <Link href="/admin/archive" onClick={() => setOpen(false)}>Manage The Spin Vault</Link>
                </>
              )}
              <form action={signOutAction}>
                <button type="submit">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/signin" onClick={() => setOpen(false)}>Sign in</Link>
              <Link href="/signup" onClick={() => setOpen(false)}>Join Now</Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
