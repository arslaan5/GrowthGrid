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
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Heatmap } from "@/components/heatmap";

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [recent, setRecent] = useState<Entry[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

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
      {/* Page title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/dashboard/entries/new">
          <Button size="sm" className="gap-1">
            <PenSquare className="h-4 w-4" /> New Entry
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      {loadingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-6">
                <div className="h-8 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((s) => (
            <Card key={s.label}>
              <CardContent className="py-5">
                <div className="flex items-center gap-2 mb-1">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">
                    {s.label}
                  </span>
                </div>
                <p className="text-xl font-semibold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Heatmap */}
      <Card>
        <CardHeader>
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
          <Link href="/dashboard/calendar">
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
            <p className="text-sm text-muted-foreground py-6 text-center">
              No entries yet.{" "}
              <Link
                href="/dashboard/entries/new"
                className="text-primary underline"
              >
                Write your first entry!
              </Link>
            </p>
          ) : (
            <div className="space-y-1">
              {recent.map((entry, idx) => (
                <div key={entry.id}>
                  <Link
                    href={`/dashboard/entries/${entry.id}`}
                    className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-accent transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{entry.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(entry.date), "MMM d, yyyy")}
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
