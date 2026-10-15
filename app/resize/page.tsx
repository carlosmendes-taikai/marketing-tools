import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { ResizeStudio } from "./ResizeStudio";
import { RelatedGuides } from "@/components/RelatedGuides";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free social media image resizer",
  "Resize one image for Instagram, LinkedIn, X, Facebook, YouTube and TikTok at once, reframe each size and download a zip. Free, and nothing is uploaded.",
  "/resize",
);

export default function ResizePage() {
  return (
    <main className="wrap">
      <header className={styles.head}>
        <h1>
          <span className={styles.line}>
            <span>Image resizer</span>
          </span>
        </h1>
      </header>
      <ResizeStudio />
      <RelatedGuides tool="resize" />
    </main>
  );
}
