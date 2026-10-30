import { z } from "zod";

export const apiHealthSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("skillbarter-api"),
  timestamp: z.string().datetime(),
});

export type ApiHealth = z.infer<typeof apiHealthSchema>;

export const apiReadySchema = z.object({
  status: z.enum(["ready", "not_ready"]),
  service: z.literal("skillbarter-api"),
  database: z.enum(["connected", "disconnected"]),
  timestamp: z.string().datetime(),
});

export type ApiReady = z.infer<typeof apiReadySchema>;
