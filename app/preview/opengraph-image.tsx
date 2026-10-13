import { ogImage, ogSize } from "@/lib/og";

export const alt = "Link preview, free on untitled.tools";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Link preview", "See your link on LinkedIn, X and WhatsApp before you share it.");
}
