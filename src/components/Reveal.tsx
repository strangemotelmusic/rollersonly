"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

export default function Reveal({
  children,
  className,
  i = 0,
  style,
}: {
  children: ReactNode;
  className?: string;
  /** Stagger index — each step adds 60ms of delay via --reveal-i. */
  i?: number;
  style?: CSSProperties;
}) {
  // The clip-path that animates the reveal lives on an inner div. The
  // IntersectionObserver must watch an *unclipped* outer div instead —
  // Chrome treats a clip-path-hidden element as 0% visible, so an observer
  // on the clipped element itself never reports isIntersecting: true.
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-100px", threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={style}>
      <div className="reveal" data-visible={visible ? "" : undefined} style={{ "--reveal-i": i } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}
