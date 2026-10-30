import { z } from "zod";

export const apiHealthSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("skillbarter-api"),
  timestamp: z.string().datetime(),
});

export type ApiHealth = z.infer<typeof apiHealthSchema>;
