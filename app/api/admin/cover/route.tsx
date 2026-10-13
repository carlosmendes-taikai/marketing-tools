import { isAdmin } from "@/lib/auth";
import { coverImage } from "@/lib/cover";

// Live cover preview while editing, including drafts. Admin only, so it can't be used to put any text on our domain.
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Signed out", { status: 401 });
  const params = new URL(request.url).searchParams;
  return coverImage({ title: (params.get("title") ?? "").slice(0, 140), subtitle: (params.get("subtitle") ?? "").slice(0, 160) });
}
