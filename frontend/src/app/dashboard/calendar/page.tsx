"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import type { Entry, HeatmapDay } from "@/lib/types";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, subYears } from "date-fns";
import { CalendarDays } from "lucide-react";

export default function CalendarPage() {
  const [entryDates, setEntryDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dayEntries, setDayEntries] = useState<Entry[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [loadingDay, setLoadingDay] = useState(false);

  // Fetch heatmap data once for the dots (lightweight — just date + count)
  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const startDate = format(subYears(new Date(), 1), "yyyy-MM-dd");
        const endDate = format(new Date(), "yyyy-MM-dd");
        const res = await api.get<HeatmapDay[]>("/analytics/heatmap", {
          params: { start_date: startDate, end_date: endDate },
        });
        const dates = new Set(res.data.filter((d) => d.count > 0).map((d) => d.date));
        setEntryDates(dates);
      } catch {
        // fail silently
      } finally {
        setLoadingCalendar(false);
      }
    };
    fetchHeatmap();
  }, []);

  // Fetch entries only for the selected date
  const fetchDayEntries = useCallback(async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setLoadingDay(true);
    try {
      const res = await api.get("/entries", {
        params: { date: dateStr, limit: 100 },
      });
      setDayEntries(res.data.entries);
    } catch {
      setDayEntries([]);
    } finally {
      setLoadingDay(false);
    }
  }, []);

  // Load entries for today on mount
  useEffect(() => {
    fetchDayEntries(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectDate = (d: Date | undefined) => {
    if (!d) return;
    setSelectedDate(d);
    fetchDayEntries(d);
  };

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <CalendarDays className="h-6 w-6" /> Calendar
      </h1>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        {/* Calendar widget */}
        <Card className="w-full lg:w-fit">
          <CardContent className="p-2 sm:p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              modifiers={{
                hasEntry: (d) => entryDates.has(format(d, "yyyy-MM-dd")),
              }}
              modifiersClassNames={{ hasEntry: "bg-primary/20 font-bold" }}
              classNames={{
                root: "w-full",
                month: "w-full flex flex-col gap-4",
              }}
            />
          </CardContent>
        </Card>

        {/* Entries for selected date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Entries for {format(selectedDate, "MMMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCalendar || loadingDay ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-muted h-14 animate-pulse rounded" />
                ))}
              </div>
            ) : dayEntries.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                No entries for this date.
              </p>
            ) : (
              <div className="space-y-1">
                {dayEntries.map((entry, idx) => (
                  <div key={entry.id}>
                    <Link
                      href={`/dashboard/entries/${entry.id}`}
                      className="hover:bg-accent flex items-center justify-between rounded-md px-2 py-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {entry.title || (
                            <span className="text-muted-foreground italic">Untitled</span>
                          )}
                        </p>
                        <p className="text-muted-foreground line-clamp-1 text-xs">
                          {entry.content.slice(0, 100)}
                        </p>
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        {entry.tags.slice(0, 3).map((t) => (
                          <Badge key={t.id} variant="secondary" className="text-[10px]">
                            {t.name}
                          </Badge>
                        ))}
                      </div>
                    </Link>
                    {idx < dayEntries.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
