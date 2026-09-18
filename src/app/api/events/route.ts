// Ingest endpoint for the web pixel + theme extension (F-1.1, F-1.2). Degrades silently
// on failure per F-2.6 — a malformed event never throws a 500 that could surface to the
// shopper; it's dropped and logged server-side instead.

import { NextRequest, NextResponse } from "next/server";
import { evaluateSession } from "@/lib/engine";
import { demoStore } from "@/lib/store";
import type { HesitationSignalEvent } from "@/lib/types";

function isValidEvent(body: unknown): body is HesitationSignalEvent {
  if (!body || typeof body !== "object") return false;
  const e = body as Record<string, unknown>;
  return (
    typeof e.sessionId === "string" &&
    typeof e.shopDomain === "string" &&
    typeof e.surface === "string" &&
    typeof e.productId === "string" &&
    typeof e.timestamp === "string" &&
    typeof e.kind === "string" &&
    typeof e.payload === "object" &&
    typeof e.consent === "object"
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  if (!isValidEvent(body)) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  // Consent gate (F-1.4): no custom event capture where analytics consent is excluded.
  if (body.consent.analytics === false) {
    return NextResponse.json({ ok: true, nudge: null }, { status: 200 });
  }

  try {
    demoStore.appendEvent(body.sessionId, body.productId, body);
    const recentEvents = demoStore.getRecentEvents(body.sessionId, body.productId);

    const result = evaluateSession(body.shopDomain, body.sessionId, body.surface, body.productId, recentEvents);

    return NextResponse.json({
      ok: true,
      nudge: result.renderNudge,
      opportunityId: result.opportunity.id,
    });
  } catch (err) {
    console.error("[byond] event ingest failed", err);
    return NextResponse.json({ ok: true, nudge: null }, { status: 200 });
  }
}
