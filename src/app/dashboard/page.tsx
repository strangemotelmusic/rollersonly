import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";

const tierLabel: Record<string, string> = {
  browse: "Browse Only",
  fancier: "Fancier",
  breeder: "Breeder",
  elite: "Elite Loft",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const profile = await ensureProfile(user);

  const { data: loft } = await supabase
    .from("lofts")
    .select("name, location, rating")
    .eq("owner_id", user.id)
    .maybeSingle();

  const { data: birdsRaw } = await supabase
    .from("birds")
    .select("id, name, ring_number, primary_photo_url, auctions(id, current_bid, starting_bid, status, created_at, bids(id))")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const myListings = (birdsRaw ?? []).map((b) => {
    const latestAuction = [...(b.auctions ?? [])].sort(
      (x, y) => new Date(y.created_at ?? 0).getTime() - new Date(x.created_at ?? 0).getTime()
    )[0];
    return {
      id: b.id,
      name: b.name || "Unnamed bird",
      ring: b.ring_number || "—",
      img: b.primary_photo_url,
      bids: latestAuction?.bids?.length ?? 0,
      currentBid: latestAuction?.current_bid ?? latestAuction?.starting_bid,
      status: latestAuction?.status === "live" ? "live" : "available",
    };
  });

  const { data: bidsRaw } = await supabase
    .from("bids")
    .select("id, amount, created_at, auctions(id, current_bid, ends_at, status, birds(id, name, primary_photo_url, lofts(name)))")
    .eq("bidder_id", user.id)
    .order("created_at", { ascending: false });

  const latestBidByAuction = new Map<string, NonNullable<typeof bidsRaw>[number]>();
  for (const bid of bidsRaw ?? []) {
    if (bid.auctions && !latestBidByAuction.has(bid.auctions.id)) {
      latestBidByAuction.set(bid.auctions.id, bid);
    }
  }

  const activeBids = Array.from(latestBidByAuction.values())
    .filter((b) => b.auctions?.status === "live")
    .map((b) => {
      const auction = b.auctions!;
      const winning = Number(b.amount) >= Number(auction.current_bid ?? 0);
      const endsMs = new Date(auction.ends_at).getTime() - Date.now();
      const hours = Math.max(0, Math.floor(endsMs / 3_600_000));
      const mins = Math.max(0, Math.floor((endsMs % 3_600_000) / 60_000));
      return {
        id: auction.id,
        birdId: auction.birds?.id,
        name: auction.birds?.name || "Unnamed bird",
        loft: auction.birds?.lofts?.name || "—",
        img: auction.birds?.primary_photo_url,
        yourBid: Number(b.amount),
        currentBid: Number(auction.current_bid ?? b.amount),
        status: winning ? "winning" : "outbid",
        ends: endsMs > 0 ? `${hours}h ${mins}m` : "Ended",
      };
    });

  const { data: completedSalesRaw } = await supabase
    .from("auctions")
    .select("id, final_price, ends_at, winner_id, birds(name)")
    .eq("seller_id", user.id)
    .eq("status", "ended")
    .order("ends_at", { ascending: false })
    .limit(5);

  const winnerIds = [...new Set((completedSalesRaw ?? []).map((s) => s.winner_id).filter((id): id is string => id !== null))];
  const { data: winners } = winnerIds.length
    ? await supabase.from("profiles").select("id, username").in("id", winnerIds)
    : { data: [] as { id: string; username: string }[] };
  const winnerMap = new Map((winners ?? []).map((w) => [w.id, w.username]));

  const recentSales = (completedSalesRaw ?? []).map((s) => ({
    name: s.birds?.name || "Unnamed bird",
    buyer: (s.winner_id && winnerMap.get(s.winner_id)) || "—",
    amount: s.final_price,
    date: new Date(s.ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  }));

  const activeBidValue = activeBids.reduce((sum, b) => sum + b.yourBid, 0);
  const birdsWinning = activeBids.filter((b) => b.status === "winning").length;
  const birdsOutbid = activeBids.filter((b) => b.status === "outbid").length;
  const salesThisMonth = recentSales.reduce((sum, s) => sum + Number(s.amount ?? 0), 0);

  const displayName = profile?.full_name || profile?.username || user.email;
  const tier = tierLabel[profile?.tier ?? ""] || "Fancier";

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>

        {/* HEADER */}
        <div className="rs-pad-lg" style={{ background: "var(--void)", borderBottom: "0.5px solid var(--border)", padding: "40px 64px" }}>
          <div className="rs-flex-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>Your Loft</p>
              <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 40, fontWeight: 300, color: "var(--white)", marginBottom: 6 }}>Welcome back, {displayName}</h1>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>
                {loft ? `${loft.name}${loft.location ? ` · ${loft.location}` : ""} · ` : profile?.username ? `${profile.username} · ` : ""}
                {tier} Member
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/pedigree" className="btn-ghost" style={{ fontSize: 11 }}>Pedigree Vault</Link>
              <Link href="/list-bird" className="btn-gold" style={{ fontSize: 11 }}>List a Bird</Link>
            </div>
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="rs-grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", background: "var(--surface)", borderBottom: "0.5px solid var(--border)" }}>
          {[
            [`$${activeBidValue.toLocaleString()}`, "Active Bid Value"],
            [String(birdsWinning), "Birds Winning"],
            [String(birdsOutbid), "Birds Outbid"],
            [`$${salesThisMonth.toLocaleString()}`, "Sales This Month"],
            [loft?.rating ? `${Number(loft.rating).toFixed(1)}★` : "—", "Seller Rating"],
          ].map(([val, label]) => (
            <div key={String(label)} style={{ padding: "28px 32px", borderRight: "0.5px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 32, fontWeight: 300, color: "var(--gold)", lineHeight: 1, marginBottom: 6 }}>{val}</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="rs-dashboard-grid rs-pad-lg" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 0, padding: "48px 64px", alignItems: "start" }}>
          <div style={{ paddingRight: 48 }}>

            {/* ACTIVE BIDS */}
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 300, color: "var(--white)" }}>Active Bids</div>
                <Link href="/browse" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>Browse more →</Link>
              </div>
              {activeBids.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--muted)" }}>No active bids yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
                  {activeBids.map((b) => (
                    <div key={b.id} style={{ background: "var(--surface)", display: "flex", gap: 20, alignItems: "center", padding: 20 }}>
                      <div style={{ position: "relative", width: 64, height: 64, borderRadius: 2, overflow: "hidden", flexShrink: 0, background: "#000" }}>
                        {b.img && <Image src={b.img} alt={b.name} fill style={{ objectFit: "contain" }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: "var(--white)", marginBottom: 3 }}>{b.name}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>{b.loft}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>Your Bid</div>
                        <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, color: "var(--white)" }}>${b.yourBid.toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>Current</div>
                        <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, color: "var(--gold)" }}>${b.currentBid.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 2, background: b.status === "winning" ? "rgba(50,200,100,0.12)" : "rgba(231,76,60,0.12)", color: b.status === "winning" ? "#50c878" : "#e74c3c", marginBottom: 8 }}>{b.status === "winning" ? "● Winning" : "Outbid"}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>{b.ends}</div>
                      </div>
                      <Link href={`/birds/${b.birdId}`} style={{ padding: "10px 16px", border: "0.5px solid var(--border-gold)", color: "var(--gold)", fontSize: 11, textDecoration: "none", borderRadius: 1, whiteSpace: "nowrap" }}>
                        {b.status === "outbid" ? "Raise Bid" : "View"}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* MY LISTINGS */}
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 300, color: "var(--white)" }}>My Listings</div>
                <Link href="/list-bird" className="btn-gold" style={{ fontSize: 11, padding: "8px 18px" }}>+ List New Bird</Link>
              </div>
              {myListings.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--muted)" }}>You haven&apos;t listed any birds yet.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                  <thead>
                    <tr style={{ borderBottom: "0.5px solid var(--border)" }}>
                      {["Bird", "Ring", "Bids", "Current Bid", "Status", ""].map((h) => (
                        <th key={h} style={{ padding: "8px 12px", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", textAlign: "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myListings.map((b) => (
                      <tr key={b.id} style={{ borderBottom: "0.5px solid var(--border)" }}>
                        <td style={{ padding: "16px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ position: "relative", width: 44, height: 44, background: "#000", borderRadius: 1, overflow: "hidden", flexShrink: 0 }}>
                              {b.img && <Image src={b.img} alt={b.name} fill style={{ objectFit: "contain" }} />}
                            </div>
                            <span style={{ fontSize: 13, color: "var(--white)" }}>{b.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "16px 12px", fontSize: 12, color: "var(--gold)" }}>{b.ring}</td>
                        <td style={{ padding: "16px 12px", fontSize: 13, color: "var(--muted)" }}>{b.bids}</td>
                        <td style={{ padding: "16px 12px", fontFamily: "var(--ff-display)", fontSize: 18, color: "var(--white)" }}>{b.currentBid ? `$${Number(b.currentBid).toLocaleString()}` : "—"}</td>
                        <td style={{ padding: "16px 12px" }}>
                          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 2, background: b.status === "live" ? "rgba(255,50,50,0.12)" : "rgba(255,255,255,0.06)", color: b.status === "live" ? "#ff6666" : "var(--muted)" }}>
                            {b.status === "live" ? "● Live" : "Available"}
                          </span>
                        </td>
                        <td style={{ padding: "16px 12px" }}>
                          <Link href={`/list-bird/${b.id}`} style={{ fontSize: 11, color: "var(--gold)", textDecoration: "none" }}>Manage →</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </section>

            {/* RECENT SALES */}
            <section>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 300, color: "var(--white)", marginBottom: 20 }}>Recent Sales</div>
              {recentSales.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--muted)" }}>No completed sales yet.</p>
              ) : (
                <div style={{ border: "0.5px solid var(--border)" }}>
                  {recentSales.map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: i < recentSales.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                      <div>
                        <div style={{ fontSize: 14, color: "var(--white)", marginBottom: 3 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>Buyer: {s.buyer} · {s.date}</div>
                      </div>
                      <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--gold)" }}>${Number(s.amount ?? 0).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* SIDEBAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{ background: "var(--void)", border: "0.5px solid var(--border-gold)", padding: 24, borderRadius: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>◆ {tier}</div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Your Plan</div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>Unlimited listings, verified pedigree, featured placement, AI matchmaking, and priority auction placement.</p>
              <a href="mailto:strangemotelmusic@gmail.com" style={{ display: "block", textAlign: "center", padding: 10, border: "0.5px solid var(--border)", color: "var(--muted)", fontSize: 11, textDecoration: "none", borderRadius: 1, letterSpacing: "0.08em", textTransform: "uppercase" }}>Manage Subscription</a>
            </div>

            <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", padding: 24, borderRadius: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>Quick Actions</div>
              {[
                { label: "Register a Bird", href: "/list-bird" },
                { label: "Account Settings", href: "/settings" },
                { label: "Add to Pedigree Vault", href: "/pedigree" },
                { label: "View Leaderboards", href: "/leaderboards" },
                { label: "Contact Support", href: "mailto:strangemotelmusic@gmail.com" },
              ].map(({ label, href }) => (
                <Link key={label} href={href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "0.5px solid var(--border)", fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>
                  {label} <span style={{ color: "var(--gold)" }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
