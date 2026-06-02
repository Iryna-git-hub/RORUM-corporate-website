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
    <path d="M12.04 3.05a8.77 8.77 0 0 0-7.5 13.33L3.5 21l4.74-1.02a8.76 8.76 0 1 0 3.8-16.93Zm0 15.06a7.08 7.08 0 0 1-3.62-.99l-.28-.17-2.17.47.48-2.09-.18-.3a7.08 7.08 0 1 1 5.77 3.08Zm3.95-4.99c-.22-.11-1.28-.63-1.48-.7-.2-.08-.34-.11-.48.11-.14.22-.55.7-.68.84-.13.15-.25.16-.47.06-.22-.11-.91-.34-1.74-1.07-.64-.57-1.08-1.28-1.2-1.5-.13-.22-.01-.34.1-.45.1-.1.22-.25.33-.37.11-.13.14-.22.22-.36.07-.15.04-.27-.02-.38-.05-.11-.48-1.16-.66-1.59-.17-.42-.35-.36-.48-.37h-.41c-.14 0-.38.05-.58.27-.2.22-.76.74-.76 1.8s.78 2.09.89 2.23c.11.15 1.53 2.34 3.7 3.28.52.22.92.35 1.24.45.52.17.99.14 1.36.08.41-.06 1.28-.52 1.46-1.03.18-.5.18-.93.13-1.03-.05-.09-.2-.14-.42-.25Z" />
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
