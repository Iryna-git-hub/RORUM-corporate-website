// Shared between the Studio schema (mediaItem.ts's `videoUrl` validation)
// and the frontend (lib/sanityGallery.ts's video resolution) so "what counts
// as a playable direct video-file URL" can never drift between what an
// editor is allowed to save and what the site will actually try to play in
// a native <video> element. mediaItem.ts's own description already promises
// "a direct link to a video file" — this is what actually enforces that
// promise, on both sides.
//
// This only checks the URL's *extension* — it says nothing about whether a
// browser can actually decode the file's codec/container at playback time.
// An .mp4 with an unsupported codec (e.g. HEVC in some browsers) can still
// fail at runtime; HorizontalGallery's own onError fallback (see
// components/HorizontalGallery.tsx's markVideoError) is what handles that
// case — extension matching here is only a first-pass "is this even
// plausibly a video file" check, not a playability guarantee.
//
// .mov deliberately excluded: QuickTime's .mov container commonly carries
// codecs (e.g. ProRes, or H.264 variants tagged in ways some browsers
// reject) that are not reliably playable in a plain <video> across this
// project's target browsers, unlike .mp4/.webm which are near-universally
// supported.
//
// .m4v is kept, but NOT on the same footing as .mp4/.webm — re-audited: it
// is typically an MP4 container (H.264/AAC), and most Chromium/Firefox/
// Safari builds play it the same as .mp4, but unlike .mp4/.webm this is not
// a web standard-guaranteed pairing — an .m4v file can in principle carry
// other codecs, and support has historically been more Apple-ecosystem-
// oriented (it originated as an iTunes/QuickTime extension). Treat .m4v
// acceptance here as "usually fine, extension alone doesn't guarantee it" —
// the same caveat as every other extension in this list, just worth calling
// out explicitly since it's the least standardized of the five. If a
// specific .m4v file fails to play, HorizontalGallery's runtime onError
// fallback (components/HorizontalGallery.tsx's markVideoError) is what
// surfaces that, the same as any other codec-level playback failure.
//
// If .mov support is ever confirmed against this project's actual target
// browser matrix, add it back here rather than to a separate list — there
// is deliberately only one list, so Studio validation and frontend
// resolution can never accept different sets.
const VIDEO_FILE_EXTENSIONS = new Set(["mp4", "webm", "ogg", "ogv", "m4v"]);
const FILE_EXTENSION_PATTERN = /\.([a-z0-9]+)$/i;

const KNOWN_WATCH_PAGE_PROVIDERS: { name: string; pattern: RegExp }[] = [
  { name: "YouTube", pattern: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i },
  { name: "Vimeo", pattern: /(^|\.)vimeo\.com$/i },
];

function parseUrl(url: string): URL | undefined {
  try {
    // A relative path (e.g. "/videos/x.mp4") has no hostname/scheme of its
    // own — resolving against a placeholder base still gives a real,
    // parsed `pathname` to check, without ever needing a network request
    // or treating the placeholder as the video's actual origin.
    return new URL(url, "https://placeholder.invalid");
  } catch {
    return undefined;
  }
}

function hostnameOf(url: string): string | undefined {
  return parseUrl(url)?.hostname;
}

/** True for a URL that looks like a direct, browser-playable video file (by extension) — not a webpage. */
export function isDirectVideoFileUrl(url: string): boolean {
  const parsed = parseUrl(url.trim());
  if (!parsed) return false;
  // Matched against the parsed `pathname` only, case-insensitively — never
  // the raw string — so a query string/fragment that happens to contain
  // something extension-shaped (e.g. an ordinary webpage URL like
  // https://example.com/watch?next=/clip.mp4) can't produce a false
  // positive, and an uppercase extension (VIDEO.MP4) still matches.
  const match = FILE_EXTENSION_PATTERN.exec(parsed.pathname);
  const extension = match?.[1]?.toLowerCase();
  return !!extension && VIDEO_FILE_EXTENSIONS.has(extension);
}

/** Returns the known provider name ("YouTube"/"Vimeo") if the URL's host is a watch-page provider, so callers can give a specific, honest error instead of a generic "invalid URL". */
export function detectWatchPageProvider(url: string): string | undefined {
  const hostname = hostnameOf(url.trim());
  if (!hostname) return undefined;
  return KNOWN_WATCH_PAGE_PROVIDERS.find((p) => p.pattern.test(hostname))?.name;
}

/**
 * The exact manager-facing validation message (bilingual EN/UK) for an
 * invalid `videoUrl` — used identically by the Studio field's own
 * `validation` and by frontend defense-in-depth checks, so an editor and a
 * developer reading a warning see the same wording.
 */
export function videoUrlValidationMessage(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  const provider = detectWatchPageProvider(trimmed);
  if (provider) {
    return `This must be a direct link to a video file, not a ${provider} page link — ${provider} pages can't be played directly here. Example: https://example.com/video.mp4 / Це має бути пряме посилання на відеофайл, а не посилання на сторінку ${provider} — такі посилання не можна відтворити напряму. Приклад: https://example.com/video.mp4`;
  }
  if (!isDirectVideoFileUrl(trimmed)) {
    return "This must be a direct link to a video file ending in .mp4 or .webm (not a webpage link). Example: https://example.com/video.mp4 / Це має бути пряме посилання на відеофайл із розширенням .mp4 або .webm (не посилання на сторінку). Приклад: https://example.com/video.mp4";
  }
  return undefined;
}
