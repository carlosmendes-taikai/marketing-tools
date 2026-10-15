import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { VibeStudio } from "./VibeStudio";
import { RelatedGuides } from "@/components/RelatedGuides";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free vibe code audit for Lovable, Base44 and Bolt apps",
  "Check a Lovable, Base44 or Bolt app for leaked API keys, missing security headers, pages Google can't read and heavy JavaScript. Free, no account.",
  "/vibe",
);

export default function VibePage() {
  return (
    <main className="wrap">
      <header className={styles.head}>
        <h1>
          <span className={styles.line}>
            <span>Vibe code audit</span>
          </span>
        </h1>
      </header>
      <VibeStudio />
      <RelatedGuides tool="vibe" />
    </main>
  );
}
