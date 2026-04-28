import { NextResponse } from "next/server";
const validTypes = ["host", "booking", "catering", "decoration", "volunteer", "work", "contact"];
export async function POST(request) {
    const body = await request.json().catch(() => null);
    if (!body || !validTypes.includes(body.type)) {
        return NextResponse.json({ ok: false, error: "Invalid inquiry payload" }, { status: 400 });
    }
    const hasSanity = Boolean(process.env.SANITY_PROJECT_ID && process.env.SANITY_DATASET && process.env.SANITY_API_TOKEN);
    if (!hasSanity) {
        return NextResponse.json({ ok: true, stored: false, message: "Sanity is not configured; inquiry accepted for MVP flow." });
    }
    try {
        const response = await fetch(`https://${process.env.SANITY_PROJECT_ID}.api.sanity.io/v2025-02-19/data/mutate/${process.env.SANITY_DATASET}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.SANITY_API_TOKEN}`
            },
            body: JSON.stringify({
                mutations: [{
                        create: {
                            _type: "inquiry",
                            inquiryType: body.type,
                            name: body.name ?? "",
                            email: body.email ?? "",
                            phone: body.phone ?? "",
                            preferredDate: body.date ?? "",
                            focus: body.focus ?? "",
                            portfolio: body.portfolio ?? "",
                            message: body.message ?? "",
                            createdAt: new Date().toISOString()
                        }
                    }]
            })
        });
        if (!response.ok) {
            return NextResponse.json({ ok: true, stored: false, message: "Sanity write failed; inquiry accepted for MVP flow." });
        }
        return NextResponse.json({ ok: true, stored: true });
    }
    catch {
        return NextResponse.json({ ok: true, stored: false, message: "Sanity write failed; inquiry accepted for MVP flow." });
    }
}
