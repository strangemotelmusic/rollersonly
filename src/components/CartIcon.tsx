"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export default function CartIcon() {
  const { items } = useCart();

  return (
    <Link href="/cart" style={{ position: "relative", display: "flex", alignItems: "center", textDecoration: "none", color: "var(--white)", fontSize: 13 }}>
      Cart
      {items.length > 0 && (
        <span
          style={{
            marginLeft: 6,
            minWidth: 18,
            height: 18,
            borderRadius: "50%",
            background: "var(--gold)",
            color: "var(--black)",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
          }}
        >
          {items.length}
        </span>
      )}
    </Link>
  );
}
