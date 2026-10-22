"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TOOLS, type Tool } from "@/lib/site";
import { DEMOS, useReducedMotion } from "./demos";
import styles from "./bento.module.css";


const SIZE: Record<string, string> = {
  qr: `${styles.big} ${styles.dark}`,
  vibe: styles.big,
  signature: styles.wide,
  utm: styles.wide,
  resize: styles.wide,
  headline: styles.wide,
  preview: styles.wide,
  linkedin: styles.wide,
  gif: styles.wide,
  engagement: styles.wide,
};

const ORDER_KEY = "bento-order-v1";
const DEFAULT_ORDER = TOOLS.map((t) => t.slug);

type Drag = {
  slug: string;
  el: HTMLElement;
  startX: number;
  startY: number;
  grabX: number; // where inside the card the mouse grabbed it
  grabY: number;
  tx: number; // current offset from the card's slot in the grid
  ty: number;
  x: number;
  y: number;
  started: boolean;
  lastTarget: string | null;
  hoverTarget: string | null; // the card the mouse is resting on, and since when
  hoverSince: number;
  lastSwap: number;
};

const DWELL_MS = 140; // rest on a card this long before it moves aside
const COOLDOWN_MS = 320; // and leave this long between swaps, so cards don't shuffle in a blur

/** The landing grid. Cards can be dragged onto each other to swap places (mouse only); the order is remembered. */
export function Bento() {
  const [order, setOrder] = useState(DEFAULT_ORDER);
  const [loaded, setLoaded] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const before = useRef<Map<string, DOMRect> | null>(null);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const slot = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  /** The dashed outline that shows where the dragged card will land. */
  function placeSlot() {
    const d = drag.current;
    const box = grid.current;
    if (!d?.started || !box || !slot.current) return;
    const r = d.el.getBoundingClientRect();
    const g = box.getBoundingClientRect();
    // the card's real slot is where it would be without the drag offset
    const left = r.left - d.tx - g.left;
    const top = r.top - d.ty - g.top;
    const el = slot.current;
    const first = !el.dataset.placed;
    if (first) el.style.transition = "none"; // appear in place, then glide on later moves
    Object.assign(el.style, { left: `${left}px`, top: `${top}px`, width: `${r.width / 1.03}px`, height: `${r.height / 1.03}px` });
    if (first) {
      el.dataset.placed = "1";
      requestAnimationFrame(() => (el.style.transition = ""));
    }
  }

  useEffect(() => {
    let saved: string[] | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(ORDER_KEY) ?? "null");
    } catch {}
    queueMicrotask(() => {
      if (Array.isArray(saved)) {
        // keep only tools that still exist, and add any new ones at the end
        const known = saved.filter((s) => DEFAULT_ORDER.includes(s));
        setOrder([...known, ...DEFAULT_ORDER.filter((s) => !known.includes(s))]);
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    } catch {}
  }, [order, loaded]);

  const tiles = () => [...(grid.current?.querySelectorAll<HTMLElement>("[data-slug]") ?? [])];

  /** Remember where every card is, so the next layout change can glide from there. */
  function snapshot() {
    before.current = new Map(tiles().map((el) => [el.dataset.slug!, el.getBoundingClientRect()]));
  }

  // FLIP: after a reorder, start each moved card where it was and let it glide to its new spot
  useLayoutEffect(() => {
    const prev = before.current;
    if (!prev) return;
    before.current = null;
    const d = drag.current;
    for (const el of tiles()) {
      const slug = el.dataset.slug!;
      if (d?.started && slug === d.slug) {
        // the dragged card stays under the mouse even though its slot moved
        const now = el.getBoundingClientRect();
        const baseLeft = now.left - d.tx;
        const baseTop = now.top - d.ty;
        d.tx = d.x - d.grabX - baseLeft;
        d.ty = d.y - d.grabY - baseTop;
        el.style.setProperty("--drag", `translate(${d.tx}px, ${d.ty}px)`);
        placeSlot();
        continue;
      }
      const old = prev.get(slug);
      if (!old) continue;
      const now = el.getBoundingClientRect();
      const dx = old.left - now.left;
      const dy = old.top - now.top;
      if ((dx || dy) && !reduced) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], { duration: 560, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    }
  }, [order, reduced]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    e.preventDefault(); // stops the browser starting a text selection; clicks still work
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-slug]");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    drag.current = {
      slug: el.dataset.slug!,
      el,
      startX: e.clientX,
      startY: e.clientY,
      grabX: e.clientX - rect.left,
      grabY: e.clientY - rect.top,
      tx: 0,
      ty: 0,
      x: e.clientX,
      y: e.clientY,
      started: false,
      lastTarget: null,
      hoverTarget: null,
      hoverSince: 0,
      lastSwap: 0,
    };

    const move = (ev: PointerEvent) => {
      const d = drag.current!;
      d.x = ev.clientX;
      d.y = ev.clientY;
      if (!d.started) {
        if (Math.hypot(ev.clientX - d.startX, ev.clientY - d.startY) < 6) return; // still just a click
        d.started = true;
        setDragging(d.slug);
        window.getSelection()?.removeAllRanges();
        document.body.style.userSelect = "none";
      }
      const rect = d.el.getBoundingClientRect();
      const baseLeft = rect.left - d.tx;
      const baseTop = rect.top - d.ty;
      d.tx = ev.clientX - d.grabX - baseLeft;
      d.ty = ev.clientY - d.grabY - baseTop;
      d.el.style.setProperty("--drag", `translate(${d.tx}px, ${d.ty}px)`);
      placeSlot();

      // which card is under the mouse? (the dragged card ignores the mouse while moving)
      // only its middle counts, so brushing past an edge doesn't trigger a swap
      const overEl = document.elementFromPoint(ev.clientX, ev.clientY)?.closest<HTMLElement>("[data-slug]");
      let over: string | null = null;
      if (overEl) {
        const r = overEl.getBoundingClientRect();
        const inX = Math.abs(ev.clientX - (r.left + r.width / 2)) < r.width * 0.35;
        const inY = Math.abs(ev.clientY - (r.top + r.height / 2)) < r.height * 0.35;
        if (inX && inY) over = overEl.dataset.slug!;
      }
      const now = performance.now();
      if (over !== d.hoverTarget) {
        d.hoverTarget = over;
        d.hoverSince = now;
      }
      const rested = now - d.hoverSince >= DWELL_MS;
      const cooled = now - d.lastSwap >= COOLDOWN_MS;
      if (over && over !== d.slug && over !== d.lastTarget && rested && cooled) {
        d.lastSwap = now;
        snapshot();
        setOrder((o) => {
          const next = [...o];
          const a = next.indexOf(d.slug);
          const b = next.indexOf(over);
          [next[a], next[b]] = [next[b], next[a]];
          return next;
        });
      }
      if (over !== d.lastTarget && (over === null || rested)) d.lastTarget = over;
    };
    // resting still over a card should also swap, even without moving the mouse
    const dwellTimer = setInterval(() => {
      const d = drag.current;
      if (d?.started) move(new PointerEvent("pointermove", { clientX: d.x, clientY: d.y }));
    }, 60);

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      clearInterval(dwellTimer);
      document.body.style.userSelect = "";
      const d = drag.current;
      drag.current = null;
      if (!d?.started) return;
      suppressClick.current = true; // the release after a drag isn't a click
      setTimeout(() => (suppressClick.current = false), 0);
      if (!reduced) d.el.animate([{ transform: `translate(${d.tx}px, ${d.ty}px) scale(1.03)` }, { transform: "translate(0, 0)" }], { duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
      d.el.style.removeProperty("--drag");
      setDragging(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const moved = order.some((s, i) => s !== DEFAULT_ORDER[i]);
  const bySlug = new Map(TOOLS.map((t) => [t.slug, t]));

  return (
    <>
      <div id="tools" ref={grid} className={`${styles.grid} ${dragging ? styles.sorting : ""}`} onPointerDown={onPointerDown}>
        {dragging && <div ref={slot} className={styles.slot} aria-hidden />}
        {order.map((slug, i) => (
          <Tile
            key={slug}
            tool={bySlug.get(slug)!}
            index={i}
            dragging={dragging === slug}
            onClickCapture={(e) => {
              if (suppressClick.current) e.preventDefault();
            }}
          />
        ))}
      </div>
      {moved && (
        <button
          className={styles.reset}
          onClick={() => {
            snapshot();
            setOrder(DEFAULT_ORDER);
          }}
        >
          Reset order
        </button>
      )}
    </>
  );
}

function Tile({ tool, index, dragging, onClickCapture }: { tool: Tool; index: number; dragging: boolean; onClickCapture: (e: React.MouseEvent) => void }) {
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const reduced = useReducedMotion();
  const el = useRef<HTMLAnchorElement>(null);
  const Demo = DEMOS[tool.slug];

  // phones have no hover: a demo plays while its card is mostly on screen instead
  useEffect(() => {
    const node = el.current;
    if (!node || !window.matchMedia("(hover: none)").matches) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.6 });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const active = !reduced && (hovered || inView || dragging);
  return (
    <Link
      ref={el}
      href={`/${tool.slug}`}
      data-slug={tool.slug}
      aria-labelledby={`tile-${tool.slug}`}
      aria-describedby={`tile-${tool.slug}-blurb`}
      className={`${styles.tile} ${SIZE[tool.slug] ?? styles.small} ${active ? styles.active : ""} ${dragging ? styles.dragging : ""}`}
      style={{ animationDelay: `${300 + index * 70}ms` }}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={onClickCapture}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {/* the demo is a picture of the tool: screen readers get the name and the blurb only */}
      <div className={styles.stage} aria-hidden>
        {Demo && <Demo active={active} />}
      </div>
      <h2 id={`tile-${tool.slug}`}>{tool.name}</h2>
      <p id={`tile-${tool.slug}-blurb`}>{tool.blurb}</p>
      <span className={styles.go} aria-hidden>
        →
      </span>
    </Link>
  );
}
