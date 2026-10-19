// Readability for marketing copy: Flesch reading ease, grade level, and the sentences and words that slow readers down.
// Runs entirely in the browser. English only.

export type MarkKind = "long" | "veryLong" | "passive" | "adverb" | "filler" | "simpler" | "buzzword";

export type Mark = { start: number; end: number; kind: MarkKind; tip: string };

export type Report = {
  words: number;
  sentences: number;
  syllables: number;
  ease: number; // Flesch reading ease, 0-100 (higher is easier)
  grade: number; // Flesch-Kincaid grade level
  label: string;
  readMin: number;
  speakMin: number;
  avgSentence: number;
  longest: number;
  marks: Mark[];
  sentenceRanges: { start: number; end: number; words: number }[];
};

export const KIND_INFO: Record<MarkKind, { label: string; plural: string }> = {
  veryLong: { label: "Very long sentence", plural: "very long sentences" },
  long: { label: "Long sentence", plural: "long sentences" },
  passive: { label: "Passive voice", plural: "passive voice" },
  simpler: { label: "Simpler word", plural: "simpler words" },
  buzzword: { label: "Buzzword", plural: "buzzwords" },
  filler: { label: "Filler", plural: "fillers" },
  adverb: { label: "Adverb", plural: "adverbs" },
};

// Wordy phrases and the plain word to use instead
const SIMPLER: [string, string][] = [
  ["in order to", "to"],
  ["due to the fact that", "because"],
  ["at this point in time", "now"],
  ["at the present time", "now"],
  ["in the event that", "if"],
  ["for the purpose of", "for"],
  ["with regard to", "about"],
  ["with respect to", "about"],
  ["in regard to", "about"],
  ["a number of", "some"],
  ["a majority of", "most"],
  ["is able to", "can"],
  ["are able to", "can"],
  ["has the ability to", "can"],
  ["have the ability to", "can"],
  ["it is important to note that", "(cut it)"],
  ["prior to", "before"],
  ["subsequent to", "after"],
  ["in spite of the fact that", "although"],
  ["utilize", "use"],
  ["utilise", "use"],
  ["utilization", "use"],
  ["facilitate", "help"],
  ["commence", "start"],
  ["terminate", "end"],
  ["endeavor", "try"],
  ["endeavour", "try"],
  ["purchase", "buy"],
  ["approximately", "about"],
  ["assistance", "help"],
  ["demonstrate", "show"],
  ["numerous", "many"],
  ["sufficient", "enough"],
  ["additional", "more"],
  ["individuals", "people"],
  ["regarding", "about"],
  ["obtain", "get"],
  ["require", "need"],
  ["requires", "needs"],
  ["optimal", "best"],
  ["implement", "do, set up"],
  ["methodology", "method"],
  ["functionality", "features"],
  ["initiate", "start"],
  ["ascertain", "find out"],
  ["modification", "change"],
];

// Marketing words that sound impressive and say nothing
const BUZZWORDS = [
  "synergy", "synergies", "leverage", "leveraging", "cutting-edge", "cutting edge", "best-in-class", "world-class", "game-changer", "game-changing",
  "next-gen", "next-generation", "seamless", "seamlessly", "revolutionary", "revolutionize", "disruptive", "innovative", "robust", "holistic",
  "paradigm", "empower", "empowers", "empowering", "unlock", "unlocks", "unleash", "supercharge", "elevate", "elevates", "streamline", "streamlines", "streamlined", "leverages", "scalable", "turnkey",
  "state-of-the-art", "mission-critical", "value-add", "best practices", "thought leader", "move the needle", "circle back", "low-hanging fruit",
  "end-to-end", "one-stop shop", "frictionless", "transformative", "unparalleled", "unprecedented",
];

const FILLERS = [
  "very", "really", "just", "actually", "basically", "literally", "quite", "rather", "totally", "completely", "simply", "definitely",
  "certainly", "somewhat", "extremely", "kind of", "sort of", "in fact", "needless to say", "of course", "truly", "honestly",
];

// -ly words that aren't adverbs (or are fine)
const NOT_ADVERBS = new Set(
  "only family early reply apply supply daily weekly monthly yearly hourly quarterly friendly likely unlikely lovely ugly holy july italy belly rely fly ally imply bully silly jelly costly timely lonely elderly curly emily assembly anomaly butterfly multiply comply rally tally holly orderly scholarly ally supply reply really homely lively deadly chilly hilly oily wily woolly folly jolly sully bodily".split(
    " ",
  ),
);

const PARTICIPLES =
  "known made done given taken seen written built shown sent paid found kept held told sold left brought bought thought chosen driven eaten fallen forgotten gone hidden begun broken spoken stolen worn torn grown thrown drawn led meant understood caught taught won hung spent lost felt heard";
const PASSIVE = new RegExp(`\\b(am|is|are|was|were|be|been|being)\\s+(?:\\w+ly\\s+)?(\\w+ed|${PARTICIPLES.split(" ").join("|")})\\b`, "gi");

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const phraseRe = (list: string[]) => new RegExp(`\\b(${[...list].sort((a, b) => b.length - a.length).map(escape).join("|")})\\b`, "gi");
const SIMPLER_RE = phraseRe(SIMPLER.map(([p]) => p));
const SIMPLER_MAP = new Map(SIMPLER.map(([p, s]) => [p, s]));
const BUZZ_RE = phraseRe(BUZZWORDS);
const FILLER_RE = phraseRe(FILLERS);

