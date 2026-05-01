import { useState, useEffect } from "react";
import { ShieldBan, ShieldCheck, Settings } from "lucide-react";
import { useStorage } from "@/hooks/useStorage";
import type { BlockedSite } from "@/types";

export function Popup() {
  const [blockedSites, setBlockedSites] = useStorage<BlockedSite[]>(
    "blockedSites",
    []
  );
  const [currentHostname, setCurrentHostname] = useState<string | null>(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) {
        try {
          const hostname = new URL(tab.url)
            .hostname.replace(/^www\./, "");
          setCurrentHostname(hostname);
        } catch {}
      }
    });
  }, []);

  const isBlocked =
    currentHostname !== null &&
    blockedSites.some((s) => s.hostname === currentHostname);

  const toggleBlock = () => {
    if (!currentHostname) return;
    if (isBlocked) {
      setBlockedSites(
        blockedSites.filter((s) => s.hostname !== currentHostname)
      );
    } else {
      setBlockedSites([
        ...blockedSites,
        {
          id: crypto.randomUUID(),
          hostname: currentHostname,
          createdAt: Date.now(),
        },
      ]);
    }
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const isChromeInternal =
    !currentHostname || currentHostname === "newtab" || currentHostname === "extensions";

  return (
    <div className="p-4 bg-background text-foreground">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldBan className="w-5 h-5 text-primary" />
          <h1 className="text-base font-semibold">Site Butler</h1>
        </div>
        <button
          onClick={openSettings}
          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {isChromeInternal ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Navigate to a website to block it
        </p>
      ) : (
        <div className="space-y-3">
          <div className="text-center py-1">
            <p className="text-sm text-muted-foreground mb-0.5">Current site</p>
            <p className="text-sm font-medium">{currentHostname}</p>
          </div>
          <button
            onClick={toggleBlock}
            className={`w-full h-9 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              isBlocked
                ? "bg-secondary text-foreground hover:bg-secondary/80"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            {isBlocked ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                Unblock this site
              </>
            ) : (
              <>
                <ShieldBan className="w-4 h-4" />
                Block this site
              </>
            )}
          </button>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {blockedSites.length} site{blockedSites.length !== 1 ? "s" : ""}{" "}
          blocked
        </p>
      </div>
    </div>
  );
}
