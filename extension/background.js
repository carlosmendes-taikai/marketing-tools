// Right-click menu: send a selection, link, image or page straight to the matching tool.
importScripts("shared.js");

const MENU = [
  { id: "headline", title: "Score this headline", contexts: ["selection"], open: (info) => toolUrl("/headline", { text: info.selectionText }) },
  { id: "keywords", title: "Keyword ideas for “%s”", contexts: ["selection"], open: (info) => toolUrl("/keywords", { q: info.selectionText }) },
  { id: "link-preview", title: "Check this link's preview", contexts: ["link"], open: (info) => toolUrl("/preview", { url: info.linkUrl }) },
  { id: "link-qr", title: "QR code for this link", contexts: ["link"], open: (info) => toolUrl("/qr", { link: info.linkUrl }) },
  { id: "image-resize", title: "Resize this image for social", contexts: ["image"], open: (info) => toolUrl("/resize", { img: info.srcUrl }) },
  { id: "page-speed", title: "Speed audit this page", contexts: ["page"], open: (info) => toolUrl("/speed", { url: info.pageUrl }) },
  { id: "page-preview", title: "Check how this page looks when shared", contexts: ["page"], open: (info) => toolUrl("/preview", { url: info.pageUrl }) },
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "mktbox", title: "mktbox", contexts: ["selection", "link", "image", "page"] });
    for (const item of MENU) chrome.contextMenus.create({ id: item.id, parentId: "mktbox", title: item.title, contexts: item.contexts, documentUrlPatterns: ["http://*/*", "https://*/*"] });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const item = MENU.find((m) => m.id === info.menuItemId);
  if (item) chrome.tabs.create({ url: item.open(info), index: tab ? tab.index + 1 : undefined });
});
