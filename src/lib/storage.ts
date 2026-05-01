import type { Settings, TemporaryAllow } from "@/types";
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
