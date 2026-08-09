import { isSanityConfigured } from "@/sanity/env";

// Embedded Studio, per the task's default preference over a standalone
// deployment. Access control is Sanity's own project-member authentication
// (the Studio's login screen) — no custom password system is implemented
// here, matching the explicit instruction not to build one.
//
// `sanity.config.ts` throws at import time when project config is missing
// (see its own comment) — that's the right behavior for someone actually
// trying to use the Studio, but it must not take down `next build` for the
// rest of the site in an environment where Sanity hasn't been provisioned
// yet. The dynamic import below is deferred until request time and guarded
// by `isSanityConfigured`, so an unconfigured environment renders a clear
// message here instead of failing the whole build.
export default async function StudioPage() {
  if (!isSanityConfigured) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", maxWidth: "40rem" }}>
        <h1>Sanity Studio is not configured</h1>
        <p>
          Set <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> and{" "}
          <code>NEXT_PUBLIC_SANITY_DATASET</code> in <code>.env.local</code> (see{" "}
          <code>.env.example</code>) to use the Studio.
        </p>
      </div>
    );
  }

  const [{ NextStudio }, { default: config }] = await Promise.all([
    import("next-sanity/studio"),
    import("@/sanity.config"),
  ]);

  return <NextStudio config={config} />;
}