export function syllables(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const groups = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

/** Sentences end at . ! ? or a line break (headlines and bullets count as their own sentence). */
function sentenceRanges(text: string) {
  const out: { start: number; end: number; words: number }[] = [];
  const re = /[^.!?\n]+(?:[.!?]+["')\]]*|$)/g;
  for (const m of text.matchAll(re)) {
    const raw = m[0];
    const lead = raw.length - raw.trimStart().length;
    const body = raw.trim();
    if (!body) continue;
    const words = body.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)?.length ?? 0;
    if (!words) continue;
    out.push({ start: m.index! + lead, end: m.index! + lead + body.length, words });
  }
  return out;
}

function easeLabel(ease: number) {
  if (ease >= 90) return "Very easy";
  if (ease >= 80) return "Easy";
  if (ease >= 70) return "Fairly easy";
  if (ease >= 60) return "Plain English";
  if (ease >= 50) return "Fairly hard";
  if (ease >= 30) return "Hard";
  return "Very hard";
}

export function analyze(text: string): Report {
  const ranges = sentenceRanges(text);
  const wordList = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? [];
  const words = wordList.length;
  const sentences = Math.max(1, ranges.length);
  const syl = wordList.reduce((a, w) => a + syllables(w), 0);
  const wps = words / sentences;
  const spw = words ? syl / words : 0;
  const ease = words ? Math.max(0, Math.min(100, 206.835 - 1.015 * wps - 84.6 * spw)) : 0;
  const grade = words ? Math.max(0, 0.39 * wps + 11.8 * spw - 15.59) : 0;

  const marks: Mark[] = [];
  for (const r of ranges) {
    if (r.words > 35) marks.push({ start: r.start, end: r.end, kind: "veryLong", tip: `${r.words} words. Split it into two or three sentences.` });
    else if (r.words > 25) marks.push({ start: r.start, end: r.end, kind: "long", tip: `${r.words} words. Try cutting it down or splitting it.` });
  }
  const add = (re: RegExp, kind: MarkKind, tip: (m: RegExpMatchArray) => string, keep: (m: RegExpMatchArray) => boolean = () => true) => {
    for (const m of text.matchAll(re)) if (keep(m)) marks.push({ start: m.index!, end: m.index! + m[0].length, kind, tip: tip(m) });
  };
  add(PASSIVE, "passive", (m) => `"${m[0]}": say who does it. "We sent the report" beats "the report was sent".`);
  add(SIMPLER_RE, "simpler", (m) => `Try "${SIMPLER_MAP.get(m[0].toLowerCase())}" instead of "${m[0]}".`);
  add(BUZZ_RE, "buzzword", (m) => `"${m[0]}" sounds big but says little. Say what it actually does.`);
  add(FILLER_RE, "filler", (m) => `"${m[0]}" rarely adds anything. Try the sentence without it.`);
  add(/\b[\p{L}]{4,}ly\b/gu, "adverb", (m) => `"${m[0]}": a stronger verb usually does the job on its own.`, (m) => !NOT_ADVERBS.has(m[0].toLowerCase()) && !FILLERS.includes(m[0].toLowerCase()));

  // word marks must not overlap each other: keep the first, in priority order
  const priority: MarkKind[] = ["passive", "simpler", "buzzword", "filler", "adverb"];
  const wordMarks = marks.filter((m) => priority.includes(m.kind)).sort((a, b) => a.start - b.start || priority.indexOf(a.kind) - priority.indexOf(b.kind));
  const kept: Mark[] = [];
  for (const m of wordMarks) if (!kept.length || m.start >= kept[kept.length - 1].end) kept.push(m);

  return {
    words,
    sentences: ranges.length,
    syllables: syl,
    ease: Math.round(ease),
    grade: Math.round(grade * 10) / 10,
    label: easeLabel(ease),
    readMin: words / 238,
    speakMin: words / 150,
    avgSentence: Math.round(wps * 10) / 10,
    longest: ranges.reduce((a, r) => Math.max(a, r.words), 0),
    marks: [...marks.filter((m) => m.kind === "long" || m.kind === "veryLong"), ...kept],
    sentenceRanges: ranges,
  };
}

export const AUDIENCES = [
  { id: "everyone", label: "Everyone", grade: 8, note: "Social posts, ads, landing pages and emails." },
  { id: "business", label: "Business readers", grade: 10, note: "B2B pages, newsletters and LinkedIn articles." },
  { id: "expert", label: "Experts", grade: 12, note: "Technical docs and whitepapers." },
] as const;

export type AudienceId = (typeof AUDIENCES)[number]["id"];

export const EXAMPLE = `In order to facilitate seamless collaboration across teams, our innovative platform has been designed to leverage cutting-edge technology that empowers individuals to really unlock their full potential and ultimately drive measurable results for the business.

Reports are generated automatically every week. It's basically very simple to set up, and you can start in minutes.

Try it free today.`;
