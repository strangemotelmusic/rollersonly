"use client";

import { useState, useTransition } from "react";
import { createMagazineCheckout } from "@/app/actions/magazine-checkout";
import { MAGAZINE_EDITIONS, type MagazineEdition } from "@/lib/magazine-editions";
import styles from "./ReserveForm.module.css";

const EDITIONS = (Object.keys(MAGAZINE_EDITIONS) as MagazineEdition[]).map((id) => ({
  id,
  label: MAGAZINE_EDITIONS[id].label,
  price: MAGAZINE_EDITIONS[id].priceCents / 100,
}));

export default function BuyForm() {
  const [edition, setEdition] = useState<MagazineEdition>("standard");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const price = EDITIONS.find((e) => e.id === edition)!.price;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      // On success the action redirects to Stripe, so a return value means failure.
      const result = await createMagazineCheckout(edition, quantity);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <div className={styles.editions} role="radiogroup" aria-label="Edition">
        {EDITIONS.map((e) => (
          <button
            key={e.id}
            type="button"
            role="radio"
            aria-checked={edition === e.id}
            className={`${styles.edition} ${edition === e.id ? styles.editionOn : ""}`}
            onClick={() => setEdition(e.id)}
            disabled={pending}
          >
            <span className={styles.editionName}>{e.label}</span>
            <span className={styles.editionPrice}>${e.price}</span>
            <span className={styles.editionNote}>shipping included</span>
          </button>
        ))}
      </div>
      <form className={styles.formRow} onSubmit={handleSubmit}>
        <label className={styles.qty}>
          <span>Qty</span>
          <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} disabled={pending}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={pending}>
          {pending ? "Opening checkout…" : `Buy Now — $${price * quantity}`}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </>
  );
}
