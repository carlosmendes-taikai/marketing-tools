import { BlockedError } from "@/lib/safe-fetch";
import { auditApp, cleanUrl } from "@/lib/vibe";

// GET /api/vibe?url=myapp.lovable.app
// Reads the live app the way a browser would and returns a plain-English report.

export const maxDuration = 60;

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, { count: number; reset: number }>();

function limited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  return ++entry.count > MAX_PER_WINDOW;
}

export async function GET(request: Request) {
  const url = cleanUrl(new URL(request.url).searchParams.get("url") ?? "");
  if (!url) return Response.json({ error: "That doesn't look like a website address." }, { status: 400 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return Response.json({ error: "Too many audits in a row. Give it a minute." }, { status: 429 });
  try {
    const report = await auditApp(url);
    return Response.json(report, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
  } catch (error) {
    if (error instanceof BlockedError) return Response.json({ error: error.message }, { status: 400 });
    const message = error instanceof Error && !/fetch|abort|timeout/i.test(error.message) ? error.message : "We couldn't load that app. Check the address and that it's public.";
    return Response.json({ error: message }, { status: 422 });
  }
}
