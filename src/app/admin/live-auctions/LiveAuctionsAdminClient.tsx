"use client";

import { useState } from "react";
import Image from "next/image";
import { createLiveAuctionCard, updateLiveAuctionCard, deleteLiveAuctionCard, reorderLiveAuctionCards } from "@/app/actions/live-auctions-admin";
import ReorderButtons from "@/components/admin/ReorderButtons";

type Card = {
  id: string;
  name: string;
  color: string | null;
  bloodline: string | null;
  loft_name: string;
  location: string | null;
  price_cents: number;
  bid_count: number;
  status: string;
  ends_at: string | null;
  schedule_label: string | null;
  tags: string[];
  image_url: string | null;
  featured_home: boolean;
  sort_order: number;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--void)",
  border: "0.5px solid var(--border)",
  color: "var(--white)",
  padding: "10px 12px",
  fontSize: 13,
  borderRadius: "var(--radius-sm)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: 6,
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

function hoursRemaining(endsAt: string | null) {
  if (!endsAt) return "";
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "";
  return (ms / 3600000).toFixed(1);
}

export default function LiveAuctionsAdminClient({ initialCards }: { initialCards: Card[] }) {
  const [cards, setCards] = useState(initialCards);
  const [showAddForm, setShowAddForm] = useState(false);
  const [reordering, setReordering] = useState(false);

  async function moveCard(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= cards.length) return;
    const next = cards.slice();
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setCards(next);
    setReordering(true);
    await reorderLiveAuctionCards(next.map((c) => c.id));
    setReordering(false);
  }

  return (
    <div>
      <button className="btn-gold" style={{ padding: "10px 22px", marginBottom: 24 }} onClick={() => setShowAddForm((s) => !s)}>
        {showAddForm ? "Cancel" : "+ Add New Auction Card"}
      </button>

      {showAddForm && (
        <CardForm
          onCancel={() => setShowAddForm(false)}
          onSubmit={async (formData) => {
            const result = await createLiveAuctionCard(formData);
            if ("error" in result) return result;
            window.location.reload();
            return result;
          }}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {cards.length === 0 && !showAddForm && <p style={{ fontSize: 14, color: "var(--muted)" }}>No auction cards yet.</p>}
        {cards.map((card, i) => (
          <CardRow
            key={card.id}
            card={card}
            onDelete={() => setCards((prev) => prev.filter((c) => c.id !== card.id))}
            canMoveUp={i > 0}
            canMoveDown={i < cards.length - 1}
            onMoveUp={() => moveCard(i, -1)}
            onMoveDown={() => moveCard(i, 1)}
            reordering={reordering}
          />
        ))}
      </div>
    </div>
  );
}

function CardRow({
  card,
  onDelete,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  reordering,
}: {
  card: Card;
  onDelete: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  reordering: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`Delete "${card.name}"? This can't be undone.`)) return;
    setPending(true);
    const result = await deleteLiveAuctionCard(card.id);
    setPending(false);
    if ("error" in result) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    onDelete();
  }

  if (editing) {
    return (
      <CardForm
        card={card}
        onCancel={() => setEditing(false)}
        onSubmit={async (formData) => {
          const result = await updateLiveAuctionCard(card.id, formData);
          if ("error" in result) return result;
          window.location.reload();
          return result;
        }}
      />
    );
  }

  return (
    <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 20, display: "flex", gap: 20, alignItems: "center" }}>
      <ReorderButtons canMoveUp={canMoveUp} canMoveDown={canMoveDown} onMoveUp={onMoveUp} onMoveDown={onMoveDown} disabled={reordering} />
      <div style={{ position: "relative", width: 90, height: 90, flexShrink: 0, background: "var(--void)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
        {card.image_url && <Image src={card.image_url} alt={card.name} fill style={{ objectFit: "cover" }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, color: "var(--white)", marginBottom: 4 }}>
          {card.name}{" "}
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: card.status === "live" ? "#e85050" : "var(--gold)" }}>
            {card.status === "live" ? "● Live" : "Upcoming"}
          </span>
          {card.featured_home && <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 8 }}>(on homepage)</span>}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
          {[card.color, card.bloodline, card.loft_name, card.location].filter(Boolean).join(" · ")}
        </div>
        <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, color: "var(--gold)" }}>
          {formatPrice(card.price_cents)} <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--ff-body)" }}>· {card.bid_count} bids</span>
        </div>
        {error && <p style={{ fontSize: 12, color: "#e8a3a3", marginTop: 6 }}>{error}</p>}
      </div>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button onClick={() => setEditing(true)} disabled={pending} className="btn-ghost" style={{ padding: "8px 16px", cursor: "pointer" }}>
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={pending}
          style={{ padding: "8px 16px", background: "transparent", border: "0.5px solid rgba(232,163,163,0.4)", color: "#e8a3a3", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 13 }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function CardForm({
  card,
  onCancel,
  onSubmit,
}: {
  card?: Card;
  onCancel: () => void;
  onSubmit: (formData: FormData) => Promise<{ error: string } | { ok: true }>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(card?.status ?? "live");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await onSubmit(formData);
    setPending(false);
    if ("error" in result) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "var(--surface)", border: "0.5px solid var(--border-gold)", borderRadius: "var(--radius-sm)", padding: 24, marginBottom: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Bird Name</label>
          <input name="name" defaultValue={card?.name} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Price / Current Bid (USD)</label>
          <input name="price" type="number" step="0.01" min="0" defaultValue={card ? card.price_cents / 100 : ""} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Color</label>
          <input name="color" placeholder="e.g. Blue Bar" defaultValue={card?.color ?? ""} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Bloodline</label>
          <input name="bloodline" placeholder="e.g. World Cup Line" defaultValue={card?.bloodline ?? ""} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Loft Name</label>
          <input name="loftName" defaultValue={card?.loft_name} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Location</label>
          <input name="location" placeholder="e.g. Montana, USA" defaultValue={card?.location ?? ""} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Bid Count</label>
          <input name="bidCount" type="number" step="1" min="0" defaultValue={card?.bid_count ?? 0} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
            <option value="live">Live</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>
        {status === "live" ? (
          <div>
            <label style={labelStyle}>Hours Until It Ends</label>
            <input name="endsInHours" type="number" step="0.1" min="0.1" placeholder="e.g. 2.5" defaultValue={hoursRemaining(card?.ends_at ?? null)} style={inputStyle} />
          </div>
        ) : (
          <div>
            <label style={labelStyle}>Schedule Text</label>
            <input name="scheduleLabel" placeholder="e.g. Tomorrow · 2:00 PM CT" defaultValue={card?.schedule_label ?? ""} style={inputStyle} />
          </div>
        )}
        <div>
          <label style={labelStyle}>Tags (comma-separated)</label>
          <input name="tags" placeholder="Verified Pedigree, DNA Cert" defaultValue={(card?.tags ?? []).join(", ")} style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <input id="featuredHome" name="featuredHome" type="checkbox" defaultChecked={card?.featured_home ?? true} />
        <label htmlFor="featuredHome" style={{ fontSize: 13, color: "var(--muted)" }}>Show on homepage Live Auctions section</label>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>{card ? "Replace Photo (optional)" : "Photo"}</label>
        <input name="file" type="file" accept="image/*" style={{ fontSize: 13, color: "var(--muted)" }} />
      </div>
      {error && <p style={{ fontSize: 13, color: "#e8a3a3", marginBottom: 16 }}>{error}</p>}
      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit" disabled={pending} className="btn-gold" style={{ padding: "10px 24px" }}>
          {pending ? "Saving…" : card ? "Save Changes" : "Add Card"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost" style={{ padding: "10px 24px", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}
