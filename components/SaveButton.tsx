"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./savebutton.module.css";

/** Browsers don't let sites add bookmarks, so this shows the right shortcut for the visitor's device. */
export function SaveButton() {
  const [tip, setTip] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function show() {
    const ua = navigator.userAgent;
    const touch = window.matchMedia("(hover: none)").matches;
    const mac = /Mac|iPhone|iPad/.test(ua);
    const message = touch
      ? mac
        ? "Tap Share, then Add to Home Screen"
        : "Open the browser menu, then Add to Home screen"
      : mac
        ? "Press ⌘ D to bookmark mktbox"
        : "Press Ctrl D to bookmark mktbox";
    setTip(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setTip(null), 3500);
  }

  return (
    <div className={styles.root}>
      <button className={`${styles.button} ${tip ? styles.on : ""}`} onClick={show} aria-label="Save mktbox for later">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
          <path d="M6 3h12v18l-6-4.5L6 21z" />
        </svg>
        Save
      </button>
      {tip && (
        <div className={styles.tip} role="status">
          {tip}
        </div>
      )}
    </div>
  );
}
