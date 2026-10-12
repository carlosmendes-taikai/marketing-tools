import { GROUPS, MARKETS, normalize, type GroupId } from "@/lib/keywords";

// GET /api/suggest?q=qr+code&group=questions&market=us-en&source=google
// Answers one group of keyword ideas. Identical requests are cached at the edge for a day,
// so popular searches never hit Google twice.

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40; // about 8 full searches a minute per visitor
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

async function suggest(query: string, gl: string, hl: string, youtube: boolean): Promise<string[]> {
  const url = new URL("https://suggestqueries.google.com/complete/search");
  url.search = new URLSearchParams({ client: "firefox", ie: "UTF-8", oe: "UTF-8", hl, gl, q: query, ...(youtube ? { ds: "yt" } : {}) }).toString();
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    const data = (await res.json()) as [string, string[]];
    return Array.isArray(data?.[1]) ? data[1] : [];
  } catch {
    return [];
  }
}

/** Runs tasks with at most `limit` in flight, keeping the original order. */
async function pool<T>(items: string[], limit: number, fn: (s: string) => Promise<T>): Promise<T[]> {
  const out: T[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seed = normalize(searchParams.get("q") ?? "");
  const group = GROUPS.find((g) => g.id === (searchParams.get("group") as GroupId));
  const market = MARKETS.find((m) => m.id === searchParams.get("market")) ?? MARKETS[0];
  const youtube = searchParams.get("source") === "youtube";

  if (!seed || !group) return Response.json({ error: "Missing keyword" }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return Response.json({ error: "Too many searches. Give it a minute." }, { status: 429 });

  const queries = group.build(seed);
  const results = await pool(queries, 6, (q) => suggest(q, market.gl, market.hl, youtube));

  // skip the seed and the bare prompts we sent ("how email signature")
  const seen = new Set<string>([seed, ...queries.map(normalize)]);
  const ideas: string[] = [];
  for (const list of results)
    for (const raw of list) {
      const s = normalize(raw);
      if (!seen.has(s)) {
        seen.add(s);
        ideas.push(s);
      }
    }

  return Response.json(
    { group: group.id, ideas },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}
