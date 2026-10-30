import { z } from "zod";

export const adminUpdateUserSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  isSuspended: z.boolean().optional(),
  suspensionReason: z.string().max(500).optional(),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

export interface PlatformStatsDto {
  totalUsers: number;
  totalExchanges: number;
  completedExchanges: number;
  activeSessions: number;
  totalSkills: number;
  pendingReports: number;
}
