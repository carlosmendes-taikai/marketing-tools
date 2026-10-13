import { getPost, getPosts } from "@/lib/blog";
import { ogImage, ogSize } from "@/lib/og";
import { TOOLS } from "@/lib/site";

export const alt = "A guide from mktbox";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug)!;
  const tool = TOOLS.find((t) => t.slug === post.tool);
  return ogImage(post.title, tool ? `A guide by mktbox, with the free ${tool.name.toLowerCase()}.` : "A guide by mktbox.");
}
