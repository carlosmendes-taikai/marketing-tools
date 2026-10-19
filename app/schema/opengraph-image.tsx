import { ogImage, ogSize } from "@/lib/og";

export const alt = "Schema markup generator, free on mktbox";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage("Schema markup generator", "Structured data for FAQs, articles, products, events and local businesses.");
}
