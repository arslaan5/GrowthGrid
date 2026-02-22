"use client";

import { useEffect, useState } from "react";
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

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [recent, setRecent] = useState<Entry[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const modLabel = useModLabel();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sumRes, heatRes, entryRes] = await Promise.all([
          api.get("/analytics/summary"),
          api.get("/analytics/heatmap"),
          api.get("/entries", { params: { limit: 5 } }),
        ]);
        setSummary(sumRes.data);
        setHeatmap(heatRes.data);
        setRecent(entryRes.data.entries);
      } catch {
        // silently handle — user is already authenticated via layout guard
      } finally {
        setLoadingSummary(false);
        setLoadingRecent(false);
      }
    };
    fetchAll();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getGreeting()}</h1>
          {summary && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
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
          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-muted-foreground border rounded-md px-2 py-1">
            <Keyboard className="h-3 w-3" /> {modLabel}N
          </span>
        </div>
      </div>

      {/* Summary cards */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse py-0">
              <CardContent className="p-4">
                <div className="h-10 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((s) => (
            <Card
              key={s.label}
              className="py-0 transition-shadow hover:shadow-md"
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted ${s.color}`}
                >
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground leading-none mb-1">
                    {s.label}
                  </p>
                  <p className="text-lg font-bold leading-tight truncate">
                    {s.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Heatmap */}
      <Card className="py-4">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Learning Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Heatmap data={heatmap} />
        </CardContent>
      </Card>

      {/* Recent entries */}
      <Card>
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
                <div key={i} className="h-14 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-10 text-center">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm font-medium mb-1">No entries yet</p>
              <p className="text-sm text-muted-foreground mb-4">
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
                    className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-accent transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">
                        {entry.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(entry.date), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {entry.content.slice(0, 100)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {entry.tags.slice(0, 3).map((t) => (
                        <Badge
                          key={t.id}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {t.name}
                        </Badge>
                      ))}
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
