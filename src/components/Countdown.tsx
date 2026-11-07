"use client";
import { useEffect, useState } from "react";

export default function Countdown({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const urgent = remaining > 0 && remaining <= 300;

  return (
    <span className={urgent ? "timer-val urgent" : "timer-val"}>{`${pad(h)}:${pad(m)}:${pad(s)}`}</span>
  );
}
