"use client";

import Link from "next/link";
import { useChat } from "@/lib/chat-context";

export default function ChatIcon() {
  const { unreadTotal } = useChat();

  return (
    <Link href="/chat" style={{ position: "relative", display: "flex", alignItems: "center", textDecoration: "none", color: "var(--white)", fontSize: 13 }}>
      Chat
      {unreadTotal > 0 && (
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
          {unreadTotal > 99 ? "99+" : unreadTotal}
        </span>
      )}
    </Link>
  );
}
