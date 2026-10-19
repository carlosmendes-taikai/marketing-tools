"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ToolDemo } from "./Bento";
import { GROUPS, TOOLS } from "@/lib/site";
import styles from "./toolsmenu.module.css";

const LIVE = TOOLS.filter((t) => t.live);
// hover-to-open only where there's a real mouse; phones get a plain tap to open and close
const canHover = () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** "Tools" in the nav: tools grouped in two columns on the left, the hovered tool's live demo on the right. */
export function ToolsMenu() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(LIVE[0].slug);
  const root = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverOpenedAt = useRef(0);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (!open) hoverOpenedAt.current = Date.now();
    setOpen(true);
  };
  // hovering already opened it, so a click that lands right after shouldn't close it again
  const toggle = () => {
    if (canHover() && Date.now() - hoverOpenedAt.current < 600) return;
    setOpen((o) => !o);
  };
  // a short grace period so moving the mouse from the button to the panel doesn't close it
  const hideSoon = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = LIVE.find((t) => t.slug === active)!;

  return (
    <div
      ref={root}
      className={styles.root}
      onPointerEnter={(e) => e.pointerType === "mouse" && canHover() && show()}
      onPointerLeave={(e) => e.pointerType === "mouse" && canHover() && hideSoon()}
    >
      <button className={`${styles.trigger} ${open ? styles.open : ""}`} aria-expanded={open} aria-haspopup="true" onClick={toggle}>
        Tools
        <span className={styles.chev} aria-hidden />
      </button>

      {open && (
        <div className={styles.panel} role="menu">
          <div className={styles.groups}>
            {GROUPS.map((g, gi) => (
              <div key={g} className={styles.group}>
                <h3>{g}</h3>
                <ul className={styles.list}>
                  {LIVE.filter((t) => t.group === g).map((t, i) => (
                    <li key={t.slug} style={{ animationDelay: `${(gi * 3 + i) * 18}ms` }}>
                      <Link
                        href={`/${t.slug}`}
                        role="menuitem"
                        className={t.slug === active ? styles.on : ""}
                        onPointerEnter={() => setActive(t.slug)}
                        onFocus={() => setActive(t.slug)}
                        onClick={() => setOpen(false)}
                      >
                        {t.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Link href={`/${current.slug}`} className={styles.preview} onClick={() => setOpen(false)} tabIndex={-1}>
            <div className={styles.demo} key={current.slug}>
              <ToolDemo slug={current.slug} />
            </div>
            <div className={styles.caption}>
              <span>
                <b>{current.name}</b>
                <small>{current.blurb}</small>
              </span>
              <span className={styles.go} aria-hidden>
                →
              </span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
