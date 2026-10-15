// The popup: a home screen with every tool for the page you're on (the QR code first),
// plus two tools that work right inside it: QR code and UTM link. The rest open on mktbox.xyz with the page filled in.

// Usual medium for a known source, so the medium can be left empty (same values as the website's UTM builder)
const MEDIUM_FOR = {
  linkedin: "social", instagram: "social", facebook: "social", x: "social", tiktok: "social",
  youtube: "video", newsletter: "email", google: "cpc", qr: "offline",
};

const $ = (id) => document.getElementById(id);
const remember = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};
const recall = (key) => {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
};

const state = { url: "", title: "", qrFor: "" };

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

/* ---------- views ---------- */

function show(view) {
  document.querySelectorAll("[data-view]").forEach((v) => (v.hidden = v.dataset.view !== view));
  $("back").hidden = view === "home";
  if (view === "utm") $("utm-source").focus();
}

/* ---------- QR ---------- */

const QR_STYLE = {
  type: "canvas",
  margin: 0,
  qrOptions: { errorCorrectionLevel: "M" },
  dotsOptions: { type: "rounded", color: "#2b2d6e" },
  cornersSquareOptions: { type: "extra-rounded", color: "#6c70e0" },
  cornersDotOptions: { type: "dot", color: "#6c70e0" },
  backgroundOptions: { color: "#ffffff" },
};
const qr = new QRCodeStyling({ ...QR_STYLE, width: 600, height: 600, data: " " });
const qrMini = new QRCodeStyling({ ...QR_STYLE, width: 240, height: 240, data: " " });
qr.append($("qr"));
qrMini.append($("qr-mini"));

function setQr(data) {
  state.qrFor = data;
  qr.update({ data });
  $("qr-for").textContent = data.replace(/^https?:\/\//, "");
}

/* ---------- UTM ---------- */

const clean = (s) => s.trim().toLowerCase().replace(/\s+/g, "_");
const fields = () => {
  const source = clean($("utm-source").value);
  const medium = clean($("utm-medium").value) || MEDIUM_FOR[source] || "";
  return { source, medium, campaign: clean($("utm-campaign").value) };
};

function tagged() {
  const { source, medium, campaign } = fields();
  if (!source || !medium) return "";
  const url = new URL(state.url);
  for (const key of [...url.searchParams.keys()]) if (key.startsWith("utm_")) url.searchParams.delete(key);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  if (campaign) url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

function renderUtm() {
  const source = clean($("utm-source").value);
  $("utm-medium").placeholder = MEDIUM_FOR[source] || "social";
  const link = tagged();
  const box = $("utm-result");
  box.classList.toggle("ready", !!link);
  if (link) {
    const [base, query] = link.split("?");
    box.replaceChildren(base + "?", Object.assign(document.createElement("mark"), { textContent: query }));
  } else box.textContent = "Fill in the source and medium to build the link.";
  $("utm-copy").disabled = !link;
  $("utm-qr").disabled = !link;
}

/* ---------- start ---------- */

(async function start() {
  const page = await currentPage();
  state.url = page.url;
  state.title = page.title;
  const web = isWebPage(page.url);

  $("page-host").textContent = web ? new URL(page.url).hostname.replace(/^www\./, "") : "";
  document.querySelectorAll("[data-open]").forEach((a) => a.addEventListener("click", () => open(a.dataset.open)));
  $("back").addEventListener("click", () => show("home"));
  show("home");

  if (!web) {
    $("blocked").hidden = false;
    document.querySelectorAll(".qr-card, .card").forEach((c) => (c.disabled = true));
    return;
  }

  setQr(page.url);
  qrMini.update({ data: page.url });
  document.querySelectorAll("[data-go]").forEach((b) =>
    b.addEventListener("click", () => {
      if (b.dataset.go === "qr") setQr(state.url); // the home card is always this page (the UTM view can hand over a tagged link)
      show(b.dataset.go);
    }),
  );
  document.querySelectorAll("[data-tool]").forEach((b) =>
    b.addEventListener("click", () => {
      const tool = b.dataset.tool;
      if (tool === "headline") open("/headline", { text: state.title });
      else open(`/${tool}`, { url: state.url });
    }),
  );

  $("qr-download").addEventListener("click", () => {
    const name = `qr-${new URL(state.qrFor).hostname.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-")}`;
    qr.download({ name, extension: "png" });
  });
  $("qr-customize").addEventListener("click", () => open("/qr", { link: state.qrFor }));

  for (const id of ["utm-source", "utm-medium", "utm-campaign"]) {
    $(id).value = recall(id);
    $(id).addEventListener("input", () => {
      remember(id, $(id).value);
      renderUtm();
    });
  }
  $("utm-copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText(tagged());
    $("utm-copy").textContent = "Copied";
    setTimeout(() => ($("utm-copy").textContent = "Copy link"), 1400);
  });
  $("utm-qr").addEventListener("click", () => {
    setQr(tagged());
    show("qr");
  });
  $("utm-more").addEventListener("click", () => open("/utm", { url: state.url }));
  renderUtm();
  // opened as a normal page (store screenshots, testing): ?view=qr|utm starts on that screen
  if (!globalThis.chrome?.tabs?.query) {
    const v = new URLSearchParams(location.search).get("view");
    if (v === "qr" || v === "utm") show(v);
  }
})();
