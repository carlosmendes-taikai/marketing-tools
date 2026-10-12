import type { Metadata } from "next";
import { SignatureStudio } from "./SignatureStudio";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = {
  title: "Free email signature generator with GIF",
  description:
    "Make a professional email signature with your photo, social icons and an animated GIF banner. Works in Gmail, Outlook and Apple Mail. Free, no account.",
};

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
    </main>
  );
}
