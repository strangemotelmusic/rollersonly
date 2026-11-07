"use client";

export default function ReorderButtons({
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  disabled,
}: {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  disabled?: boolean;
}) {
  const btnStyle = (enabled: boolean): React.CSSProperties => ({
    width: 28,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "0.5px solid var(--border)",
    borderRadius: 4,
    color: enabled ? "var(--gold)" : "var(--border)",
    cursor: enabled ? "pointer" : "default",
    fontSize: 11,
    lineHeight: 1,
    padding: 0,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <button type="button" onClick={onMoveUp} disabled={!canMoveUp || disabled} title="Move up" style={btnStyle(canMoveUp && !disabled)}>
        ▲
      </button>
      <button type="button" onClick={onMoveDown} disabled={!canMoveDown || disabled} title="Move down" style={btnStyle(canMoveDown && !disabled)}>
        ▼
      </button>
    </div>
  );
}
