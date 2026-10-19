// Builds JSON-LD structured data (schema.org) that Google, Bing and AI search read to understand a page.
// Required and recommended fields follow Google's rich result docs for each type.

export type SchemaType = "faq" | "article" | "product" | "local" | "event" | "organization";

export type Field = {
  key: string;
  label: string;
  hint?: string;
  placeholder?: string;
  kind?: "text" | "url" | "textarea" | "lines" | "date" | "datetime" | "number" | "select";
  options?: [string, string][];
  need?: "required" | "recommended";
  half?: boolean;
};

export type Values = Record<string, string>;
export type Faq = { q: string; a: string };

export const TYPES: { id: SchemaType; label: string; blurb: string }[] = [
  { id: "faq", label: "FAQ", blurb: "Questions and answers on a page." },
  { id: "article", label: "Article", blurb: "Blog posts, news and guides." },
  { id: "product", label: "Product", blurb: "Price, stock and star ratings." },
  { id: "local", label: "Local business", blurb: "Address, hours and phone." },
  { id: "event", label: "Event", blurb: "Date, place and tickets." },
  { id: "organization", label: "Organization", blurb: "Your company, logo and profiles." },
];

const CURRENCIES: [string, string][] = ["EUR", "USD", "GBP", "BRL", "CAD", "AUD", "CHF", "JPY", "INR"].map((c) => [c, c]);

