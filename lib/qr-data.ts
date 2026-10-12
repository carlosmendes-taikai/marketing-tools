// Turns form fields into the text a phone camera understands.
// Every format here is a static standard, so codes keep working forever.

export type ContentType = "link" | "text" | "wifi" | "contact" | "email" | "sms" | "phone" | "whatsapp" | "location" | "event";

export type Field = {
  key: string;
  label: string;
  placeholder?: string;
  kind?: "text" | "textarea" | "select" | "datetime" | "password" | "checkbox";
  options?: { value: string; label: string }[];
  half?: boolean;
};

export const CONTENT_TYPES: { id: ContentType; label: string; fields: Field[]; defaults: Record<string, string> }[] = [
  {
    id: "link",
    label: "Link",
    fields: [{ key: "url", label: "Website address", placeholder: "yourwebsite.com" }],
    defaults: { url: "" },
  },
  {
    id: "text",
    label: "Text",
    fields: [{ key: "text", label: "Your text", kind: "textarea", placeholder: "Anything you want people to read" }],
    defaults: { text: "" },
  },
  {
    id: "wifi",
    label: "Wifi",
    fields: [
      { key: "ssid", label: "Network name", placeholder: "Ana's Bakery" },
      { key: "password", label: "Password", kind: "password" },
      {
        key: "security",
        label: "Security",
        kind: "select",
        options: [
          { value: "WPA", label: "WPA / WPA2 / WPA3" },
          { value: "WEP", label: "WEP" },
          { value: "nopass", label: "No password" },
        ],
        half: true,
      },
      { key: "hidden", label: "Hidden network", kind: "checkbox", half: true },
    ],
    defaults: { ssid: "", password: "", security: "WPA", hidden: "" },
  },
  {
    id: "contact",
    label: "Contact",
    fields: [
      { key: "first", label: "First name", half: true },
      { key: "last", label: "Last name", half: true },
      { key: "phone", label: "Phone", placeholder: "+351 912 345 678", half: true },
      { key: "email", label: "Email", half: true },
      { key: "company", label: "Company", half: true },
      { key: "title", label: "Job title", half: true },
      { key: "website", label: "Website" },
    ],
    defaults: { first: "", last: "", phone: "", email: "", company: "", title: "", website: "" },
  },
  {
    id: "email",
    label: "Email",
    fields: [
      { key: "to", label: "Send to", placeholder: "hello@yourcompany.com" },
      { key: "subject", label: "Subject" },
      { key: "body", label: "Message", kind: "textarea" },
    ],
    defaults: { to: "", subject: "", body: "" },
  },
  {
    id: "sms",
    label: "SMS",
    fields: [
      { key: "phone", label: "Phone number", placeholder: "+351 912 345 678" },
      { key: "message", label: "Message", kind: "textarea" },
    ],
    defaults: { phone: "", message: "" },
  },
  {
    id: "phone",
    label: "Call",
    fields: [{ key: "phone", label: "Phone number", placeholder: "+351 912 345 678" }],
    defaults: { phone: "" },
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    fields: [
      { key: "phone", label: "Phone number with country code", placeholder: "+351 912 345 678" },
      { key: "message", label: "Pre-filled message", kind: "textarea" },
    ],
    defaults: { phone: "", message: "" },
  },
  {
    id: "location",
    label: "Location",
    fields: [{ key: "query", label: "Address or place", placeholder: "Rua Augusta 100, Lisbon" }],
    defaults: { query: "" },
  },
  {
    id: "event",
    label: "Event",
    fields: [
      { key: "title", label: "Event name" },
      { key: "start", label: "Starts", kind: "datetime", half: true },
      { key: "end", label: "Ends", kind: "datetime", half: true },
      { key: "location", label: "Where" },
      { key: "notes", label: "Notes", kind: "textarea" },
    ],
    defaults: { title: "", start: "", end: "", location: "", notes: "" },
  },
];

const esc = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
const digits = (s: string) => s.replace(/[^\d+]/g, "");
const icsDate = (s: string) => (s ? s.replace(/[-:]/g, "").slice(0, 13) + "00" : "");

/** Returns the encoded payload, or an empty string when there is nothing to encode yet. */
export function encode(type: ContentType, v: Record<string, string>): string {
  switch (type) {
    case "link": {
      const url = v.url.trim();
      if (!url) return "";
      return /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
    }
    case "text":
      return v.text;
    case "wifi":
      if (!v.ssid) return "";
      return `WIFI:T:${v.security};S:${esc(v.ssid)};${v.security === "nopass" ? "" : `P:${esc(v.password)};`}${v.hidden ? "H:true;" : ""};`;
    case "contact": {
      if (!v.first && !v.last && !v.phone && !v.email) return "";
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${esc(v.last)};${esc(v.first)};;;`,
        `FN:${esc([v.first, v.last].filter(Boolean).join(" "))}`,
        v.company && `ORG:${esc(v.company)}`,
        v.title && `TITLE:${esc(v.title)}`,
        v.phone && `TEL;TYPE=CELL:${digits(v.phone)}`,
        v.email && `EMAIL:${v.email}`,
        v.website && `URL:${v.website}`,
        "END:VCARD",
      ];
      return lines.filter(Boolean).join("\n");
    }
    case "email": {
      if (!v.to) return "";
      const q = new URLSearchParams();
      if (v.subject) q.set("subject", v.subject);
      if (v.body) q.set("body", v.body);
      const qs = q.toString().replace(/\+/g, "%20");
      return `mailto:${v.to}${qs ? `?${qs}` : ""}`;
    }
    case "sms":
      if (!v.phone) return "";
      return `SMSTO:${digits(v.phone)}:${v.message}`;
    case "phone":
      return v.phone ? `tel:${digits(v.phone)}` : "";
    case "whatsapp": {
      const n = digits(v.phone).replace(/^\+/, "");
      if (!n) return "";
      return `https://wa.me/${n}${v.message ? `?text=${encodeURIComponent(v.message)}` : ""}`;
    }
    case "location":
      return v.query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.query)}` : "";
    case "event": {
      if (!v.title) return "";
      const lines = [
        "BEGIN:VEVENT",
        `SUMMARY:${esc(v.title)}`,
        v.start && `DTSTART:${icsDate(v.start)}`,
        v.end && `DTEND:${icsDate(v.end)}`,
        v.location && `LOCATION:${esc(v.location)}`,
        v.notes && `DESCRIPTION:${esc(v.notes)}`,
        "END:VEVENT",
      ];
      return lines.filter(Boolean).join("\n");
    }
  }
}

/** WCAG contrast ratio between two hex colors. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const [r, g, bl] = [0, 2, 4].map((i) => {
      const c = parseInt(full.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

export function luminanceOf(hex: string) {
  return contrast(hex, "#000000");
}
