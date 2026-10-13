import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { ToolsMenu } from "./ToolsMenu";
import { SaveButton } from "./SaveButton";
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
            Blog
          </Link>
          <SaveButton />
        </div>
      </div>
    </nav>
  );
}
