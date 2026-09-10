"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/dots-birds";

type Bird = {
  id: string;
  name: string;
  band_number: string | null;
  age: string | null;
  price_cents: number;
  description: string | null;
  photo_url: string | null;
  is_available: boolean;
  bloodline: string | null;
};

const BLOODLINE_INFO: Record<string, string> = {
  Hannes: "The Hannes line — South African depth and quality, direct from Hannes Rossouw's foundation stock.",
  Poen: "The Poen line — a cornerstone of the Tyson family's South African breeding program.",
  McKinney: "The McKinney line — Kevin McKinney's bloodline, carried forward through the Tyson family.",
};

export default function TysonsCornerClient({ birds }: { birds: Bird[] }) {
  const { addItem, has } = useCart();

  if (birds.length === 0) {
    return (
      <div style={{ margin: 40, padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
        No birds listed for sale right now — check back soon.
      </div>
    );
  }

  const groups = ["Hannes", "Poen", "McKinney"]
    .map((bloodline) => ({ bloodline, birds: birds.filter((b) => b.bloodline === bloodline) }))
    .filter((g) => g.birds.length > 0);

  return (
    <div style={{ padding: "0 40px 64px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto 48px", padding: "20px 24px", background: "var(--surface)", border: "0.5px solid var(--border-gold)", borderRadius: 2, textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>
          Every order ships live in a shipping box — the bird price is charged now, and the box + shipping cost is
          arranged separately after your order. Questions before you order?{" "}
          <a href="mailto:strangemotelmusic@gmail.com" style={{ color: "var(--gold)" }}>Contact us</a>.
        </p>
      </div>

      {groups.map((group) => (
        <div key={group.bloodline} style={{ marginBottom: 56 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 300, color: "var(--white)" }}>
              {group.bloodline} Bloodline
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, maxWidth: 600 }}>{BLOODLINE_INFO[group.bloodline]}</p>
          </div>

          <div className="browse-grid">
            {group.birds.map((bird) => {
              const inCart = has(bird.id);
              return (
                <div key={bird.id} className="auction-card">
                  <div className="auction-img-wrap">
                    {!bird.is_available && (
                      <div className="auction-badge" style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>Sold</div>
                    )}
                    {bird.photo_url && (
                      <Image src={bird.photo_url} alt={bird.name} fill style={{ objectFit: "contain", objectPosition: "center bottom", opacity: bird.is_available ? 1 : 0.4 }} />
                    )}
                  </div>
                  <div className="auction-body">
                    <div className="auction-name">{bird.name}</div>
                    <div className="auction-breeder">
                      {[bird.band_number && `Band #${bird.band_number}`, bird.age].filter(Boolean).join(" · ")}
                    </div>
                    {bird.description && (
                      <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, margin: "10px 0 0" }}>{bird.description}</p>
                    )}
                    <div className="auction-meta" style={{ marginTop: 14 }}>
                      <div>
                        <div className="auction-bid-label">Price</div>
                        <div className="auction-bid">{formatPrice(bird.price_cents)}</div>
                      </div>
                    </div>

                    {!bird.is_available ? (
                      <div style={{ marginTop: 16, width: "100%", padding: 10, textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
                        Sold
                      </div>
                    ) : inCart ? (
                      <Link
                        href="/cart"
                        style={{ display: "block", marginTop: 16, width: "100%", padding: 10, background: "var(--gold)", border: "0.5px solid var(--gold)", color: "var(--black)", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", borderRadius: 1, textDecoration: "none" }}
                      >
                        In Cart — View Cart
                      </Link>
                    ) : (
                      <button
                        onClick={() =>
                          addItem({ id: bird.id, name: bird.name, bandNumber: bird.band_number, priceCents: bird.price_cents, photoUrl: bird.photo_url })
                        }
                        style={{ marginTop: 16, width: "100%", padding: 10, background: "transparent", border: "0.5px solid var(--border-gold)", color: "var(--gold)", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", borderRadius: 1 }}
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
