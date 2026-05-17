"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabase";

const activeBids = [
  { id: 1, name: "Blue Bar Champion Cock", loft: "Anderson Elite Loft", yourBid: "$1,240", currentBid: "$1,240", status: "winning", ends: "2h 18m", img: "/bird-white-red.jpg" },
  { id: 5, name: "White Badge Roller Hen", loft: "Royal Birmingham Loft", yourBid: "$600", currentBid: "$650", status: "outbid", ends: "5h 44m", img: "/bird-white-red2.jpg" },
];

const myListings = [
  { id: 1, name: "Blue Bar Champion Cock", ring: "AU24-TX-44821", bids: 14, currentBid: "$1,240", status: "live", img: "/bird-white-red.jpg" },
  { id: 4, name: "Black Centertail Young Cock", ring: "AU25-TX-11203", bids: 0, currentBid: "$420", status: "available", img: "/bird-black-centertail.jpg" },
];

const recentSales = [
  { name: "Lavender Cock", buyer: "martinez_ca", amount: "$1,100", date: "May 12, 2025" },
  { name: "Red Self Hen", buyer: "khanloft_tx", amount: "$780", date: "April 28, 2025" },
  { name: "White Badge Pair", buyer: "sterling_nl", amount: "$2,400", date: "April 10, 2025" },
];

