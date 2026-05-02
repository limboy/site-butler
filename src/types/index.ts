export interface BlockedSite {
  id: string;
  hostname: string;
  createdAt: number;
}

export interface Settings {
  blockedSites: BlockedSite[];
  breathCount: number;
}

export type Message =
  | { type: "TEMPORARILY_ALLOW"; hostname: string; tabId: number }
  | { type: "SYNC_RULES" }
  | { type: "GET_ORIGINAL_URL"; tabId: number };

export interface TemporaryAllow {
  hostname: string;
  ruleId: number;
  tabId: number;
  expiresAt: number;
}

export interface BlockEvent {
  id: string;
  hostname: string;
  timestamp: number;
  decision: "yes" | "no" | "viewed";
}
