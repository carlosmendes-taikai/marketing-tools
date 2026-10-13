import { ogImage, ogSize } from "@/lib/og";

export const alt = "Free marketing tools. No paywall at the end.";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Free marketing tools.", "No paywall at the end. QR codes, email signatures, keyword ideas, UTM links and more.");
}
