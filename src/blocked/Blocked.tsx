import { useState, useEffect, useRef } from "react";
import { Wind, ArrowRight, X } from "lucide-react";
import { useBreathingExercise } from "@/hooks/useBreathingExercise";
import { DEFAULT_BREATH_COUNT } from "@/lib/constants";
import { recordBlockEvent, updateBlockEventDecision } from "@/lib/storage";

type Stage = "intro" | "breathing" | "decision";

const PETAL_OFFSETS = [
  { x: 0, y: 0 },
  { x: 0, y: -28 },
  { x: 24, y: -14 },
  { x: 24, y: 14 },
  { x: 0, y: 28 },
  { x: -24, y: 14 },
  { x: -24, y: -14 },
];

export function Blocked() {
  const [stage, setStage] = useState<Stage>("intro");
  const [breathCount, setBreathCount] = useState(DEFAULT_BREATH_COUNT);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const eventIdRef = useRef<string | null>(null);

  const params = new URLSearchParams(window.location.search);
  const hostname = params.get("host") ?? "this site";

  const { state, start } = useBreathingExercise(breathCount);

  useEffect(() => {
    chrome.storage.sync.get("breathCount").then((data) => {
      if (data.breathCount) setBreathCount(data.breathCount as number);
    });

    chrome.tabs.getCurrent().then((tab) => {
      if (tab?.id) {
        chrome.runtime.sendMessage(
          { type: "GET_ORIGINAL_URL", tabId: tab.id },
          (response) => {
            if (response?.url) setOriginalUrl(response.url);
          }
        );
      }
    });

    recordBlockEvent(hostname).then((id) => {
      eventIdRef.current = id;
    });
  }, []);

  useEffect(() => {
    if (state.phase === "complete") {
      setStage("decision");
    }
  }, [state.phase]);

  const handleStart = () => {
    setStage("breathing");
    start();
  };

  const handleYes = async () => {
    const tab = await chrome.tabs.getCurrent();
    if (!tab?.id) return;
    if (eventIdRef.current) {
      await updateBlockEventDecision(eventIdRef.current, "yes");
    }
    await chrome.runtime.sendMessage({
      type: "TEMPORARILY_ALLOW",
      hostname,
      tabId: tab.id,
    });
    const targetUrl = originalUrl ?? `https://${hostname}`;
    chrome.tabs.update(tab.id, { url: targetUrl });
  };

  const handleNo = async () => {
    const tab = await chrome.tabs.getCurrent();
    if (!tab?.id) return;
    if (eventIdRef.current) {
      await updateBlockEventDecision(eventIdRef.current, "no");
    }
    chrome.tabs.update(tab.id, { url: "chrome://newtab" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col items-center justify-center text-foreground selection:bg-primary/20">
      {stage === "intro" && (
        <div className="animate-fade-in-up flex flex-col items-center gap-8 px-4">
          <div className="flex flex-col items-center gap-3">
            <Wind className="w-10 h-10 text-primary" />
            <h1 className="text-2xl font-light tracking-wide text-foreground">
              Let's take a moment
            </h1>
            <p className="text-muted-foreground text-sm">
              Before visiting{" "}
              <span className="text-foreground font-medium">{hostname}</span>
            </p>
          </div>
          <button
            onClick={handleStart}
            className="px-8 py-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all text-sm font-medium tracking-wide shadow-sm"
          >
            Start Breathing
          </button>
        </div>
      )}

      {stage === "breathing" && (
        <div className="flex flex-col items-center gap-12">
          <p className="text-xs text-muted-foreground tracking-widest uppercase">
            Breath {state.currentBreath} of {state.totalBreaths}
          </p>

          <div className="relative w-48 h-48 animate-breathe">
            {PETAL_OFFSETS.map((offset, i) => (
              <div
                key={i}
                className="absolute w-24 h-24 rounded-full"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  background:
                    i === 0
                      ? "radial-gradient(circle, oklch(0.7 0.15 195 / 0.5), oklch(0.6 0.18 180 / 0.05))"
                      : `radial-gradient(circle, oklch(0.65 0.12 ${195 + i * 15} / 0.35), transparent)`,
                }}
              />
            ))}
            <div className="absolute inset-0 rounded-full animate-breathe-glow" />
          </div>

          <p className="text-lg font-light tracking-[0.2em] text-primary">
            {state.phase === "inhale" ? "Inhale..." : "Exhale..."}
          </p>
        </div>
      )}

      {stage === "decision" && (
        <div className="animate-fade-in-up flex flex-col items-center gap-8 px-4">
          <div className="flex flex-col items-center gap-2">
            <p className="text-muted-foreground text-sm">Still want to visit</p>
            <p className="text-xl font-light text-foreground">{hostname}?</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleNo}
              className="px-6 py-2.5 rounded-full border border-border text-muted-foreground hover:bg-secondary transition-colors text-sm flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              No
            </button>
            <button
              onClick={handleYes}
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-all text-sm flex items-center gap-2 shadow-sm"
            >
              Yes
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
