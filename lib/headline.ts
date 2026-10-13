// Rule-based headline scoring. No AI: word lists, length targets and a few patterns that
// consistently separate headlines people click from ones they scroll past.

export type Context = "seo" | "linkedin" | "email" | "ad";

export const CONTEXTS: { id: Context; label: string; chars: [number, number]; words: [number, number]; note: string }[] = [
  { id: "seo", label: "Blog or SEO title", chars: [50, 60], words: [6, 12], note: "Google shows about 60 characters before cutting it off." },
  { id: "linkedin", label: "LinkedIn hook", chars: [40, 110], words: [6, 18], note: "The first lines decide if people tap \"…more\"." },
  { id: "email", label: "Email subject", chars: [28, 45], words: [4, 9], note: "Phones show about 40 characters of a subject line." },
  { id: "ad", label: "Ad headline", chars: [20, 30], words: [3, 6], note: "Google Ads headlines are capped at 30 characters." },
];

const set = (s: string) => new Set(s.split(/\s+/).filter(Boolean));

const COMMON = set(`a about after all also an and any are as at be because been but by can come could day do does even first for from get give go good have he her him his how i if in into is it its just know like look make me most my new no not now of on one only or other our out over people say see she so some take than that the their them then there these they thing think this time to two up us use very want way we well what when which who will with work would year you your`);

const POWER = set(`absolutely amazing best biggest boost breakthrough brilliant certified complete confidential crucial definitive easy effortless essential exclusive expert fast fearless free guaranteed hidden honest huge incredible instant insider killer launch lessons limited little-known massive master mistakes must never now powerful proven quick rare remarkable revealed revolutionary secret secrets shocking simple simply smart snapshot startling step-by-step strategies stunning success surprising timeless tips ultimate uncover unique unlock unusual urgent vital winning wonderful worst`);

const EMOTIONAL = set(`afraid alarming amazing angry anxious awesome beautiful blissful brave broke cheat crazy danger dead delight devastating disaster dream embarrassing epic fail fear forbidden furious genius glorious grateful guilty happy hate heartbreaking hilarious hope horrible hurt insane inspiring jaw-dropping joy love lonely lost lucky miracle nightmare painful panic perfect proud regret risky sad scary shame shocking sick stress struggle stupid terrible thrilled tragic trapped ugly unbelievable unforgettable upset weird wrong worry`);

