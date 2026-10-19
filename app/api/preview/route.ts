import { BlockedError, readCapped, safeFetch } from "@/lib/safe-fetch";
import { attrs, decode } from "@/lib/html";
import { runChecks, scoreOf, suggestedTags, type ImageInfo, type PageMeta } from "@/lib/preview";

// GET /api/preview?url=example.com
// Reads a page's share tags the way LinkedIn, Slack or WhatsApp do, then checks the share image.

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

function parseHead(html: string, base: URL) {
  const head = html.split(/<\/head>/i)[0];
  const tags: { key: string; value: string }[] = [];
  const meta = new Map<string, string>();
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    const key = (a.property ?? a.name ?? "").toLowerCase();
    if (!key || a.content === undefined) continue;
    if (key.startsWith("og:") || key.startsWith("twitter:")) tags.push({ key, value: a.content });
    if (!meta.has(key)) meta.set(key, a.content);
  }
  const links = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0]));
  const abs = (href?: string) => {
    if (!href) return "";
    try {
      return new URL(href, base).toString();
    } catch {
      return "";
    }
  };
  const icon = links.find((l) => /(^|\s)(apple-touch-icon|icon|shortcut icon)(\s|$)/i.test(l.rel ?? ""));
  return {
    tags,
    meta,
    htmlTitle: decode(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ""),
    canonical: abs(links.find((l) => (l.rel ?? "").toLowerCase() === "canonical")?.href),
    favicon: abs(icon?.href) || new URL("/favicon.ico", base).toString(),
    abs,
  };
}

/** Width and height from the first bytes of a PNG, GIF, WebP or JPEG. */
function dimensions(b: Uint8Array): { width: number; height: number } | null {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const ascii = (o: number, n: number) => String.fromCharCode(...b.subarray(o, o + n));
  if (b.length > 24 && b[0] === 0x89 && ascii(1, 3) === "PNG") return { width: dv.getUint32(16), height: dv.getUint32(20) };
  if (b.length > 10 && ascii(0, 3) === "GIF") return { width: dv.getUint16(6, true), height: dv.getUint16(8, true) };
  if (b.length > 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const kind = ascii(12, 4);
    if (kind === "VP8 ") return { width: dv.getUint16(26, true) & 0x3fff, height: dv.getUint16(28, true) & 0x3fff };
    if (kind === "VP8L") {
      const bits = dv.getUint32(21, true);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (kind === "VP8X") return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
  }
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let o = 2;
    while (o + 9 < b.length) {
      if (b[o] !== 0xff) {
        o++;
        continue;
      }
      const marker = b[o + 1];
      const size = dv.getUint16(o + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { height: dv.getUint16(o + 5), width: dv.getUint16(o + 7) };
      o += 2 + size;
    }
  }
  return null;
}

async function inspectImage(url: string, declaredWidth: number | null, declaredHeight: number | null): Promise<ImageInfo> {
  const info: ImageInfo = { url, ok: false, width: null, height: null, bytes: null, type: "", declaredWidth, declaredHeight };
  try {
    const { res } = await safeFetch(url, { accept: "image/*", timeoutMs: 8000 });
    info.type = res.headers.get("content-type") ?? "";
    const length = Number(res.headers.get("content-length"));
    info.bytes = Number.isFinite(length) && length > 0 ? length : null;
    if (!res.ok || !info.type.startsWith("image/")) {
      await res.body?.cancel();
      return info;
    }
    const head = await readCapped(res, 256 * 1024);
    const dims = dimensions(head);
    info.ok = true;
    info.width = dims?.width ?? declaredWidth;
    info.height = dims?.height ?? declaredHeight;
  } catch {}
  return info;
}

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
    const html = new TextDecoder().decode(await readCapped(res, 1024 * 1024, "</head>"));
    const p = parseHead(html, finalUrl);
    const get = (...keys: string[]) => keys.map((k) => p.meta.get(k)).find((v) => v && v.trim()) ?? "";

    const imageUrl = p.abs(get("og:image", "og:image:url", "og:image:secure_url", "twitter:image", "twitter:image:src"));
    const num = (k: string) => (Number(get(k)) > 0 ? Number(get(k)) : null);

    const meta: PageMeta = {
      url: target.toString(),
      finalUrl: finalUrl.toString(),
      status: res.status,
      title: get("og:title", "twitter:title") || p.htmlTitle,
      description: get("og:description", "twitter:description", "description"),
      htmlTitle: p.htmlTitle,
      metaDescription: get("description"),
      siteName: get("og:site_name"),
      domain: finalUrl.hostname.replace(/^www\./, ""),
      canonical: p.canonical,
      favicon: p.favicon,
      image: imageUrl ? await inspectImage(imageUrl, num("og:image:width"), num("og:image:height")) : null,
      twitterCard: get("twitter:card"),
      tags: p.tags,
    };
    const checks = runChecks(meta);

    return Response.json(
      { meta, checks, score: scoreOf(checks), suggested: suggestedTags(meta) },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } },
    );
  } catch (e) {
    if (e instanceof BlockedError) return Response.json({ error: e.message }, { status: 400 });
    if ((e as Error).name === "TimeoutError") return Response.json({ error: "The page took too long to answer." }, { status: 504 });
    return Response.json({ error: "Couldn't reach that page. Check the address, or the site may block preview bots." }, { status: 502 });
  }
}
