"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { replaceSiteImage, renameSiteImage } from "@/app/actions/site-images";
import type { SiteImageKey } from "@/lib/site-images";

export default function SiteImageSlot({
  slotKey,
  label,
  url,
}: {
  slotKey: SiteImageKey;
  label: string;
  url: string;
}) {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [currentLabel, setCurrentLabel] = useState(label);
  const [nameDraft, setNameDraft] = useState(label);
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "error">("idle");
  const [nameError, setNameError] = useState<string | null>(null);

  async function handleSaveName() {
    if (nameDraft.trim() === currentLabel.trim()) return;
    setNameStatus("saving");
    setNameError(null);

    const result = await renameSiteImage(slotKey, nameDraft);

    if ("error" in result) {
      setNameStatus("error");
      setNameError(result.error ?? "Something went wrong.");
      return;
    }

    setCurrentLabel(result.label!);
    setNameDraft(result.label!);
    setNameStatus("idle");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await replaceSiteImage(slotKey, formData);

    if ("error" in result) {
      setStatus("error");
      setError(result.error);
      return;
    }

    setCurrentUrl(result.url);
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20, display: "flex", gap: 20, alignItems: "center" }}>
      <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0, background: "var(--void)", borderRadius: 2, overflow: "hidden" }}>
        <Image src={currentUrl} alt={currentLabel} fill style={{ objectFit: "cover" }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            style={{ flex: 1, background: "var(--deep)", border: "0.5px solid var(--border)", color: "var(--white)", padding: "8px 12px", fontSize: 13, borderRadius: 2, outline: "none" }}
          />
          <button
            type="button"
            onClick={handleSaveName}
            disabled={nameStatus === "saving" || nameDraft.trim() === currentLabel.trim()}
            className="btn-ghost"
            style={{ fontSize: 11, padding: "8px 14px", whiteSpace: "nowrap", opacity: nameStatus === "saving" || nameDraft.trim() === currentLabel.trim() ? 0.5 : 1 }}
          >
            {nameStatus === "saving" ? "Saving…" : "Save Name"}
          </button>
        </div>
        {nameStatus === "error" && <p style={{ fontSize: 12, color: "#e8a3a3", marginTop: -6, marginBottom: 12 }}>{nameError}</p>}
        <label
          className="btn-ghost"
          style={{ display: "inline-block", padding: "8px 18px", cursor: status === "uploading" ? "default" : "pointer", opacity: status === "uploading" ? 0.6 : 1 }}
        >
          {status === "uploading" ? "Uploading…" : "Replace Image"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={status === "uploading"}
            style={{ display: "none" }}
          />
        </label>
        {status === "error" && <p style={{ fontSize: 12, color: "#e8a3a3", marginTop: 8 }}>{error}</p>}
      </div>
    </div>
  );
}
