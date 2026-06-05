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
    <>
      <path d="M12.04 4.1a7.85 7.85 0 0 0-6.76 11.83l-.78 3.02 3.1-.82a7.85 7.85 0 1 0 4.44-14.03Z" />
      <path d="M9.06 8.28c-.18-.4-.37-.41-.52-.42h-.45c-.16 0-.41.06-.63.3-.21.24-.82.8-.82 1.94 0 1.15.84 2.26.96 2.42.12.16 1.62 2.58 3.98 3.52.55.22.98.35 1.32.45.55.17 1.05.15 1.45.09.44-.07 1.36-.56 1.55-1.11.19-.55.19-1.02.13-1.12-.06-.1-.22-.16-.45-.28l-1.58-.76c-.23-.11-.4-.16-.57.16-.17.24-.66.84-.81 1-.15.16-.3.18-.55.06a6.3 6.3 0 0 1-1.86-1.15 6.9 6.9 0 0 1-1.29-1.6c-.13-.23-.01-.36.1-.48.1-.1.23-.27.34-.4.11-.14.15-.23.23-.39.08-.16.04-.3-.02-.42l-.71-1.81Z" />
    </>
  ),
};

export function SocialIcon({ icon, className = "" }) {
  const normalizedIcon = icon?.toLowerCase();
  const isInstagram = normalizedIcon === "instagram";
  const isWhatsapp = normalizedIcon === "whatsapp";
  const isStrokeIcon = isInstagram || isWhatsapp;

  return (
    <svg
      className={`social-icon ${className}`.trim()}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill={isStrokeIcon ? "none" : "currentColor"}
      stroke={isStrokeIcon ? "currentColor" : "none"}
      strokeWidth={isWhatsapp ? 1.65 : isInstagram ? 1.9 : undefined}
      strokeLinecap={isStrokeIcon ? "round" : undefined}
      strokeLinejoin={isStrokeIcon ? "round" : undefined}
      focusable="false"
    >
      {icons[normalizedIcon] ?? null}
    </svg>
  );
}
