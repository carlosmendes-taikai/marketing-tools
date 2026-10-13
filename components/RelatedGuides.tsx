import Link from "next/link";
import { getPosts, postsForTool } from "@/lib/blog";
import styles from "./relatedguides.module.css";

/** Guides for a tool (at the bottom of tool pages), or more reading after an article. */
export async function RelatedGuides({ tool, exclude, title = "Guides" }: { tool: string; exclude?: string; title?: string }) {
  const own = (await postsForTool(tool)).filter((p) => p.slug !== exclude);
  // after an article, top up with other guides so there are always three to read next
  const fill = exclude ? (await getPosts()).filter((p) => p.tool !== tool && p.slug !== exclude) : [];
  const posts = [...own, ...fill].slice(0, exclude ? 3 : 6);
  if (!posts.length) return null;
  return (
    <section className={styles.wrap}>
      <h2>{title}</h2>
      <div className={styles.grid}>
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.card}>
            {/* eslint-disable-next-line @next/next/no-img-element -- already a sized PNG from our own route */}
            <img className={styles.thumb} src={p.cover} alt={p.coverAlt} width={1200} height={630} loading="lazy" />
            <b>{p.title}</b>
            <span>{p.description}</span>
            <small>{p.minutes} min read</small>
          </Link>
        ))}
      </div>
    </section>
  );
}
