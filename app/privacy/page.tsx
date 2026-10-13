import type { Metadata } from "next";
import { pageMetadata } from "@/lib/og";
import { GITHUB_URL } from "@/lib/site";
import styles from "../blog/blog.module.css";

export const metadata: Metadata = pageMetadata(
  "Privacy",
  "What mktbox and the mktbox Chrome extension do with your data: no accounts, no ads, no selling, and most tools run entirely in your browser.",
  "/privacy",
);

export default function PrivacyPage() {
  return (
    <main className="wrap">
      <article className={styles.article} style={{ maxWidth: 720, margin: "0 auto" }}>
        <header className={styles.header}>
          <h1>Privacy</h1>
          <p className={styles.lead}>Short version: no accounts, no ads, nothing sold, and most tools never send your data anywhere.</p>
          <p className={styles.meta}>Last updated 13 October 2026</p>
        </header>
        <div className={styles.prose}>
          <h2>The website</h2>
          <p>
            You don&apos;t need an account to use mktbox. We use Vercel Web Analytics to count page views. It doesn&apos;t use cookies and doesn&apos;t identify you.
          </p>
          <p>Some tools run entirely in your browser and send nothing to us:</p>
          <ul>
            <li>QR code generator, image resizer, GIF animator, headline analyzer and LinkedIn post formatter.</li>
            <li>Links you save in the UTM builder, and your recent searches, are stored only in your own browser.</li>
          </ul>
          <p>Other tools need to send what you type to work:</p>
          <ul>
            <li>
              <strong>Link preview</strong> fetches the page you enter, from our server.
            </li>
            <li>
              <strong>Page speed audit</strong> sends the address you enter to Google PageSpeed Insights.
            </li>
            <li>
              <strong>Keyword ideas</strong> sends your search term to Google and YouTube autocomplete.
            </li>
            <li>
              <strong>Vibe code audit</strong> reads the public page, code files and a few standard files of the app you enter, from our server. It never logs in or reads its database.
            </li>
            <li>
              <strong>Email signature</strong> uploads images you add to file storage, so they can show in emails. Anyone with the link can see them.
            </li>
          </ul>
          <p>We don&apos;t keep logs of what you enter beyond what our hosting provider needs to run the site.</p>

          <h2>The Chrome extension</h2>
          <p>
            The extension reads the address and title of the tab you&apos;re on, only when you open it or use its right-click menu. It uses them to draw a QR code
            and build a tagged link inside the extension. Nothing is sent anywhere.
          </p>
          <p>
            When you click a button that opens a mktbox tool (like link preview or speed audit), the page address, selected text or image address goes to
            mktbox.xyz in that link, and the tool then works as described above.
          </p>
          <p>
            The extension remembers your last tab, channel and campaign name on your own computer. It has no access to your browsing history, and it can only see
            a page when you use it there.
          </p>

          <h2>Questions</h2>
          <p>
            mktbox is open source, so you can check all of this in the code. For questions, open an issue on{" "}
            <a href={GITHUB_URL} target="_blank" rel="noopener">
              GitHub
            </a>
            .
          </p>
        </div>
      </article>
    </main>
  );
}
