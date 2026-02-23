"use client";

import { useEffect, useReducer } from "react";
import Link from "next/link";
import api from "@/lib/api";
import type { Summary, HeatmapDay, Entry } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Flame,
  Trophy,
  Tag,
  CalendarDays,
  PenSquare,
  ArrowRight,
  Sparkles,
  Keyboard,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Heatmap } from "@/components/heatmap";
import { useModLabel } from "@/lib/use-platform";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getMotivationalMessage(streak: number): string {
  if (streak === 0) return "Start a new streak today — every day counts!";
  if (streak === 1) return "First entry logged — great start! 🎉";
  if (streak < 7) return `${streak}-day streak! You're building a habit 💪`;
  if (streak < 30) return `${streak} days in a row — you're on fire! 🔥🔥`;
  return `${streak}-day streak — absolutely incredible! 🏆`;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
interface DashboardState {
  summary: Summary | null;
  heatmap: HeatmapDay[];
  recent: Entry[];
  loadingSummary: boolean;
  loadingRecent: boolean;
}

type DashboardAction =
  | { type: "FETCH_SUCCESS"; summary: Summary; heatmap: HeatmapDay[]; recent: Entry[] }
  | { type: "FETCH_ERROR" };

const initialState: DashboardState = {
  summary: null,
  heatmap: [],
  recent: [],
  loadingSummary: true,
  loadingRecent: true,
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "FETCH_SUCCESS":
      return {
        ...state,
        summary: action.summary,
        heatmap: action.heatmap,
        recent: action.recent,
        loadingSummary: false,
        loadingRecent: false,
      };
    case "FETCH_ERROR":
      return { ...state, loadingSummary: false, loadingRecent: false };
    default:
      return state;
  }
}

export default function DashboardPage() {
  const [{ summary, heatmap, recent, loadingSummary, loadingRecent }, dispatch] = useReducer(
    dashboardReducer,
    initialState
  );
  const modLabel = useModLabel();

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const [sumRes, heatRes, entryRes] = await Promise.all([
          api.get("/analytics/summary"),
          api.get("/analytics/heatmap"),
          api.get("/entries", { params: { limit: 5 } }),
        ]);
        if (!cancelled) {
          dispatch({
            type: "FETCH_SUCCESS",
            summary: sumRes.data,
            heatmap: heatRes.data,
            recent: entryRes.data.entries,
          });
        }
      } catch {
        // silently handle — user is already authenticated via layout guard
        if (!cancelled) {
          dispatch({ type: "FETCH_ERROR" });
        }
      }
    };
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = summary
    ? [
        {
          label: "Total Entries",
          value: summary.total_entries,
          icon: BookOpen,
          color: "text-blue-500",
        },
        {
          label: "Current Streak",
          value: `${summary.current_streak} day${summary.current_streak !== 1 ? "s" : ""}`,
          icon: Flame,
          color: "text-orange-500",
        },
        {
          label: "Longest Streak",
          value: `${summary.longest_streak} day${summary.longest_streak !== 1 ? "s" : ""}`,
          icon: Trophy,
          color: "text-yellow-500",
        },
        {
          label: "This Month",
          value: summary.entries_this_month,
          icon: CalendarDays,
          color: "text-green-500",
        },
        {
          label: "Top Tag",
          value: summary.most_used_tag ?? "—",
          icon: Tag,
          color: "text-purple-500",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Greeting & motivational banner */}
      <div className="animate-fade-up flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}</h1>
          {summary && (
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
              <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
              {getMotivationalMessage(summary.current_streak)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/entries/new">
            <Button size="sm" className="gap-1">
              <PenSquare className="h-4 w-4" /> New Entry
            </Button>
          </Link>
          <span className="text-muted-foreground hidden items-center gap-1 rounded-md border px-2 py-1 text-[11px] lg:inline-flex">
            <Keyboard className="h-3 w-3" /> {modLabel}N
          </span>
        </div>
      </div>

      {/* Summary cards */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="py-0">
              <CardContent className="p-4">
                <div className="skeleton-shimmer h-10 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {statCards.map((s, i) => (
            <Card
              key={s.label}
              className={`animate-fade-up cursor-default py-0 hover:shadow-md stagger-${i + 1}`}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div
                  className={`bg-muted mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.color} transition-transform duration-200 hover:scale-110`}
                >
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-muted-foreground mb-1 text-[11px] leading-none font-medium">
                    {s.label}
                  </p>
                  <p className="animate-count-pop truncate text-lg leading-tight font-bold">
                    {s.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Heatmap */}
      <Card className="animate-fade-up stagger-3 py-4">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Learning Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Heatmap data={heatmap} />
        </CardContent>
      </Card>

      {/* Recent entries */}
      <Card className="animate-fade-up stagger-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Entries</CardTitle>
          <Link href="/dashboard/entries">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loadingRecent ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-muted h-14 animate-pulse rounded" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-10 text-center">
              <BookOpen className="text-muted-foreground mx-auto mb-3 h-10 w-10 opacity-50" />
              <p className="mb-1 text-sm font-medium">No entries yet</p>
              <p className="text-muted-foreground mb-4 text-sm">
                Your learning journey starts with a single entry.
              </p>
              <Link href="/dashboard/entries/new">
                <Button size="sm" variant="outline" className="gap-1">
                  <PenSquare className="h-3.5 w-3.5" /> Write your first entry
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {recent.map((entry, idx) => (
                <div key={entry.id}>
                  <Link
                    href={`/dashboard/entries/${entry.id}`}
                    className={`hover:bg-accent group animate-fade-up flex items-center justify-between rounded-md px-2 py-3 transition-all duration-150 stagger-${idx + 1}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="group-hover:text-primary truncate font-medium transition-colors">
                        {entry.title}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {format(parseISO(entry.date), "MMM d, yyyy")}
                      </p>
                      <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                        {entry.content.slice(0, 100)}
                      </p>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-2">
                      {entry.tags.slice(0, 3).map((t) => (
                        <Badge key={t.id} variant="secondary" className="text-[10px]">
                          {t.name}
                        </Badge>
                      ))}
                      <ArrowRight className="text-muted-foreground h-3.5 w-3.5 opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </div>
                  </Link>
                  {idx < recent.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
