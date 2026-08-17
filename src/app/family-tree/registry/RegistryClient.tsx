"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import PedigreeTree from "@/components/pedigree/PedigreeTree";
import FamilyTreeSireDamPicker, { type BirdOption } from "@/components/pedigree/FamilyTreeSireDamPicker";
import BirdPhotoEditor from "@/components/family-tree/BirdPhotoEditor";
import { registerFamilyTreeBird, updateFamilyTreeBird } from "@/lib/family-tree/birds";
import { buildPedigreeSelectQuery, birdLabel, type PedigreeNode } from "@/lib/pedigree/tree";
import { renderPedigreePdf } from "@/lib/pedigree/pdf";
import { emailPedigreePdf, sendPedigreeToSubscriber } from "@/app/actions/pedigree";
import { searchProfiles } from "@/app/actions/chat";
import { cropFor, cropImageStyle, type PhotoSettingsMap } from "@/lib/our-breeders/crop";

export type FamilyTreeBird = {
  id: string;
  name: string | null;
  ring_number: string | null;
  sex: string | null;
  color: string | null;
  birth_year: number | null;
  primary_photo_url: string | null;
  photo_settings: PhotoSettingsMap;
  sire_id: string | null;
  dam_id: string | null;
};

const FEATURED_GENERATIONS = 4;

