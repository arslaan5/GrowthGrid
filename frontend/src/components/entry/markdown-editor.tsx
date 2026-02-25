"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Eye, Pencil } from "lucide-react";

const MarkdownRenderer = dynamic(() => import("@/components/markdown-renderer"), {
  ssr: false,
  loading: () => <div className="bg-muted h-24 animate-pulse rounded" />,
});

interface MarkdownEditorProps {
  id: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({
  id,
  label = "Content (Markdown supported)",
  placeholder = "Write about what you learned...",
  rows = 10,
  value,
  onChange,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={mode === "write" ? id : undefined}>{label}</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={mode === "write" ? "default" : "ghost"}
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setMode("write")}
          >
            <Pencil className="h-3 w-3" /> Write
          </Button>
          <Button
            type="button"
            variant={mode === "preview" ? "default" : "ghost"}
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setMode("preview")}
          >
            <Eye className="h-3 w-3" /> Preview
          </Button>
        </div>
      </div>

      {mode === "write" ? (
        <>
          <Textarea
            id={id}
            placeholder={placeholder}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-muted-foreground text-right text-xs">
            {value.trim().split(/\s+/).filter(Boolean).length} words
          </p>
        </>
      ) : (
        <div className="prose prose-zinc dark:prose-invert min-h-[10rem] max-w-none rounded-md border p-4">
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <p className="text-muted-foreground italic">Nothing to preview</p>
          )}
        </div>
      )}
    </div>
  );
}
