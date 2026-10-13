import { ogImage, ogSize } from "@/lib/og";

export const alt = "QR code generator, free on untitled.tools";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("QR code generator", "Styled QR codes for links, wifi and contacts. They never expire.");
}
