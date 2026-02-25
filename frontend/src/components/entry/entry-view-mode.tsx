"use client";

import type { Entry } from "@/lib/types";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Edit3, ExternalLink, FileText, Link2, Loader2, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useState } from "react";

const MarkdownRenderer = dynamic(() => import("@/components/markdown-renderer"), {
  ssr: false,
  loading: () => <div className="bg-muted h-24 animate-pulse rounded" />,
});

interface EntryViewModeProps {
  entry: Entry;
  deleting: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteAttachment: (id: string) => void;
}

export function EntryViewMode({
  entry,
  deleting,
  onBack,
  onEdit,
  onDelete,
  onDeleteAttachment,
}: EntryViewModeProps) {
  const [loadingAttachment, setLoadingAttachment] = useState<string | null>(null);

  const handleOpenAttachment = async (id: string) => {
    setLoadingAttachment(id);
    try {
      const { data } = await api.get<{ url: string }>(`/uploads/${id}/url`);
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      // silently ignore; could add a toast here
    } finally {
      setLoadingAttachment(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight">
            {entry.title || <span className="text-muted-foreground italic">Untitled</span>}
          </h1>
          <p className="text-muted-foreground text-sm">
            {format(parseISO(entry.date), "MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={onEdit}>
            <Edit3 className="h-3 w-3" /> Edit
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1">
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete this entry?</DialogTitle>
              </DialogHeader>
              <p className="text-muted-foreground text-sm">
                This action cannot be undone. All attachments will also be removed.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                </DialogClose>
                <Button variant="destructive" size="sm" onClick={onDelete} disabled={deleting}>
                  {deleting ? "Deleting…" : "Confirm Delete"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.tags.map((t) => (
            <Badge key={t.id} variant="secondary">
              {t.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Content (rendered markdown) */}
      <Card>
        <CardContent className="prose prose-zinc dark:prose-invert max-w-none">
          <MarkdownRenderer content={entry.content} />
        </CardContent>
      </Card>

      {/* Links */}
      {entry.links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Link2 className="h-4 w-4" /> Resource Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {entry.links.map((lk) => (
              <a
                key={lk.id}
                href={lk.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-2 text-sm hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {lk.title}
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {entry.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" /> Attachments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {entry.attachments.map((a) => (
              <div key={a.id} className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => handleOpenAttachment(a.id)}
                  disabled={loadingAttachment === a.id}
                  className="text-primary flex items-center gap-1 truncate hover:underline disabled:opacity-60"
                >
                  {loadingAttachment === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  {a.file_name}
                </button>
                <button
                  className="text-muted-foreground hover:text-destructive ml-auto"
                  onClick={() => onDeleteAttachment(a.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
