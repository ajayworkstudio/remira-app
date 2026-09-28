export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  category_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  title: string;
  content?: string | null;
  category_id?: string | null;
  tags?: string[];
}