const POSITIVE = set(`amazing awesome best better boost brilliant easy effortless free genius great happy love lucky perfect powerful proven simple smart success thrilled ultimate win winning wonderful grow growth faster`);
const NEGATIVE = set(`avoid bad dead disaster fail failing fear hate horrible mistake mistakes never nightmare pain problem regret risk scary stop struggle terrible ugly wrong worst lose losing broke stuck`);
const FILLER = set(`very really just things stuff basically actually literally quite somewhat various several`);
const CLICKBAIT = [/you won'?t believe/i, /what happened next/i, /will shock you/i, /this one trick/i, /doctors hate/i];

export type WordKind = "common" | "uncommon" | "emotional" | "power";

export type Analysis = {
  text: string;
  score: number;
  grade: "Strong" | "Good" | "Needs work";
  chars: number;
  words: { word: string; kind: WordKind }[];
  balance: Record<WordKind, number>; // share of words, 0 to 1
  type: "List" | "How-to" | "Question" | "Guide" | "Statement";
  sentiment: "Positive" | "Negative" | "Neutral";
  checks: { level: "pass" | "warn" | "fail"; title: string; tip: string }[];
  firstWords: string;
  lastWords: string;
};

const clean = (w: string) => w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

export function analyze(raw: string, context: Context): Analysis {
  const text = raw.replace(/\s+/g, " ").trim();
  const ctx = CONTEXTS.find((c) => c.id === context)!;
  const tokens = text.split(" ").filter((t) => clean(t));
  const words = tokens.map((t) => {
    const w = clean(t);
    const kind: WordKind = POWER.has(w) ? "power" : EMOTIONAL.has(w) ? "emotional" : COMMON.has(w) ? "common" : "uncommon";
    return { word: t, kind };
  });
  const n = words.length || 1;
  const share = (k: WordKind) => words.filter((w) => w.kind === k).length / n;
  const balance = { common: share("common"), uncommon: share("uncommon"), emotional: share("emotional"), power: share("power") };
  const chars = [...text].length;
  const lower = words.map((w) => clean(w.word));
  const checks: Analysis["checks"] = [];
  let score = 0;

  // length (25)
  const [cMin, cMax] = ctx.chars;
  if (chars >= cMin && chars <= cMax) {
    score += 25;
    checks.push({ level: "pass", title: `Length is right (${chars} characters)`, tip: ctx.note });
  } else {
    const off = chars < cMin ? cMin - chars : chars - cMax;
    score += Math.max(0, 25 - off * 0.8);
    checks.push({
      level: off > 15 ? "fail" : "warn",
      title: chars < cMin ? `A bit short (${chars} characters)` : `Too long (${chars} characters)`,
      tip: chars < cMin ? `Aim for ${cMin} to ${cMax}. Add the benefit or a specific detail.` : `Aim for ${cMin} to ${cMax}. ${ctx.note}`,
    });
  }
  const [wMin, wMax] = ctx.words;
  if (words.length < wMin || words.length > wMax) {
    score -= 3;
    checks.push({ level: "warn", title: `${words.length} words`, tip: `${wMin} to ${wMax} words tends to work best here.` });
  }

  // word balance (25)
  const inRange = (v: number, lo: number, hi: number) => (v >= lo && v <= hi ? 1 : Math.max(0, 1 - Math.min(Math.abs(v - lo), Math.abs(v - hi)) * 4));
  score += 7 * inRange(balance.common, 0.2, 0.35) + 6 * inRange(balance.uncommon, 0.1, 0.45) + 6 * inRange(balance.emotional, 0.08, 0.2) + (balance.power > 0 ? 6 : 0);
  if (balance.power === 0) checks.push({ level: "warn", title: "No power words", tip: "Words like proven, simple, secret or ultimate make people stop scrolling." });
  else checks.push({ level: "pass", title: "Has a power word", tip: "" });
  if (balance.emotional === 0) checks.push({ level: "warn", title: "No emotional words", tip: "A word that makes people feel something (love, fear, mistake, perfect) lifts clicks." });
  if (balance.common > 0.5) checks.push({ level: "warn", title: "Mostly filler-type words", tip: "Swap a few small words for specific ones." });

  // headline type (10)
  const type: Analysis["type"] = /^(the |top )?\d/i.test(text)
    ? "List"
    : /^how (to|i|we|you)\b/i.test(text)
      ? "How-to"
      : /\?$/.test(text)
        ? "Question"
        : /\bguide\b/i.test(text)
          ? "Guide"
          : "Statement";
  score += type === "Statement" ? 4 : 10;
  if (type === "Statement") checks.push({ level: "warn", title: "Plain statement", tip: "Lists (\"7 ways…\"), how-tos and questions usually win more clicks." });
  else checks.push({ level: "pass", title: `${type} headline`, tip: "" });

  // numbers (5)
  if (/\d/.test(text)) score += 5;
  else if (type !== "List") checks.push({ level: "warn", title: "No number", tip: "Specific numbers (7 tips, 3 minutes, 40%) feel concrete and get more clicks." });

  // sentiment (15)
  const pos = lower.filter((w) => POSITIVE.has(w)).length;
  const neg = lower.filter((w) => NEGATIVE.has(w)).length;
  const sentiment: Analysis["sentiment"] = pos > neg ? "Positive" : neg > pos ? "Negative" : "Neutral";
  score += sentiment === "Neutral" ? 5 : 15;
  if (sentiment === "Neutral") checks.push({ level: "warn", title: "Neutral tone", tip: "Headlines with a clear positive or negative angle outperform neutral ones." });

  // clarity (20)
  let clarity = 20;
  const fillers = lower.filter((w) => FILLER.has(w));
  if (fillers.length) {
    clarity -= 5 * fillers.length;
    checks.push({ level: "warn", title: `Filler: ${[...new Set(fillers)].join(", ")}`, tip: "These words take space without adding meaning. Cut them." });
  }
  // capitals count as shouting for real words; short acronyms like SEO or AI are fine
  const shouting = tokens.filter((t) => {
    const w = clean(t);
    return t === t.toUpperCase() && /\p{L}/u.test(t) && w.length >= 3 && (w.length > 4 || COMMON.has(w) || POWER.has(w) || EMOTIONAL.has(w));
  });
  if (shouting.length) {
    clarity -= 6;
    checks.push({ level: "warn", title: "ALL CAPS words", tip: "Caps read as shouting. Use one at most." });
  }
  if ((text.match(/!/g) ?? []).length > 1) {
    clarity -= 4;
    checks.push({ level: "warn", title: "Several exclamation marks", tip: "One is plenty, often none." });
  }
  if (CLICKBAIT.some((r) => r.test(text))) {
    clarity -= 10;
    checks.push({ level: "fail", title: "Sounds like clickbait", tip: "Phrases like this get ignored or hidden by feeds. Say what's inside instead." });
  }
  score += Math.max(0, clarity);

  if (CLICKBAIT.some((r) => r.test(text))) score = Math.min(score, 45);
  score = Math.round(Math.max(0, Math.min(100, text ? score : 0)));
  const order = { fail: 0, warn: 1, pass: 2 };
  checks.sort((a, b) => order[a.level] - order[b.level]);

  return {
    text,
    score,
    grade: score >= 80 ? "Strong" : score >= 65 ? "Good" : "Needs work",
    chars,
    words,
    balance,
    type,
    sentiment,
    checks,
    firstWords: tokens.slice(0, 3).join(" "),
    lastWords: tokens.length > 3 ? tokens.slice(-3).join(" ") : "",
  };
}