export const FIELDS: Record<SchemaType, Field[]> = {
  faq: [],
  article: [
    { key: "headline", label: "Headline", placeholder: "How to write headlines that get clicks", need: "required" },
    { key: "description", label: "Short description", kind: "textarea", placeholder: "What the article covers, in one or two sentences.", need: "recommended" },
    { key: "url", label: "Article address", kind: "url", placeholder: "https://yoursite.com/blog/headlines", need: "recommended" },
    { key: "image", label: "Image address", kind: "url", hint: "At least 1200px wide", placeholder: "https://yoursite.com/cover.png", need: "recommended" },
    { key: "authorName", label: "Author", placeholder: "Carlos Mendes", need: "recommended", half: true },
    { key: "authorUrl", label: "Author page", kind: "url", placeholder: "https://yoursite.com/about", half: true },
    { key: "datePublished", label: "Published", kind: "date", need: "recommended", half: true },
    { key: "dateModified", label: "Last updated", kind: "date", half: true },
    { key: "publisherName", label: "Publisher", placeholder: "Your company", half: true },
    { key: "publisherLogo", label: "Publisher logo", kind: "url", placeholder: "https://yoursite.com/logo.png", half: true },
  ],
  product: [
    { key: "name", label: "Product name", placeholder: "Merino crew sweater", need: "required" },
    { key: "description", label: "Description", kind: "textarea", placeholder: "Soft, warm and made to last.", need: "recommended" },
    { key: "image", label: "Image address", kind: "url", placeholder: "https://yoursite.com/sweater.jpg", need: "recommended" },
    { key: "url", label: "Product page", kind: "url", placeholder: "https://yoursite.com/sweater", half: true },
    { key: "brand", label: "Brand", placeholder: "Your brand", need: "recommended", half: true },
    { key: "price", label: "Price", kind: "number", placeholder: "89.00", need: "required", half: true },
    { key: "currency", label: "Currency", kind: "select", options: CURRENCIES, half: true },
    {
      key: "availability",
      label: "Availability",
      kind: "select",
      options: [
        ["InStock", "In stock"],
        ["OutOfStock", "Out of stock"],
        ["PreOrder", "Pre-order"],
        ["LimitedAvailability", "Limited stock"],
      ],
      half: true,
    },
    { key: "sku", label: "SKU", placeholder: "SW-001", half: true },
    { key: "ratingValue", label: "Average rating", kind: "number", hint: "Only real reviews from your site", placeholder: "4.7", half: true },
    { key: "reviewCount", label: "Number of reviews", kind: "number", placeholder: "128", half: true },
  ],
  local: [
    {
      key: "businessType",
      label: "Kind of business",
      kind: "select",
      options: [
        ["LocalBusiness", "Local business"],
        ["Restaurant", "Restaurant"],
        ["CafeOrCoffeeShop", "Café"],
        ["Store", "Shop"],
        ["ProfessionalService", "Professional service"],
        ["HealthAndBeautyBusiness", "Health and beauty"],
        ["Dentist", "Dentist"],
        ["ExerciseGym", "Gym"],
        ["LodgingBusiness", "Hotel or lodging"],
        ["RealEstateAgent", "Real estate agent"],
      ],
    },
    { key: "name", label: "Business name", placeholder: "Corner Coffee", need: "required" },
    { key: "url", label: "Website", kind: "url", placeholder: "https://cornercoffee.com", need: "recommended", half: true },
    { key: "telephone", label: "Phone", placeholder: "+351 912 345 678", need: "recommended", half: true },
    { key: "street", label: "Street address", placeholder: "Rua Augusta 100", need: "required" },
    { key: "city", label: "City", placeholder: "Lisbon", need: "required", half: true },
    { key: "postalCode", label: "Postal code", placeholder: "1100-053", need: "recommended", half: true },
    { key: "region", label: "Region", placeholder: "Lisboa", half: true },
    { key: "country", label: "Country code", hint: "Two letters", placeholder: "PT", need: "recommended", half: true },
    { key: "hours", label: "Opening hours", kind: "lines", hint: "One line per group of days", placeholder: "Mo-Fr 08:00-18:00\nSa 09:00-14:00", need: "recommended" },
    { key: "image", label: "Photo address", kind: "url", placeholder: "https://cornercoffee.com/shop.jpg", need: "recommended", half: true },
    { key: "priceRange", label: "Price range", placeholder: "€€", half: true },
  ],
  event: [
    { key: "name", label: "Event name", placeholder: "Growth marketing meetup", need: "required" },
    { key: "description", label: "Description", kind: "textarea", placeholder: "Talks and drinks with marketers from Lisbon startups.", need: "recommended" },
    { key: "startDate", label: "Starts", kind: "datetime", need: "required", half: true },
    { key: "endDate", label: "Ends", kind: "datetime", need: "recommended", half: true },
    {
      key: "mode",
      label: "Where",
      kind: "select",
      options: [
        ["offline", "In person"],
        ["online", "Online"],
        ["mixed", "Both"],
      ],
    },
    { key: "venue", label: "Venue", placeholder: "LX Factory", need: "required", half: true },
    { key: "city", label: "City", placeholder: "Lisbon", need: "required", half: true },
    { key: "street", label: "Street address", placeholder: "Rua Rodrigues de Faria 103", half: true },
    { key: "country", label: "Country code", placeholder: "PT", half: true },
    { key: "onlineUrl", label: "Online link", kind: "url", placeholder: "https://youtube.com/live/...", need: "required" },
    { key: "image", label: "Image address", kind: "url", placeholder: "https://yoursite.com/event.jpg", need: "recommended" },
    { key: "organizer", label: "Organizer", placeholder: "Your company", need: "recommended", half: true },
    { key: "organizerUrl", label: "Organizer website", kind: "url", placeholder: "https://yoursite.com", half: true },
    { key: "price", label: "Ticket price", kind: "number", hint: "0 for free", placeholder: "0", need: "recommended", half: true },
    { key: "currency", label: "Currency", kind: "select", options: CURRENCIES, half: true },
    { key: "ticketUrl", label: "Ticket link", kind: "url", placeholder: "https://lu.ma/your-event", need: "recommended" },
  ],
  organization: [
    { key: "name", label: "Company name", placeholder: "Your company", need: "required" },
    { key: "url", label: "Website", kind: "url", placeholder: "https://yoursite.com", need: "required", half: true },
    { key: "logo", label: "Logo address", kind: "url", hint: "Square, at least 112px", placeholder: "https://yoursite.com/logo.png", need: "recommended", half: true },
    { key: "description", label: "What you do", kind: "textarea", placeholder: "One or two sentences about the company.", need: "recommended" },
    { key: "email", label: "Email", placeholder: "hello@yoursite.com", half: true },
    { key: "telephone", label: "Phone", placeholder: "+351 912 345 678", half: true },
    { key: "sameAs", label: "Social profiles", kind: "lines", hint: "One link per line: LinkedIn, X, Instagram, YouTube", placeholder: "https://linkedin.com/company/yours\nhttps://x.com/yours", need: "recommended" },
  ],
};

