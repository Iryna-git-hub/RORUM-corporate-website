import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

// Turns Draft Mode back off. Reachable two ways:
//   - the "Exit preview" badge rendered on the site while Draft Mode is on
//     (components/DisableDraftMode.tsx), for a normal tab that entered preview
//   - directly, as a manual escape hatch
//
// Inside the Presentation Tool iframe the Studio has its own perspective
// toggle, so the badge hides itself there (see DisableDraftMode.tsx).
export async function GET(request: Request): Promise<Response> {
  (await draftMode()).disable();
  return NextResponse.redirect(new URL("/", request.url));
}
