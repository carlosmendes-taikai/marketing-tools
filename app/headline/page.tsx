import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { HeadlineStudio } from "./HeadlineStudio";
import { RelatedGuides } from "@/components/RelatedGuides";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free headline analyzer for titles, hooks and subject lines",
  "Score a blog title, LinkedIn hook, email subject or ad headline, or check any page's title and description as Google shows them. Free, no account.",
  "/headline",
);

export default function HeadlinePage() {
  return (
    <main className="wrap">
      <header className={styles.head}>
        <h1>
          <span className={styles.line}>
            <span>Headline analyzer</span>
          </span>
        </h1>
      </header>
      <HeadlineStudio />
      <RelatedGuides tool="headline" />
    </main>
  );
}
