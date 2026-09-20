const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  // The 3 permanent redirects that used to live here moved to middleware.ts
  // (see LEGACY_REDIRECTS there) — middleware runs before the [locale]
  // rewrite and can express "redirect regardless of which locale prefix was
  // used" as one rule instead of one next.config.js entry per locale.
  images: {
    // Required for next/image to load Sanity-hosted images (e.g. the event
    // detail page's hero banner, sourced via sanity/lib/image.ts's
    // urlForImage()). Other Sanity-image call sites in this codebase render
    // plain <img> tags instead of next/image and so didn't need this, but
    // that's a separate, pre-existing pattern — not a reason to downgrade
    // this page's <Image fill priority> hero away from next/image.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
};

module.exports = nextConfig;
