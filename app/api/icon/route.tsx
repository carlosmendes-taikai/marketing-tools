import { ImageResponse } from "next/og";
import { SOCIAL_PATHS } from "@/lib/social-icons";

// Email apps don't render SVG, so social icons are served as PNGs in any color.
// /api/icon?n=linkedin&c=6c70e0&s=circle
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = SOCIAL_PATHS[searchParams.get("n") ?? ""];
  if (!path) return new Response("Unknown icon", { status: 404 });

  const hex = (searchParams.get("c") ?? "141413").replace(/[^0-9a-f]/gi, "").slice(0, 6).padEnd(6, "0");
  const color = `#${hex}`;
  const circle = searchParams.get("s") !== "plain";
  const size = 96;

  return new ImageResponse(
    circle ? (
      <div style={{ width: size, height: size, borderRadius: size, background: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={52} height={52} viewBox="0 0 24 24">
          <path d={path} fill="#ffffff" />
        </svg>
      </div>
    ) : (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={80} height={80} viewBox="0 0 24 24">
          <path d={path} fill={color} />
        </svg>
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}
