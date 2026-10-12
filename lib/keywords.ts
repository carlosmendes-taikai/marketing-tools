// Keyword ideas come from Google's (and YouTube's) autocomplete: we ask it to finish
// the seed with question words, prepositions, comparisons and every letter.

export type GroupId = "popular" | "questions" | "prepositions" | "comparisons" | "alphabet";
export type Source = "google" | "youtube";

export const GROUPS: { id: GroupId; label: string; build: (seed: string) => string[] }[] = [
  { id: "popular", label: "Popular", build: (s) => [s] },
  {
    id: "questions",
    label: "Questions",
    build: (s) => ["how", "what", "why", "where", "when", "who", "which", "can", "does", "is", "are", "should", "will"].map((w) => `${w} ${s}`),
  },
  {
    id: "prepositions",
    label: "Prepositions",
    build: (s) => ["for", "with", "without", "to", "near", "in", "on", "like", "from"].map((w) => `${s} ${w}`),
  },
  {
    id: "comparisons",
    label: "Comparisons",
    build: (s) => ["vs", "versus", "or", "and", "alternative"].map((w) => `${s} ${w}`),
  },
  {
    id: "alphabet",
    label: "A to Z",
    build: (s) => "abcdefghijklmnopqrstuvwxyz".split("").map((l) => `${s} ${l}`),
  },
];

export const MARKETS = [
  { id: "us-en", label: "United States", gl: "us", hl: "en" },
  { id: "gb-en", label: "United Kingdom", gl: "gb", hl: "en" },
  { id: "ca-en", label: "Canada", gl: "ca", hl: "en" },
  { id: "au-en", label: "Australia", gl: "au", hl: "en" },
  { id: "in-en", label: "India", gl: "in", hl: "en" },
  { id: "pt-pt", label: "Portugal", gl: "pt", hl: "pt" },
  { id: "br-pt", label: "Brazil", gl: "br", hl: "pt" },
  { id: "es-es", label: "Spain", gl: "es", hl: "es" },
  { id: "mx-es", label: "Mexico", gl: "mx", hl: "es" },
  { id: "fr-fr", label: "France", gl: "fr", hl: "fr" },
  { id: "de-de", label: "Germany", gl: "de", hl: "de" },
  { id: "it-it", label: "Italy", gl: "it", hl: "it" },
  { id: "nl-nl", label: "Netherlands", gl: "nl", hl: "nl" },
];

export const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 80);
