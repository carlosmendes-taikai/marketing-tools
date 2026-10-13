import { cacheLife, cacheTag } from "next/cache";
import { loadStore } from "./cms";
import { renderMarkdown, type Rendered } from "./markdown";

export { TOOL_MARKER } from "./markdown";

// Articles are edited in /admin and stored in Vercel Blob (see lib/cms.ts).
// Everything here is cached under the "blog" tag; saving in the editor refreshes it.

export const BLOG_TAG = "blog";

export type Post = Rendered & {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated: string;
  tool: string;
};

/** Every published article, newest first. */
export async function getPosts(): Promise<Post[]> {
  "use cache";
  cacheTag(BLOG_TAG);
  cacheLife("max");
  const { posts } = await loadStore();
  return posts
    .filter((p) => p.status === "published")
    .map(({ slug, title, description, date, updated, tool, body }) => ({ slug, title, description, date, updated, tool, ...renderMarkdown(body) }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

export async function getPost(slug: string) {
  return (await getPosts()).find((p) => p.slug === slug);
}

/** Where an old slug points now, after a rename in the editor. */
export async function getRedirect(slug: string): Promise<string | undefined> {
  "use cache";
  cacheTag(BLOG_TAG);
  cacheLife("max");
  return (await loadStore()).redirects[slug];
}

export async function postsForTool(tool: string) {
  return (await getPosts()).filter((p) => p.tool === tool);
}

export const formatDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
