import { z } from "zod";

export const sessionStatusEnum = z.enum(["PROPOSED", "CONFIRMED", "CANCELLED", "COMPLETED"]);
export type SessionStatus = z.infer<typeof sessionStatusEnum>;

export const createSessionSchema = z.object({
  exchangeId: z.string().min(1, "Exchange ID is required"),
  title: z.string().min(3).max(100).trim(),
  startTime: z.string().datetime("Valid ISO datetime required"),
  endTime: z.string().datetime("Valid ISO datetime required"),
  notes: z.string().max(1000).optional().default(""),
  meetingLink: z.string().url().optional().or(z.literal("")),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: "End time must be after start time",
  path: ["endTime"],
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const updateSessionStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
  notes: z.string().max(1000).optional(),
});

export type UpdateSessionStatusInput = z.infer<typeof updateSessionStatusSchema>;

export interface ExchangeSessionDto {
  id: string;
  exchangeId: string;
  proposedById: string;
  title: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  notes?: string;
  meetingLink?: string;
  createdAt: string;
}
