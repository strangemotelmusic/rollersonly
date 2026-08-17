"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Countdown from "@/components/Countdown";
import { createClient } from "@/lib/supabase/client";
import { placeBid } from "@/app/actions/bids";
import AuctionChat from "./AuctionChat";

type ChatMessage = {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  profiles: { username: string } | null;
};

type Bird = {
  id: string;
  name: string | null;
  ring_number: string | null;
  color: string | null;
  sex: string | null;
  birth_year: number | null;
  primary_photo_url: string | null;
  roll_quality: string | null;
  health_certified: boolean | null;
  dna_certified: boolean | null;
  lofts: { name: string; location: string | null } | null;
};

type Bid = {
  id: string;
  amount: number;
  bidder_id: string;
  created_at: string | null;
  profiles: { username: string } | null;
};

type Auction = {
  id: string;
  title: string;
  description: string | null;
  reserve_price: number;
  starting_bid: number;
  current_bid: number | null;
  bid_increment: number;
  ends_at: string;
  status: string;
  video_url: string | null;
  seller_id: string;
  birds: Bird | null;
  bids: Bid[];
};

function maskUsername(username?: string | null) {
  if (!username || username.length < 2) return "Bidder";
  return `${username[0]}${"*".repeat(Math.max(1, username.length - 2))}${username[username.length - 1]}`;
}

