"use client";

import { Suspense, useEffect, useReducer } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import ReactMarkdown from "react-markdown";
import { Loader } from "@/components/loader";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
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

// ─── State shape ────────────────────────────────────────────────────────────

interface EditState {
  date: Date;
  title: string;
  content: string;
  tags: string[];
  tagInput: string;
  links: LinkPayload[];
  linkTitle: string;
  linkUrl: string;
  newFiles: File[];
  calendarOpen: boolean;
}

interface PageState {
  entry: Entry | null;
  loading: boolean;
  editing: boolean;
  deleting: boolean;
  saving: boolean;
  existingTags: string[];
  edit: EditState;
}

type Action =
  | { type: "SET_ENTRY"; payload: Entry }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_EDITING"; payload: boolean }
  | { type: "SET_DELETING"; payload: boolean }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_EXISTING_TAGS"; payload: string[] }
  | { type: "POPULATE_EDIT"; payload: Entry }
  | { type: "SET_DATE"; payload: Date }
  | { type: "SET_TITLE"; payload: string }
  | { type: "SET_CONTENT"; payload: string }
  | { type: "SET_TAGS"; payload: string[] }
  | { type: "SET_TAG_INPUT"; payload: string }
  | { type: "SET_LINKS"; payload: LinkPayload[] }
  | { type: "SET_LINK_TITLE"; payload: string }
  | { type: "SET_LINK_URL"; payload: string }
  | { type: "SET_NEW_FILES"; payload: File[] }
  | { type: "SET_CALENDAR_OPEN"; payload: boolean }
  | { type: "REMOVE_ATTACHMENT"; payload: string };

const initialEditState: EditState = {
  date: new Date(),
  title: "",
  content: "",
  tags: [],
  tagInput: "",
  links: [],
  linkTitle: "",
  linkUrl: "",
  newFiles: [],
  calendarOpen: false,
};

const initialState: PageState = {
  entry: null,
  loading: true,
  editing: false,
  deleting: false,
  saving: false,
  existingTags: [],
  edit: initialEditState,
};

