import { ImageResponse } from "next/og";
import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const SITE_URL = "https://nopaywall.vercel.app";
export const ogSize = { width: 1200, height: 630 };

/** Title, description, canonical and share tags for a page, all kept in step. */
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Fetches just the glyphs needed from Google Fonts, as TTF (the format the image renderer reads). */
async function googleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`, { cache: "force-cache" })).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return src ? await (await fetch(src, { cache: "force-cache" })).arrayBuffer() : null;
  } catch {
    return null; // fall back to the default font rather than failing the build
  }
}

/** The share image: warm grey card, big headline, the four-square mark in the corner. */
export async function ogImage(headline: string, sub: string) {
  const text = `${headline}${sub}${SITE_NAME}FreeNo accountpaywall·`;
  const [bold, regular] = await Promise.all([googleFont("Schibsted Grotesk", 700, text), googleFont("Schibsted Grotesk", 400, text)]);
  const fonts = [
    ...(bold ? [{ name: "Schibsted", data: bold, weight: 700 as const, style: "normal" as const }] : []),
    ...(regular ? [{ name: "Schibsted", data: regular, weight: 400 as const, style: "normal" as const }] : []),
  ];
  const ink = "#141413";
  const accent = "#6c70e0";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f4f3ef", padding: 72, color: ink, fontFamily: fonts.length ? "Schibsted" : undefined }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30, fontWeight: 700, letterSpacing: -1 }}>
          <div style={{ display: "flex", flexWrap: "wrap", width: 30, gap: 4 }}>
            {[ink, accent, ink, ink].map((c, i) => (
              <div key={i} style={{ width: 13, height: 13, borderRadius: 3, background: c }} />
            ))}
          </div>
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: headline.length > 24 ? 84 : 104, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>{headline}</div>
          <div style={{ width: 160, height: 12, borderRadius: 6, background: accent }} />
          <div style={{ fontSize: 36, color: "#76746e", letterSpacing: -0.5, maxWidth: 900 }}>{sub}</div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 24, color: "#76746e" }}>
          <span>Free</span>
          <span>·</span>
          <span>No account</span>
          <span>·</span>
          <span>No paywall</span>
        </div>
      </div>
    ),
    { ...ogSize, fonts },
  );
}
