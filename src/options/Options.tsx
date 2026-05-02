import { useState } from "react";
import { Plus, Trash2, Wind, ShieldBan, BarChart2, Settings } from "lucide-react";
import { useStorage } from "@/hooks/useStorage";
import type { BlockedSite } from "@/types";
import { Statistics } from "./Statistics";

export function Options() {
  const [activeTab, setActiveTab] = useState<"settings" | "statistics">(
    "settings"
  );
  const [blockedSites, setBlockedSites] = useStorage<BlockedSite[]>(
    "blockedSites",
    []
  );
  const [breathCount, setBreathCount] = useStorage<number>("breathCount", 3);
  const [input, setInput] = useState("");

  const addSite = () => {
    const hostname = input
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "");
    if (!hostname || blockedSites.some((s) => s.hostname === hostname)) return;

    setBlockedSites([
      ...blockedSites,
      { id: crypto.randomUUID(), hostname, createdAt: Date.now() },
    ]);
    setInput("");
  };

  const removeSite = (id: string) => {
    setBlockedSites(blockedSites.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="flex items-center gap-3 mb-8">
          <ShieldBan className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-semibold">Site Butler</h1>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-lg bg-secondary/60 mb-8">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "settings"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => setActiveTab("statistics")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "statistics"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            Statistics
          </button>
        </div>

        {activeTab === "statistics" && <Statistics />}

        {activeTab === "settings" && (
          <>
          <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Blocked Sites
          </h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSite()}
              placeholder="e.g. youtube.com"
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
            <button
              onClick={addSite}
              className="h-9 px-4 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {blockedSites.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No sites blocked yet. Add a hostname above or use the popup to
                block the current site.
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {blockedSites.map((site) => (
                <li
                  key={site.id}
                  className="flex items-center justify-between px-3 py-2 rounded-md border border-border text-sm hover:bg-secondary/50 transition-colors"
                >
                  <span>{site.hostname}</span>
                  <button
                    onClick={() => removeSite(site.id)}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive-foreground transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Breathing Exercise
          </h2>
          <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Wind className="w-4 h-4 text-muted-foreground" />
              <span>Breaths required</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => breathCount > 1 && setBreathCount(breathCount - 1)}
                className="w-7 h-7 rounded-md border border-input text-sm flex items-center justify-center hover:bg-secondary transition-colors"
              >
                -
              </button>
              <span className="text-sm font-medium w-5 text-center">
                {breathCount}
              </span>
              <button
                onClick={() =>
                  breathCount < 10 && setBreathCount(breathCount + 1)
                }
                className="w-7 h-7 rounded-md border border-input text-sm flex items-center justify-center hover:bg-secondary transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </section>
        </>
        )}
      </div>
    </div>
  );
}
