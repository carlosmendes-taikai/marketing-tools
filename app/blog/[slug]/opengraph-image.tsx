import { getPost, getPosts } from "@/lib/blog";
import { ogImage, ogSize } from "@/lib/og";
import { TOOLS, nameInSentence } from "@/lib/site";

export const alt = "A guide from mktbox";
export const size = ogSize;
export const contentType = "image/png";

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  if (!post) return ogImage("Marketing guides", "Free tools and plain-English guides by mktbox.");
  const tool = TOOLS.find((t) => t.slug === post.tool);
  return ogImage(post.title, tool ? `A guide by mktbox, with the free ${nameInSentence(tool.name)}.` : "A guide by mktbox.");
}