/** Fields that only apply to some answers: venue for in-person events, online link for online ones. */
export function visibleFields(type: SchemaType, v: Values): Field[] {
  return FIELDS[type].filter((f) => {
    if (type !== "event") return true;
    const mode = v.mode || "offline";
    if (["venue", "city", "street", "country"].includes(f.key)) return mode !== "online";
    if (f.key === "onlineUrl") return mode !== "offline";
    return true;
  });
}

export const DEFAULTS: Values = { currency: "EUR", availability: "InStock", businessType: "LocalBusiness", mode: "offline" };

const t = (s?: string) => (s ?? "").trim();
const lines = (s?: string) =>
  t(s)
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
/** Drops empty values so the output only has what was filled in. */
function prune(o: unknown): unknown {
  if (Array.isArray(o)) {
    const a = o.map(prune).filter((x) => x !== undefined);
    return a.length ? a : undefined;
  }
  if (o && typeof o === "object") {
    const entries = Object.entries(o)
      .map(([k, v]) => [k, prune(v)] as const)
      .filter(([, v]) => v !== undefined);
    // an object with nothing but its @type is empty too
    return entries.some(([k]) => k !== "@type") ? Object.fromEntries(entries) : undefined;
  }
  return o === "" || o === undefined || o === null ? undefined : o;
}
const local = (dt: string) => (dt && dt.length === 16 ? `${dt}:00` : dt); // "2026-11-04T19:00" -> with seconds

