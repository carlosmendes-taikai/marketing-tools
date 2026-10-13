import { getPost } from "@/lib/blog";
import { coverImage } from "@/lib/cover";

// The article's cover and share image. The URL carries ?v=<last save>, so it can be cached forever.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  if (!post) return new Response("Not found", { status: 404 });
  const image = await coverImage({ title: post.title, subtitle: post.subtitle });
  image.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return image;
}
