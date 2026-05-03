import type { BlockedSite } from "@/types";
import {
  BLOCKING_RULE_ID_BASE,
  ALLOW_RULE_ID_BASE,
  TEMPORARY_ALLOW_DURATION_MS,
} from "./constants";
import { getTemporaryAllows, setTemporaryAllows } from "./storage";

function createBlockingRule(
  site: BlockedSite,
  index: number
): chrome.declarativeNetRequest.Rule {
  return {
    id: BLOCKING_RULE_ID_BASE + index,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        extensionPath: "/src/blocked/index.html?host=" + encodeURIComponent(site.hostname),
      },
    },
    condition: {
      requestDomains: [site.hostname],
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  };
}

export async function syncBlockingRules(
  sites: BlockedSite[]
): Promise<void> {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const blockingRuleIds = existingRules
    .filter(
      (r) =>
        r.id >= BLOCKING_RULE_ID_BASE && r.id < ALLOW_RULE_ID_BASE
    )
    .map((r) => r.id);

  const newRules = sites.map((site, i) => createBlockingRule(site, i));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: blockingRuleIds,
    addRules: newRules,
  });
}

export async function temporarilyAllowSite(
  hostname: string,
  tabId: number
): Promise<void> {
  const [allows, existingSessionRules] = await Promise.all([
    getTemporaryAllows(),
    chrome.declarativeNetRequest.getSessionRules(),
  ]);
  const existingIds = new Set(existingSessionRules.map((r) => r.id));
  let ruleId = ALLOW_RULE_ID_BASE;
  if (allows.length > 0) {
    ruleId =
      ALLOW_RULE_ID_BASE +
      Math.max(...allows.map((a) => a.ruleId - ALLOW_RULE_ID_BASE)) +
      1;
  }
  while (existingIds.has(ruleId)) ruleId++;

  await chrome.declarativeNetRequest.updateSessionRules({
    addRules: [
      {
        id: ruleId,
        priority: 2,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.ALLOW,
        },
        condition: {
          requestDomains: [hostname],
          resourceTypes: [
            chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
          ],
          tabIds: [tabId],
        },
      },
    ],
  });

  const expiresAt = Date.now() + TEMPORARY_ALLOW_DURATION_MS;
  allows.push({ hostname, ruleId, tabId, expiresAt });
  await setTemporaryAllows(allows);

  chrome.alarms.create(`allow-expire-${ruleId}`, {
    delayInMinutes: TEMPORARY_ALLOW_DURATION_MS / 60000,
  });
}

export async function removeAllowRulesForTab(
  tabId: number
): Promise<void> {
  const [allows, existingRules] = await Promise.all([
    getTemporaryAllows(),
    chrome.declarativeNetRequest.getSessionRules(),
  ]);
  const toRemove = allows.filter((a) => a.tabId === tabId);
  if (toRemove.length === 0) return;

  const existingIds = new Set(existingRules.map((r) => r.id));
  const idsToRemove = toRemove.map((a) => a.ruleId).filter((id) => existingIds.has(id));
  if (idsToRemove.length > 0) {
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: idsToRemove });
  }
  await setTemporaryAllows(allows.filter((a) => a.tabId !== tabId));
}

export async function cleanupExpiredAllows(): Promise<void> {
  const [allows, existingRules] = await Promise.all([
    getTemporaryAllows(),
    chrome.declarativeNetRequest.getSessionRules(),
  ]);
  const now = Date.now();
  const expired = allows.filter((a) => a.expiresAt <= now);
  if (expired.length === 0) return;

  const existingIds = new Set(existingRules.map((r) => r.id));
  const idsToRemove = expired.map((a) => a.ruleId).filter((id) => existingIds.has(id));
  if (idsToRemove.length > 0) {
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: idsToRemove });
  }
  await setTemporaryAllows(allows.filter((a) => a.expiresAt > now));
}

export async function clearAllTemporaryAllows(): Promise<void> {
  const [allows, existingRules] = await Promise.all([
    getTemporaryAllows(),
    chrome.declarativeNetRequest.getSessionRules(),
  ]);
  if (allows.length === 0) return;

  const existingIds = new Set(existingRules.map((r) => r.id));
  const idsToRemove = allows.map((a) => a.ruleId).filter((id) => existingIds.has(id));
  if (idsToRemove.length > 0) {
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: idsToRemove });
  }
  await setTemporaryAllows([]);
}
