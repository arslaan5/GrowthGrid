"use client";

import { useReducer, useEffect } from "react";
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface TagInputProps {
  tags: string[];
  existingTags: string[];
  tagInput: string;
  onTagInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (t: string) => void;
  onSuggest: (t: string) => void;
}

function TagInput({
  tags,
  existingTags,
  tagInput,
  onTagInputChange,
  onAdd,
  onRemove,
  onSuggest,
}: TagInputProps) {
  return (
    <div className="space-y-2">
      <Label>Tags</Label>
      <div className="flex gap-2">
        <Input
          placeholder="Add a tag…"
          value={tagInput}
          onChange={(e) => onTagInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <Button type="button" variant="secondary" size="icon" onClick={onAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1">
              {t}
              <button onClick={() => onRemove(t)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {existingTags.filter((t) => !tags.includes(t)).length > 0 && (
        <div className="mt-2 space-y-1">
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
                  onClick={() => onSuggest(t)}
                >
                  + {t}
                </Badge>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface LinkInputProps {
  links: LinkPayload[];
  linkTitle: string;
  linkUrl: string;
  onTitleChange: (v: string) => void;
  onUrlChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}

function LinkInput({
  links,
  linkTitle,
  linkUrl,
  onTitleChange,
  onUrlChange,
  onAdd,
  onRemove,
}: LinkInputProps) {
  return (
    <div className="space-y-2">
      <Label>Resource Links</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Title"
          value={linkTitle}
          onChange={(e) => onTitleChange(e.target.value)}
        />
        <Input
          placeholder="URL"
          value={linkUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <Button type="button" variant="secondary" size="icon" onClick={onAdd}>
          <Link2 className="h-4 w-4" />
        </Button>
      </div>
      {links.length > 0 && (
        <div className="mt-2 space-y-1">
          {links.map((lk, idx) => (
            <div key={`${lk.title}-${lk.url}`} className="flex items-center gap-2 text-sm">
              <Link2 className="text-muted-foreground h-3 w-3" />
              <span className="font-medium">{lk.title}</span>
              <span className="text-muted-foreground truncate">{lk.url}</span>
              <button className="ml-auto" onClick={() => onRemove(idx)}>
                <X className="text-muted-foreground hover:text-destructive h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface FileAttachmentsProps {
  files: File[];
  onAdd: (newFiles: File[]) => void;
  onRemove: (f: File) => void;
}

function FileAttachments({ files, onAdd, onRemove }: FileAttachmentsProps) {
  return (
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
                onAdd(Array.from(e.target.files));
              }
            }}
          />
        </label>
      </div>
      {files.length > 0 && (
        <div className="mt-2 space-y-1">
          {files.map((f) => (
            <div key={f.name} className="flex items-center gap-2 text-sm">
              <span className="truncate">{f.name}</span>
              <span className="text-muted-foreground text-xs">
                ({(f.size / 1024).toFixed(1)} KB)
              </span>
              <button className="ml-auto" onClick={() => onRemove(f)}>
                <X className="text-muted-foreground hover:text-destructive h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

interface NewEntryState {
  date: Date;
  title: string;
  content: string;
  tagInput: string;
  tags: string[];
  links: LinkPayload[];
  linkTitle: string;
  linkUrl: string;
  files: File[];
  saving: boolean;
  calendarOpen: boolean;
  existingTags: string[];
}

type NewEntryAction =
  | { type: "SET_DATE"; payload: Date }
  | { type: "SET_TITLE"; payload: string }
  | { type: "SET_CONTENT"; payload: string }
  | { type: "SET_TAG_INPUT"; payload: string }
  | { type: "ADD_TAG"; payload: string }
  | { type: "REMOVE_TAG"; payload: string }
  | { type: "ADD_LINK"; payload: LinkPayload }
  | { type: "REMOVE_LINK"; payload: number }
  | { type: "SET_LINK_TITLE"; payload: string }
  | { type: "SET_LINK_URL"; payload: string }
  | { type: "ADD_FILES"; payload: File[] }
  | { type: "REMOVE_FILE"; payload: File }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_CALENDAR_OPEN"; payload: boolean }
  | { type: "SET_EXISTING_TAGS"; payload: string[] };

const initialNewEntryState: NewEntryState = {
  date: new Date(),
  title: "",
  content: "",
  tagInput: "",
  tags: [],
  links: [],
  linkTitle: "",
  linkUrl: "",
  files: [],
  saving: false,
  calendarOpen: false,
  existingTags: [],
};

function newEntryReducer(state: NewEntryState, action: NewEntryAction): NewEntryState {
  switch (action.type) {
    case "SET_DATE":
      return { ...state, date: action.payload };
    case "SET_TITLE":
      return { ...state, title: action.payload };
    case "SET_CONTENT":
      return { ...state, content: action.payload };
    case "SET_TAG_INPUT":
      return { ...state, tagInput: action.payload };
    case "ADD_TAG":
      return state.tags.includes(action.payload)
        ? { ...state, tagInput: "" }
        : { ...state, tags: [...state.tags, action.payload], tagInput: "" };
    case "REMOVE_TAG":
      return { ...state, tags: state.tags.filter((t) => t !== action.payload) };
    case "ADD_LINK":
      return {
        ...state,
        links: [...state.links, action.payload],
        linkTitle: "",
        linkUrl: "",
      };
    case "REMOVE_LINK":
      return { ...state, links: state.links.filter((_, i) => i !== action.payload) };
    case "SET_LINK_TITLE":
      return { ...state, linkTitle: action.payload };
    case "SET_LINK_URL":
      return { ...state, linkUrl: action.payload };
    case "ADD_FILES":
      return { ...state, files: [...state.files, ...action.payload] };
    case "REMOVE_FILE":
      return { ...state, files: state.files.filter((f) => f !== action.payload) };
    case "SET_SAVING":
      return { ...state, saving: action.payload };
    case "SET_CALENDAR_OPEN":
      return { ...state, calendarOpen: action.payload };
    case "SET_EXISTING_TAGS":
      return { ...state, existingTags: action.payload };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewEntryPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(newEntryReducer, initialNewEntryState);
  const {
    date,
    title,
    content,
    tagInput,
    tags,
    links,
    linkTitle,
    linkUrl,
    files,
    saving,
    calendarOpen,
    existingTags,
  } = state;

  // Fetch all previously-used tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await api.get("/entries/tags");
        dispatch({ type: "SET_EXISTING_TAGS", payload: res.data });
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
    if (t) dispatch({ type: "ADD_TAG", payload: t });
    else dispatch({ type: "SET_TAG_INPUT", payload: "" });
  };

  const removeTag = (t: string) => dispatch({ type: "REMOVE_TAG", payload: t });

  const addLink = () => {
    if (linkTitle.trim() && linkUrl.trim()) {
      dispatch({ type: "ADD_LINK", payload: { title: linkTitle.trim(), url: linkUrl.trim() } });
    }
  };

  const removeLink = (idx: number) => dispatch({ type: "REMOVE_LINK", payload: idx });

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (!content.trim()) {
      toast.error("Content is required.");
      return;
    }

    dispatch({ type: "SET_SAVING", payload: true });
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
      dispatch({ type: "SET_SAVING", payload: false });
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
            <Dialog
              open={calendarOpen}
              onOpenChange={(open) => dispatch({ type: "SET_CALENDAR_OPEN", payload: open })}
            >
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
                      dispatch({ type: "SET_DATE", payload: d });
                      dispatch({ type: "SET_CALENDAR_OPEN", payload: false });
                    }
                  }}
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
              onChange={(e) => dispatch({ type: "SET_TITLE", payload: e.target.value })}
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
              onChange={(e) => dispatch({ type: "SET_CONTENT", payload: e.target.value })}
              className="font-mono text-sm"
            />
            <p className="text-muted-foreground text-right text-xs">
              {content.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          <Separator />

          <TagInput
            tags={tags}
            existingTags={existingTags}
            tagInput={tagInput}
            onTagInputChange={(v) => dispatch({ type: "SET_TAG_INPUT", payload: v })}
            onAdd={addTag}
            onRemove={removeTag}
            onSuggest={(t) => dispatch({ type: "ADD_TAG", payload: t })}
          />

          <Separator />

          <LinkInput
            links={links}
            linkTitle={linkTitle}
            linkUrl={linkUrl}
            onTitleChange={(v) => dispatch({ type: "SET_LINK_TITLE", payload: v })}
            onUrlChange={(v) => dispatch({ type: "SET_LINK_URL", payload: v })}
            onAdd={addLink}
            onRemove={removeLink}
          />

          <Separator />

          <FileAttachments
            files={files}
            onAdd={(newFiles) => dispatch({ type: "ADD_FILES", payload: newFiles })}
            onRemove={(f) => dispatch({ type: "REMOVE_FILE", payload: f })}
          />
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
