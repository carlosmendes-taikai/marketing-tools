// Wraps the raw QR SVG in an optional frame and turns it into a downloadable file.

export type FrameKind = "none" | "card" | "pill";

export type FrameOptions = {
  kind: FrameKind;
  text: string;
  color: string;
  textColor: string;
};

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const escapeXml = (s: string) =>
  s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);

/** Returns a standalone SVG string: the QR code, plus the frame when one is picked. */
export function composeSvg(qrSvg: string, size: number, frame: FrameOptions): string {
  const inner = qrSvg.replace(/<\?xml[^>]*\?>/, "").trim();
  if (frame.kind === "none") return inner;

  const pad = Math.round(size * 0.07);
  const band = Math.round(size * 0.2);
  const w = size + pad * 2;
  const h = size + pad * 2 + band;
  const nested = inner.replace(/^<svg/, `<svg x="${pad}" y="${pad}"`);
  const text = escapeXml(frame.text || "Scan me");
  const fontSize = Math.round(band * 0.36);

  if (frame.kind === "card") {
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" rx="${pad * 1.4}" fill="${frame.color}"/>
${nested}
<text x="${w / 2}" y="${size + pad * 2 + band * 0.42}" text-anchor="middle" dominant-baseline="middle" font-family="${FONT}" font-weight="700" font-size="${fontSize}" letter-spacing="-0.5" fill="${frame.textColor}">${text}</text>
</svg>`;
  }

  // pill: QR on its own, a button-like label underneath
  const pillW = Math.min(size * 0.82, Math.max(size * 0.42, text.length * fontSize * 0.62 + pad * 2.4));
  const pillH = band * 0.62;
  const pillY = size + pad * 1.6;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
${nested}
<rect x="${(w - pillW) / 2}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${pillH / 2}" fill="${frame.color}"/>
<text x="${w / 2}" y="${pillY + pillH / 2}" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" font-weight="700" font-size="${fontSize}" letter-spacing="-0.5" fill="${frame.textColor}">${text}</text>
</svg>`;
}

export function svgToPng(svg: string, width: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    img.onload = () => {
      const ratio = img.naturalHeight / img.naturalWidth || 1;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = Math.round(width * ratio);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create PNG"))), "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not render the QR code"));
    };
    img.src = url;
  });
}

export function saveBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
