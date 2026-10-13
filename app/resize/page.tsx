import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { ResizeStudio } from "./ResizeStudio";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free social media image resizer",
  "Resize one image for Instagram, LinkedIn, X, Facebook, YouTube, TikTok and Pinterest at once. Drag to reframe each size, download all as a zip. Free, and your image never leaves your device.",
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
    </main>
  );
}
