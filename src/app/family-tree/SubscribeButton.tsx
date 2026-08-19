function paymentLinkUrl(userId: string): string {
  const base = process.env.NEXT_PUBLIC_FAMILY_TREE_PAYMENT_LINK_URL;
  if (!base) return "/dashboard";
  return `${base}?client_reference_id=${encodeURIComponent(userId)}`;
}

export default function SubscribeButton({ userId, full }: { userId: string; full?: boolean }) {
  const href = paymentLinkUrl(userId);

  if (full) {
    return (
      <a
        href={href}
        style={{ display: "block", textAlign: "center", padding: 12, background: "#2DD4BF", color: "#0A0D12", fontSize: 13, fontWeight: 700, borderRadius: 4, textDecoration: "none" }}
      >
        Subscribe — $40/yr
      </a>
    );
  }

  return (
    <a href={href} style={{ background: "#2DD4BF", color: "#0A0D12", fontSize: 12, fontWeight: 700, padding: "8px 18px", borderRadius: 4, textDecoration: "none" }}>
      Subscribe — $40/yr
    </a>
  );
}
