"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import type { Entry } from "@/lib/types";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
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
              onSelect={(d) => d && setSelectedDate(d)}
              modifiers={{
                hasEntry: (d) => datesWithEntries.has(format(d, "yyyy-MM-dd")),
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
            {loading ? (
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
                        <p className="truncate font-medium">{entry.title}</p>
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
