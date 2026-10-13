import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

// Fetches public web pages only. Every hop (including redirects) is checked so the
// server can't be pointed at private networks, cloud metadata or localhost.

const UA = "Mozilla/5.0 (compatible; MktboxPreview/1.0; +https://mktbox.xyz/preview)";

function privateV4(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function privateIp(ip: string) {
  if (isIP(ip) === 4) return privateV4(ip);
  const v = ip.toLowerCase();
  const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return privateV4(mapped[1]);
  return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb") || v.startsWith("64:ff9b");
}

export class BlockedError extends Error {}

async function assertPublic(u: URL) {
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new BlockedError("Only web addresses are allowed.");
  if (u.port && u.port !== "80" && u.port !== "443") throw new BlockedError("Only standard web ports are allowed.");
  if (u.username || u.password) throw new BlockedError("Addresses with passwords aren't allowed.");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new BlockedError("That address isn't public.");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new BlockedError("That address isn't public.");
}

/** Like fetch, but public addresses only, with manual redirects (each re-checked) and a time limit. */
export async function safeFetch(input: string, init: { accept: string; timeoutMs: number; maxRedirects?: number }) {
  let url = new URL(input);
  const signal = AbortSignal.timeout(init.timeoutMs);
  for (let hop = 0; hop <= (init.maxRedirects ?? 5); hop++) {
    await assertPublic(url);
    const res = await fetch(url, { redirect: "manual", signal, headers: { "User-Agent": UA, Accept: init.accept, "Accept-Language": "en" } });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      await res.body?.cancel();
      url = new URL(loc, url);
      continue;
    }
    return { res, url };
  }
  throw new BlockedError("Too many redirects.");
}

/** Reads at most `limit` bytes, stopping early once `stopAt` shows up (for HTML: the end of <head>). */
export async function readCapped(res: Response, limit: number, stopAt?: string): Promise<Uint8Array> {
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  const decoder = stopAt ? new TextDecoder() : null;
  let tail = "";
  while (total < limit) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    total += value.length;
    if (decoder) {
      tail = (tail + decoder.decode(value, { stream: true })).slice(-4096);
      if (tail.toLowerCase().includes(stopAt!)) break;
    }
  }
  await reader.cancel().catch(() => {});
  const out = new Uint8Array(Math.min(total, limit));
  let at = 0;
  for (const c of chunks) {
    const n = Math.min(c.length, out.length - at);
    out.set(c.subarray(0, n), at);
    at += n;
    if (at >= out.length) break;
  }
  return out;
}
