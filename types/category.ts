export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export type CategoryInput = Pick<Category, "name"> & Partial<Pick<Category, "icon" | "color">>;
