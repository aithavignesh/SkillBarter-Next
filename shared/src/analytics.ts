import { z } from "zod";

export const analyticsEventNameEnum = z.enum([
  "USER_REGISTERED",
  "USER_VERIFIED",
  "ONBOARDING_COMPLETED",
  "PROFILE_UPDATED",
  "SKILL_ADDED",
  "MATCH_VIEWED",
  "EXCHANGE_REQUESTED",
  "EXCHANGE_ACCEPTED",
  "SESSION_SCHEDULED",
  "EXCHANGE_COMPLETED",
  "REVIEW_SUBMITTED",
]);

export type AnalyticsEventName = z.infer<typeof analyticsEventNameEnum>;

export const trackEventSchema = z.object({
  eventName: analyticsEventNameEnum,
  metadata: z.record(z.unknown()).optional().default({}),
});

export type TrackEventInput = z.infer<typeof trackEventSchema>;

export interface AnalyticsSummaryDto {
  totalEvents: number;
  eventsByType: Record<string, number>;
  recentEvents: Array<{
    eventName: string;
    userId?: string;
    timestamp: string;
  }>;
}
