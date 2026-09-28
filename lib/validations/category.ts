import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Please name the category.").max(40, "Keep the name under 40 characters."),
  icon: z.string().max(32).nullable().optional(),
  color: z
    .string()
    .regex(/^[a-z]+$/, "Invalid color.")
    .max(16)
    .nullable()
    .optional(),
});
