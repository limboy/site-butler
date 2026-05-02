import { useState, useEffect, useCallback } from "react";
import { BarChart2, Trash2 } from "lucide-react";
import { getBlockEvents, clearBlockEvents } from "@/lib/storage";
import type { BlockEvent } from "@/types";

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  const isThisYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    ...(!isThisYear && { year: "numeric" }),
  });
}

function DecisionBadge({ decision }: { decision: BlockEvent["decision"] }) {
  if (decision === "no") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
        Resisted
      </span>
    );
  }
  if (decision === "yes") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
        Visited
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground/40">—</span>;
}

export function Statistics() {
  const [events, setEvents] = useState<BlockEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await getBlockEvents();
    setEvents(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = events.length;
  const noCount = events.filter((e) => e.decision === "no").length;
  const yesCount = events.filter((e) => e.decision === "yes").length;
  const decidedCount = noCount + yesCount;
  const resistanceRate =
    decidedCount > 0 ? Math.round((noCount / decidedCount) * 100) : 0;

  const byHostname = events.reduce<
    Record<string, { total: number; no: number; yes: number }>
  >((acc, e) => {
    if (!acc[e.hostname]) acc[e.hostname] = { total: 0, no: 0, yes: 0 };
    acc[e.hostname].total++;
    if (e.decision === "no") acc[e.hostname].no++;
    if (e.decision === "yes") acc[e.hostname].yes++;
    return acc;
  }, {});
  const sortedSites = Object.entries(byHostname).sort(
    (a, b) => b[1].total - a[1].total
  );

  const hourCounts = Array<number>(24).fill(0);
  events.forEach((e) => {
    hourCounts[new Date(e.timestamp).getHours()]++;
  });
  const maxHourCount = Math.max(...hourCounts, 1);

  const recentEvents = [...events].reverse().slice(0, 15);

  if (loading) return null;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <BarChart2 className="w-10 h-10 text-muted-foreground/20" />
        <p className="text-sm text-muted-foreground">No data yet</p>
        <p className="text-xs text-muted-foreground/50">
          Statistics appear once sites start getting blocked.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1.5">Total</p>
          <p className="text-2xl font-semibold tabular-nums">{total}</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">attempts</p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1.5">Resisted</p>
          <p className="text-2xl font-semibold text-emerald-600 tabular-nums">
            {noCount}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {decidedCount > 0 ? `${resistanceRate}% of decided` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50/40 px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1.5">Visited</p>
          <p className="text-2xl font-semibold text-amber-500 tabular-nums">
            {yesCount}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {decidedCount > 0 ? `${100 - resistanceRate}% of decided` : "—"}
          </p>
        </div>
      </div>

      {/* Hour chart */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Activity by Hour
        </h3>
        <div className="flex items-end gap-px h-14">
          {hourCounts.map((count, hour) => (
            <div
              key={hour}
              className="flex-1 rounded-t-sm transition-all"
              title={`${hour}:00–${hour + 1}:00 · ${count} attempt${count !== 1 ? "s" : ""}`}
              style={{
                height: count === 0 ? "2px" : `${(count / maxHourCount) * 100}%`,
                backgroundColor:
                  count === 0
                    ? "oklch(0.93 0 0)"
                    : `oklch(${0.55 + 0.2 * (1 - count / maxHourCount)} 0.15 195 / ${0.4 + 0.6 * (count / maxHourCount)})`,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground/50">
          {["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p", "11p"].map(
            (label) => (
              <span key={label}>{label}</span>
            )
          )}
        </div>
      </div>

      {/* By site */}
      {sortedSites.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            By Site
          </h3>
          <div className="space-y-4">
            {sortedSites.slice(0, 8).map(([hostname, counts]) => {
              const noPercent =
                counts.total > 0 ? (counts.no / counts.total) * 100 : 0;
              const yesPercent =
                counts.total > 0 ? (counts.yes / counts.total) * 100 : 0;
              return (
                <div key={hostname}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium">{hostname}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {counts.total}×
                    </span>
                  </div>
                  <div className="flex rounded-full h-1.5 overflow-hidden bg-muted">
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${noPercent}%` }}
                    />
                    <div
                      className="bg-amber-400 transition-all"
                      style={{ width: `${yesPercent}%` }}
                    />
                  </div>
                  <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      {counts.no} resisted
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                      {counts.yes} visited
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Recent Activity
        </h3>
        <ul className="divide-y divide-border">
          {recentEvents.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between py-2 text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-muted-foreground/60 shrink-0 tabular-nums w-16 whitespace-nowrap">
                  {formatTime(event.timestamp)}
                </span>
                <span className="truncate">{event.hostname}</span>
              </div>
              <DecisionBadge decision={event.decision} />
            </li>
          ))}
        </ul>
      </div>

      {/* Clear */}
      <div className="flex justify-end pt-2 border-t border-border">
        <button
          onClick={async () => {
            await clearBlockEvents();
            setEvents([]);
          }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1.5 rounded-md hover:bg-destructive/5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear statistics
        </button>
      </div>
    </div>
  );
}
