"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import type { Entry } from "@/lib/types";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";

export default function CalendarPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Fetch all entries (no limit for calendar overview)
        const res = await api.get("/entries", { params: { limit: 1000 } });
        setEntries(res.data.entries);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Map of date string → entries for quick look-up
  const entriesByDate = entries.reduce<Record<string, Entry[]>>((acc, e) => {
    const d = e.date; // YYYY-MM-DD
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});

  // Dates that have entries — used to show dots on the calendar
  const datesWithEntries = new Set(Object.keys(entriesByDate));

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const dayEntries = entriesByDate[selectedKey] ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <CalendarDays className="h-6 w-6" /> Calendar
      </h1>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        {/* Calendar widget */}
        <Card className="w-fit">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              modifiers={{
                hasEntry: (d) => datesWithEntries.has(format(d, "yyyy-MM-dd")),
              }}
              modifiersClassNames={{ hasEntry: "bg-primary/20 font-bold" }}
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
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            ) : dayEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No entries for this date.
              </p>
            ) : (
              <div className="space-y-1">
                {dayEntries.map((entry, idx) => (
                  <div key={entry.id}>
                    <Link
                      href={`/dashboard/entries/${entry.id}`}
                      className="flex items-center justify-between py-3 px-2 rounded-md hover:bg-accent transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{entry.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
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
