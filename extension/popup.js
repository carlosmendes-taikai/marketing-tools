// The popup: QR code, UTM link and quick checks for the page you're on.
// Uses the same channel values and QR style as the website, so links match the UTM builder.

const CHANNELS = [
  { id: "linkedin", label: "LinkedIn", source: "linkedin", medium: "social" },
  { id: "instagram", label: "Instagram", source: "instagram", medium: "social" },
  { id: "facebook", label: "Facebook", source: "facebook", medium: "social" },
  { id: "x", label: "X", source: "x", medium: "social" },
  { id: "tiktok", label: "TikTok", source: "tiktok", medium: "social" },
  { id: "youtube", label: "YouTube", source: "youtube", medium: "video" },
  { id: "newsletter", label: "Newsletter", source: "newsletter", medium: "email" },
  { id: "google-ads", label: "Google Ads", source: "google", medium: "cpc" },
  { id: "qr", label: "Printed QR", source: "qr", medium: "offline" },
];

const $ = (id) => document.getElementById(id);
const remember = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};
const recall = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const state = { url: "", title: "", channel: recall("channel"), campaign: recall("campaign") || "", qrFor: "" };

/** The active tab. Opened as a normal page (for testing), ?url=&title= stand in for it. */
async function currentPage() {
  if (globalThis.chrome?.tabs?.query) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return { url: tab?.url || "", title: tab?.title || "" };
  }
  const params = new URLSearchParams(location.search);
  return { url: params.get("url") || "", title: params.get("title") || "" };
}

function open(path, params) {
  const url = toolUrl(path, params);
  if (globalThis.chrome?.tabs?.create) chrome.tabs.create({ url });
  else window.open(url, "_blank");
  window.close();
}

/* ---------- tabs ---------- */

function showTab(name) {
  document.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
  document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== name));
  remember("tab", name);
}

/* ---------- QR ---------- */

const qr = new QRCodeStyling({
  width: 600,
  height: 600,
  type: "canvas",
  data: " ",
  margin: 0,
  qrOptions: { errorCorrectionLevel: "M" },
  dotsOptions: { type: "rounded", color: "#2b2d6e" },
  cornersSquareOptions: { type: "extra-rounded", color: "#6c70e0" },
  cornersDotOptions: { type: "dot", color: "#6c70e0" },
  backgroundOptions: { color: "#ffffff" },
});
qr.append($("qr"));

function setQr(data) {
  state.qrFor = data;
  qr.update({ data });
  $("qr-for").textContent = data.replace(/^https?:\/\//, "");
}

/* ---------- UTM ---------- */

const clean = (s) => s.trim().toLowerCase().replace(/\s+/g, "_");

function tagged() {
  const channel = CHANNELS.find((c) => c.id === state.channel);
  if (!channel) return "";
  const url = new URL(state.url);
  for (const key of [...url.searchParams.keys()]) if (key.startsWith("utm_")) url.searchParams.delete(key);
  url.searchParams.set("utm_source", channel.source);
  url.searchParams.set("utm_medium", channel.medium);
  if (clean(state.campaign)) url.searchParams.set("utm_campaign", clean(state.campaign));
  return url.toString();
}

function renderUtm() {
  document.querySelectorAll("#channels button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === state.channel)));
  const link = tagged();
  const box = $("utm-result");
  box.classList.toggle("ready", !!link);
  if (link) {
    const [base, query] = link.split("?");
    box.replaceChildren(base + "?", Object.assign(document.createElement("mark"), { textContent: query }));
  } else box.textContent = "Pick a channel to build the link.";
  $("utm-copy").disabled = !link;
  $("utm-qr").disabled = !link;
}

/* ---------- start ---------- */

(async function start() {
  const page = await currentPage();
  state.url = page.url;
  state.title = page.title;
  const web = isWebPage(page.url);

  $("page-title").textContent = page.title || (web ? new URL(page.url).hostname : "This page");
  $("page-host").textContent = web ? page.url.replace(/^https?:\/\//, "").replace(/\/$/, "") : "Not a web page";

  document.querySelectorAll("[data-open]").forEach((a) => a.addEventListener("click", () => open(a.dataset.open)));
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

  if (!web) {
    $("blocked").hidden = false;
    document.querySelector(".tabs").hidden = true;
    document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = true));
    return;
  }

  showTab(recall("tab") || "qr");
  setQr(page.url);

  $("qr-download").addEventListener("click", () => {
    const name = `qr-${new URL(state.qrFor).hostname.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-")}`;
    qr.download({ name, extension: "png" });
  });
  $("qr-customize").addEventListener("click", () => open("/qr", { link: state.qrFor }));

  for (const c of CHANNELS) {
    const b = Object.assign(document.createElement("button"), { textContent: c.label });
    b.dataset.id = c.id;
    b.addEventListener("click", () => {
      state.channel = state.channel === c.id ? null : c.id;
      remember("channel", state.channel || "");
      renderUtm();
    });
    $("channels").append(b);
  }
  $("campaign").value = state.campaign;
  $("campaign").addEventListener("input", (e) => {
    state.campaign = e.target.value;
    remember("campaign", state.campaign);
    renderUtm();
  });
  $("utm-copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText(tagged());
    $("utm-copy").textContent = "Copied";
    setTimeout(() => ($("utm-copy").textContent = "Copy link"), 1400);
  });
  $("utm-qr").addEventListener("click", () => {
    setQr(tagged());
    showTab("qr");
  });
  $("utm-more").addEventListener("click", () => open("/utm", { url: state.url }));
  renderUtm();

  document.querySelectorAll("[data-tool]").forEach((b) =>
    b.addEventListener("click", () => {
      const tool = b.dataset.tool;
      if (tool === "headline") open("/headline", { text: state.title });
      else open(`/${tool}`, { url: state.url });
    }),
  );
})();
