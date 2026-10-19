import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { SchemaStudio } from "./SchemaStudio";
import { RelatedGuides } from "@/components/RelatedGuides";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free schema markup generator (JSON-LD)",
  "Make structured data for FAQs, articles, products, local businesses, events and organizations. Copy the JSON-LD and test it in Google. Free, no account.",
  "/schema",
);

export default function SchemaPage() {
  return (
    <main className="wrap">
      <header className={styles.head}>
        <h1>
          <span className={styles.line}>
            <span>Schema markup generator</span>
          </span>
        </h1>
      </header>
      <SchemaStudio />
      <RelatedGuides tool="schema" />
    </main>
  );
}
