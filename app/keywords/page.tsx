import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { KeywordStudio } from "./KeywordStudio";
import { RelatedGuides } from "@/components/RelatedGuides";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free keyword ideas tool, questions people ask",
  "Find the questions and phrases people type into Google and YouTube about any topic. Hundreds of keyword ideas, grouped and exportable to CSV. Free, no account.",
  "/keywords",
);

export default function KeywordsPage() {
  return (
    <main className="wrap">
      <header className={styles.head}>
        <h1>
          <span className={styles.line}>
            <span>Keyword ideas</span>
          </span>
        </h1>
      </header>
      <KeywordStudio />
      <RelatedGuides tool="keywords" />
    </main>
  );
}
