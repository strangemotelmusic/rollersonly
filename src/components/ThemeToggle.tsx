"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "ro-theme";

// Runs before first paint via a blocking inline script in layout.tsx, so the
// stored theme is already on <html> by the time anything renders — without
// it the page would paint dark then snap to light on hydration.
export const themeInitScript = `
(function(){
  try {
    // Defaults to dark for everyone. RollersOnly has always been a dark
    // site, so light mode is opt-in via the toggle only — deriving it from
    // prefers-color-scheme would silently flip the look for every visitor
    // whose phone is in light mode.
    var t = localStorage.getItem('${THEME_STORAGE_KEY}');
    document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function ThemeToggle({ className }: { className?: string }) {
  // Starts null so the button renders nothing theme-specific on the server —
  // the real value is only knowable on the client, and guessing would cause
  // a hydration mismatch against whatever the init script already applied.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme) || "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // private browsing / storage disabled — the theme still applies for
      // this page view, it just won't persist.
    }
    setTheme(next);
  }

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        borderRadius: "50%",
        border: "0.5px solid var(--border)",
        background: "transparent",
        color: "var(--muted)",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
      }}
    >
      {/* Rendered only once the client knows the theme, so the two icons
          can't flash-swap during hydration. */}
      {theme === null ? null : isLight ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.3M12 19.1v2.3M21.4 12h-2.3M4.9 12H2.6M18.6 5.4l-1.6 1.6M7 17l-1.6 1.6M18.6 18.6L17 17M7 7 5.4 5.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 14.3A8.6 8.6 0 1 1 9.7 3.5a6.9 6.9 0 0 0 10.8 10.8Z" />
    </svg>
  );
}
