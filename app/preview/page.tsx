import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { PreviewStudio } from "./PreviewStudio";
import { RelatedGuides } from "@/components/RelatedGuides";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free link preview checker for LinkedIn, X and WhatsApp",
  "See how your link looks on LinkedIn, X, WhatsApp, Slack and Facebook before you share it, and get the exact fixes for missing images and titles. Free.",
  "/preview",
);

export default function PreviewPage() {
  return (
    <main className="wrap">
      <header className={styles.head}>
        <h1>
          <span className={styles.line}>
            <span>Link preview</span>
          </span>
        </h1>
      </header>
      <PreviewStudio />
      <RelatedGuides tool="preview" />
    </main>
  );
}
