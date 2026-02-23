import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strips common markdown syntax and returns plain text.
 * Used for list/preview snippets where we don't want raw markdown symbols.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold **text**
    .replace(/__(.+?)__/g, "$1") // bold __text__
    .replace(/\*(.+?)\*/g, "$1") // italic *text*
    .replace(/_(.+?)_/g, "$1") // italic _text_
    .replace(/~~(.+?)~~/g, "$1") // strikethrough
    .replace(/`{1,3}[^`\n]*`{1,3}/g, "") // inline code / code blocks
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
    .replace(/!\[.*?\]\(.+?\)/g, "") // images
    .replace(/^[-*+]\s+/gm, "") // unordered list items
    .replace(/^\d+\.\s+/gm, "") // ordered list items
    .replace(/^>\s+/gm, "") // blockquotes
    .replace(/[-]{3,}/g, "") // horizontal rules
    .replace(/\n+/g, " ") // collapse newlines
    .trim();
}
