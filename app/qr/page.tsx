import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { QrStudio } from "./QrStudio";
import styles from "@/components/tool.module.css";

export const metadata: Metadata = pageMetadata(
  "Free QR code generator, no signup",
  "Make styled QR codes for links, wifi, contacts, events and more. Add your logo and a frame. Download PNG or SVG. Free, no account, never expires.",
  "/qr",
);

export default function QrPage() {
  return (
    <main className="wrap">
      <header className={styles.head}>
        <h1>
          <span className={styles.line}>
            <span>QR code generator</span>
          </span>
        </h1>
      </header>
      <QrStudio />
    </main>
  );
}
