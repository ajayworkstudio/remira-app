import { z } from "zod";

const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const timeRe = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const repeatConfigSchema = z
  .object({
    weekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
    interval: z.number().int().min(1).max(365).optional(),
    until: z.string().regex(dateRe).nullable().optional(),
  })
  .strict();

export const reminderSchema = z
  .object({
    title: z.string().trim().min(1, "Please add a title.").max(120, "Keep the title under 120 characters."),
    description: z.string().trim().max(2000, "Description is too long (max 2000 characters).").nullable().optional(),
    reminder_date: z.string().regex(dateRe, "Please choose a valid date."),
    reminder_time: z.string().regex(timeRe, "Please choose a valid time."),
    timezone: z.string().min(1).max(64).optional(),
    category_id: z.uuid().nullable().optional(),
    priority: z.enum(["low", "medium", "high"]),
    repeat_type: z.enum(["none", "daily", "weekly", "monthly", "custom"]),
    repeat_config: repeatConfigSchema.optional(),
    notification_enabled: z.boolean(),
    notification_minutes_before: z.number().int().min(0).max(10080),
  })
  .superRefine((val, ctx) => {
    if (val.repeat_type === "custom" && !(val.repeat_config?.weekdays?.length || val.repeat_config?.interval)) {
      ctx.addIssue({ code: "custom", path: ["repeat_config"], message: "Pick at least one weekday or an interval." });
    }
  });

export type ReminderFormValues = z.infer<typeof reminderSchema>;
