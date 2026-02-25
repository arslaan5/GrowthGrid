"use client";

import { Suspense, useEffect, useReducer } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import type { Entry, LinkPayload } from "@/lib/types";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Loader } from "@/components/loader";
import { useUnsavedChanges } from "@/lib/use-unsaved-changes";
import { EntryViewMode } from "@/components/entry/entry-view-mode";
import { EntryEditMode } from "@/components/entry/entry-edit-mode";

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
        fd.append("entry_id", id as string);
        fd.append("file", file);
        await api.post("/uploads", fd, {
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
      await api.delete(`/uploads/${attachmentId}`);
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

  if (!editing) {
    return (
      <EntryViewMode
        entry={entry}
        deleting={deleting}
        onBack={() => router.back()}
        onEdit={() => dispatch({ type: "SET_EDITING", payload: true })}
        onDelete={handleDelete}
        onDeleteAttachment={handleDeleteAttachment}
      />
    );
  }

  return (
    <EntryEditMode
      entry={entry}
      date={date}
      title={title}
      content={content}
      tags={tags}
      tagInput={tagInput}
      links={links}
      linkTitle={linkTitle}
      linkUrl={linkUrl}
      newFiles={newFiles}
      calendarOpen={calendarOpen}
      existingTags={existingTags}
      saving={saving}
      onDateChange={(d) => dispatch({ type: "SET_DATE", payload: d })}
      onTitleChange={(v) => dispatch({ type: "SET_TITLE", payload: v })}
      onContentChange={(v) => dispatch({ type: "SET_CONTENT", payload: v })}
      onTagInputChange={(v) => dispatch({ type: "SET_TAG_INPUT", payload: v })}
      onAddTag={addTag}
      onRemoveTag={removeTag}
      onSuggestTag={(t) => {
        dispatch({ type: "SET_TAGS", payload: [...tags, t] });
        dispatch({ type: "SET_TAG_INPUT", payload: "" });
      }}
      onLinkTitleChange={(v) => dispatch({ type: "SET_LINK_TITLE", payload: v })}
      onLinkUrlChange={(v) => dispatch({ type: "SET_LINK_URL", payload: v })}
      onAddLink={addLink}
      onRemoveLink={removeLink}
      onAddFiles={(files) => dispatch({ type: "SET_NEW_FILES", payload: [...newFiles, ...files] })}
      onRemoveFile={(f) =>
        dispatch({ type: "SET_NEW_FILES", payload: newFiles.filter((x) => x !== f) })
      }
      onCalendarOpenChange={(open) => dispatch({ type: "SET_CALENDAR_OPEN", payload: open })}
      onSave={handleUpdate}
      onCancel={() => guardedNavigate()}
      onDeleteAttachment={handleDeleteAttachment}
      showDialog={showDialog}
      confirmLeave={confirmLeave}
      cancelLeave={cancelLeave}
    />
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
