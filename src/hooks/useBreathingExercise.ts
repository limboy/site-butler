import { useState, useEffect, useCallback, useRef } from "react";
import { INHALE_DURATION_MS } from "@/lib/constants";

type Phase = "idle" | "inhale" | "exhale" | "complete";

interface BreathingState {
  phase: Phase;
  currentBreath: number;
  totalBreaths: number;
}

export function useBreathingExercise(totalBreaths: number) {
  const [state, setState] = useState<BreathingState>({
    phase: "idle",
    currentBreath: 0,
    totalBreaths,
  });
  const intervalRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    cleanup();
    setState({ phase: "inhale", currentBreath: 1, totalBreaths });

    let tick = 1;
    intervalRef.current = window.setInterval(() => {
      tick++;
      setState((prev) => {
        if (prev.phase === "inhale") {
          return { ...prev, phase: "exhale" };
        }
        const nextBreath = prev.currentBreath + 1;
        if (nextBreath > totalBreaths) {
          cleanup();
          return { ...prev, phase: "complete" };
        }
        return { ...prev, phase: "inhale", currentBreath: nextBreath };
      });
    }, INHALE_DURATION_MS);
  }, [totalBreaths, cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return { state, start };
}
