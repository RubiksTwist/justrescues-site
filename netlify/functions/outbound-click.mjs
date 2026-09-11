const MAX_EVENT_BYTES = 1024;
const MAX_FIELD_LENGTH = 160;
const SURFACES = new Set(["catalog_card", "dog_detail", "rescue_page", "rescue_page_card"]);
const KINDS = new Set(["application", "original_listing", "rescue_catalog", "rescue_website"]);

function text(value) {
  return typeof value === "string" && value.length <= MAX_FIELD_LENGTH ? value : "";
}

function destinationHost(value) {
  const host = text(value).toLowerCase();
  return /^[a-z0-9.-]+(?::\d+)?$/.test(host) ? host : "";
}

/**
 * Records an anonymous referral event in Netlify function logs.
 *
 * The browser sends no cookies, user identifiers, IP addresses, full URLs,
 * search terms, or other visitor-supplied data. The Netlify dashboard keeps
 * these logs for the retention period provided by the team's plan.
 */
export default async function handler(request) {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { allow: "POST" } });
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_EVENT_BYTES) {
    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  }

  try {
    const body = await request.text();
    if (body.length > MAX_EVENT_BYTES) throw new Error("event body is too large");
    const payload = JSON.parse(body);
    const event = {
      event: "outbound_referral",
      rescue: text(payload.rescue),
      dog: text(payload.dog),
      surface: text(payload.surface),
      kind: text(payload.kind),
      destination_host: destinationHost(payload.destination_host),
    };
    if (!event.rescue || !SURFACES.has(event.surface) || !KINDS.has(event.kind) || !event.destination_host) {
      throw new Error("invalid referral event");
    }
    console.log(JSON.stringify(event));
  } catch {
    // Tracking must never delay or prevent a visitor from opening a rescue link.
  }

  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
