import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Please add a title.").max(160, "Keep the title under 160 characters."),
  content: z.string().max(50000, "This note is too long (max 50,000 characters).").nullable().optional(),
  category_id: z.uuid().nullable().optional(),
  tags: z
    .array(z.string().trim().min(1).max(32, "Tags must be under 32 characters."))
    .max(12, "Use at most 12 tags.")
    .optional(),
});
