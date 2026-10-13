import { ogImage, ogSize } from "@/lib/og";

export const alt = "Email signature, free on untitled.tools";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Email signature", "Signatures with an animated GIF that work in Gmail and Outlook.");
}
