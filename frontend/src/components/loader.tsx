"use client";

import { useState, useEffect } from "react";
import { Flame } from "lucide-react";

const tips = [
  "Consistency beats perfection.",
  "Small steps compound into big results.",
  "Every expert was once a beginner.",
  "Learning is a journey, not a destination.",
  "The best time to start was yesterday. The next best time is now.",
  "You don't have to be great to start, but you have to start to be great.",
  "Progress, not perfection.",
  "What you learn today shapes who you become tomorrow.",
  "A little progress each day adds up to big results.",
  "Discipline is choosing what you want most over what you want now.",
  "Stay curious — it's the engine of achievement.",
  "Your future self will thank you for today's effort.",
  "Knowledge is the one thing nobody can take from you.",
  "Fall seven times, stand up eight.",
  "Showing up is 80% of the battle.",
];

function pickRandom(): string {
  return tips[Math.floor(Math.random() * tips.length)];
}

interface LoaderProps {
  /** Optional message shown above the subtitle. Defaults to "Loading…" */
  message?: string;
  /** If true, renders full-screen centered. Otherwise inline with padding. */
  fullScreen?: boolean;
}

export function Loader({
  message = "Loading…",
  fullScreen = true,
}: LoaderProps) {
  const [subtitle, setSubtitle] = useState(pickRandom);

  // Rotate subtitle every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitle(pickRandom());
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={
        fullScreen
          ? "min-h-screen flex items-center justify-center"
          : "flex items-center justify-center py-20"
      }
    >
      <div className="flex flex-col items-center gap-4 text-center px-6 max-w-sm">
        {/* Animated logo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Flame className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>

        {/* Message */}
        <p className="text-sm font-medium text-foreground">{message}</p>

        {/* Motivational subtitle with fade transition */}
        <p
          key={subtitle}
          className="text-xs text-muted-foreground italic animate-fade-in"
        >
          &ldquo;{subtitle}&rdquo;
        </p>
      </div>
    </div>
  );
}
