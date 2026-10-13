import { ImageResponse } from "next/og";
import { googleFont, ogSize } from "./og";

// The article cover template. One design for every article: warm paper, a large cropped version
// of the four-square mark bottom right, the mktbox logo top left, then title and subtitle. 1200x630, so the same
// image works on the page and as the share image. Change it here and every cover updates.

export const coverSize = ogSize;

export async function coverImage({ title, subtitle }: { title: string; subtitle: string }) {
  const text = `${title}${subtitle}mktbox`;
  const [bold, regular] = await Promise.all([googleFont("Schibsted Grotesk", 700, text), googleFont("Schibsted Grotesk", 400, text)]);
  const fonts = [
    ...(bold ? [{ name: "Schibsted", data: bold, weight: 700 as const, style: "normal" as const }] : []),
    ...(regular ? [{ name: "Schibsted", data: regular, weight: 400 as const, style: "normal" as const }] : []),
  ];
  const ink = "#141413";
  const accent = "#6c70e0";
  const size = title.length > 70 ? 58 : title.length > 50 ? 66 : title.length > 34 ? 76 : 88;
  const tile = 150; // big mark squares

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#f4f3ef",
          color: ink,
          fontFamily: fonts.length ? "Schibsted" : undefined,
        }}
      >
        {/* the logo mark, big and cropped by the bottom right corner */}
        <div style={{ position: "absolute", right: -60, bottom: -60, display: "flex", flexWrap: "wrap", width: tile * 2 + 20, gap: 20 }}>
          {["#e6e4de", accent, "#e6e4de", "#e8e8fb"].map((c, i) => (
            <div key={i} style={{ width: tile, height: tile, borderRadius: 38, background: c }} />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700, letterSpacing: -1 }}>
          <div style={{ display: "flex", flexWrap: "wrap", width: 30, gap: 4 }}>
            {[ink, accent, ink, ink].map((c, i) => (
              <div key={i} style={{ width: 13, height: 13, borderRadius: 3, background: c }} />
            ))}
          </div>
          mktbox
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 840 }}>
          <div style={{ fontSize: size, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 34, color: "#5f5d57", letterSpacing: -0.5, lineHeight: 1.3, maxWidth: 780 }}>{subtitle}</div>}
        </div>
      </div>
    ),
    { ...coverSize, fonts },
  );
}
