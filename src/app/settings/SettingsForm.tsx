"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const inputStyle = { width: "100%", background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "12px 16px", fontSize: 14, borderRadius: 2, outline: "none", fontFamily: "var(--ff-body)" };
const labelStyle = { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--muted)", display: "block", marginBottom: 8 };

export default function SettingsForm({
  userId,
  initial,
}: {
  userId: string;
  initial: { username: string; fullName: string; bio: string; location: string; avatarUrl: string | null; phone: string };
}) {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState(initial.username);
  const [fullName, setFullName] = useState(initial.fullName);
  const [bio, setBio] = useState(initial.bio);
  const [location, setLocation] = useState(initial.location);
  const [phone, setPhone] = useState(initial.phone);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickAvatar(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setPendingFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setError("");
    setSaved(false);
    if (!username.trim()) { setError("Username is required."); return; }
    setSaving(true);

    let newAvatarUrl = avatarUrl;
    if (pendingFile) {
      const path = `${userId}/${crypto.randomUUID()}-${pendingFile.name}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, pendingFile);
      if (uploadErr) { setSaving(false); setError(`Avatar upload failed: ${uploadErr.message}`); return; }
      newAvatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        username,
        full_name: fullName || null,
        bio: bio || null,
        location: location || null,
        avatar_url: newAvatarUrl,
      })
      .eq("id", userId);

    if (updateErr) { setSaving(false); setError(updateErr.message); return; }

    // Phone lives in its own table (profile_phones), not profiles — profiles
    // has a public read policy, this doesn't, so it's only ever visible to
    // other signed-in members, never the public internet.
    const trimmedPhone = phone.trim();
    const { error: phoneErr } = trimmedPhone
      ? await supabase.from("profile_phones").upsert({ user_id: userId, phone: trimmedPhone, updated_at: new Date().toISOString() })
      : await supabase.from("profile_phones").delete().eq("user_id", userId);

    setSaving(false);
    if (phoneErr) { setError(phoneErr.message); return; }

    setAvatarUrl(newAvatarUrl);
    setPendingFile(null);
    setSaved(true);
    router.refresh();
  }

  const displayAvatar = avatarPreview || avatarUrl;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label style={labelStyle}>Avatar</label>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "var(--surface2)", border: "1px solid var(--border-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--ff-display)", fontSize: 28, color: "var(--gold)" }}>
            {displayAvatar ? (
              <Image src={displayAvatar} alt="Avatar" fill style={{ objectFit: "cover" }} />
            ) : (
              (fullName || username || "?").charAt(0).toUpperCase()
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => { pickAvatar(e.target.files); e.target.value = ""; }}
            style={{ display: "none" }}
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-ghost" style={{ fontSize: 11 }}>
            Change Photo
          </button>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Full name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Location</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="DeSoto, Texas, USA" style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Phone number (optional)</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="(555) 123-4567" style={inputStyle} />
        <p style={{ fontSize: 11, color: "var(--subtle)", marginTop: 6 }}>
          Shared with other signed-in members on the Members directory. Leave blank to keep it private. Never shown to
          signed-out visitors.
        </p>
      </div>

      <div>
        <label style={labelStyle}>Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell the community about your loft and bloodlines…" style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} />
      </div>

      {error && <div style={{ color: "#E74C3C", fontSize: 13, padding: "10px 14px", background: "rgba(231,76,60,0.08)", borderRadius: 2, border: "0.5px solid rgba(231,76,60,0.3)" }}>{error}</div>}
      {saved && <div style={{ color: "#2ECC71", fontSize: 13 }}>Saved.</div>}

      <button className="btn-gold-lg" onClick={handleSave} disabled={saving} style={{ width: "100%", textAlign: "center" }}>
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
