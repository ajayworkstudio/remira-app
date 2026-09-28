import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Please enter a valid email."),
  password: z.string().min(1, "Please enter your password."),
});

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Password is too long.");

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(1, "Please enter your name.").max(80),
    email: z.email("Please enter a valid email."),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match." });

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Please enter your name.").max(80),
});
