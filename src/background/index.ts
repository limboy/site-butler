import { getSettings } from "@/lib/storage";
import {
  syncBlockingRules,
  temporarilyAllowSite,
  removeAllowRulesForTab,
  cleanupExpiredAllows,
  clearAllTemporaryAllows,
} from "@/lib/rules";
import type { Message } from "@/types";

const pendingUrls = new Map<number, string>();

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await syncBlockingRules(settings.blockedSites);
});

chrome.runtime.onStartup.addListener(async () => {
  await clearAllTemporaryAllows();
  const settings = await getSettings();
  await syncBlockingRules(settings.blockedSites);
});

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  const url = details.url;
  if (url.startsWith("chrome") || url.startsWith("about")) return;

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const settings = await getSettings();
    if (settings.blockedSites.some((s) => hostname.endsWith(s.hostname))) {
      pendingUrls.set(details.tabId, url);
    }
  } catch {}
});

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    if (message.type === "TEMPORARILY_ALLOW") {
      temporarilyAllowSite(message.hostname, message.tabId).then(() =>
        sendResponse({ success: true })
      );
      return true;
    }
    if (message.type === "SYNC_RULES") {
      getSettings()
        .then((s) => syncBlockingRules(s.blockedSites))
        .then(() => sendResponse({ success: true }));
      return true;
    }
    if (message.type === "GET_ORIGINAL_URL") {
      const url = pendingUrls.get(message.tabId);
      sendResponse({ url: url ?? null });
      return false;
    }
  }
);

chrome.tabs.onRemoved.addListener((tabId) => {
  removeAllowRulesForTab(tabId);
  pendingUrls.delete(tabId);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith("allow-expire-")) {
    cleanupExpiredAllows();
  }
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === "sync" && changes.blockedSites) {
    const settings = await getSettings();
    await syncBlockingRules(settings.blockedSites);
  }
});
