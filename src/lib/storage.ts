import type { BlockEvent, Settings, TemporaryAllow } from "@/types";
import { DEFAULT_BREATH_COUNT } from "./constants";

const DEFAULT_SETTINGS: Settings = {
  blockedSites: [],
  breathCount: DEFAULT_BREATH_COUNT,
};

export async function getSettings(): Promise<Settings> {
  const data = await chrome.storage.sync.get(["blockedSites", "breathCount"]);
  return {
    blockedSites:
      (data.blockedSites as Settings["blockedSites"] | undefined) ??
      DEFAULT_SETTINGS.blockedSites,
    breathCount:
      (data.breathCount as number | undefined) ??
      DEFAULT_SETTINGS.breathCount,
  };
}

export async function saveSettings(
  settings: Partial<Settings>
): Promise<void> {
  await chrome.storage.sync.set(settings);
}

export async function getTemporaryAllows(): Promise<TemporaryAllow[]> {
  const data = await chrome.storage.session.get("temporaryAllows");
  return (data.temporaryAllows as TemporaryAllow[] | undefined) ?? [];
}

export async function setTemporaryAllows(
  allows: TemporaryAllow[]
): Promise<void> {
  await chrome.storage.session.set({ temporaryAllows: allows });
}

export async function getBlockEvents(): Promise<BlockEvent[]> {
  const data = await chrome.storage.local.get("blockEvents");
  return (data.blockEvents as BlockEvent[] | undefined) ?? [];
}

export async function recordBlockEvent(hostname: string): Promise<string> {
  const events = await getBlockEvents();
  const id = crypto.randomUUID();
  const event: BlockEvent = {
    id,
    hostname,
    timestamp: Date.now(),
    decision: "viewed",
  };
  await chrome.storage.local.set({ blockEvents: [...events, event].slice(-1000) });
  return id;
}

export async function updateBlockEventDecision(
  id: string,
  decision: "yes" | "no"
): Promise<void> {
  const events = await getBlockEvents();
  await chrome.storage.local.set({
    blockEvents: events.map((e) => (e.id === id ? { ...e, decision } : e)),
  });
}

export async function clearBlockEvents(): Promise<void> {
  await chrome.storage.local.remove("blockEvents");
}
