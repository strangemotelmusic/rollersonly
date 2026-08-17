"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { flattenForLayout, birdLabel, type PedigreeNode } from "@/lib/pedigree/tree";

const DEPTH_OPTIONS = [2, 3, 4] as const;
const NODE_WIDTH = 168;
const NODE_HEIGHT = 60;

export default function PedigreeTree({
  root,
  highlightIds,
  linkToBirdPages = true,
}: {
  root: PedigreeNode;
  highlightIds?: Set<string>;
  linkToBirdPages?: boolean;
}) {
  const router = useRouter();
  const maxAvailable = useMemo(() => {
    const nodes = flattenForLayout(root);
    return Math.min(4, nodes.reduce((max, n) => Math.max(max, n.generation), 0) + 1);
  }, [root]);
  const [depth, setDepth] = useState(Math.max(2, maxAvailable));

  const allNodes = useMemo(() => flattenForLayout(root), [root]);
  const visibleNodes = useMemo(() => allNodes.filter((n) => n.generation < depth), [allNodes, depth]);
  const maxGeneration = depth - 1;

  const colWidth = NODE_WIDTH + 56;
  const leafCount = 2 ** maxGeneration;
  const height = Math.max(320, leafCount * (NODE_HEIGHT + 18));
  const width = depth * colWidth;

  function pos(generation: number, slot: number) {
    const slotsInGen = 2 ** generation;
    const y = ((slot + 0.5) / slotsInGen) * height - NODE_HEIGHT / 2;
    const x = generation * colWidth;
    return { x, y };
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {DEPTH_OPTIONS.filter((d) => d <= Math.max(maxAvailable, 2)).map((d) => (
          <button
            key={d}
            onClick={() => setDepth(d)}
            style={{
              padding: "6px 14px",
              fontSize: 11,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              borderRadius: 20,
              cursor: "pointer",
              border: `0.5px solid ${depth === d ? "var(--gold)" : "var(--border)"}`,
              background: depth === d ? "rgba(212,175,55,0.12)" : "transparent",
              color: depth === d ? "var(--gold)" : "var(--muted)",
            }}
          >
            {d === 2 ? "Parents" : d === 3 ? "Grandparents" : "Great-grandparents"}
          </button>
        ))}
      </div>

      <div style={{ overflowX: "auto", background: "var(--void)", border: "0.5px solid var(--border)", borderRadius: 4, padding: 24 }}>
        <div style={{ position: "relative", width, height }}>
          <svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
            {visibleNodes
              .filter((n) => n.generation < maxGeneration)
              .map(({ node, generation, slot }) => {
                const { x, y } = pos(generation, slot);
                const startX = x + NODE_WIDTH;
                const startY = y + NODE_HEIGHT / 2;
                const slotsInGen = 2 ** generation;
                const sirePos = pos(generation + 1, slot * 2);
                const damPos = pos(generation + 1, slot * 2 + 1);
                const sireY = sirePos.y + NODE_HEIGHT / 2;
                const damY = damPos.y + NODE_HEIGHT / 2;
                const childX = (generation + 1) * colWidth;
                const midX = startX + (childX - startX) / 2;
                return (
                  <g key={`${node.id}-lines-${slotsInGen}`}>
                    <path d={`M ${startX} ${startY} H ${midX} V ${sireY} H ${childX}`} stroke="var(--border-gold)" strokeWidth={1.5} fill="none" />
                    <path d={`M ${startX} ${startY} H ${midX} V ${damY} H ${childX}`} stroke="var(--border-gold)" strokeWidth={1.5} fill="none" />
                  </g>
                );
              })}
          </svg>

          {visibleNodes.map(({ node, generation, slot }) => {
            const { x, y } = pos(generation, slot);
            const isSubject = generation === 0;
            const isHighlighted = highlightIds?.has(node.id);
            const clickable = linkToBirdPages && !isSubject;
            return (
              <div
                key={`${node.id}-${generation}-${slot}`}
                onClick={clickable ? () => router.push(`/birds/${node.id}`) : undefined}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 4,
                  background: isSubject ? "linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.04))" : "var(--surface)",
                  border: `0.5px solid ${isHighlighted ? "var(--gold)" : isSubject ? "var(--border-gold)" : "var(--border)"}`,
                  boxShadow: isHighlighted ? "0 0 0 1px var(--gold), 0 0 16px rgba(212,175,55,0.35)" : isSubject ? "0 0 20px rgba(212,175,55,0.15)" : undefined,
                  cursor: clickable ? "pointer" : "default",
                  transition: "box-shadow 0.15s, border-color 0.15s",
                }}
              >
                <div style={{ position: "relative", width: 34, height: 34, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "var(--deep)", border: "0.5px solid var(--border)" }}>
                  {node.primary_photo_url && <Image src={node.primary_photo_url} alt="" fill style={{ objectFit: "cover" }} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: isSubject ? "var(--white)" : "var(--white)", fontWeight: isSubject ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {birdLabel(node)}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {[node.sex, node.color].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Unrecorded-ancestor placeholders */}
          {visibleNodes
            .filter((n) => n.generation < maxGeneration)
            .flatMap(({ node, generation, slot }) => {
              const out: React.ReactNode[] = [];
              if (!node.sire) {
                const p = pos(generation + 1, slot * 2);
                out.push(<UnknownBox key={`${node.id}-sire-unknown`} x={p.x} y={p.y} />);
              }
              if (!node.dam) {
                const p = pos(generation + 1, slot * 2 + 1);
                out.push(<UnknownBox key={`${node.id}-dam-unknown`} x={p.x} y={p.y} />);
              }
              return out;
            })}
        </div>
      </div>
    </div>
  );
}

function UnknownBox({ x, y }: { x: number; y: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 4,
        border: "0.5px dashed var(--border)",
        color: "var(--muted)",
        fontSize: 11,
        fontStyle: "italic",
      }}
    >
      Unrecorded
    </div>
  );
}
