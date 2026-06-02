const icons = {
  instagram: (
    <>
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.15" cy="6.85" r="1.15" />
    </>
  ),
  facebook: (
    <path d="M13.75 21v-7.1h2.38l.36-2.78h-2.74V9.35c0-.8.22-1.35 1.37-1.35h1.46V5.52c-.25-.04-1.12-.11-2.13-.11-2.1 0-3.54 1.28-3.54 3.64v2.07H8.53v2.78h2.38V21h2.84Z" />
  ),
  linkedin: (
    <>
      <path d="M6.45 9.35H9.1V18H6.45V9.35Z" />
      <path d="M7.78 8.18a1.54 1.54 0 1 0-.02-3.08 1.54 1.54 0 0 0 .02 3.08Z" />
      <path d="M10.78 9.35h2.54v1.18h.04c.35-.67 1.22-1.38 2.51-1.38 2.69 0 3.18 1.77 3.18 4.07V18H16.4v-4.24c0-1.01-.02-2.31-1.41-2.31-1.41 0-1.63 1.1-1.63 2.24V18h-2.58V9.35Z" />
    </>
  ),
  whatsapp: (
    <path d="M19.1 4.88A9.55 9.55 0 0 0 3.98 16.35L3 21l4.78-1.25A9.54 9.54 0 0 0 19.1 4.88Zm-7.35 13.03a7.85 7.85 0 0 1-3.98-1.09l-.28-.16-2.84.74.76-2.76-.18-.29a7.82 7.82 0 1 1 6.52 3.56Zm4.28-5.85c-.23-.12-1.38-.68-1.6-.76-.21-.08-.37-.12-.53.12-.15.23-.6.76-.74.92-.14.15-.27.17-.51.06-.23-.12-.99-.37-1.89-1.17-.7-.62-1.17-1.39-1.31-1.62-.14-.24-.01-.36.1-.48.11-.1.24-.27.35-.41.12-.14.16-.23.24-.39.08-.15.04-.29-.02-.41-.06-.12-.53-1.27-.72-1.74-.19-.46-.38-.39-.53-.4h-.45c-.16 0-.41.06-.62.29-.21.23-.82.8-.82 1.96 0 1.15.84 2.27.96 2.42.12.16 1.65 2.52 4 3.53.56.24.99.38 1.33.49.56.18 1.07.15 1.47.09.45-.07 1.38-.56 1.58-1.11.19-.54.19-1.01.13-1.11-.06-.1-.21-.16-.44-.28Z" />
  ),
};

export function SocialIcon({ icon, className = "" }) {
  const normalizedIcon = icon?.toLowerCase();
  const isInstagram = normalizedIcon === "instagram";

  return (
    <svg
      className={`social-icon ${className}`.trim()}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill={isInstagram ? "none" : "currentColor"}
      stroke={isInstagram ? "currentColor" : "none"}
      strokeWidth={isInstagram ? 1.9 : undefined}
      strokeLinecap={isInstagram ? "round" : undefined}
      strokeLinejoin={isInstagram ? "round" : undefined}
      focusable="false"
    >
      {icons[normalizedIcon] ?? null}
    </svg>
  );
}
