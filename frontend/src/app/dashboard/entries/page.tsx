"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Entry } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  BookOpen,
  Search,
  X,
  ArrowRight,
  ArrowLeft,
  SlidersHorizontal,
  MoreHorizontal,
  Edit3,
  Trash2,
  ExternalLink,
} from "lucide-react";

const PAGE_SIZE = 20;

export default function EntriesListPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Search & filter
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      };
      if (search.trim()) params.search = search.trim();
      if (activeTag) params.tag = activeTag;

      const res = await api.get("/entries", { params });
      setEntries(res.data.entries);
      setTotal(res.data.total);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, [page, search, activeTag]);

  // Collect all unique tags from loaded entries for quick filter chips
  useEffect(() => {
    const tagSet = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => tagSet.add(t.name)));
    setAllTags(Array.from(tagSet).sort());
  }, [entries]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, activeTag]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/entries/${deleteTarget.id}`);
      toast.success("Entry deleted.");
      setDeleteTarget(null);
      fetchEntries();
    } catch {
      toast.error("Failed to delete entry.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> Entries
        </h1>
        <Link href="/dashboard/entries/new">
          <Button size="sm" className="gap-1">
            + New Entry
          </Button>
        </Link>
      </div>

      {/* Search bar */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-up stagger-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entries by title or content…"
            className="pl-9 transition-all duration-200 focus:scale-[1.01]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-150 hover:scale-110 active:scale-95"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 animate-fade-up stagger-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          {activeTag && (
            <Badge
              variant="default"
              className="gap-1 cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95"
              onClick={() => setActiveTag(null)}
            >
              {activeTag}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {allTags
            .filter((t) => t !== activeTag)
            .map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer transition-all duration-150 hover:bg-accent hover:scale-105 active:scale-95"
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </Badge>
            ))}
        </div>
      )}

      {/* Entry list */}
      <Card className="py-0 animate-fade-up stagger-3">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-0 divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 px-4 py-4">
                  <div className="h-4 skeleton-shimmer rounded w-1/3 mb-2" />
                  <div className="h-3 skeleton-shimmer rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center animate-fade-in-scale">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {search || activeTag
                  ? "No entries match your filters."
                  : "No entries yet. Start your learning journey!"}
              </p>
              {!search && !activeTag && (
                <Link href="/dashboard/entries/new">
                  <Button size="sm" variant="outline" className="mt-3">
                    Write your first entry
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {entries.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={`flex items-start gap-3 px-4 py-4 hover:bg-accent/50 transition-all duration-150 group animate-fade-up`}
                  style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
                >
                  {/* Clickable main content area */}
                  <Link
                    href={`/dashboard/entries/${entry.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="font-medium truncate group-hover:text-primary transition-colors">
                      {entry.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(parseISO(entry.date), "MMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {entry.content.slice(0, 120)}
                    </p>
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {entry.tags.slice(0, 3).map((t) => (
                          <Badge
                            key={t.id}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {t.name}
                          </Badge>
                        ))}
                        {entry.tags.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{entry.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>

                  {/* Action menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/dashboard/entries/${entry.id}`)
                        }
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(
                            `/dashboard/entries/${entry.id}?edit=true`,
                          )
                        }
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(entry)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete entry?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              &ldquo;{deleteTarget?.title}&rdquo;
            </span>{" "}
            will be permanently deleted along with its attachments. This cannot
            be undone.
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
