import Link from "next/link";
import { SITE_NAME, AUTHOR, GITHUB_URL, CHROME_URL } from "@/lib/site";
import styles from "./chrome.module.css";

export function Footer() {
  return (
    <footer className={styles.footerOuter}>
      <div className="wrap">
        <div className={styles.footer}>
        <span>
          {SITE_NAME} · built by{" "}
          <a href="https://mendes.cc" target="_blank" rel="noreferrer">
            {AUTHOR}
          </a>
        </span>
        <span className={styles.footerLinks}>
          <a href={CHROME_URL} target="_blank" rel="noreferrer">
            Chrome extension
          </a>
          <Link href="/privacy">Privacy</Link>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            Open source on GitHub
          </a>
        </span>
        </div>
      </div>
    </footer>
  );
}
