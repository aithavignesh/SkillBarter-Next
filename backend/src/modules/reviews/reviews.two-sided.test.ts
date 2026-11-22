import mongoose from "mongoose";
import { afterEach, describe, expect, it } from "vitest";
import { User } from "../../models/User";
import { Exchange } from "../../models/Exchange";
import { Review } from "../../models/Review";
import { Notification } from "../../models/Notification";
import { AnalyticsEvent } from "../../models/AnalyticsEvent";
import { reviewsService } from "./reviews.service";

describe("ReviewsService two-sided completed exchange", () => {
  let userIds: mongoose.Types.ObjectId[] = [];
  let exchangeId: mongoose.Types.ObjectId | undefined;

  afterEach(async () => {
    if (exchangeId) {
      await Promise.all([
        Review.deleteMany({ exchangeId }),
        Exchange.deleteOne({ _id: exchangeId }),
      ]);
    }
    if (userIds.length) {
      await Promise.all([
        Notification.deleteMany({
          $or: [
            { recipientId: { $in: userIds } },
            { senderId: { $in: userIds } },
          ],
        }),
        AnalyticsEvent.deleteMany({ userId: { $in: userIds }, eventName: "REVIEW_SUBMITTED" }),
        User.deleteMany({ _id: { $in: userIds } }),
      ]);
    }
    userIds = [];
    exchangeId = undefined;
  });

  it("allows both participants to review each other once after mutual completion", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const [requester, recipient] = await Promise.all([
      User.create({
        email: `review-requester-${suffix}@example.test`,
        passwordHash: "test-hash",
        displayName: "Review Requester",
        isEmailVerified: true,
        onboardingCompleted: true,
      }),
      User.create({
        email: `review-recipient-${suffix}@example.test`,
        passwordHash: "test-hash",
        displayName: "Review Recipient",
        isEmailVerified: true,
        onboardingCompleted: true,
      }),
    ]);
    userIds = [requester._id, recipient._id];

    const exchange = await Exchange.create({
      requesterId: requester._id,
      recipientId: recipient._id,
      offeredSkillId: new mongoose.Types.ObjectId(),
      wantedSkillId: new mongoose.Types.ObjectId(),
      status: "COMPLETED",
      proposalDescription: "A completed two-party review test exchange.",
      completionStatus: { requesterConfirmed: true, recipientConfirmed: true },
    });
    exchangeId = exchange._id;

    const requesterReview = await reviewsService.createReview(requester._id.toString(), {
      exchangeId: exchange._id.toString(),
      rating: 5,
      comment: "The session was clear, useful, and well prepared.",
    });
    const recipientReview = await reviewsService.createReview(recipient._id.toString(), {
      exchangeId: exchange._id.toString(),
      rating: 4,
      comment: "The teaching was patient and easy to follow.",
    });

    expect(requesterReview.revieweeId).toBe(recipient._id.toString());
    expect(recipientReview.revieweeId).toBe(requester._id.toString());

    const [requesterReviews, recipientReviews, refreshedRequester, refreshedRecipient] = await Promise.all([
      reviewsService.getUserReviews(requester._id.toString()),
      reviewsService.getUserReviews(recipient._id.toString()),
      User.findById(requester._id),
      User.findById(recipient._id),
    ]);

    expect(requesterReviews).toHaveLength(1);
    expect(requesterReviews[0].rating).toBe(4);
    expect(recipientReviews).toHaveLength(1);
    expect(recipientReviews[0].rating).toBe(5);
    expect(refreshedRequester?.reputationScore).toBe(4);
    expect(refreshedRecipient?.reputationScore).toBe(5);

    await expect(
      reviewsService.createReview(requester._id.toString(), {
        exchangeId: exchange._id.toString(),
        rating: 3,
        comment: "A duplicate review must be rejected.",
      }),
    ).rejects.toThrow("You have already reviewed this exchange");

    await expect(
      reviewsService.createReview(recipient._id.toString(), {
        exchangeId: exchange._id.toString(),
        rating: 3,
        comment: "A duplicate review must be rejected.",
      }),
    ).rejects.toThrow("You have already reviewed this exchange");

    expect(await Review.countDocuments({ exchangeId: exchange._id })).toBe(2);
    expect(await Notification.countDocuments({ recipientId: { $in: userIds }, type: "REVIEW_RECEIVED" })).toBe(2);
    expect(await AnalyticsEvent.countDocuments({ userId: { $in: userIds }, eventName: "REVIEW_SUBMITTED" })).toBe(2);
  });
});
