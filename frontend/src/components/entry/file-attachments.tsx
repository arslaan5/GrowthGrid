"use client";

import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";

export interface FileAttachmentsProps {
  files: File[];
  onAdd: (newFiles: File[]) => void;
  onRemove: (f: File) => void;
}

export function FileAttachments({ files, onAdd, onRemove }: FileAttachmentsProps) {
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
