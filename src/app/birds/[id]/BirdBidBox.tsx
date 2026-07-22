"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { placeBid } from "@/app/actions/bids";

type Bid = {
  id: string;
  amount: number;
  created_at: string | null;
  profiles: { username: string } | null;
};

type Auction = {
  id: string;
  current_bid: number | null;
  starting_bid: number;
  bid_increment: number;
  status: string;
  ends_at: string;
  seller_id: string;
} | null;

function maskUsername(username?: string | null) {
  if (!username || username.length < 2) return "Bidder";
  return `${username[0]}${"*".repeat(Math.max(1, username.length - 2))}${username[username.length - 1]}`;
}

export default function BirdBidBox({
  auction,
  bids,
  currentUserId,
  isBrowseOnly,
}: {
  auction: Auction;
  bids: Bid[];
  currentUserId: string | null;
  isBrowseOnly: boolean;
}) {
  const router = useRouter();

  if (!auction) {
    return (
      <div style={{ background: "var(--void)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 28 }}>
        <div style={{ fontSize: 14, color: "var(--muted)" }}>This bird isn&apos;t currently listed in an auction.</div>
      </div>
    );
  }

  const currentBid = Number(auction.current_bid ?? auction.starting_bid);
  const minBid = currentBid + Number(auction.bid_increment);
  const [bidInput, setBidInput] = useState(minBid);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isLive = auction.status === "live";
  const isOwnAuction = currentUserId && currentUserId === auction.seller_id;

  async function handleBid() {
    if (!currentUserId) {
      router.push("/signin");
      return;
    }
    setLoading(true);
    setError("");
    const result = await placeBid(auction!.id, bidInput);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div style={{ background: "var(--void)", border: "0.5px solid var(--border-gold)", borderRadius: 2, padding: 28, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>Current bid</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 44, fontWeight: 300, color: "var(--gold)", lineHeight: 1 }}>${currentBid.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{bids.length} bid{bids.length === 1 ? "" : "s"} placed</div>
          </div>
        </div>

        {isBrowseOnly ? (
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Browse Only members can&apos;t place bids. <Link href="/signup" style={{ color: "var(--gold)", textDecoration: "none" }}>Upgrade your plan</Link> to bid.
          </div>
        ) : isOwnAuction ? (
          <div style={{ fontSize: 13, color: "var(--muted)" }}>This is your own listing.</div>
        ) : !isLive ? (
          <div style={{ fontSize: 13, color: "var(--muted)" }}>This auction isn&apos;t currently accepting bids.</div>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>Your bid (min ${minBid.toLocaleString()})</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  value={bidInput}
                  onChange={(e) => setBidInput(Number(e.target.value))}
                  style={{ flex: 1, background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "12px 16px", fontSize: 16, borderRadius: 2, outline: "none", fontFamily: "var(--ff-display)" }}
                />
                <button onClick={handleBid} disabled={loading} className="btn-gold" style={{ padding: "12px 20px", whiteSpace: "nowrap" }}>
                  {loading ? "Placing…" : "Place Bid"}
                </button>
              </div>
            </div>
            {error && <div style={{ color: "#E74C3C", fontSize: 12, marginBottom: 12 }}>{error}</div>}
          </>
        )}

        <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6, padding: "12px 0", borderTop: "0.5px solid var(--border)" }}>
          🔒 Escrow-protected · Funds held until delivery confirmed · <Link href={`/auctions/${auction.id}`} style={{ color: "var(--gold)", textDecoration: "none" }}>Enter Live Auction Room →</Link>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 14 }}>Bid History</div>
        {bids.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--muted)" }}>No bids yet.</div>
        ) : (
          bids.map((b, i) => (
            <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < bids.length - 1 ? "0.5px solid var(--border)" : "none" }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--white)" }}>{i === 0 ? "⭐ " : ""}{maskUsername(b.profiles?.username)}</div>
              </div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, color: i === 0 ? "var(--gold)" : "var(--muted)" }}>${Number(b.amount).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
