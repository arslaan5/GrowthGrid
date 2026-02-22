"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Entry, LinkPayload } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { format, parseISO } from "date-fns";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  CalendarDays,
  Edit3,
  ExternalLink,
  FileText,
  Link2,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

export default function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [date, setDate] = useState<Date>(new Date());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [links, setLinks] = useState<LinkPayload[]>([]);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/entries/${id}`);
        setEntry(res.data);
        populateEditState(res.data);
      } catch {
        toast.error("Entry not found.");
        router.replace("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  const populateEditState = (e: Entry) => {
    setDate(parseISO(e.date));
    setTitle(e.title);
    setContent(e.content);
    setTags(e.tags.map((t) => t.name));
    setLinks(e.links.map((lk) => ({ title: lk.title, url: lk.url })));
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
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

  const removeLink = (idx: number) =>
    setLinks(links.filter((_, i) => i !== idx));

  const handleUpdate = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/entries/${id}`, {
        date: format(date, "yyyy-MM-dd"),
        title: title.trim(),
        content: content.trim(),
        tags,
        links,
      });

      // Upload new files
      for (const file of newFiles) {
        const fd = new FormData();
        fd.append("file", file);
        await api.post(`/entries/${id}/attachments`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // Re-fetch to get full data with attachments
      const updated = await api.get(`/entries/${id}`);
      setEntry(updated.data);
      populateEditState(updated.data);
      setNewFiles([]);
      setEditing(false);
      toast.success("Entry updated!");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { detail?: string } } }).response?.data
              ?.detail
          : "Failed to update entry.";
      toast.error(msg || "Failed to update entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/entries/${id}`);
      toast.success("Entry deleted.");
      router.replace("/dashboard");
    } catch {
      toast.error("Failed to delete entry.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await api.delete(`/entries/${id}/attachments/${attachmentId}`);
      setEntry((prev) =>
        prev
          ? {
              ...prev,
              attachments: prev.attachments.filter(
                (a) => a.id !== attachmentId,
              ),
            }
          : prev,
      );
      toast.success("Attachment deleted.");
    } catch {
      toast.error("Failed to delete attachment.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">
          Loading entry…
        </div>
      </div>
    );
  }

  if (!entry) return null;

  // ---------- VIEW MODE ----------
  if (!editing) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {entry.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(entry.date), "MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setEditing(true)}
            >
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
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. All attachments will also be
                  removed.
                </p>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
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
          <CardContent className="py-6 prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown>{entry.content}</ReactMarkdown>
          </CardContent>
        </Card>

        {/* Links */}
        {entry.links.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
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
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
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
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" /> Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {entry.attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm">
                  <a
                    href={a.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {a.file_name}
                  </a>
                  <button
                    className="ml-auto text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteAttachment(a.id)}
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

  // ---------- EDIT MODE ----------
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setEditing(false);
            if (entry) populateEditState(entry);
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Entry</h1>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 font-normal"
                >
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
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="edit-content">Content (Markdown)</Label>
            <Textarea
              id="edit-content"
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-mono text-sm"
            />
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
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={addTag}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
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
          </div>

          <Separator />

          {/* Links */}
          <div className="space-y-2">
            <Label>Resource Links</Label>
            <div className="flex flex-col sm:flex-row gap-2">
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
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={addLink}
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </div>
            {links.length > 0 && (
              <div className="space-y-1 mt-2">
                {links.map((lk, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Link2 className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{lk.title}</span>
                    <span className="text-muted-foreground truncate">
                      {lk.url}
                    </span>
                    <button className="ml-auto" onClick={() => removeLink(idx)}>
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Existing attachments */}
          {entry.attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Existing Attachments</Label>
              {entry.attachments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{a.file_name}</span>
                  <button
                    className="ml-auto text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteAttachment(a.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New files */}
          <div className="space-y-2">
            <Label>Add Attachments</Label>
            <label className="cursor-pointer inline-block">
              <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-md px-3 py-2 hover:bg-accent transition-colors">
                <Upload className="h-4 w-4" />
                Choose files
              </div>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files)
                    setNewFiles([...newFiles, ...Array.from(e.target.files)]);
                }}
              />
            </label>
            {newFiles.length > 0 && (
              <div className="space-y-1 mt-2">
                {newFiles.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(f.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      className="ml-auto"
                      onClick={() =>
                        setNewFiles(newFiles.filter((_, i) => i !== idx))
                      }
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setEditing(false);
            if (entry) populateEditState(entry);
          }}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button onClick={handleUpdate} disabled={saving} className="gap-1">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
