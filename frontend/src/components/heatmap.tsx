"use client";

import CalendarHeatmap, {
  type ReactCalendarHeatmapValue,
} from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { subYears, format } from "date-fns";
import type { HeatmapDay } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useMemo } from "react";

type HeatmapValue = ReactCalendarHeatmapValue<string> & { count?: number };

interface HeatmapProps {
  data: HeatmapDay[];
}

export function Heatmap({ data }: HeatmapProps) {
  const today = new Date();
  const startDate = subYears(today, 1);

  const [tip, setTip] = useState<{ date: string; count: number } | null>(null);

  const stats = useMemo(() => {
    const activeDays = data.filter((d) => d.count > 0).length;
    const totalEntries = data.reduce((sum, d) => sum + d.count, 0);
    return { activeDays, totalEntries };
  }, [data]);

  return (
    <div className="space-y-3">
      <div className="heatmap-wrapper overflow-x-auto">
        <style jsx global>{`
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
            fill: oklch(0.75 0.12 142);
          }
          .heatmap-wrapper .react-calendar-heatmap .color-scale-2 {
            fill: oklch(0.65 0.16 142);
          }
          .heatmap-wrapper .react-calendar-heatmap .color-scale-3 {
            fill: oklch(0.55 0.2 142);
          }
          .heatmap-wrapper .react-calendar-heatmap .color-scale-4 {
            fill: oklch(0.45 0.22 142);
          }
          .heatmap-wrapper .react-calendar-heatmap rect:hover {
            stroke: var(--color-foreground);
            stroke-width: 1px;
          }
        `}</style>

        <Tooltip open={!!tip}>
          <TooltipTrigger asChild>
            <div>
              <CalendarHeatmap
                startDate={startDate}
                endDate={today}
                values={data}
                classForValue={(value: HeatmapValue | undefined) => {
                  const count = value?.count ?? 0;
                  if (count === 0) return "color-empty";
                  if (count === 1) return "color-scale-1";
                  if (count === 2) return "color-scale-2";
                  if (count === 3) return "color-scale-3";
                  return "color-scale-4";
                }}
                showWeekdayLabels
                onClick={(value: HeatmapValue | undefined) => {
                  if (value?.count) {
                    const date =
                      typeof value.date === "string" ? value.date : "";
                    setTip(
                      tip?.date === date ? null : { date, count: value.count },
                    );
                  } else {
                    setTip(null);
                  }
                }}
                titleForValue={(value: HeatmapValue | undefined) => {
                  const count = value?.count ?? 0;
                  if (!value?.date) return "";
                  return `${value.date}: ${count} entr${count === 1 ? "y" : "ies"}`;
                }}
              />
            </div>
          </TooltipTrigger>
          {tip && (
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
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {stats.activeDays} active day{stats.activeDays !== 1 ? "s" : ""} ·{" "}
          {stats.totalEntries} entr{stats.totalEntries !== 1 ? "ies" : "y"} this
          year
        </span>
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: "var(--color-muted)" }}
          />
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: "oklch(0.75 0.12 142)" }}
          />
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: "oklch(0.65 0.16 142)" }}
          />
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: "oklch(0.55 0.2 142)" }}
          />
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: "oklch(0.45 0.22 142)" }}
          />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
