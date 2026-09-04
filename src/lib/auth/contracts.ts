import { z } from "zod";

export const adminLoginSchema = z.object({
  storeSlug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  email: z.email().max(255),
  password: z.string().min(12).max(200),
});

export type AdminLoginRequest = z.infer<typeof adminLoginSchema>;
