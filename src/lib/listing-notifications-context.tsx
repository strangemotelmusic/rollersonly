"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export type NewListing = {
  id: string;
  title: string;
  starting_bid: number | null;
  created_at: string;
  birds: { primary_photo_url: string | null } | null;
};

type NewListingRow = {
  id: string;
  title: string;
  starting_bid: number | null;
  created_at: string;
};

type ListingNotificationsContextValue = {
  unreadCount: number;
  recentListings: NewListing[];
  markRead: () => void;
};

const ListingNotificationsContext = createContext<ListingNotificationsContextValue | null>(null);

export function ListingNotificationsProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [recentListings, setRecentListings] = useState<NewListing[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // One-time bootstrap: who's signed in, their last-read marker (lazily
  // created on first visit, matching the ensure-profile.ts convention so a
  // brand-new row defaults to "now" instead of flooding a new member with
  // every historic listing as unread), and the initial unread set.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      setUserId(user.id);

      const { data: existing } = await supabase
        .from("listing_notification_reads")
        .select("last_read_at")
        .eq("user_id", user.id)
        .maybeSingle();

      let lastReadAt = existing?.last_read_at ?? null;
      if (!lastReadAt) {
        lastReadAt = new Date().toISOString();
        await supabase.from("listing_notification_reads").upsert({ user_id: user.id, last_read_at: lastReadAt });
      }

      const { data: listings } = await supabase
        .from("auctions")
        .select("id, title, starting_bid, created_at, birds(primary_photo_url)")
        .order("created_at", { ascending: false })
        .limit(20);

      if (cancelled) return;
      const all = (listings ?? []) as unknown as NewListing[];
      setRecentListings(all);
      setUnreadCount(all.filter((l) => l.created_at > lastReadAt!).length);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One realtime channel for the whole session - unfiltered INSERT relies on
  // the auctions table's existing public/authenticated SELECT RLS to scope
  // what each subscriber actually receives, same reasoning as chat-context.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("listing-notify")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "auctions" }, (payload: { new: NewListingRow }) => {
        const row = payload.new;
        setRecentListings((prev) => (prev.some((l) => l.id === row.id) ? prev : [{ ...row, birds: null }, ...prev].slice(0, 20)));
        setUnreadCount((c) => c + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function markRead() {
    setUnreadCount(0);
    if (!userIdRef.current) return;
    const now = new Date().toISOString();
    supabase
      .from("listing_notification_reads")
      .upsert({ user_id: userIdRef.current, last_read_at: now })
      .then(() => {});
  }

  return (
    <ListingNotificationsContext.Provider value={{ unreadCount, recentListings, markRead }}>
      {children}
    </ListingNotificationsContext.Provider>
  );
}

export function useListingNotifications() {
  const ctx = useContext(ListingNotificationsContext);
  if (!ctx) throw new Error("useListingNotifications must be used within a ListingNotificationsProvider");
  return ctx;
}
