import mongoose from "mongoose";
import { Review, IReview } from "../../models/Review";
import { Exchange } from "../../models/Exchange";
import { User } from "../../models/User";
import { Notification } from "../../models/Notification";
import { AnalyticsEvent } from "../../models/AnalyticsEvent";
import { CreateReviewInput, ReviewDto } from "@skillbarter/shared";
import { AppError } from "../../middleware/errorHandler";

export class ReviewsService {
  async createReview(reviewerId: string, input: CreateReviewInput): Promise<ReviewDto> {
    const exchange = await Exchange.findById(input.exchangeId);
    if (!exchange) {
      throw new AppError("Exchange not found", 404, "NOT_FOUND");
    }

    if (exchange.status !== "COMPLETED") {
      throw new AppError("Reviews can only be submitted for completed exchanges", 400, "EXCHANGE_NOT_COMPLETED");
    }

    const isRequester = exchange.requesterId.toString() === reviewerId;
    const isRecipient = exchange.recipientId.toString() === reviewerId;

    if (!isRequester && !isRecipient) {
      throw new AppError("You were not a participant in this exchange", 403, "FORBIDDEN");
    }

    const revieweeId = isRequester ? exchange.recipientId.toString() : exchange.requesterId.toString();

    // Check duplicate review
    const existing = await Review.findOne({
      exchangeId: exchange._id,
      reviewerId: new mongoose.Types.ObjectId(reviewerId),
    });

    if (existing) {
      throw new AppError("You have already reviewed this exchange", 409, "DUPLICATE_REVIEW");
    }

    const review = await Review.create({
      exchangeId: exchange._id,
      reviewerId: new mongoose.Types.ObjectId(reviewerId),
      revieweeId: new mongoose.Types.ObjectId(revieweeId),
      rating: input.rating,
      comment: input.comment.trim(),
    });

    // Recompute reviewee reputation score
    const allReviews = await Review.find({ revieweeId: new mongoose.Types.ObjectId(revieweeId) });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Math.round((totalRating / allReviews.length) * 10) / 10;

    await User.findByIdAndUpdate(revieweeId, { reputationScore: avgRating });

    // Send notification to reviewee
    const reviewer = await User.findById(reviewerId);
    await Notification.create({
      recipientId: new mongoose.Types.ObjectId(revieweeId),
      senderId: new mongoose.Types.ObjectId(reviewerId),
      type: "REVIEW_RECEIVED",
      title: "New Review Received",
      message: `${reviewer?.displayName || "A user"} gave you a ${input.rating}-star review!`,
      link: `/profile/${revieweeId}`,
    });

    await AnalyticsEvent.create({
      eventName: "REVIEW_SUBMITTED",
      userId: new mongoose.Types.ObjectId(reviewerId),
      metadata: { revieweeId, rating: input.rating },
      timestamp: new Date(),
    });

    return {
      id: review._id.toString(),
      exchangeId: review.exchangeId.toString(),
      reviewerId,
      reviewerName: reviewer?.displayName,
      reviewerAvatar: reviewer?.avatarUrl,
      revieweeId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    };
  }

  async getUserReviews(userId: string): Promise<ReviewDto[]> {
    const reviews = await Review.find({ revieweeId: new mongoose.Types.ObjectId(userId) })
      .populate("reviewerId", "displayName avatarUrl")
      .sort({ createdAt: -1 });

    return reviews.map((r) => {
      const reviewer = r.reviewerId as unknown as { displayName?: string; avatarUrl?: string };
      return {
        id: r._id.toString(),
        exchangeId: r.exchangeId.toString(),
        reviewerId: r.reviewerId._id ? r.reviewerId._id.toString() : r.reviewerId.toString(),
        reviewerName: reviewer?.displayName,
        reviewerAvatar: reviewer?.avatarUrl,
        revieweeId: userId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      };
    });
  }
}

export const reviewsService = new ReviewsService();
