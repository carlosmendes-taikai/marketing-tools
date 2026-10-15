import Link from "next/link";
import { SITE_NAME, CHROME_URL } from "@/lib/site";
import { ToolsMenu } from "./ToolsMenu";
import styles from "./chrome.module.css";

export function Nav() {
  return (
    <nav className={styles.navOuter}>
      <div className={`wrap ${styles.nav}`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.mark} aria-hidden>
            <i />
            <i />
            <i />
            <i />
          </span>
          {SITE_NAME}
        </Link>
        <div className={styles.links}>
          <ToolsMenu />
          <Link href="/blog" className={styles.navLink}>
            Guides
          </Link>
          <a href={CHROME_URL} target="_blank" rel="noreferrer" className={styles.cta} title="Free mktbox extension for Chrome, Edge, Brave and Arc" aria-label="Add mktbox to Chrome">
            {/* puzzle piece: the browser's own sign for an extension */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
              <path d="M9 4.5a2.5 2.5 0 0 1 5 0V6h4a1 1 0 0 1 1 1v4h-1.5a2.5 2.5 0 0 0 0 5H19v4a1 1 0 0 1-1 1h-4v-1.5a2.5 2.5 0 0 0-5 0V21H5a1 1 0 0 1-1-1v-4h1.5a2.5 2.5 0 0 0 0-5H4V7a1 1 0 0 1 1-1h4z" />
            </svg>
            <span className={styles.ctaLong}>Add to Chrome</span>
            <span className={styles.ctaShort}>Extension</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
