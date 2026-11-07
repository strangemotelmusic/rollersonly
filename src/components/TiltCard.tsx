"use client";

import { useRef } from "react";
import type { CSSProperties, ReactNode, PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/**
 * Pointer-driven 3D tilt — decorative mouse-tracking, so it's spring-driven
 * per the animate skill (gesture-like, should carry velocity through
 * interruption). Mouse only: touch taps don't get a meaningless tilt.
 */
export default function TiltCard({
  children,
  className,
  style,
  maxTilt = 8,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(rawX, { stiffness: 200, damping: 20, mass: 0.5 });
  const rotateY = useSpring(rawY, { stiffness: 200, damping: 20, mass: 0.5 });

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rawY.set(px * maxTilt);
    rawX.set(py * -maxTilt);
  }

  function handlePointerLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ ...style, rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
