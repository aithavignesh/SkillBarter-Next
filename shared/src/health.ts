import { z } from "zod";

export const apiHealthSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("skillbarter-api"),
  timestamp: z.string().datetime(),
  commit: z.string().max(64).nullable().optional(),
  branch: z.string().max(250).nullable().optional(),
});

export type ApiHealth = z.infer<typeof apiHealthSchema>;

export const apiReadySchema = z.object({
  status: z.enum(["ready", "not_ready"]),
  service: z.literal("skillbarter-api"),
  database: z.enum(["connected", "disconnected"]),
  timestamp: z.string().datetime(),
  commit: z.string().max(64).nullable().optional(),
  branch: z.string().max(250).nullable().optional(),
});

export type ApiReady = z.infer<typeof apiReadySchema>;