export default function DashboardPage() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--black)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--muted)", fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 300 }}>Loading your loft…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--black)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <div style={{ fontFamily: "var(--ff-display)", fontSize: 32, fontWeight: 300, color: "var(--white)" }}>Sign in to access your dashboard</div>
        <Link href="/signin" className="btn-gold" style={{ padding: "14px 32px" }}>Sign In</Link>
      </div>
    );
  }

  return (
    <>
      <Nav active="/dashboard" />
      <div style={{ paddingTop: 72, background: "var(--black)", minHeight: "100vh" }}>

        {/* HEADER */}
        <div style={{ background: "var(--void)", borderBottom: "0.5px solid var(--border)", padding: "40px 64px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>Your Loft</p>
              <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 40, fontWeight: 300, color: "var(--white)", marginBottom: 6 }}>Welcome back, James</h1>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Anderson Elite Loft · DeSoto, TX · Elite Loft Member</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/pedigree" className="btn-ghost" style={{ fontSize: 11 }}>Pedigree Vault</Link>
              <Link href="/signup" className="btn-gold" style={{ fontSize: 11 }}>List a Bird</Link>
            </div>
          </div>
        </div>

        {/* QUICK STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", background: "var(--surface)", borderBottom: "0.5px solid var(--border)" }}>
          {[
            ["$4,280", "Active Bid Value"],
            ["2", "Birds Winning"],
            ["1", "Birds Outbid"],
            ["$4,280", "Sales This Month"],
            ["4.9★", "Seller Rating"],
          ].map(([val, label]) => (
            <div key={String(label)} style={{ padding: "28px 32px", borderRight: "0.5px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 32, fontWeight: 300, color: "var(--gold)", lineHeight: 1, marginBottom: 6 }}>{val}</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 0, padding: "48px 64px", alignItems: "start" }}>
          <div style={{ paddingRight: 48 }}>

            {/* ACTIVE BIDS */}
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 300, color: "var(--white)" }}>Active Bids</div>
                <Link href="/browse" style={{ fontSize: 12, color: "var(--gold)", textDecoration: "none" }}>Browse more →</Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--border)" }}>
                {activeBids.map((b) => (
                  <div key={b.id} style={{ background: "var(--surface)", display: "flex", gap: 20, alignItems: "center", padding: 20 }}>
                    <div style={{ position: "relative", width: 64, height: 64, borderRadius: 2, overflow: "hidden", flexShrink: 0, background: "#000" }}>
                      <Image src={b.img} alt={b.name} fill style={{ objectFit: "contain" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: "var(--white)", marginBottom: 3 }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{b.loft}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>Your Bid</div>
                      <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, color: "var(--white)" }}>{b.yourBid}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>Current</div>
                      <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, color: "var(--gold)" }}>{b.currentBid}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 2, background: b.status === "winning" ? "rgba(50,200,100,0.12)" : "rgba(231,76,60,0.12)", color: b.status === "winning" ? "#50c878" : "#e74c3c", marginBottom: 8 }}>{b.status === "winning" ? "● Winning" : "Outbid"}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>{b.ends}</div>
                    </div>
                    <Link href={`/birds/${b.id}`} style={{ padding: "10px 16px", border: "0.5px solid var(--border-gold)", color: "var(--gold)", fontSize: 11, textDecoration: "none", borderRadius: 1, whiteSpace: "nowrap" }}>
                      {b.status === "outbid" ? "Raise Bid" : "View"}
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            {/* MY LISTINGS */}
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 300, color: "var(--white)" }}>My Listings</div>
                <Link href="/signup" className="btn-gold" style={{ fontSize: 11, padding: "8px 18px" }}>+ List New Bird</Link>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                            <Image src={b.img} alt={b.name} fill style={{ objectFit: "contain" }} />
                          </div>
                          <span style={{ fontSize: 13, color: "var(--white)" }}>{b.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 12px", fontSize: 12, color: "var(--gold)" }}>{b.ring}</td>
                      <td style={{ padding: "16px 12px", fontSize: 13, color: "var(--muted)" }}>{b.bids}</td>
                      <td style={{ padding: "16px 12px", fontFamily: "var(--ff-display)", fontSize: 18, color: "var(--white)" }}>{b.currentBid}</td>
                      <td style={{ padding: "16px 12px" }}>
                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 2, background: b.status === "live" ? "rgba(255,50,50,0.12)" : "rgba(255,255,255,0.06)", color: b.status === "live" ? "#ff6666" : "var(--muted)" }}>
                          {b.status === "live" ? "● Live" : "Available"}
                        </span>
                      </td>
                      <td style={{ padding: "16px 12px" }}>
                        <Link href={`/birds/${b.id}`} style={{ fontSize: 11, color: "var(--gold)", textDecoration: "none" }}>Manage →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* RECENT SALES */}
            <section>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 300, color: "var(--white)", marginBottom: 20 }}>Recent Sales</div>
              <div style={{ border: "0.5px solid var(--border)" }}>
                {recentSales.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: i < recentSales.length - 1 ? "0.5px solid var(--border)" : "none" }}>
                    <div>
                      <div style={{ fontSize: 14, color: "var(--white)", marginBottom: 3 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>Buyer: {s.buyer} · {s.date}</div>
                    </div>
                    <div style={{ fontFamily: "var(--ff-display)", fontSize: 22, color: "var(--gold)" }}>{s.amount}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* SIDEBAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{ background: "var(--void)", border: "0.5px solid var(--border-gold)", padding: 24, borderRadius: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 16 }}>◆ Elite Loft</div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: 20, fontWeight: 300, color: "var(--white)", marginBottom: 8 }}>Your Plan</div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>Unlimited listings, verified pedigree, featured placement, AI matchmaking, and priority auction placement.</p>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>Renews</div>
              <div style={{ fontSize: 14, color: "var(--white)", marginBottom: 16 }}>June 1, 2025</div>
              <a href="mailto:strangemotelmusic@gmail.com" style={{ display: "block", textAlign: "center", padding: 10, border: "0.5px solid var(--border)", color: "var(--muted)", fontSize: 11, textDecoration: "none", borderRadius: 1, letterSpacing: "0.08em", textTransform: "uppercase" }}>Manage Subscription</a>
            </div>

            <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", padding: 24, borderRadius: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>Quick Actions</div>
              {[
                { label: "Register a Bird", href: "/signup" },
                { label: "Add to Pedigree Vault", href: "/pedigree" },
                { label: "View Leaderboards", href: "/leaderboards" },
                { label: "Contact Support", href: "mailto:strangemotelmusic@gmail.com" },
              ].map(({ label, href }) => (
                <Link key={label} href={href} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "0.5px solid var(--border)", fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>
                  {label} <span style={{ color: "var(--gold)" }}>→</span>
                </Link>
              ))}
            </div>

            <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", padding: 24, borderRadius: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>Notifications</div>
              {[
                { text: "You have the leading bid on Blue Bar Champion Cock", time: "4m ago", type: "win" },
                { text: "You were outbid on White Badge Roller Hen", time: "12m ago", type: "loss" },
                { text: "Anderson's Thunder pedigree was verified", time: "2h ago", type: "info" },
              ].map((n, i) => (
                <div key={i} style={{ padding: "12px 0", borderBottom: i < 2 ? "0.5px solid var(--border)" : "none" }}>
                  <div style={{ fontSize: 12, color: n.type === "win" ? "#50c878" : n.type === "loss" ? "#e74c3c" : "var(--white)", marginBottom: 4, lineHeight: 1.5 }}>{n.text}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>{n.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
