/* Types matching the backend API responses. */

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Link {
  id: string;
  title: string;
  url: string;
}

export interface Attachment {
  id: string;
  entry_id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

export interface Entry {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  tags: Tag[];
  links: Link[];
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
}

export interface EntryListResponse {
  entries: Entry[];
  total: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface Summary {
  total_entries: number;
  current_streak: number;
  longest_streak: number;
  most_used_tag: string | null;
  entries_this_month: number;
}

/* ---------- Request payloads ---------- */

export interface LinkPayload {
  title: string;
  url: string;
}

export interface EntryCreatePayload {
  date: string;
  title: string;
  content: string;
  tags: string[];
  links: LinkPayload[];
}

export interface EntryUpdatePayload {
  date?: string;
  title?: string;
  content?: string;
  tags?: string[];
  links?: LinkPayload[];
}
