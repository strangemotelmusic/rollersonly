"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useListingNotifications } from "@/lib/listing-notifications-context";

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const { unreadCount, recentListings, markRead } = useListingNotifications();
  const [open, setOpen] = useState(false);

  function toggle() {
    setOpen((o) => {
      if (!o) markRead();
      return !o;
    });
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={toggle}
        title="New listings"
        style={{ position: "relative", display: "flex", alignItems: "center", background: "none", border: "none", color: "var(--white)", fontSize: 16, cursor: "pointer", padding: 0 }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -8,
              minWidth: 16,
              height: 16,
              borderRadius: "50%",
              background: "var(--gold)",
              color: "var(--black)",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 14px)",
              right: 0,
              width: 320,
              maxHeight: 420,
              overflowY: "auto",
              background: "var(--surface)",
              border: "0.5px solid var(--border)",
              borderRadius: 2,
              boxShadow: "0 20px 50px -10px rgba(0,0,0,0.8)",
              zIndex: 41,
            }}
          >
            <div style={{ padding: "14px 18px", borderBottom: "0.5px solid var(--border)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>
              New Listings
            </div>
            {recentListings.length === 0 ? (
              <div style={{ padding: 20, fontSize: 13, color: "var(--muted)" }}>No listings yet.</div>
            ) : (
              recentListings.map((l) => (
                <Link
                  key={l.id}
                  href={`/auctions/${l.id}`}
                  onClick={() => setOpen(false)}
                  style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 18px", borderBottom: "0.5px solid var(--border)", textDecoration: "none" }}
                >
                  <span style={{ position: "relative", width: 40, height: 40, flexShrink: 0, borderRadius: 2, overflow: "hidden", background: "var(--void)" }}>
                    {l.birds?.primary_photo_url && <Image src={l.birds.primary_photo_url} alt={l.title} fill style={{ objectFit: "cover" }} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, color: "var(--white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</span>
                    <span style={{ display: "block", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {l.starting_bid != null ? `Opening bid $${l.starting_bid.toLocaleString()}` : "New listing"} · {timeAgo(l.created_at)}
                    </span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
