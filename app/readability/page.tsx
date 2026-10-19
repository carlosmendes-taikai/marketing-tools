import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { ReadabilityStudio } from "./ReadabilityStudio";
import { RelatedGuides } from "@/components/RelatedGuides";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free readability checker for marketing copy",
  "Check the reading level of any text and see long sentences, passive voice, filler words and buzzwords highlighted as you type. Free, no account.",
  "/readability",
);

export default function ReadabilityPage() {
  return (
    <main className="wrap">
      <header className={styles.head}>
        <h1>
          <span className={styles.line}>
            <span>Readability checker</span>
          </span>
        </h1>
      </header>
      <ReadabilityStudio />
      <RelatedGuides tool="readability" />
    </main>
  );
}