const inputStyle: React.CSSProperties = { width: "100%", background: "#0A0D12", border: "1px solid #1C232E", color: "#E8EDF3", padding: "10px 12px", fontSize: 13, borderRadius: 4, outline: "none" };
const labelStyle: React.CSSProperties = { fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5B6675", display: "block", marginBottom: 6 };
const card: React.CSSProperties = { background: "#0D1117", border: "1px solid #1C232E", borderRadius: 6, padding: 20 };
const btnPrimary: React.CSSProperties = { background: "#2DD4BF", color: "#0A0D12", border: "none", padding: "10px 20px", fontSize: 13, fontWeight: 700, borderRadius: 4, cursor: "pointer" };
const btnGhost: React.CSSProperties = { background: "transparent", color: "#C7D0DB", border: "1px solid #1C232E", padding: "9px 18px", fontSize: 13, borderRadius: 4, cursor: "pointer" };

export default function RegistryClient({ ownerId, initialMyBirds }: { ownerId: string; initialMyBirds: FamilyTreeBird[] }) {
  const supabase = createClient();
  const [myBirds, setMyBirds] = useState(initialMyBirds);
  const [showRegister, setShowRegister] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string | null; ring_number: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected] = useState<{ root: PedigreeNode } | null>(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [editingBirdId, setEditingBirdId] = useState<string | null>(null);
  const [photoEditorBird, setPhotoEditorBird] = useState<FamilyTreeBird | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("family_tree_birds")
        .select("id, name, ring_number")
        .or(`name.ilike.%${query}%,ring_number.ilike.%${query}%`)
        .limit(8);
      setResults(data ?? []);
      setSearching(false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function selectBird(birdId: string) {
    setLoadingTree(true);
    setQuery("");
    setResults([]);
    const select = buildPedigreeSelectQuery(FEATURED_GENERATIONS);
    const { data } = await supabase.from("family_tree_birds").select(select).eq("id", birdId).single();
    setLoadingTree(false);
    if (data) setSelected({ root: data as unknown as PedigreeNode });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {/* SEARCH */}
      <div style={{ position: "relative", maxWidth: 480 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the registry by name or ring number…"
          style={inputStyle}
        />
        {(searching || results.length > 0) && query.trim() && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6, background: "#0D1117", border: "1px solid #1C232E", borderRadius: 4, zIndex: 20, maxHeight: 240, overflowY: "auto" }}>
            {searching && <div style={{ padding: 12, fontSize: 12, color: "#5B6675" }}>Searching…</div>}
            {!searching && results.length === 0 && <div style={{ padding: 12, fontSize: 12, color: "#5B6675" }}>No birds found.</div>}
            {results.map((b) => (
              <button key={b.id} onClick={() => selectBird(b.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", color: "#E8EDF3", fontSize: 13, cursor: "pointer" }}>
                {b.name || "Unnamed bird"} {b.ring_number && <span style={{ color: "#2DD4BF" }}>· {b.ring_number}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TREE VIEWER */}
      {(loadingTree || selected) && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#E8EDF3", marginBottom: 16 }}>Pedigree Tree</h2>
          {loadingTree ? <p style={{ fontSize: 13, color: "#5B6675" }}>Loading…</p> : selected && <TreeAndShare root={selected.root} />}
        </div>
      )}

      {/* MY BIRDS */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#E8EDF3" }}>My Birds ({myBirds.length})</h2>
          <button style={btnPrimary} onClick={() => setShowRegister((s) => !s)}>{showRegister ? "Cancel" : "+ Register a Bird"}</button>
        </div>

        {showRegister && (
          <div style={{ ...card, marginBottom: 20, border: "1px solid #2DD4BF" }}>
            <RegisterForm
              ownerId={ownerId}
              onRegistered={(b) => {
                setMyBirds((prev) => [b, ...prev]);
                setShowRegister(false);
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {myBirds.length === 0 && !showRegister && <p style={{ fontSize: 13, color: "#5B6675" }}>No birds registered yet.</p>}
          {myBirds.map((b) => (
            <BirdRow
              key={b.id}
              bird={b}
              isEditing={editingBirdId === b.id}
              onToggleEdit={() => setEditingBirdId(editingBirdId === b.id ? null : b.id)}
              onOpenPhotoEditor={() => setPhotoEditorBird(b)}
              onSaved={(updated) => setMyBirds((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
              onViewTree={() => selectBird(b.id)}
            />
          ))}
        </div>
      </div>

      {photoEditorBird && photoEditorBird.primary_photo_url && (
        <BirdPhotoEditor
          birdId={photoEditorBird.id}
          url={photoEditorBird.primary_photo_url}
          initialCrop={cropFor(photoEditorBird.photo_settings, photoEditorBird.primary_photo_url)}
          onClose={() => setPhotoEditorBird(null)}
          onSaved={(settings) => {
            setMyBirds((prev) =>
              prev.map((x) =>
                x.id === photoEditorBird.id
                  ? { ...x, photo_settings: { ...x.photo_settings, [photoEditorBird.primary_photo_url!]: settings } }
                  : x
              )
            );
          }}
        />
      )}
    </div>
  );
}

function RegisterForm({ ownerId, onRegistered }: { ownerId: string; onRegistered: (bird: FamilyTreeBird) => void }) {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [ringNumber, setRingNumber] = useState("");
  const [sex, setSex] = useState("cock");
  const [color, setColor] = useState("");
  const [birthYear, setBirthYear] = useState(new Date().getFullYear());
  const [sire, setSire] = useState<BirdOption | null>(null);
  const [dam, setDam] = useState<BirdOption | null>(null);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Bird name is required.");
      return;
    }
    setSaving(true);
    setError("");
    const result = await registerFamilyTreeBird(supabase, {
      ownerId,
      name,
      ringNumber: ringNumber || null,
      sex,
      color: color || null,
      birthYear,
      sireId: sire?.id ?? null,
      damId: dam?.id ?? null,
      notes: notes || null,
      photos,
    });
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onRegistered({
      id: result.birdId,
      name,
      ring_number: ringNumber || null,
      sex,
      color: color || null,
      birth_year: birthYear,
      primary_photo_url: null,
      photo_settings: {},
      sire_id: sire?.id ?? null,
      dam_id: dam?.id ?? null,
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Ring Number</label>
          <input value={ringNumber} onChange={(e) => setRingNumber(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Sex</label>
          <select value={sex} onChange={(e) => setSex(e.target.value)} style={inputStyle}>
            <option value="cock">Cock</option>
            <option value="hen">Hen</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Color</label>
          <input value={color} onChange={(e) => setColor(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Birth Year</label>
          <input type="number" value={birthYear} onChange={(e) => setBirthYear(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>

      <FamilyTreeSireDamPicker sire={sire} dam={dam} onChangeSire={setSire} onChangeDam={setDam} />

      <div>
        <label style={labelStyle}>Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      <div>
        <label style={labelStyle}>Photo</label>
        <input type="file" accept="image/*" multiple onChange={(e) => setPhotos(Array.from(e.target.files ?? []))} style={{ fontSize: 12, color: "#5B6675" }} />
      </div>

      {error && <p style={{ fontSize: 12, color: "#e8a3a3" }}>{error}</p>}

      <button style={btnPrimary} onClick={handleSubmit} disabled={saving}>
        {saving ? "Registering…" : "Register Bird"}
      </button>
    </div>
  );
}

function BirdRow({
  bird,
  isEditing,
  onToggleEdit,
  onOpenPhotoEditor,
  onSaved,
  onViewTree,
}: {
  bird: FamilyTreeBird;
  isEditing: boolean;
  onToggleEdit: () => void;
  onOpenPhotoEditor: () => void;
  onSaved: (bird: FamilyTreeBird) => void;
  onViewTree: () => void;
}) {
  const supabase = createClient();
  const [sire, setSire] = useState<BirdOption | null>(bird.sire_id ? { id: bird.sire_id, name: null, ring_number: null, sex: null } : null);
  const [dam, setDam] = useState<BirdOption | null>(bird.dam_id ? { id: bird.dam_id, name: null, ring_number: null, sex: null } : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    const result = await updateFamilyTreeBird(supabase, bird.id, {
      name: bird.name || "",
      ringNumber: bird.ring_number,
      sex: bird.sex,
      color: bird.color,
      birthYear: bird.birth_year,
      sireId: sire?.id ?? null,
      damId: dam?.id ?? null,
      notes: null,
    });
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSaved({ ...bird, sire_id: sire?.id ?? null, dam_id: dam?.id ?? null });
    onToggleEdit();
  }

  return (
    <div style={card}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <button
          type="button"
          onClick={bird.primary_photo_url ? onOpenPhotoEditor : undefined}
          disabled={!bird.primary_photo_url}
          style={{ position: "relative", width: 56, height: 56, borderRadius: 4, overflow: "hidden", flexShrink: 0, background: "#0A0D12", border: "1px solid #1C232E", padding: 0, cursor: bird.primary_photo_url ? "pointer" : "default" }}
        >
          {bird.primary_photo_url && <Image src={bird.primary_photo_url} alt="" fill style={cropImageStyle(cropFor(bird.photo_settings, bird.primary_photo_url))} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: "#E8EDF3" }}>{bird.name || "Unnamed bird"} {bird.ring_number && <span style={{ fontSize: 11, color: "#2DD4BF" }}>{bird.ring_number}</span>}</div>
          <div style={{ fontSize: 12, color: "#5B6675", marginTop: 2 }}>Sire: {bird.sire_id ? "recorded" : "unrecorded"} · Dam: {bird.dam_id ? "recorded" : "unrecorded"}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button style={btnGhost} onClick={onViewTree}>View Tree</button>
          <button style={btnGhost} onClick={onToggleEdit}>{isEditing ? "Close" : "Edit Bloodline"}</button>
        </div>
      </div>

      {isEditing && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #1C232E" }}>
          <FamilyTreeSireDamPicker sire={sire} dam={dam} onChangeSire={setSire} onChangeDam={setDam} excludeBirdId={bird.id} />
          {error && <p style={{ fontSize: 12, color: "#e8a3a3", marginTop: 10 }}>{error}</p>}
          <button style={{ ...btnPrimary, marginTop: 12 }} onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Bloodline"}
          </button>
        </div>
      )}
    </div>
  );
}

function TreeAndShare({ root }: { root: PedigreeNode }) {
  const supabase = createClient();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [panel, setPanel] = useState<"none" | "email" | "subscriber">("none");
  const [status, setStatus] = useState<string | null>(null);

  function handleDownload() {
    const blob = renderPedigreePdf(root, null);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${birdLabel(root).replace(/[^a-z0-9]+/gi, "-")}-pedigree.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function ensureShareUrl(): Promise<string | null> {
    if (shareUrl) return shareUrl;
    setUploading(true);
    setStatus(null);
    try {
      const blob = renderPedigreePdf(root, null);
      const path = `${root.id}/${crypto.randomUUID()}.pdf`;
      const { error: uploadErr } = await supabase.storage.from("pedigree-exports").upload(path, blob, { contentType: "application/pdf" });
      if (uploadErr) {
        setStatus(`Could not prepare share link: ${uploadErr.message}`);
        return null;
      }
      const url = supabase.storage.from("pedigree-exports").getPublicUrl(path).data.publicUrl;
      setShareUrl(url);
      return url;
    } finally {
      setUploading(false);
    }
  }

  async function openSharePanel(target: "email" | "subscriber") {
    setStatus(null);
    const url = await ensureShareUrl();
    if (!url) return;
    setPanel(target);
  }

  return (
    <div>
      <PedigreeTree root={root} />
      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button style={btnGhost} onClick={handleDownload}>Download PDF</button>
        <button style={btnGhost} onClick={() => openSharePanel("email")} disabled={uploading}>
          {uploading && panel !== "subscriber" ? "Preparing…" : "Email Pedigree"}
        </button>
        <button style={btnGhost} onClick={() => openSharePanel("subscriber")} disabled={uploading}>
          {uploading && panel === "subscriber" ? "Preparing…" : "Send to a Subscriber"}
        </button>
      </div>

      {status && <p style={{ fontSize: 12, color: "#5B6675", marginTop: 10 }}>{status}</p>}

      {panel === "email" && shareUrl && <EmailPanel birdName={birdLabel(root)} shareUrl={shareUrl} onClose={() => setPanel("none")} onStatus={setStatus} />}
      {panel === "subscriber" && shareUrl && <SubscriberPanel birdName={birdLabel(root)} shareUrl={shareUrl} onClose={() => setPanel("none")} onStatus={setStatus} />}
    </div>
  );
}

function EmailPanel({ birdName, shareUrl, onClose, onStatus }: { birdName: string; shareUrl: string; onClose: () => void; onStatus: (s: string | null) => void }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!email.trim()) return;
    setSending(true);
    onStatus(null);
    const result = await emailPedigreePdf(email.trim(), birdName, shareUrl);
    setSending(false);
    if ("error" in result) {
      const subject = encodeURIComponent(`Pedigree — ${birdName}`);
      const body = encodeURIComponent(`Here's the pedigree for ${birdName}:\n\n${shareUrl}`);
      window.location.href = `mailto:${email.trim()}?subject=${subject}&body=${body}`;
      onStatus("Direct send isn't set up yet — opening your email app with the pedigree link ready to send.");
    } else {
      onStatus(`Sent to ${email.trim()}.`);
    }
    onClose();
  }

  return (
    <div style={{ ...card, marginTop: 14, maxWidth: 420 }}>
      <label style={labelStyle}>Email this pedigree</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" style={inputStyle} />
        <button style={btnPrimary} onClick={send} disabled={sending || !email.trim()}>{sending ? "Sending…" : "Send"}</button>
      </div>
    </div>
  );
}

function SubscriberPanel({ birdName, shareUrl, onClose, onStatus }: { birdName: string; shareUrl: string; onClose: () => void; onStatus: (s: string | null) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; username: string | null; full_name: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  async function runSearch(q: string) {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const result = await searchProfiles(q);
    setSearching(false);
    if ("profiles" in result) setResults(result.profiles);
  }

  async function send(otherUserId: string) {
    setSendingTo(otherUserId);
    const result = await sendPedigreeToSubscriber(otherUserId, birdName, shareUrl);
    setSendingTo(null);
    onStatus("error" in result ? result.error : "Sent via chat.");
    onClose();
  }

  return (
    <div style={{ ...card, marginTop: 14, maxWidth: 420 }}>
      <label style={labelStyle}>Send to a subscriber</label>
      <input value={query} onChange={(e) => runSearch(e.target.value)} placeholder="Search by username…" style={{ ...inputStyle, marginBottom: 8 }} />
      {searching && <div style={{ fontSize: 12, color: "#5B6675" }}>Searching…</div>}
      {results.map((p) => (
        <button
          key={p.id}
          onClick={() => send(p.id)}
          disabled={sendingTo === p.id}
          style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 4px", background: "none", border: "none", borderBottom: "1px solid #1C232E", color: "#E8EDF3", fontSize: 13, cursor: "pointer" }}
        >
          {sendingTo === p.id ? "Sending…" : p.full_name || p.username || "Member"}
        </button>
      ))}
    </div>
  );
}
