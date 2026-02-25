"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

export interface TagInputProps {
  tags: string[];
  existingTags: string[];
  tagInput: string;
  onTagInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (t: string) => void;
  onSuggest: (t: string) => void;
}

export function TagInput({
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
