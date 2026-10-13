// Shared by the popup and the right-click menu.

const SITE = "https://mktbox.xyz";

/** A link into one of the tools, tagged so we can see visits that came from the extension. */
function toolUrl(path, params = {}) {
  const url = new URL(path, SITE);
  for (const [key, value] of Object.entries(params)) if (value) url.searchParams.set(key, value);
  url.searchParams.set("utm_source", "chrome_extension");
  url.searchParams.set("utm_medium", "extension");
  return url.toString();
}

/** Only normal web pages can be shared, tagged or audited (not chrome:// pages, files, the new tab page…). */
const isWebPage = (url) => /^https?:\/\//.test(url || "");
