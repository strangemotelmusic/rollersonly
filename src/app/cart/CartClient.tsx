"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/dots-birds";
import { createDotsBirdCheckout } from "@/app/actions/dots-birds-checkout";

export default function CartClient() {
  const { items, removeItem, removeItems } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce((sum, item) => sum + item.priceCents, 0);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    const result = await createDotsBirdCheckout(items.map((i) => i.id));
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      if (result.unavailableIds) removeItems(result.unavailableIds);
    }
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
        <p style={{ marginBottom: 20 }}>Your cart is empty.</p>
        <Link href="/dots-birds" className="btn-gold" style={{ padding: "12px 28px" }}>
          Browse D.O.T.S Birds →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        {items.map((item) => (
          <div key={item.id} style={{ display: "flex", gap: 16, alignItems: "center", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 16 }}>
            <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0, background: "var(--void)", borderRadius: 2, overflow: "hidden" }}>
              {item.photoUrl && <Image src={item.photoUrl} alt={item.name} fill style={{ objectFit: "cover" }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: "var(--white)" }}>{item.name}</div>
              {item.bandNumber && <div style={{ fontSize: 12, color: "var(--muted)" }}>Band #{item.bandNumber}</div>}
            </div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, color: "var(--gold)" }}>{formatPrice(item.priceCents)}</div>
            <button
              onClick={() => removeItem(item.id)}
              style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "0.5px solid var(--border)", paddingTop: 20, marginBottom: 24 }}>
        <span style={{ fontSize: 14, color: "var(--muted)" }}>Total</span>
        <span style={{ fontFamily: "var(--ff-display)", fontSize: 28, color: "var(--white)" }}>{formatPrice(total)}</span>
      </div>

      {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginBottom: 16 }}>{error}</p>}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="btn-gold"
        style={{ width: "100%", padding: 16, fontSize: 13, opacity: loading ? 0.6 : 1, cursor: loading ? "default" : "pointer" }}
      >
        {loading ? "Redirecting to checkout…" : "Buy Now"}
      </button>
    </>
  );
}
