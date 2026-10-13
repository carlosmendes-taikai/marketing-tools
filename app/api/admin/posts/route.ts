import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { BLOG_TAG } from "@/lib/blog";
import { loadStore, saveStore, type Doc } from "@/lib/cms";
import { slugify } from "@/lib/markdown";
import { TOOLS } from "@/lib/site";

const denied = () => NextResponse.json({ error: "Signed out. Log in again." }, { status: 401 });
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

// show changes on the live site straight away, not on the visit after next
const refresh = () => revalidateTag(BLOG_TAG, { expire: 0 });

export async function GET() {
  if (!(await isAdmin())) return denied();
  return NextResponse.json(await loadStore());
}

/** Create or update one article. `prevUpdated` guards against overwriting a newer save from another tab. */
export async function PUT(request: Request) {
  if (!(await isAdmin())) return denied();
  const input = (await request.json()) as Partial<Doc> & { prevUpdated?: string };

  const title = String(input.title ?? "").trim();
  const slug = slugify(String(input.slug ?? "") || title);
  const date = String(input.date ?? "");
  const tool = String(input.tool ?? "");
  if (!title) return bad("Add a title.");
  if (!slug) return bad("Add a URL slug.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad("The date should look like 2026-10-13.");
  if (tool && !TOOLS.some((t) => t.slug === tool)) return bad("Unknown tool.");

  const store = await loadStore();
  const index = input.id ? store.posts.findIndex((p) => p.id === input.id) : -1;
  const existing = index >= 0 ? store.posts[index] : undefined;
  if (existing && input.prevUpdated && existing.updated !== input.prevUpdated) return bad("This article was changed somewhere else. Reload to get the latest version.", 409);
  if (store.posts.some((p) => p.slug === slug && p.id !== existing?.id)) return bad(`Another article already uses /blog/${slug}.`, 409);

  const doc: Doc = {
    id: existing?.id ?? randomUUID(),
    slug,
    title,
    description: String(input.description ?? "").trim(),
    date,
    updated: new Date().toISOString(),
    tool,
    status: input.status === "draft" ? "draft" : "published",
    body: String(input.body ?? ""),
    subtitle: String(input.subtitle ?? "").trim(),
    coverAlt: String(input.coverAlt ?? "").trim(),
  };

  // renamed: send the old address (and anything that pointed at it) to the new one
  if (existing && existing.slug !== slug) {
    for (const [from, to] of Object.entries(store.redirects)) if (to === existing.slug) store.redirects[from] = slug;
    store.redirects[existing.slug] = slug;
  }
  delete store.redirects[slug];

  if (existing) store.posts[index] = doc;
  else store.posts.push(doc);
  await saveStore(store);
  refresh();
  return NextResponse.json({ post: doc, redirects: store.redirects });
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return denied();
  const id = new URL(request.url).searchParams.get("id");
  const store = await loadStore();
  const post = store.posts.find((p) => p.id === id);
  if (!post) return bad("Article not found.", 404);
  store.posts = store.posts.filter((p) => p.id !== id);
  for (const [from, to] of Object.entries(store.redirects)) if (to === post.slug) delete store.redirects[from];
  await saveStore(store);
  refresh();
  return NextResponse.json({ ok: true });
}
