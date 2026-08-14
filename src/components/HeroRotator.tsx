"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const ROTATE_MS = 6000;
const FADE_MS = 2500;

export default function HeroRotator({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: -1, overflow: "hidden" }} aria-hidden>
      {images.map((src, i) => (
        <Image
          key={src + i}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          style={{
            objectFit: "cover",
            opacity: i === index ? 0.6 : 0,
            transition: `opacity ${FADE_MS}ms ease`,
            filter: "grayscale(0.1) brightness(0.8)",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  );
}
