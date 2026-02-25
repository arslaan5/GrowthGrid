"use client";

import type { Entry, LinkPayload } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ArrowLeft, CalendarDays, FileText, Save, Trash2, Upload, X } from "lucide-react";
import { TagInput } from "@/components/entry/tag-input";
import { LinkInput } from "@/components/entry/link-input";
import { MarkdownEditor } from "@/components/entry/markdown-editor";

interface EntryEditModeProps {
  entry: Entry;
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
  existingTags: string[];
  saving: boolean;
  onDateChange: (d: Date) => void;
  onTitleChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onTagInputChange: (v: string) => void;
  onAddTag: () => void;
  onRemoveTag: (t: string) => void;
  onSuggestTag: (t: string) => void;
  onLinkTitleChange: (v: string) => void;
  onLinkUrlChange: (v: string) => void;
  onAddLink: () => void;
  onRemoveLink: (idx: number) => void;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (f: File) => void;
  onCalendarOpenChange: (open: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  onDeleteAttachment: (id: string) => void;
  showDialog: boolean;
  confirmLeave: () => void;
  cancelLeave: () => void;
}

export function EntryEditMode({
  entry,
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
  existingTags,
  saving,
  onDateChange,
  onTitleChange,
  onContentChange,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onSuggestTag,
  onLinkTitleChange,
  onLinkUrlChange,
  onAddLink,
  onRemoveLink,
  onAddFiles,
  onRemoveFile,
  onCalendarOpenChange,
  onSave,
  onCancel,
  onDeleteAttachment,
  showDialog,
  confirmLeave,
  cancelLeave,
}: EntryEditModeProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Entry</h1>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Dialog open={calendarOpen} onOpenChange={onCalendarOpenChange}>
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
                      onDateChange(d);
                      onCalendarOpenChange(false);
                    }
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => onTitleChange(e.target.value)} />
          </div>

          {/* Content */}
          <MarkdownEditor
            id="edit-content"
            label="Content (Markdown)"
            value={content}
            onChange={onContentChange}
          />

          <Separator />

          <TagInput
            tags={tags}
            existingTags={existingTags}
            tagInput={tagInput}
            onTagInputChange={onTagInputChange}
            onAdd={onAddTag}
            onRemove={onRemoveTag}
            onSuggest={onSuggestTag}
          />

          <Separator />

          <LinkInput
            links={links}
            linkTitle={linkTitle}
            linkUrl={linkUrl}
            onTitleChange={onLinkTitleChange}
            onUrlChange={onLinkUrlChange}
            onAdd={onAddLink}
            onRemove={onRemoveLink}
          />

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
                    onClick={() => onDeleteAttachment(a.id)}
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
                  if (e.target.files) onAddFiles(Array.from(e.target.files));
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
                    <button className="ml-auto" onClick={() => onRemoveFile(f)}>
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
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving} className="gap-1">
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
