import mongoose from "mongoose";
import { AnalyticsEvent } from "../../models/AnalyticsEvent";
import { AnalyticsSummaryDto, TrackEventInput } from "@skillbarter/shared";

export class AnalyticsService {
  async trackEvent(input: TrackEventInput, userId?: string): Promise<void> {
    await AnalyticsEvent.create({
      eventName: input.eventName,
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      metadata: input.metadata || {},
      timestamp: new Date(),
    });
  }

  async getSummary(): Promise<AnalyticsSummaryDto> {
    const totalEvents = await AnalyticsEvent.countDocuments();

    const counts = await AnalyticsEvent.aggregate([
      { $group: { _id: "$eventName", count: { $sum: 1 } } },
    ]);

    const eventsByType: Record<string, number> = {};
    for (const c of counts) {
      eventsByType[c._id] = c.count;
    }

    const recent = await AnalyticsEvent.find()
      .sort({ timestamp: -1 })
      .limit(20);

    const recentEvents = recent.map((r) => ({
      eventName: r.eventName,
      userId: r.userId?.toString(),
      timestamp: r.timestamp.toISOString(),
    }));

    return {
      totalEvents,
      eventsByType,
      recentEvents,
    };
  }
}

export const analyticsService = new AnalyticsService();
