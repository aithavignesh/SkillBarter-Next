import { z } from "zod";

export const reportTargetTypeEnum = z.enum(["user", "message", "review", "community_post"]);
export type ReportTargetType = z.infer<typeof reportTargetTypeEnum>;

export const reportStatusEnum = z.enum(["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]);
export type ReportStatus = z.infer<typeof reportStatusEnum>;

export const blockUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  reason: z.string().max(300).trim().optional(),
});

export type BlockUserInput = z.infer<typeof blockUserSchema>;

export const createReportSchema = z.object({
  targetType: reportTargetTypeEnum,
  targetId: z.string().min(1, "Target ID is required"),
  reason: z.string().min(3, "Reason must be at least 3 characters").max(100).trim(),
  description: z.string().min(10, "Please describe the issue in detail (at least 10 characters)").max(1500).trim(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const adminReportActionSchema = z.object({
  status: reportStatusEnum,
  moderationNotes: z.string().max(1000).optional(),
  actionTaken: z.enum(["none", "warning", "content_removed", "account_suspended"]).default("none"),
});

export type AdminReportActionInput = z.infer<typeof adminReportActionSchema>;

export interface ReportDto {
  id: string;
  reporterId: string;
  reporterName?: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description: string;
  status: ReportStatus;
  moderationNotes?: string;
  createdAt: string;
}
