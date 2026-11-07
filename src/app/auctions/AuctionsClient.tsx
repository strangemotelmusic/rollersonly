"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import Countdown from "@/components/Countdown";
import PreviewIcon from "@/components/PreviewIcon";
import styles from "@/styles/PreviewTheme.module.css";

type Lot = {
  id: string;
  name: string;
  loft: string;
  location: string;
  bloodline: string;
  isLive: boolean;
  bid: string;
  bidLabel: string;
  bids: number;
  seconds: number;
  scheduleLabel: string;
  imgUrl: string;
  tags: string[];
};

type Sort = "ending" | "newest" | "low" | "high";

function bidValue(lot: Lot) {
  return Number(lot.bid.replace(/[^0-9.]/g, "")) || 0;
}

export default function AuctionsClient({ lots, locations, bloodlines }: { lots: Lot[]; locations: string[]; bloodlines: string[] }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("all");
  const [family, setFamily] = useState("all");
  const [sort, setSort] = useState<Sort>("ending");

  const filtered = useMemo(() => {
    let result = lots.filter((lot) => {
      if (region !== "all" && lot.location !== region) return false;
      if (family !== "all" && lot.bloodline !== family) return false;
      if (q.trim()) {
        const hay = `${lot.name} ${lot.loft} ${lot.bloodline}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
    result = [...result].sort((a, b) => {
      if (sort === "low") return bidValue(a) - bidValue(b);
      if (sort === "high") return bidValue(b) - bidValue(a);
      if (sort === "ending") return (a.isLive ? a.seconds : Infinity) - (b.isLive ? b.seconds : Infinity);
      return 0;
    });
    return result;
  }, [lots, q, region, family, sort]);

  return (
    <>
      <div className={`${styles["page-heading"]} ${styles.container}`}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <PreviewIcon name="down" className={styles.icon} />
          <span>Auctions</span>
        </div>
        <div className={styles["page-heading-row"]}>
          <div>
            <div className={styles.eyebrow}>The auction room</div>
            <h1>Good birds. Better connections.</h1>
            <p>A clearer view of every lot, every pedigree, and every next step — verified pedigrees, escrow-protected.</p>
          </div>
          <Link href="/list-bird" className={`${styles.btn} ${styles["btn-primary"]}`}>
            <PreviewIcon name="arrowUp" className={styles.icon} /> Sell a bird
          </Link>
        </div>
      </div>

      <section className={`${styles.container} ${styles["page-section"]}`}>
        <div className={styles.filters}>
          <div className={styles["input-wrap"]}>
            <PreviewIcon name="arrow" className={styles.icon} />
            <input
              type="search"
              placeholder="Bird, loft or bloodline..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div>
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="all">All locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <div className={styles["family-filter"]}>
            <select value={family} onChange={(e) => setFamily(e.target.value)}>
              <option value="all">All bloodlines</option>
              {bloodlines.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles["filter-meta"]}>
          <span className={styles.subtle}>
            {filtered.length} lot{filtered.length === 1 ? "" : "s"}
          </span>
          <div className={styles["sort-select"]}>
            <label htmlFor="sort-filter">Sort by</label>
            <select id="sort-filter" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="ending">Ending soon</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </div>
        </div>

        <div className={styles["auction-grid"]}>
          {filtered.map((lot) => (
            <article key={lot.id} className={styles["auction-card"]}>
              <div className={styles["card-picture"]}>
                <Link href={`/birds/${lot.id}`} aria-label={`View ${lot.name}`}>
                  <Image src={lot.imgUrl} alt={lot.name} width={600} height={480} />
                </Link>
                <div className={styles["card-tags"]}>
                  <span className={styles.pill}>{lot.isLive ? "● LIVE" : "UPCOMING"}</span>
                </div>
              </div>
              <div className={styles["card-body"]}>
                <div className={styles["lot-number"]}>{[lot.loft, lot.location].filter(Boolean).join(" · ").toUpperCase()}</div>
                <h3>
                  <Link href={`/birds/${lot.id}`}>{lot.name}</Link>
                </h3>
                <div className={styles["card-meta"]}>{[lot.bloodline, ...lot.tags].filter(Boolean).join(" · ")}</div>
                <div className={styles["bid-row"]}>
                  <div>
                    <label>{lot.bidLabel}</label>
                    <strong>
                      {lot.bid}
                      <small>USD</small>
                    </strong>
                  </div>
                  <div className={styles["time-box"]}>
                    <label>{lot.isLive ? "Ends in" : "Starts"}</label>
                    {lot.isLive ? <Countdown seconds={lot.seconds} /> : <span>{lot.scheduleLabel}</span>}
                  </div>
                </div>
                <div className={styles["card-foot"]}>
                  <Link href={`/birds/${lot.id}`}>
                    View bird <PreviewIcon name="arrowUp" className={styles.icon} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: 14, padding: "40px 0" }}>No lots match these filters right now.</p>
        )}

        <div className={styles["note-card"]}>
          <h3>See the bird. Know the background.</h3>
          <p>
            Open a lot to explore its pedigree, seller profile, and shipping information. Every listing is
            escrow-protected from bid to delivery.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
