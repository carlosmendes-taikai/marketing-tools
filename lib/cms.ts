import "server-only";
import { createHmac } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { del, list, put } from "@vercel/blob";

// Articles live as JSON in Vercel Blob (one file per save, newest wins), edited from /admin.
// The blob store is public (it also hosts signature images), so the file sits under a path
// derived from ADMIN_SECRET: nobody can list or guess it, which keeps drafts private.
// The Markdown files in /content/blog are only the starting point, used until the first save.

export type Doc = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD, shown as the publish date
  updated: string; // ISO timestamp of the last save
  tool: string;
  status: "draft" | "published";
  body: string; // Markdown
  subtitle?: string; // second line on the cover image
  coverAlt?: string; // alt text for the cover; generated from the title when empty
};

export type Store = {
  posts: Doc[];
  redirects: Record<string, string>; // old slug -> current slug
};

function secret() {
  const s = process.env.ADMIN_SECRET;
  if (!s) throw new Error("ADMIN_SECRET is not set");
  return s;
}

export const hmac = (value: string) => createHmac("sha256", secret()).update(value).digest("hex");

const dir = () => `cms/${hmac("cms-folder").slice(0, 32)}`;

// Blob storage is only eventually consistent when a file is overwritten: a read straight after a save
// can return the previous version. So nothing is overwritten. Every save is a new file named by its
// timestamp, the newest one wins, and the last few are kept as a safety net.
const KEEP_VERSIONS = 30;

async function readJson<T>(name: string): Promise<T | null> {
  const { blobs } = await list({ prefix: `${dir()}/${name}/`, limit: 1000 });
  const newest = blobs.sort((a, b) => a.pathname.localeCompare(b.pathname)).at(-1);
  if (!newest) return null;
  const res = await fetch(newest.url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blob read failed (${res.status})`);
  return (await res.json()) as T;
}

async function writeJson(name: string, data: unknown) {
  await put(`${dir()}/${name}/${Date.now()}.json`, JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
  // tidy up old versions; not worth failing a save over
  const { blobs } = await list({ prefix: `${dir()}/${name}/`, limit: 1000 });
  const old = blobs.sort((a, b) => b.pathname.localeCompare(a.pathname)).slice(KEEP_VERSIONS);
  if (old.length) await del(old.map((b) => b.url)).catch(() => {});
}

function seedFromFiles(): Store {
  const folder = join(process.cwd(), "content", "blog");
  const posts = readdirSync(folder)
    .filter((f) => f.endsWith(".md"))
    .map((file): Doc => {
      const raw = readFileSync(join(folder, file), "utf8");
      const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!match) throw new Error(`Missing header in ${file}`);
      const meta = Object.fromEntries(
        match[1].split("\n").map((line) => {
          const at = line.indexOf(":");
          let value = line.slice(at + 1).trim();
          if (/^".*"$/.test(value)) value = value.slice(1, -1).replace(/\\"/g, '"');
          return [line.slice(0, at).trim(), value];
        }),
      );
      return {
        id: `seed-${file.replace(/\.md$/, "")}`, // stable, so edits before the first save still match
        slug: file.replace(/\.md$/, ""),
        title: meta.title,
        description: meta.description,
        date: meta.date,
        updated: `${meta.date}T12:00:00.000Z`,
        tool: meta.tool,
        status: "published",
        body: match[2].trim() + "\n",
      };
    });
  return { posts, redirects: {} };
}

export async function loadStore(): Promise<Store> {
  return (await readJson<Store>("blog")) ?? seedFromFiles();
}

export const saveStore = (store: Store) => writeJson("blog", store);

// One pending login code at a time (there is one admin).
export type LoginState = { hash: string; expires: number; attempts: number; sentAt: number };
export const loadLogin = () => readJson<LoginState>("login");
export const saveLogin = (state: LoginState | null) => writeJson("login", state ?? {});
