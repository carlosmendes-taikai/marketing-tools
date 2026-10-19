import { attrs, decode } from "@/lib/html";
import { BlockedError, readCapped, safeFetch } from "@/lib/safe-fetch";
import type { PageTitleInfo } from "@/lib/title-check";

// GET /api/title?url=example.com
// Reads what Google reads for a search result: the page title, meta description, main heading and index rules.

export const maxDuration = 30;

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
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

const text = (html: string) => decode(html.replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " "));

export async function GET(request: Request) {
  const raw = (new URL(request.url).searchParams.get("url") ?? "").trim();
  let target: URL;
  try {
    target = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!target.hostname.includes(".")) throw new Error();
  } catch {
    return Response.json({ error: "That doesn't look like a website address." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(ip)) return Response.json({ error: "Too many checks in a row. Give it a minute." }, { status: 429 });

  try {
    const { res, url: finalUrl } = await safeFetch(target.toString(), { accept: "text/html,application/xhtml+xml", timeoutMs: 10_000 });
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) {
      await res.body?.cancel();
      return Response.json({ error: "That address isn't a web page (it's a file or an API)." }, { status: 422 });
    }
    const html = new TextDecoder().decode(await readCapped(res, 1536 * 1024));
    const [head, body = ""] = html.split(/<\/head>/i);

    const meta = new Map<string, string>();
    for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
      const a = attrs(m[0]);
      const key = (a.property ?? a.name ?? "").toLowerCase();
      if (key && a.content !== undefined && !meta.has(key)) meta.set(key, a.content);
    }
    const links = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0]));
    const abs = (href?: string) => {
      try {
        return href ? new URL(href, finalUrl).toString() : "";
      } catch {
        return "";
      }
    };
    const titles = [...head.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => decode(m[1]));
    const icon = links.find((l) => /(^|\s)(apple-touch-icon|icon|shortcut icon)(\s|$)/i.test(l.rel ?? ""));

    const info: PageTitleInfo = {
      url: target.toString(),
      finalUrl: finalUrl.toString(),
      status: res.status,
      title: titles[0] ?? "",
      titleCount: titles.length,
      description: meta.get("description") ?? "",
      ogTitle: meta.get("og:title") ?? "",
      siteName: meta.get("og:site_name") ?? meta.get("application-name") ?? "",
      robots: [meta.get("robots"), meta.get("googlebot"), res.headers.get("x-robots-tag")].filter(Boolean).join(", "),
      canonical: abs(links.find((l) => (l.rel ?? "").toLowerCase() === "canonical")?.href),
      favicon: abs(icon?.href) || new URL("/favicon.ico", finalUrl).toString(),
      h1: [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => text(m[1])).filter(Boolean).slice(0, 5),
      bodyWords: text(body).split(" ").filter(Boolean).length,
    };
    // Bot walls (Cloudflare and friends) answer with a stand-in page, not the real one
    if ((res.status === 403 || res.status === 429 || res.status === 503) && (info.bodyWords < 60 || /just a moment|attention required|access denied/i.test(info.title)))
      return Response.json({ error: "This site blocks automated checks, so we can't read its real title. Try another page, or check it in Google." }, { status: 422 });
    return Response.json(info, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } });
  } catch (e) {
    if (e instanceof BlockedError) return Response.json({ error: e.message }, { status: 400 });
    if ((e as Error).name === "TimeoutError") return Response.json({ error: "The page took too long to answer." }, { status: 504 });
    return Response.json({ error: "Couldn't reach that page. Check the address, or the site may block bots." }, { status: 502 });
  }
}
