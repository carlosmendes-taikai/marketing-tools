import { ogImage, ogSize } from "@/lib/og";

export const alt = "UTM builder, free on untitled.tools";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("UTM builder", "Tagged campaign links, each with its own QR code.");
}