function reducer(state: PageState, action: Action): PageState {
  switch (action.type) {
    case "SET_ENTRY":
      return { ...state, entry: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_EDITING":
      return { ...state, editing: action.payload };
    case "SET_DELETING":
      return { ...state, deleting: action.payload };
    case "SET_SAVING":
      return { ...state, saving: action.payload };
    case "SET_EXISTING_TAGS":
      return { ...state, existingTags: action.payload };
    case "POPULATE_EDIT":
      return {
        ...state,
        edit: {
          ...state.edit,
          date: parseISO(action.payload.date),
          title: action.payload.title,
          content: action.payload.content,
          tags: action.payload.tags.map((t) => t.name),
          links: action.payload.links.map((lk) => ({ title: lk.title, url: lk.url })),
        },
      };
    case "SET_DATE":
      return { ...state, edit: { ...state.edit, date: action.payload } };
    case "SET_TITLE":
      return { ...state, edit: { ...state.edit, title: action.payload } };
    case "SET_CONTENT":
      return { ...state, edit: { ...state.edit, content: action.payload } };
    case "SET_TAGS":
      return { ...state, edit: { ...state.edit, tags: action.payload } };
    case "SET_TAG_INPUT":
      return { ...state, edit: { ...state.edit, tagInput: action.payload } };
    case "SET_LINKS":
      return { ...state, edit: { ...state.edit, links: action.payload } };
    case "SET_LINK_TITLE":
      return { ...state, edit: { ...state.edit, linkTitle: action.payload } };
    case "SET_LINK_URL":
      return { ...state, edit: { ...state.edit, linkUrl: action.payload } };
    case "SET_NEW_FILES":
      return { ...state, edit: { ...state.edit, newFiles: action.payload } };
    case "SET_CALENDAR_OPEN":
      return { ...state, edit: { ...state.edit, calendarOpen: action.payload } };
    case "REMOVE_ATTACHMENT":
      return {
        ...state,
        entry: state.entry
          ? {
              ...state.entry,
              attachments: state.entry.attachments.filter((a) => a.id !== action.payload),
            }
          : state.entry,
      };
    default:
      return state;
  }
}

// ─── Inner component (uses useSearchParams — must be inside Suspense) ────────

function EntryDetailPageInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(reducer, initialState);

  const { entry, loading, editing, deleting, saving, existingTags, edit } = state;
  const {
    date,
    title,
    content,
    tags,
    tagInput,
    links,
    linkTitle,
    linkUrl,
    newFiles,
    calendarOpen,
  } = edit;

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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/entries/${id}`);
        dispatch({ type: "SET_ENTRY", payload: res.data });
        dispatch({ type: "POPULATE_EDIT", payload: res.data });
        // Open in edit mode if ?edit=true — read from searchParams without storing in state
        if (searchParams.get("edit") === "true") {
          dispatch({ type: "SET_EDITING", payload: true });
        }
      } catch {
        toast.error("Entry not found.");
        router.replace("/dashboard");
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Track unsaved changes in edit mode
  const isDirty =
    editing &&
    entry !== null &&
    (title !== entry.title ||
      content !== entry.content ||
      tags.join(",") !== entry.tags.map((t) => t.name).join(",") ||
      newFiles.length > 0);

  const { guardedNavigate, showDialog, confirmLeave, cancelLeave } = useUnsavedChanges(isDirty);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) dispatch({ type: "SET_TAGS", payload: [...tags, t] });
    dispatch({ type: "SET_TAG_INPUT", payload: "" });
  };

  const removeTag = (t: string) =>
    dispatch({ type: "SET_TAGS", payload: tags.filter((x) => x !== t) });

  const addLink = () => {
    if (linkTitle.trim() && linkUrl.trim()) {
      dispatch({
        type: "SET_LINKS",
        payload: [...links, { title: linkTitle.trim(), url: linkUrl.trim() }],
      });
      dispatch({ type: "SET_LINK_TITLE", payload: "" });
      dispatch({ type: "SET_LINK_URL", payload: "" });
    }
  };

  const removeLink = (idx: number) =>
    dispatch({ type: "SET_LINKS", payload: links.filter((_, i) => i !== idx) });

  const handleUpdate = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    dispatch({ type: "SET_SAVING", payload: true });
    try {
      await api.put(`/entries/${id}`, {
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
      dispatch({ type: "SET_ENTRY", payload: updated.data });
      dispatch({ type: "POPULATE_EDIT", payload: updated.data });
      dispatch({ type: "SET_NEW_FILES", payload: [] });
      dispatch({ type: "SET_EDITING", payload: false });
      toast.success("Entry updated!");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response: { data: { detail?: string } } }).response?.data?.detail
          : "Failed to update entry.";
      toast.error(msg || "Failed to update entry.");
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  };

  const handleDelete = async () => {
    dispatch({ type: "SET_DELETING", payload: true });
    try {
      await api.delete(`/entries/${id}`);
      toast.success("Entry deleted.");
      router.replace("/dashboard");
    } catch {
      toast.error("Failed to delete entry.");
    } finally {
      dispatch({ type: "SET_DELETING", payload: false });
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await api.delete(`/entries/${id}/attachments/${attachmentId}`);
      dispatch({ type: "REMOVE_ATTACHMENT", payload: attachmentId });
      toast.success("Attachment deleted.");
    } catch {
      toast.error("Failed to delete attachment.");
    }
  };

  if (loading) {
    return <Loader message="Loading entry…" fullScreen={false} />;
  }

  if (!entry) return null;

  // ---------- VIEW MODE ----------
  if (!editing) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold tracking-tight">{entry.title}</h1>
            <p className="text-muted-foreground text-sm">
              {format(parseISO(entry.date), "MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => dispatch({ type: "SET_EDITING", payload: true })}
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
                <p className="text-muted-foreground text-sm">
                  This action cannot be undone. All attachments will also be removed.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" size="sm">
                      Cancel
                    </Button>
                  </DialogClose>
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
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none py-6">
            <ReactMarkdown>{entry.content}</ReactMarkdown>
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
                  <a
                    href={a.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary truncate hover:underline"
                  >
                    {a.file_name}
                  </a>
                  <button
                    className="text-muted-foreground hover:text-destructive ml-auto"
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => guardedNavigate()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Entry</h1>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* Date */}
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
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => dispatch({ type: "SET_TITLE", payload: e.target.value })}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="edit-content">Content (Markdown)</Label>
            <Textarea
              id="edit-content"
              rows={10}
              value={content}
              onChange={(e) => dispatch({ type: "SET_CONTENT", payload: e.target.value })}
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
                onChange={(e) => dispatch({ type: "SET_TAG_INPUT", payload: e.target.value })}
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
                <p className="text-muted-foreground text-[11px]">Previously used:</p>
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
                          dispatch({ type: "SET_TAGS", payload: [...tags, t] });
                          dispatch({ type: "SET_TAG_INPUT", payload: "" });
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
                onChange={(e) => dispatch({ type: "SET_LINK_TITLE", payload: e.target.value })}
              />
              <Input
                placeholder="URL"
                value={linkUrl}
                onChange={(e) => dispatch({ type: "SET_LINK_URL", payload: e.target.value })}
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
                {links.map((lk) => (
                  <div key={`${lk.title}-${lk.url}`} className="flex items-center gap-2 text-sm">
                    <Link2 className="text-muted-foreground h-3 w-3" />
                    <span className="font-medium">{lk.title}</span>
                    <span className="text-muted-foreground truncate">{lk.url}</span>
                    <button className="ml-auto" onClick={() => removeLink(links.indexOf(lk))}>
                      <X className="text-muted-foreground hover:text-destructive h-3 w-3" />
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
                  <FileText className="text-muted-foreground h-3 w-3" />
                  <span className="truncate">{a.file_name}</span>
                  <button
                    className="text-muted-foreground hover:text-destructive ml-auto"
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
            <label className="inline-block cursor-pointer">
              <div className="text-muted-foreground hover:bg-accent flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors">
                <Upload className="h-4 w-4" />
                Choose files
              </div>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files)
                    dispatch({
                      type: "SET_NEW_FILES",
                      payload: [...newFiles, ...Array.from(e.target.files)],
                    });
                }}
              />
            </label>
            {newFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {newFiles.map((f) => (
                  <div key={f.name} className="flex items-center gap-2 text-sm">
                    <span className="truncate">{f.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({(f.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      className="ml-auto"
                      onClick={() =>
                        dispatch({
                          type: "SET_NEW_FILES",
                          payload: newFiles.filter((x) => x !== f),
                        })
                      }
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

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => guardedNavigate()} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleUpdate} disabled={saving} className="gap-1">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Changes"}
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

// ─── Public export — wrapped in Suspense for useSearchParams ────────────────

export default function EntryDetailPage() {
  return (
    <Suspense fallback={<Loader message="Loading entry…" fullScreen={false} />}>
      <EntryDetailPageInner />
    </Suspense>
  );
}
