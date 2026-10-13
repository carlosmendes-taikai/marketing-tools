import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Home-screen icon: the four-square mark on the site's warm grey.
export default function AppleIcon() {
  const ink = "#141413";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f3ef" }}>
        <div style={{ display: "flex", flexWrap: "wrap", width: 104, gap: 12 }}>
          {[ink, "#6c70e0", ink, ink].map((c, i) => (
            <div key={i} style={{ width: 46, height: 46, borderRadius: 13, background: c }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