export default function AuctionRoom({
  auction,
  secondsLeft,
  currentUserId,
  isBrowseOnly,
  initialMessages,
}: {
  auction: Auction;
  secondsLeft: number;
  currentUserId: string | null;
  isBrowseOnly: boolean;
  initialMessages: ChatMessage[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const initialBid = Number(auction.current_bid ?? auction.starting_bid);
  const [currentBid, setCurrentBid] = useState(initialBid);
  const [bidInput, setBidInput] = useState(initialBid + Number(auction.bid_increment));
  const [showConfirm, setShowConfirm] = useState(false);
  const [bidError, setBidError] = useState("");
  const [placingBid, setPlacingBid] = useState(false);
  const [bids, setBids] = useState(
    [...auction.bids].sort((a, b) => Number(b.amount) - Number(a.amount))
  );

  const bird = auction.birds;

  useEffect(() => {
    const channel = supabase
      .channel(`auction-${auction.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bids", filter: `auction_id=eq.${auction.id}` },
        (payload: { new: { id: string; amount: number; bidder_id: string; created_at: string } }) => {
          setCurrentBid(Number(payload.new.amount));
          setBids((prev) => [
            { ...payload.new, amount: Number(payload.new.amount), profiles: null },
            ...prev,
          ]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [auction.id, supabase]);

  async function handleConfirmBid() {
    if (!currentUserId) {
      router.push("/signin");
      return;
    }
    setPlacingBid(true);
    setBidError("");
    const result = await placeBid(auction.id, bidInput);
    setPlacingBid(false);
    if (result.error) {
      setBidError(result.error);
      return;
    }
    setShowConfirm(false);
    router.refresh();
  }

  const isOwnAuction = currentUserId && currentUserId === auction.seller_id;
  const minBid = currentBid + Number(auction.bid_increment);
  const isLive = auction.status === "live";

  return (
    <div style={{ background: "var(--black)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* TOPBAR */}
      <div className="rs-pad-x-sm" style={{ position: "fixed", top: 0, left: 0, right: 0, height: 60, background: "rgba(0,0,0,0.97)", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{ fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 600, letterSpacing: "0.1em", color: "var(--white)", textDecoration: "none" }}>
            Rollers<span style={{ color: "var(--gold)" }}>Only</span>
          </Link>
          <div className="rs-hide-mobile" style={{ fontSize: 12, color: "var(--muted)" }}>
            <Link href="/browse" style={{ color: "var(--muted)", textDecoration: "none" }}>Auctions</Link>
            <span style={{ margin: "0 8px" }}>›</span>
            <span style={{ color: "var(--white)" }}>{bird?.name || auction.title}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--white)", background: isLive ? "rgba(255,50,50,0.15)" : "rgba(255,255,255,0.08)", border: `0.5px solid ${isLive ? "rgba(255,80,80,0.4)" : "var(--border)"}`, padding: "5px 12px", borderRadius: 2 }}>
            {isLive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff4444", display: "inline-block", animation: "pulse-red 1.5s ease-in-out infinite" }} />}
            {isLive ? "Live Auction" : auction.status}
          </div>
          <Link href="/browse" className="btn-ghost" style={{ fontSize: 11 }}>← Back</Link>
        </div>
      </div>

      {/* MAIN */}
      <div className="rs-3col-fixed" style={{ display: "flex", flex: 1, paddingTop: 60, height: "calc(100vh - 60px)" }}>

        {/* LEFT — bird display */}
        <div style={{ flex: 1, borderRight: "0.5px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ height: "55vh", background: "#000", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 16, left: 16, display: "flex", flexDirection: "column", gap: 8, zIndex: 2 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{bird?.ring_number && <span style={{ color: "var(--gold)" }}>{bird.ring_number}</span>}</div>
              <div style={{ display: "flex", gap: 6 }}>
                {(
                  [
                    bird?.dna_certified ? ["DNA Confirmed", "#5DADE2"] : null,
                    bird?.health_certified ? ["Health Certified", "#2ECC71"] : null,
                  ].filter((x): x is [string, string] => x !== null)
                ).map(([label, color]) => (
                  <span key={label} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 8px", border: `0.5px solid ${color}`, color, borderRadius: 1 }}>{label}</span>
                ))}
              </div>
            </div>
            {bird?.primary_photo_url && (
              <Image src={bird.primary_photo_url} alt={bird.name || auction.title} fill style={{ objectFit: "contain", objectPosition: "center bottom" }} />
            )}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: "linear-gradient(to top, rgba(212,175,55,0.06), transparent)" }} />
          </div>

          {/* Bird info */}
          <div style={{ padding: "20px 28px", borderBottom: "0.5px solid var(--border)", background: "var(--deep)" }}>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 400, color: "var(--white)", marginBottom: 8 }}>{bird?.name || auction.title}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
              {[
                bird?.ring_number,
                bird?.lofts?.name,
                bird?.lofts?.location,
                bird?.sex,
                bird?.birth_year && `${bird.birth_year} Hatch`,
                bird?.color,
              ]
                .filter(Boolean)
                .map((m) => (
                  <span key={m as string}>{m}</span>
                ))}
            </div>
          </div>

          {auction.description && (
            <div style={{ padding: "20px 28px", flex: 1, overflowY: "auto" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>Description</div>
              <p style={{ fontSize: 14, color: "var(--white)", lineHeight: 1.7 }}>{auction.description}</p>
            </div>
          )}
        </div>

        {/* CENTER — bid engine */}
        <div style={{ width: 300, borderRight: "0.5px solid var(--border)", background: "var(--void)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ padding: 24, borderBottom: "0.5px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>Current Bid</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 52, fontWeight: 300, color: "var(--gold)", lineHeight: 1, marginBottom: 4 }}>${currentBid.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>{bids.length} bid{bids.length === 1 ? "" : "s"}{bids[0]?.profiles?.username ? ` · ${maskUsername(bids[0].profiles.username)} is leading` : ""}</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>Ends in</div>
              <Countdown seconds={secondsLeft} />
            </div>

            {currentBid >= Number(auction.reserve_price) && (
              <span style={{ display: "inline-block", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2ECC71", border: "0.5px solid rgba(46,204,113,0.4)", padding: "3px 10px", borderRadius: 1, marginBottom: 20 }}>Reserve met ✓</span>
            )}

            {isBrowseOnly ? (
              <div style={{ fontSize: 13, color: "var(--muted)", padding: "16px 0" }}>
                Browse Only members can&apos;t place bids. <Link href="/signup" style={{ color: "var(--gold)", textDecoration: "none" }}>Upgrade your plan</Link> to bid.
              </div>
            ) : isOwnAuction ? (
              <div style={{ fontSize: 13, color: "var(--muted)", padding: "16px 0" }}>This is your own listing.</div>
            ) : !isLive ? (
              <div style={{ fontSize: 13, color: "var(--muted)", padding: "16px 0" }}>This auction is not currently accepting bids.</div>
            ) : (
              <>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>Your bid</div>
                  <input type="number" value={bidInput} onChange={(e) => setBidInput(Number(e.target.value))} style={{ width: "100%", background: "var(--deep)", border: "0.5px solid var(--border-gold)", color: "var(--white)", padding: "12px 16px", fontSize: 18, fontFamily: "var(--ff-display)", fontWeight: 300, borderRadius: 2, outline: "none" }} />
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>Minimum: ${minBid.toLocaleString()} · Increment: ${Number(auction.bid_increment).toLocaleString()}</div>
                </div>

                <button onClick={() => setShowConfirm(true)} style={{ width: "100%", background: "var(--gold)", color: "var(--black)", border: "none", padding: 16, fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", borderRadius: 2, marginTop: 12, transition: "all 0.2s" }}>
                  Place Bid
                </button>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, textAlign: "center" }}>5% platform commission · Escrow protected</div>
              </>
            )}
          </div>

          {/* Bid history */}
          <div style={{ padding: 24, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>Bid History</div>
            {bids.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--muted)" }}>No bids yet — be the first.</div>
            ) : (
              bids.map((b, i) => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "0.5px solid var(--border)" }}>
                  <div style={{ fontSize: 13, color: i === 0 ? "var(--gold)" : "var(--white)" }}>
                    {maskUsername(b.profiles?.username)} — ${Number(b.amount).toLocaleString()}
                    {i === 0 && <span style={{ fontSize: 10, color: "var(--gold)", marginLeft: 6 }}>★ Winning</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{b.created_at ? new Date(b.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT — chat */}
        <div style={{ width: 280, background: "var(--deep)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 20px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ECC71", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--white)" }}>Live Chat</span>
          </div>
          <AuctionChat auctionId={auction.id} currentUserId={currentUserId} initialMessages={initialMessages} />
        </div>
      </div>

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "0 16px" }}>
          <div style={{ background: "var(--deep)", border: "0.5px solid var(--border-gold)", padding: 40, borderRadius: 2, maxWidth: 420, width: "100%" }}>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 300, color: "var(--white)", marginBottom: 12 }}>Confirm Bid</div>
            <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 20 }}>
              You are placing a bid of <strong style={{ color: "var(--gold)" }}>${bidInput.toLocaleString()}</strong> on {bird?.name || auction.title}. Your payment will be held in escrow until you confirm arrival and condition.
            </p>
            {bidError && <div style={{ color: "#E74C3C", fontSize: 13, marginBottom: 16, padding: "10px 14px", background: "rgba(231,76,60,0.08)", borderRadius: 2, border: "0.5px solid rgba(231,76,60,0.3)" }}>{bidError}</div>}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { setShowConfirm(false); setBidError(""); }} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleConfirmBid} disabled={placingBid} style={{ flex: 1, background: "var(--gold)", color: "var(--black)", border: "none", padding: 14, fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 2 }}>
                {placingBid ? "Placing…" : "Confirm Bid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
