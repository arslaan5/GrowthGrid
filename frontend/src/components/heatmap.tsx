"use client";

import CalendarHeatmap, { type ReactCalendarHeatmapValue } from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { subYears, subMonths, format } from "date-fns";
import type { HeatmapDay } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useMemo, useEffect } from "react";

type HeatmapValue = ReactCalendarHeatmapValue<string> & { count?: number };

interface HeatmapProps {
  data: HeatmapDay[];
}

function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

const SCALE_COLORS = {
  1: "oklch(0.75 0.12 142)",
  2: "oklch(0.65 0.16 142)",
  3: "oklch(0.55 0.2 142)",
  4: "oklch(0.45 0.22 142)",
} as const;

export function Heatmap({ data }: HeatmapProps) {
  const today = new Date();
  const isMobile = useIsMobile();

  // Desktop: full year. Mobile: last 3 months.
  const startDate = isMobile ? subMonths(today, 3) : subYears(today, 1);

  // Filter data to only include entries within the visible window.
  const visibleData = useMemo(() => {
    if (!isMobile) return data;
    const cutoff = startDate.toISOString().slice(0, 10);
    return data.filter((d) => d.date >= cutoff);
  }, [data, isMobile, startDate]);

  const [pill, setPill] = useState<{ date: string; count: number } | null>(null);

  // Desktop tooltip state (hover-controlled)
  const [tip, setTip] = useState<{ date: string; count: number } | null>(null);

  const stats = useMemo(() => {
    const activeDays = data.filter((d) => d.count > 0).length;
    const totalEntries = data.reduce((sum, d) => sum + d.count, 0);
    return { activeDays, totalEntries };
  }, [data]);

  const cellSize = isMobile ? 14 : 11;
  const cellGap = isMobile ? 3 : 2;

  const classForValue = (value: HeatmapValue | undefined) => {
    const count = value?.count ?? 0;
    if (count === 0) return "color-empty";
    if (count === 1) return "color-scale-1";
    if (count === 2) return "color-scale-2";
    if (count === 3) return "color-scale-3";
    return "color-scale-4";
  };

  const titleForValue = (value: HeatmapValue | undefined) => {
    const count = value?.count ?? 0;
    if (!value?.date) return "";
    return `${value.date}: ${count} entr${count === 1 ? "y" : "ies"}`;
  };

  const handleClick = (value: HeatmapValue | undefined) => {
    if (!value?.count) {
      setPill(null);
      setTip(null);
      return;
    }
    const date = typeof value.date === "string" ? value.date : "";
    if (isMobile) {
      setPill(pill?.date === date ? null : { date, count: value.count });
    } else {
      setTip(tip?.date === date ? null : { date, count: value.count });
    }
  };

  return (
    <div className="space-y-3">
      {/* Mobile tap-pill */}
      {isMobile && pill && (
        <div className="animate-fade-in flex justify-center">
          <span className="bg-foreground text-background inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium shadow-md">
            <span>{format(new Date(pill.date), "MMM d, yyyy")}</span>
            <span className="bg-background/20 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
              {pill.count} entr{pill.count === 1 ? "y" : "ies"}
            </span>
          </span>
        </div>
      )}

      <div className="heatmap-wrapper overflow-x-auto">
        <style>{`
          .heatmap-wrapper .react-calendar-heatmap text {
            font-size: 8px;
            fill: var(--color-muted-foreground);
          }
          .heatmap-wrapper .react-calendar-heatmap rect {
            rx: 2;
            ry: 2;
          }
          .heatmap-wrapper .react-calendar-heatmap .color-empty {
            fill: var(--color-muted);
          }
          .heatmap-wrapper .react-calendar-heatmap .color-scale-1 {
            fill: ${SCALE_COLORS[1]};
          }
          .heatmap-wrapper .react-calendar-heatmap .color-scale-2 {
            fill: ${SCALE_COLORS[2]};
          }
          .heatmap-wrapper .react-calendar-heatmap .color-scale-3 {
            fill: ${SCALE_COLORS[3]};
          }
          .heatmap-wrapper .react-calendar-heatmap .color-scale-4 {
            fill: ${SCALE_COLORS[4]};
          }
          .heatmap-wrapper .react-calendar-heatmap rect:hover {
            stroke: var(--color-foreground);
            stroke-width: 1px;
            cursor: pointer;
          }
          /* On mobile: hide month labels, stretch SVG to full width */
          .heatmap-mobile .react-calendar-heatmap-month-label {
            display: none;
          }
          .heatmap-mobile svg {
            width: 100%;
            height: auto;
            display: block;
          }
        `}</style>

        <Tooltip open={!isMobile && !!tip}>
          <TooltipTrigger asChild>
            <div
              className={`heatmap-wrapper${isMobile ? "heatmap-mobile" : ""}`}
              style={
                {
                  "--cell-size": `${cellSize}px`,
                  "--cell-gap": `${cellGap}px`,
                } as React.CSSProperties
              }
            >
              <CalendarHeatmap
                startDate={startDate}
                endDate={today}
                values={visibleData}
                classForValue={classForValue}
                showWeekdayLabels={!isMobile}
                gutterSize={cellGap}
                onClick={handleClick}
                titleForValue={titleForValue}
              />
            </div>
          </TooltipTrigger>
          {!isMobile && tip && (
            <TooltipContent>
              <p className="text-xs font-medium">
                {format(new Date(tip.date), "MMM d, yyyy")} — {tip.count} entr
                {tip.count === 1 ? "y" : "ies"}
              </p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Footer: legend + summary */}
      <div className="text-muted-foreground flex flex-col gap-1.5 text-xs sm:flex-row sm:items-center sm:justify-between">
        <span>
          {stats.activeDays} active day{stats.activeDays !== 1 ? "s" : ""} · {stats.totalEntries}{" "}
          entr{stats.totalEntries !== 1 ? "ies" : "y"} this year
        </span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: "var(--color-muted)" }}
          />
          {Object.values(SCALE_COLORS).map((color) => (
            <span
              key={color}
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
