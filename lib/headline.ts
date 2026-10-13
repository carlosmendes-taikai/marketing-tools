// Rule-based headline scoring. No AI: seven qualities, each scored on a sliding scale and
// weighted differently for SEO titles, LinkedIn hooks, email subjects and ad headlines.

export type Context = "seo" | "linkedin" | "email" | "ad";
export type Part = "length" | "clarity" | "specific" | "benefit" | "hook" | "structure" | "fit";
export type WordKind = "common" | "uncommon" | "emotional" | "power";
type Level = "pass" | "warn" | "fail";

export const CONTEXTS: { id: Context; label: string; chars: [number, number]; note: string }[] = [
  { id: "seo", label: "Blog or SEO title", chars: [35, 60], note: "Google shows about 60 characters before cutting it off." },
  { id: "linkedin", label: "LinkedIn hook", chars: [20, 80], note: "Short first lines stop the scroll and make people tap \"…more\"." },
  { id: "email", label: "Email subject", chars: [10, 45], note: "Phones show about 40 characters of a subject line." },
  { id: "ad", label: "Ad headline", chars: [18, 30], note: "Google Ads headlines are capped at 30 characters." },
];

export const PART_LABEL: Record<Part, string> = {
  length: "Length",
  clarity: "Clarity",
  specific: "Specificity",
  benefit: "Reader benefit",
  hook: "Hook",
  structure: "Structure",
  fit: "Fits the format",
};

const WEIGHTS: Record<Context, Record<Part, number>> = {
  seo: { length: 15, clarity: 18, specific: 15, benefit: 15, hook: 10, structure: 15, fit: 12 },
  linkedin: { length: 10, clarity: 15, specific: 15, benefit: 10, hook: 25, structure: 10, fit: 15 },
  email: { length: 15, clarity: 15, specific: 10, benefit: 10, hook: 25, structure: 10, fit: 15 },
  ad: { length: 18, clarity: 12, specific: 15, benefit: 20, hook: 5, structure: 5, fit: 25 },
};

/* ---------- word lists ---------- */

const set = (s: string) => new Set(s.split(/\s+/).filter(Boolean));

