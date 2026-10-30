import { z } from "zod";

export const createReviewSchema = z.object({
  exchangeId: z.string().min(1, "Exchange ID is required"),
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  comment: z.string().min(5, "Review comment must be at least 5 characters").max(1000).trim(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export interface ReviewDto {
  id: string;
  exchangeId: string;
  reviewerId: string;
  reviewerName?: string;
  reviewerAvatar?: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: string;
}
