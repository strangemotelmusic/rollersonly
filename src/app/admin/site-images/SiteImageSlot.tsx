"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { replaceSiteImage } from "@/app/actions/site-images";
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.set("file", file);
    const result = await replaceSiteImage(slotKey, formData);

    if (result.error) {
      setStatus("error");
      setError(result.error);
      return;
    }

    setCurrentUrl(result.url!);
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: 2, padding: 20, display: "flex", gap: 20, alignItems: "center" }}>
      <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0, background: "var(--void)", borderRadius: 2, overflow: "hidden" }}>
        <Image src={currentUrl} alt={label} fill style={{ objectFit: "cover" }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: "var(--white)", marginBottom: 8 }}>{label}</div>
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
