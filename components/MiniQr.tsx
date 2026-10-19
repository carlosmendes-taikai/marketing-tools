"use client";

import { useEffect, useRef } from "react";
import type QRCodeStyling from "qr-code-styling";

const STYLE = {
  qrOptions: { errorCorrectionLevel: "Q" as const },
  dotsOptions: { type: "rounded" as const, color: "#2b2d6e" },
  cornersSquareOptions: { type: "extra-rounded" as const, color: "#6c70e0" },
  cornersDotOptions: { type: "dot" as const, color: "#6c70e0" },
  backgroundOptions: { color: "#ffffff" },
};

/** A small styled QR code for any text. Same engine and house style as the QR tool. */
export function MiniQr({ data, size = 168, className }: { data: string; size?: number; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const qr = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { default: QR } = await import("qr-code-styling");
      if (cancelled || !box.current) return;
      if (!qr.current) {
        qr.current = new QR({ type: "svg", width: size, height: size, margin: 8, data: data || " ", ...STYLE });
        box.current.innerHTML = "";
        qr.current.append(box.current);
      } else {
        qr.current.update({ data: data || " " });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data, size]);

  return <div ref={box} className={className} aria-label="QR code for this link" />;
}

/** Downloads a crisp 1024px PNG of the QR code, independent of the on-screen size. */
export async function downloadQrPng(data: string, name: string) {
  const { default: QR } = await import("qr-code-styling");
  await new QR({ type: "canvas", width: 1024, height: 1024, margin: 40, data, ...STYLE }).download({ name, extension: "png" });
}

/** The same 1024px PNG as a file in memory, for zipping many codes at once. */
export async function qrPngBlob(data: string): Promise<Blob> {
  const { default: QR } = await import("qr-code-styling");
  return (await new QR({ type: "canvas", width: 1024, height: 1024, margin: 40, data, ...STYLE }).getRawData("png")) as Blob;
}
