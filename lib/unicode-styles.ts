// LinkedIn has no bold or italic. These "styles" swap letters for look-alike Unicode characters
// (Mathematical Alphanumeric Symbols), which show up styled anywhere text can be pasted.

export type StyleId = "bold" | "italic" | "boldItalic" | "boldSerif" | "italicSerif" | "mono" | "underline" | "strike";

type Ranges = { upper: number; lower: number; digit?: number; exceptions?: Record<string, number> };

const MAPS: Partial<Record<StyleId, Ranges>> = {
  bold: { upper: 0x1d5d4, lower: 0x1d5ee, digit: 0x1d7ec },
  italic: { upper: 0x1d608, lower: 0x1d622 },
  boldItalic: { upper: 0x1d63c, lower: 0x1d656 },
  boldSerif: { upper: 0x1d400, lower: 0x1d41a, digit: 0x1d7ce },
  italicSerif: { upper: 0x1d434, lower: 0x1d44e, exceptions: { h: 0x210e } },
  mono: { upper: 0x1d670, lower: 0x1d68a, digit: 0x1d7f6 },
};

const COMBINING: Partial<Record<StyleId, string>> = { underline: "̲", strike: "̶" };

export const STYLES: { id: StyleId; label: string }[] = [
  { id: "bold", label: "Bold" },
  { id: "italic", label: "Italic" },
  { id: "boldItalic", label: "Bold italic" },
  { id: "boldSerif", label: "Bold serif" },
  { id: "italicSerif", label: "Italic serif" },
  { id: "mono", label: "Monospace" },
  { id: "underline", label: "Underline" },
  { id: "strike", label: "Strikethrough" },
];

// Reverse lookup: styled character -> plain letter, for every map above.
const REVERSE = new Map<number, string>();
for (const r of Object.values(MAPS)) {
  for (let i = 0; i < 26; i++) {
    REVERSE.set(r.upper + i, String.fromCharCode(65 + i));
    REVERSE.set(r.lower + i, String.fromCharCode(97 + i));
  }
  if (r.digit) for (let i = 0; i < 10; i++) REVERSE.set(r.digit + i, String(i));
  for (const [ch, cp] of Object.entries(r.exceptions ?? {})) REVERSE.set(cp, ch);
}

/** Back to ordinary letters: undoes every style, including underline and strikethrough. */
export function toPlain(text: string): string {
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp === 0x332 || cp === 0x336) continue;
    out += REVERSE.get(cp) ?? ch;
  }
  return out;
}

export function applyStyle(text: string, style: StyleId): string {
  const plain = toPlain(text);
  const mark = COMBINING[style];
  if (mark) return [...plain].map((c) => (c === "\n" || c === " " ? c : c + mark)).join("");
  const r = MAPS[style]!;
  let out = "";
  for (const ch of plain) {
    const c = ch.charCodeAt(0);
    if (r.exceptions?.[ch]) out += String.fromCodePoint(r.exceptions[ch]);
    else if (c >= 65 && c <= 90) out += String.fromCodePoint(r.upper + c - 65);
    else if (c >= 97 && c <= 122) out += String.fromCodePoint(r.lower + c - 97);
    else if (r.digit !== undefined && c >= 48 && c <= 57) out += String.fromCodePoint(r.digit + c - 48);
    else out += ch;
  }
  return out;
}

/** True when the text already looks like this style, so the button can switch it off again. */
export function hasStyle(text: string, style: StyleId): boolean {
  if (!text.trim()) return false;
  const plain = toPlain(text);
  return plain !== text && applyStyle(plain, style) === text;
}

/** Share of letters that are styled: LinkedIn search and screen readers can't read those. */
export function styledShare(text: string): number {
  let letters = 0;
  let styled = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (REVERSE.has(cp)) {
      styled++;
      letters++;
    } else if (/[a-z0-9]/i.test(ch)) letters++;
  }
  return letters ? styled / letters : 0;
}
