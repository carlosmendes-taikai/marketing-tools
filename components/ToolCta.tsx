"use client";

import Link from "next/link";
import { useState } from "react";
import { ToolDemo } from "./Bento";
import { TOOLS } from "@/lib/site";
import styles from "./toolcta.module.css";

/** The live tool card dropped into articles: its demo plays while hovered, like on the homepage. */
export function ToolCta({ slug, variant = "inline" }: { slug: string; variant?: "inline" | "end" }) {
  const [active, setActive] = useState(false);
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return null;
  return (
    <Link
      href={`/${slug}`}
      className={`${styles.card} ${variant === "end" ? styles.end : ""}`}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <div className={styles.demo}>
        <ToolDemo slug={slug} active={active} />
      </div>
      <div className={styles.text}>
        <small>{variant === "end" ? "Ready to try it?" : "Free tool"}</small>
        <b>{tool.name}</b>
        <span>{tool.blurb}</span>
        <em className={styles.button}>
          Open the {/^[A-Z][a-z]+\b/.test(tool.name) ? tool.name[0].toLowerCase() + tool.name.slice(1) : tool.name} <span aria-hidden>→</span>
        </em>
      </div>
    </Link>
  );
}
