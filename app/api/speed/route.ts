import { cleanUrl, toReport, type Strategy } from "@/lib/speed";

// GET /api/speed?url=example.com&strategy=mobile
// Runs Google PageSpeed Insights and returns a trimmed, plain-English report.
// Reports for the same page are cached for an hour.

export const maxDuration = 280;

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;
const hits = new Map<string, { count: number; reset: number }>();

function limited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  entry.count++;
  return entry.count > MAX_PER_WINDOW;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = cleanUrl(searchParams.get("url") ?? "");
  const strategy: Strategy = searchParams.get("strategy") === "desktop" ? "desktop" : "mobile";
  if (!url) return Response.json({ error: "That doesn't look like a website address." }, { status: 400 });

  // Local development only: a saved sample report, for building the page without using Google's quota.
  if (process.env.NODE_ENV === "development" && searchParams.get("demo") === "1") {
    const sample = (await import("@/lib/fixtures/psi-sample.json")).default;
    await new Promise((r) => setTimeout(r, 2500));
    return Response.json(toReport(sample, strategy));
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return Response.json({ error: "Too many audits in a row. Give it a minute." }, { status: 429 });

  const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  api.searchParams.set("url", url);
  api.searchParams.set("strategy", strategy);
  for (const c of ["PERFORMANCE", "SEO", "ACCESSIBILITY", "BEST_PRACTICES"]) api.searchParams.append("category", c);
  if (process.env.PSI_API_KEY) api.searchParams.set("key", process.env.PSI_API_KEY);

  try {
    const res = await fetch(api, { signal: AbortSignal.timeout(270_000) });
    const data = await res.json();
    if (!res.ok) {
      const msg: string = data?.error?.message ?? "";
      if (res.status === 429) return Response.json({ error: "We've hit Google's limit for now. Try again in a few minutes." }, { status: 503 });
      if (/FAILED_DOCUMENT_REQUEST|ERRORED_DOCUMENT_REQUEST|DNS|NO_FCP|unreachable/i.test(msg))
        return Response.json({ error: "Google couldn't load that page. Check the address and that the site is public." }, { status: 422 });
      return Response.json({ error: "The audit failed. Try again in a moment." }, { status: 502 });
    }
    return Response.json(toReport(data, strategy), {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return Response.json({ error: "The audit took too long. Try again, slow sites sometimes need a second go." }, { status: 504 });
  }
}
