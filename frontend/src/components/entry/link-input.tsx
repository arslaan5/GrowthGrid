"use client";

import type { LinkPayload } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, X } from "lucide-react";

export interface LinkInputProps {
  links: LinkPayload[];
  linkTitle: string;
  linkUrl: string;
  onTitleChange: (v: string) => void;
  onUrlChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}

export function LinkInput({
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
