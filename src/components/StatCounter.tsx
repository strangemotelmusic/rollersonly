"use client";

import { useEffect, useRef, useState } from "react";
import { animate, type AnimationPlaybackControls } from "motion/react";

export default function StatCounter({
  value,
  prefix = "",
}: {
  value: number;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    // Observe the containing block, not this bare inline span — a span
    // whose only content is a single digit is a degenerate (near-zero
    // width) observer target and can misreport intersection.
    const target = ref.current?.closest<HTMLElement>(".stat-item") ?? ref.current;
    if (!target) return;
    let controls: AnimationPlaybackControls | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        controls = animate(0, value, {
          duration: 1.4,
          ease: [0.23, 1, 0.32, 1],
          onUpdate: (v) => setDisplay(Math.round(v)),
        });
      },
      { rootMargin: "-100px", threshold: 0.1 }
    );
    observer.observe(target);
    return () => {
      observer.disconnect();
      controls?.stop();
    };
  }, [value]);

  return (
    <span ref={ref}>
      {prefix}
      {display}
    </span>
  );
}
