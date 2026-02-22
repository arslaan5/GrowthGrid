"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { LinkPayload } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarDays, Plus, X, Link2, Upload, ArrowLeft, Save } from "lucide-react";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";

export default function NewEntryPage() {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [links, setLinks] = useState<LinkPayload[]>([]);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [existingTags, setExistingTags] = useState<string[]>([]);

  // Fetch all previously-used tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await api.get("/entries/tags");
        setExistingTags(res.data);
      } catch {
        // silently ignore
      }
    };
    fetchTags();
  }, []);

  // Track whether the form has been touched
  const isDirty =
    title.trim() !== "" ||
    content.trim() !== "" ||
    tags.length > 0 ||
    links.length > 0 ||
    files.length > 0;

  const { guardedNavigate, showDialog, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const addLink = () => {
    if (linkTitle.trim() && linkUrl.trim()) {
      setLinks([...links, { title: linkTitle.trim(), url: linkUrl.trim() }]);
      setLinkTitle("");
      setLinkUrl("");
    }
  };

  const removeLink = (idx: number) => setLinks(links.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!content.trim()) {
      toast.error("Content is required.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("/entries", {
        date: format(date, "yyyy-MM-dd"),
        title: title.trim(),
        content: content.trim(),
        tags,
        links,
      });

      const entryId = res.data.id;

      // Upload files sequentially
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        await api.post(`/entries/${entryId}/attachments`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast.success("Entry created!");
      router.push(`/dashboard/entries/${entryId}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { detail?: string } } }).response?.data?.detail
          : "Failed to create entry.";
      toast.error(msg || "Failed to create entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => guardedNavigate()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">New Entry</h1>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* Date picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2 font-normal">
                  <CalendarDays className="h-4 w-4" />
                  {format(date, "MMMM d, yyyy")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-87.5">
                <DialogHeader>
                  <DialogTitle>Pick a date</DialogTitle>
                </DialogHeader>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What did you learn today?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content (Markdown supported)</Label>
            <Textarea
              id="content"
              placeholder="Write about what you learned..."
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-muted-foreground text-right text-xs">
              {content.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="secondary" size="icon" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button onClick={() => removeTag(t)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {/* Existing tag suggestions */}
            {existingTags.filter((t) => !tags.includes(t)).length > 0 && (
              <div className="mt-2 space-y-1">
                {/* <p className="text-[11px] text-muted-foreground">
                  Previously used:
                </p> */}
                <div className="flex flex-wrap gap-1.5">
                  {existingTags
                    .filter(
                      (t) =>
                        !tags.includes(t) &&
                        (!tagInput.trim() || t.includes(tagInput.trim().toLowerCase()))
                    )
                    .map((t) => (
                      <Badge
                        key={t}
                        variant="outline"
                        className="hover:bg-accent cursor-pointer text-[11px] transition-colors"
                        onClick={() => {
                          setTags([...tags, t]);
                          setTagInput("");
                        }}
                      >
                        + {t}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Links */}
          <div className="space-y-2">
            <Label>Resource Links</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Title"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
              />
              <Input
                placeholder="URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLink();
                  }
                }}
              />
              <Button type="button" variant="secondary" size="icon" onClick={addLink}>
                <Link2 className="h-4 w-4" />
              </Button>
            </div>
            {links.length > 0 && (
              <div className="mt-2 space-y-1">
                {links.map((lk, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Link2 className="text-muted-foreground h-3 w-3" />
                    <span className="font-medium">{lk.title}</span>
                    <span className="text-muted-foreground truncate">{lk.url}</span>
                    <button className="ml-auto" onClick={() => removeLink(idx)}>
                      <X className="text-muted-foreground hover:text-destructive h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* File attachments */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <div className="text-muted-foreground hover:bg-accent flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors">
                  <Upload className="h-4 w-4" />
                  Choose files
                </div>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setFiles([...files, ...Array.from(e.target.files)]);
                    }
                  }}
                />
              </label>
            </div>
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="truncate">{f.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({(f.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      className="ml-auto"
                      onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                    >
                      <X className="text-muted-foreground hover:text-destructive h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => guardedNavigate()} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving} className="gap-1">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Entry"}
        </Button>
      </div>

      {/* Unsaved changes confirmation dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => !open && cancelLeave()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            You have unsaved changes. If you leave now they will be lost.
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={cancelLeave}>
              Keep editing
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmLeave}>
              Discard & leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