const COMMON = set(`a about after all also an and any are as at be because been but by can come could day do does even first for from get give go good have he her him his how i if in into is it its just know like look make me most my new no not now of on one only or other our out over people say see she so some take than that the their them then there these they thing think this time to two up us use very want way we well what when which who will with work would year you your`);
const POWER = set(`proven simple secret secrets ultimate essential effortless exclusive instant insider powerful quick rare remarkable revealed surprising unusual vital complete definitive breakthrough little-known step-by-step easy fast free hidden honest massive`);
const EMOTIONAL = set(`afraid amazing angry beautiful brave crazy danger dream embarrassing fail fear forbidden genius grateful guilty happy hate hope horrible hurt inspiring love lonely lost lucky nightmare painful panic perfect proud regret risky sad scary shame shocking stress struggle stupid terrible ugly upset weird wrong worry`);
const OUTCOME = set(`get grow save boost increase cut win build learn make find avoid stop double doubled triple earn improve launch write rank sell hire fix reduce speed scale land master create cost costing lose losing waste wasting miss missing`);
const FILLER = set(`very really just things stuff basically actually literally quite somewhat various several`);
const JARGON = set(`synergy leverage leveraging solution solutions innovative cutting-edge best-in-class seamless seamlessly robust holistic paradigm disruptive next-gen world-class game-changing game-changer revolutionary empower empowering`);
const CURIOSITY = /\b(why|secret|secrets|mistake|mistakes|nobody|no one|truth|what happens|here'?s|the real|surprising|wrong|never|stop|myth|myths|almost|nearly|weird|unpopular)\b/i;
const CONTRAST = /\b(but|until|instead|yet|actually|without|even if|despite)\b/i;
const URGENCY = /\b(ends|ending|tomorrow|today|tonight|last chance|deadline|before|expires|closing)\b/i;
const PAIN = /\b(stop|avoid|never|ruin|ruining|kill|killing|slop|cringe|boring|ugly|broke|fail|failed|lazy|overrated|underrated|hidden|nobody|rejected|messed|problem|lonely|loneliness|wrong|mistake|mistakes|myth|dead|dying|quit|fired)\b/i;
const VIVID = /\b(looks? like|feels? like|like a|like an)\b/i;
const CONFESSION = /\b(hot take|unpopular opinion|hard truth|confession|i was wrong|honest(ly)?)\b/i;
const STORY = /\b(learned|lessons?|what happened|i tried|we tried|story)\b/i;
const VALUE = /\b(exact|step[- ]by[- ]step|process|framework|playbook|template|checklist|blueprint)\b/i;
const COMPARATIVE = /\b(faster|easier|better|cheaper|smarter|simpler|free)\b/i;
const NAMED = /\b([A-Z]{2,5}|[A-Z][a-z]+[A-Z]\w*)\b/; // acronyms and brand names: AI, SEO, CRM, ChatGPT
const VAGUE = /\b(something|stuff|things|some things|a few things|whatever)\b/i;
const OVERUSED = /\b(you'?ll love|don'?t miss|big news|exciting news|check (it|this) out|game[- ]changer|must[- ]read|you need to know)\b/i;
const OBJECTION = /\b(without|even if|no (code|experience|budget|ads)|in (\d+|five|ten|two|three) (minutes|days|weeks|steps))\b/i;
const TIMEFRAME = /\b(in \d+ (minutes|hours|days|weeks|months)|this (week|month|year)|today|tomorrow|tonight|(19|20)\d\d)\b/i;
const AUDIENCE = /\bfor (beginners|startups|founders|marketers|teams|small (business|businesses|teams)|freelancers|creators|developers|designers|managers|agencies|students|parents|busy \w+)\b/i;
const CLICKBAIT = [/you won'?t believe/i, /what happened next/i, /will shock you/i, /this one trick/i, /doctors hate/i, /blow your mind/i];
const LI_CLICHE = /\b(excited|thrilled|happy|proud|humbled|delighted) to (announce|share)\b|^i'?m (excited|thrilled|happy|proud|humbled)/i;
const SPAM = /\b(act now|buy now|click here|guaranteed|risk[- ]free|100% free|winner|cash|urgent|limited time only|order now)\b|\$\$+/i;
const VAGUE_EMAIL = /\b(newsletter|update|updates|issue #?\d*|news|announcement|monthly|weekly digest|edition)\b/i;
const CTA = /\b(get|try|start|book|shop|save|buy|join|claim|download|order|discover|compare|see|find|learn|grab|switch|apply)\b/i;
const OFFER = /\b(free|\d+% off|off|trial|discount|save|deal|sale|bonus)\b/i;

/* ---------- analysis ---------- */

export type Analysis = {
  text: string;
  score: number;
  grade: "Strong" | "Good" | "Needs work";
  chars: number;
  words: { word: string; kind: WordKind }[];
  parts: { id: Part; value: number; weight: number }[]; // value 0 to 1
  type: "List" | "How-to" | "Question" | "Guide" | "Comparison" | "Statement";
  checks: { level: Level; title: string; tip: string }[];
  firstWords: string;
  lastWords: string;
};

const clean = (w: string) => w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const syllables = (w: string) => Math.max(1, (w.toLowerCase().replace(/e$/, "").match(/[aeiouy]+/g) ?? []).length);

export function analyze(raw: string, context: Context, keyword = ""): Analysis {
  const text = raw.replace(/\s+/g, " ").trim();
  const ctx = CONTEXTS.find((c) => c.id === context)!;
  const tokens = text.split(" ").filter((t) => clean(t));
  const lower = tokens.map(clean);
  const words = tokens.map((t, i) => {
    const w = lower[i];
    const kind: WordKind = POWER.has(w) ? "power" : EMOTIONAL.has(w) ? "emotional" : COMMON.has(w) ? "common" : "uncommon";
    return { word: t, kind };
  });
  const chars = [...text].length;
  const checks: Analysis["checks"] = [];
  const add = (level: Level, title: string, tip = "") => checks.push({ level, title, tip });

  /* length: best at the middle of the range, fading gently outside it */
  const [lo, hi] = ctx.chars;
  let length: number;
  if (context === "ad" && chars > 30) {
    length = 0;
    add("fail", `Over the 30-character limit (${chars})`, "Google Ads won't accept it. Cut it down.");
  } else if (chars >= lo && chars <= hi) {
    const mid = (lo + hi) / 2;
    length = 1 - (0.2 * Math.abs(chars - mid)) / ((hi - lo) / 2);
    add("pass", `Length is right (${chars} characters)`);
  } else {
    const off = chars < lo ? lo - chars : chars - hi;
    length = clamp(0.8 - off / (hi * 0.8));
    add(off > hi * 0.3 ? "fail" : "warn", chars < lo ? `A bit short (${chars} characters)` : `Too long (${chars} characters)`, `Aim for ${lo} to ${hi}. ${ctx.note}`);
  }

  let ceiling = 100; // real problems cap the score, however good the rest is

  /* clarity */
  let clarity = 1;
  const fillers = [...new Set(lower.filter((w) => FILLER.has(w)))];
  if (fillers.length) {
    clarity -= 0.18 * fillers.length;
    add("warn", `Filler: ${fillers.join(", ")}`, "These words take space without adding meaning. Cut them.");
  }
  const jargon = [...new Set(lower.filter((w) => JARGON.has(w)))];
  if (jargon.length) {
    clarity -= 0.2 * jargon.length;
    ceiling = Math.min(ceiling, 55);
    add("warn", `Jargon: ${jargon.join(", ")}`, "Say what it actually does. Plain words get more clicks.");
  }
  const shouting = tokens.filter((t, i) => t === t.toUpperCase() && /\p{L}/u.test(t) && lower[i].length >= 3 && (lower[i].length > 4 || COMMON.has(lower[i]) || POWER.has(lower[i])));
  if (shouting.length) {
    clarity -= 0.2;
    add("warn", "ALL CAPS words", "Caps read as shouting, and ad platforms reject them.");
  }
  if ((text.match(/!/g) ?? []).length > 1) {
    clarity -= 0.15;
    add("warn", "Several exclamation marks", "One is plenty, often none.");
  }
  const clickbait = CLICKBAIT.some((r) => r.test(text));
  if (fillers.length) ceiling = Math.min(ceiling, 64);
  if (clickbait) {
    clarity -= 0.5;
    add("fail", "Sounds like clickbait", "Feeds and inboxes bury these. Say what's inside instead.");
  }
  const avgSyl = lower.reduce((a, w) => a + syllables(w), 0) / (lower.length || 1);
  if (avgSyl > 1.9) {
    clarity -= 0.15;
    add("warn", "Hard to read at a glance", "Swap long words for short ones. Headlines are skimmed, not read.");
  }
  clarity = clamp(clarity);

  /* specificity */
  const hasNumber = /\d/.test(text);
  // a clear headline isn't vague just because it has no number: start from a baseline
  let specific = 0.35;
  if (hasNumber) specific += 0.35;
  if (lower.filter((w) => !COMMON.has(w) && w.length >= 4).length >= 2) specific += 0.2; // concrete vocabulary
  if (NAMED.test(text)) specific += 0.15;
  if (VALUE.test(text)) specific += 0.15;
  if (/\d+(\.\d+)?%|\$\d|€\d|\b\d{2,}\b/.test(text)) specific += 0.1;
  if (TIMEFRAME.test(text)) specific += 0.25;
  if (AUDIENCE.test(text)) specific += 0.25;
  if (/\bvs\.?\b|\bversus\b/i.test(text)) specific += 0.15;
  if (/["“].+["”]/.test(text)) specific += 0.1;
  const vague = VAGUE.test(text);
  if (vague) {
    specific -= 0.3;
    ceiling = Math.min(ceiling, 70);
    add("warn", `Vague: "${text.match(VAGUE)![0]}"`, "Name the actual thing. \"Something about hiring\" becomes \"the interview question I dropped\".");
  }
  if (OVERUSED.test(text)) {
    ceiling = Math.min(ceiling, 68);
    add("warn", `Overused: "${text.match(OVERUSED)![0]}"`, "People have seen this phrase a thousand times. Say what's actually new.");
  }
  specific = clamp(specific);
  if (specific >= 0.7) add("pass", "Specific and concrete");
  else if (!hasNumber && specific < 0.55) add("warn", "Could be more specific (optional)", "Add a number, a time frame or who it's for: \"in 30 days\", \"40%\", \"for small teams\".");

  /* reader benefit */
  let benefit = 0.2;
  const personal = context === "linkedin" ? /\b(i|we|my|our|i'?ve|i'?m)\b/i : /\b(you|your|you'?re|yourself)\b/i;
  const hasOutcome = lower.some((w) => OUTCOME.has(w));
  const personalised = /\{.+\}|\[(first ?)?name\]/i.test(text);
  if (personal.test(text) || personalised) benefit += 0.35;
  if (hasOutcome) benefit += 0.35;
  if (OBJECTION.test(text)) benefit += 0.3;
  if (AUDIENCE.test(text)) benefit += 0.3; // naming who it's for speaks to the reader
  if (context === "ad" && OFFER.test(text)) benefit += 0.2;
  if (STORY.test(text)) benefit += 0.25; // lessons are a benefit in themselves
  if (COMPARATIVE.test(text)) benefit += 0.25;
  benefit = clamp(benefit);
  if (benefit >= 0.65) add("pass", context === "linkedin" ? "Personal and outcome-driven" : "Clear benefit for the reader");
  else if (!hasOutcome) add("warn", "No clear outcome", "Say what the reader gets: grow, save, cut, learn, avoid. Adding \"without…\" removes an objection.");
  else if (!personal.test(text))
    add(
      "warn",
      context === "linkedin" ? "Not personal yet" : "Doesn't speak to the reader",
      context === "linkedin" ? "Hooks in first person (\"I\", \"we\") feel like a story, not an ad." : "\"You\" and \"your\" make it about the reader.",
    );

  /* hook */
  const power = words.filter((w) => w.kind === "power").length;
  const emotional = words.filter((w) => w.kind === "emotional").length;
  let hook = 0.2;
  hook += power ? Math.min(0.3, 0.2 + 0.1 * (power - 1)) : 0;
  hook += emotional ? 0.2 : 0;
  if (CURIOSITY.test(text)) hook += 0.25;
  if (CONTRAST.test(text)) hook += 0.15;
  if (/\?$/.test(text)) hook += 0.15;
  if (context === "linkedin") {
    if (/[.:]\s+\S/.test(text)) hook += 0.3; // two-beat hooks: "I quit. Here's why."
    if (/^(i|we|my|our)\b/i.test(text)) hook += 0.15; // a personal story beats a statement
  }
  if ((context === "email" || context === "ad") && URGENCY.test(text)) hook += 0.25;
  if (hasNumber) hook += 0.1;
  if (PAIN.test(text)) hook += 0.2;
  if (VIVID.test(text)) hook += 0.15;
  if (CONFESSION.test(text)) hook += 0.25;
  if (STORY.test(text)) hook += 0.2;
  if (VALUE.test(text)) hook += 0.1;
  if (context !== "seo" && words.length <= 6) hook += 0.15; // short and punchy
  if (personalised) hook += 0.15;
  hook = clamp(hook);
  // search titles and ads live or die on relevance, so only nag about the hook where it carries real weight
  const hookMatters = (context === "linkedin" || context === "email") && hook < 0.45;
  if (hook >= 0.6) add("pass", "Strong hook");
  else if (hookMatters) add("warn", "Weak hook", "Give people a reason to stop: a surprising result, a mistake, a contrast (\"…but\", \"without…\") or one vivid word.");

  /* structure */
  const type: Analysis["type"] = /^(the |top )?\d/i.test(text)
    ? "List"
    : /^(how (to|i|we|you)|what (i|we) (learned|did))\b/i.test(text)
      ? "How-to"
      : /\?$/.test(text) || /^why\b/i.test(text)
        ? "Question"
        : /\bvs\.?\b|\bversus\b/i.test(text)
          ? "Comparison"
          : /\b(guide|checklist|template|playbook|framework)\b/i.test(text)
            ? "Guide"
            : "Statement";
  let structure = { List: 1, "How-to": 1, Question: 0.85, Comparison: 0.9, Guide: 0.85, Statement: context === "linkedin" || context === "email" ? 0.8 : 0.6 }[type];
  if (/[:–—]|\s-\s|\(.+\)|\[.+\]/.test(text) || (context === "linkedin" && /[.]\s+\S/.test(text))) structure = Math.min(1, structure + 0.2);
  if (type === "Statement" && (context === "seo" || context === "ad"))
    add("warn", "Plain statement", "Lists (\"7 ways…\"), how-tos, questions and \"X: the subtitle\" formats usually win more clicks.");

  /* fits the format */
  let fit = 1;
  let keywordMissing = false;

  if (context === "seo") {
    const kw = keyword.trim().toLowerCase();
    if (kw) {
      const at = text.toLowerCase().indexOf(kw);
      if (at < 0) {
        fit -= 0.6;
        keywordMissing = true;
        add("fail", `Keyword "${keyword.trim()}" is missing`, "Include it so Google and searchers see the match.");
      } else if (at > text.length / 2) {
        fit -= 0.25;
        add("warn", "Keyword is near the end", "Move it toward the start. Searchers scan the first few words.");
      } else add("pass", "Keyword up front");
    } else fit = 0.8;
    if (/\b(19|20)\d\d\b|\[.+\]|\(.+\)/.test(text)) fit = Math.min(1, fit + 0.2);
  }
  if (context === "linkedin") {
    if (LI_CLICHE.test(text)) {
      fit -= 0.6;
      ceiling = Math.min(ceiling, 55);
      add("fail", "Cliché opener", "\"Excited to announce\" is the most scrolled-past line on LinkedIn. Lead with the result or the story.");
    }
    if (/#\w|https?:\/\//.test(text)) {
      fit -= 0.3;
      add("warn", "Hashtag or link in the hook", "Save them for the end of the post.");
    }
    const firstLine = text.split(/(?<=[.!?])\s/)[0];
    if ([...firstLine].length > 60) {
      fit -= 0.25;
      add("warn", "First sentence wraps on phones", "Keep the opening sentence under about 60 characters.");
    }
  }
  if (context === "email") {
    if (SPAM.test(text)) {
      fit -= 0.4;
      ceiling = Math.min(ceiling, 52);
      add("fail", "Spam trigger words", "Words like \"act now\", \"guaranteed\" or \"click here\" push emails into spam.");
    }
    if (VAGUE_EMAIL.test(text)) {
      fit -= 0.45;
      ceiling = Math.min(ceiling, 55);
      add("warn", "Reads like a generic newsletter", "\"Newsletter #12\" or \"Monthly update\" gets skipped. Name the one thing inside.");
    }
    if (/\{.+\}|\[name\]|\[first ?name\]/i.test(text)) add("pass", "Personalised");
  }
  if (context === "ad") {
    if (text.includes("!")) {
      fit -= 0.4;
      ceiling = Math.min(ceiling, 58);
      add("fail", "Exclamation mark", "Google Ads doesn't allow \"!\" in headlines.");
    }
    if (!CTA.test(text)) {
      fit -= 0.35;
      add("warn", "No call to action", "Start with a verb: Get, Try, Start, Book, Save, Shop.");
    }
    if (OFFER.test(text)) add("pass", "Has an offer");
  }
  fit = clamp(fit);

  /* total */
  const weights = WEIGHTS[context];
  const values: Record<Part, number> = { length, clarity, specific, benefit, hook, structure, fit };
  const parts = (Object.keys(weights) as Part[]).map((id) => ({ id, value: values[id], weight: weights[id] }));
  let score = parts.reduce((a, p) => a + p.value * p.weight, 0);
  if (clickbait) score = Math.min(score, 45);
  if (keywordMissing) score = Math.min(score, 55); // after the curve this lands near 60
  // says what it is, not why anyone should care
  const generic = type === "Statement" && hook <= 0.4 && benefit <= 0.2 && !hasNumber && !PAIN.test(text) && !CONFESSION.test(text);
  if (generic) {
    score *= 0.78;
    add("warn", "Generic", "It says what this is, not why anyone should care. Add the outcome, a surprise or a stake.");
  }
  if (context === "ad" && chars > 30) score = Math.min(score, 50);
  // a gentle curve: nobody maxes all seven qualities, so great headlines should still reach the 80s and 90s
  score = text ? Math.min(ceiling, Math.round(Math.pow(clamp(score / 100), 0.75) * 100)) : 0;

  const order: Record<Level, number> = { fail: 0, warn: 1, pass: 2 };
  checks.sort((a, b) => order[a.level] - order[b.level]);

  return {
    text,
    score,
    grade: score >= 80 ? "Strong" : score >= 65 ? "Good" : "Needs work",
    chars,
    words,
    parts,
    type,
    checks,
    firstWords: tokens.slice(0, 3).join(" "),
    lastWords: tokens.length > 3 ? tokens.slice(-3).join(" ") : "",
  };
}

/* ---------- proven formulas, with an example for each ---------- */

export const FORMULAS: Record<Context, { formula: string; example: string }[]> = {
  seo: [
    { formula: "How to [get result] in [time frame] (without [pain])", example: "How to Grow Your Newsletter in 30 Days (Without Paid Ads)" },
    { formula: "[Number] proven ways to [get result] in [year]", example: "11 Proven Ways to Cut Cart Abandonment in 2026" },
    { formula: "[Topic]: the complete guide for [audience]", example: "Email Deliverability: The Complete Guide for Startups" },
    { formula: "Why [common belief] is wrong (and what to do instead)", example: "Why Posting Daily Is Wrong (and What to Do Instead)" },
    { formula: "[Option A] vs [option B]: which is better for [audience]?", example: "Notion vs Coda: Which Is Better for Small Teams?" },
  ],
  linkedin: [
    { formula: "I [did something surprising]. [Unexpected result].", example: "I deleted 40% of our blog posts. Traffic went up." },
    { formula: "[Number] years in [field]. [Number] lessons I wish I knew sooner.", example: "10 years in marketing. 7 lessons I wish I knew sooner." },
    { formula: "Most [role] get [topic] wrong. Here's why.", example: "Most founders get pricing wrong. Here's why." },
    { formula: "We [got result] in [time frame] without [expected thing].", example: "We doubled demo bookings in 60 days without ads." },
    { formula: "Unpopular opinion: [contrarian take].", example: "Unpopular opinion: your logo doesn't matter yet." },
  ],
  email: [
    { formula: "[Name], quick question about [topic]", example: "{first_name}, quick question about your launch" },
    { formula: "Your [thing] is [about to change]", example: "Your free trial ends tomorrow" },
    { formula: "The [topic] mistake costing you [result]", example: "The pricing mistake costing you sales" },
    { formula: "[Number] ways to [result] this week", example: "3 ways to win back lost customers this week" },
    { formula: "[Short curiosity line]", example: "We almost didn't send this" },
  ],
  ad: [
    { formula: "[Verb] [result] in [time frame]", example: "Get Payroll Done in 5 Minutes" },
    { formula: "Save [number]% on [product]", example: "Save 30% on Running Shoes" },
    { formula: "Start your free [length] trial", example: "Start Your Free 14-Day Trial" },
    { formula: "Try the [product] for [audience]", example: "Try the CRM for Small Teams" },
    { formula: "See why [number] [users] switch", example: "See Why 12,000 Teams Switch" },
  ],
};
