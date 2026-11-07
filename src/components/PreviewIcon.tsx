const iconPaths: Record<string, string> = {
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  arrowUp: '<path d="M6 18 18 6M6 6h12v12"/>',
  left: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  gavel: '<path d="m13 3 8 8-3 3-8-8 3-3Zm-6 7 7 7M9 12l-6 6 3 3 6-6M12 21h9"/>',
  tree: '<rect x="8" y="2" width="8" height="5" rx="1"/><rect x="2" y="17" width="7" height="5" rx="1"/><rect x="15" y="17" width="7" height="5" rx="1"/><path d="M12 7v5M5.5 17v-5h13v5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  book: '<path d="M12 5C8 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Zm0 0v16"/>',
  home: '<path d="m2 11 10-9 10 9M5 9v12h14V9M9 21v-7h6v7"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/>',
  band: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v13c0 4 16 4 16 0V5M8 12h3m3 0h2M8 15h3m3 0h2"/>',
};

export default function PreviewIcon({ name, className }: { name: keyof typeof iconPaths; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: iconPaths[name] }}
    />
  );
}