export function buildSchema(type: SchemaType, v: Values, faqs: Faq[]): object {
  const base = { "@context": "https://schema.org" };
  let data: object;
  switch (type) {
    case "faq":
      data = {
        "@type": "FAQPage",
        mainEntity: faqs
          .filter((f) => t(f.q) && t(f.a))
          .map((f) => ({ "@type": "Question", name: t(f.q), acceptedAnswer: { "@type": "Answer", text: t(f.a) } })),
      };
      break;
    case "article":
      data = {
        "@type": "Article",
        headline: t(v.headline),
        description: t(v.description),
        image: t(v.image),
        mainEntityOfPage: t(v.url),
        datePublished: t(v.datePublished),
        dateModified: t(v.dateModified),
        author: { "@type": "Person", name: t(v.authorName), url: t(v.authorUrl) },
        publisher: { "@type": "Organization", name: t(v.publisherName), logo: { "@type": "ImageObject", url: t(v.publisherLogo) } },
      };
      break;
    case "product":
      data = {
        "@type": "Product",
        name: t(v.name),
        description: t(v.description),
        image: t(v.image),
        sku: t(v.sku),
        brand: { "@type": "Brand", name: t(v.brand) },
        offers: t(v.price)
          ? { "@type": "Offer", url: t(v.url), price: t(v.price), priceCurrency: v.currency, availability: `https://schema.org/${v.availability}` }
          : undefined,
        aggregateRating: t(v.ratingValue) ? { "@type": "AggregateRating", ratingValue: t(v.ratingValue), reviewCount: t(v.reviewCount) } : undefined,
      };
      break;
    case "local":
      data = {
        "@type": v.businessType,
        name: t(v.name),
        url: t(v.url),
        telephone: t(v.telephone),
        image: t(v.image),
        priceRange: t(v.priceRange),
        address: { "@type": "PostalAddress", streetAddress: t(v.street), addressLocality: t(v.city), addressRegion: t(v.region), postalCode: t(v.postalCode), addressCountry: t(v.country).toUpperCase() },
        openingHours: lines(v.hours),
      };
      break;
    case "event": {
      const mode = v.mode || "offline";
      const place = { "@type": "Place", name: t(v.venue), address: { "@type": "PostalAddress", streetAddress: t(v.street), addressLocality: t(v.city), addressCountry: t(v.country).toUpperCase() } };
      const virtual = { "@type": "VirtualLocation", url: t(v.onlineUrl) };
      data = {
        "@type": "Event",
        name: t(v.name),
        description: t(v.description),
        startDate: local(t(v.startDate)),
        endDate: local(t(v.endDate)),
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: `https://schema.org/${{ offline: "Offline", online: "Online", mixed: "Mixed" }[mode]}EventAttendanceMode`,
        location: mode === "offline" ? place : mode === "online" ? virtual : [place, virtual],
        image: t(v.image),
        organizer: { "@type": "Organization", name: t(v.organizer), url: t(v.organizerUrl) },
        offers: t(v.price) || t(v.ticketUrl) ? { "@type": "Offer", price: t(v.price), priceCurrency: v.currency, url: t(v.ticketUrl), availability: "https://schema.org/InStock" } : undefined,
      };
      break;
    }
    case "organization":
      data = {
        "@type": "Organization",
        name: t(v.name),
        url: t(v.url),
        logo: t(v.logo),
        description: t(v.description),
        email: t(v.email),
        telephone: t(v.telephone),
        sameAs: lines(v.sameAs),
      };
      break;
  }
  return { ...base, ...((prune(data) as object) ?? {}) };
}

export type Issue = { level: "fail" | "warn"; text: string };

export function issuesFor(type: SchemaType, v: Values, faqs: Faq[]): Issue[] {
  const out: Issue[] = [];
  for (const f of visibleFields(type, v)) {
    if (t(v[f.key])) continue;
    if (f.need === "required") out.push({ level: "fail", text: `Add the ${f.label.toLowerCase()}. Google needs it.` });
    else if (f.need === "recommended") out.push({ level: "warn", text: `Add the ${f.label.toLowerCase()} for a richer result.` });
  }
  if (type === "faq") {
    const done = faqs.filter((f) => t(f.q) && t(f.a)).length;
    if (!done) out.push({ level: "fail", text: "Add at least one question with its answer." });
    if (faqs.some((f) => !!t(f.q) !== !!t(f.a))) out.push({ level: "warn", text: "A question is missing its answer (or the other way round). It's left out." });
  }
  for (const f of FIELDS[type]) {
    const val = t(v[f.key]);
    if (f.kind === "url" && val && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(val)) out.push({ level: "warn", text: `${f.label} should be a full address starting with https://` });
  }
  if (type === "product" && t(v.ratingValue) && (Number(v.ratingValue) < 1 || Number(v.ratingValue) > 5)) out.push({ level: "warn", text: "Average rating should be between 1 and 5." });
  if (type === "product" && t(v.ratingValue) && !t(v.reviewCount)) out.push({ level: "warn", text: "Add the number of reviews, or Google ignores the rating." });
  if (type === "event" && t(v.startDate) && t(v.endDate) && v.endDate < v.startDate) out.push({ level: "fail", text: "The event ends before it starts." });
  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === "fail" ? -1 : 1));
}

/** The snippet to paste into the page's <head>. */
// "<" is written as \u003c so text like "</script>" inside an answer can't break out of the tag. JSON reads it back the same.
export const toScript = (data: object) => `<script type="application/ld+json">\n${JSON.stringify(data, null, 2).replace(/</g, "\\u003c")}\n</script>`;
