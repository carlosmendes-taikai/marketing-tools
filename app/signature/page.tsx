import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { SignatureStudio } from "./SignatureStudio";
import { RelatedGuides } from "@/components/RelatedGuides";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free email signature generator with GIF",
  "Make a professional email signature with your photo, social icons and an animated GIF banner. Works in Gmail, Outlook and Apple Mail. Free, no account.",
  "/signature",
);

export default function SignaturePage() {
  return (
    <main className="wrap">
      <header className={styles.head}>
        <h1>
          <span className={styles.line}>
            <span>Email signature</span>
          </span>
        </h1>
      </header>
      <SignatureStudio />
      <RelatedGuides tool="signature" />
    </main>
  );
}
