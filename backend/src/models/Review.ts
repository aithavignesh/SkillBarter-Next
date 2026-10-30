import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  exchangeId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  revieweeId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    exchangeId: { type: Schema.Types.ObjectId, ref: "Exchange", required: true, index: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    revieweeId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, minlength: 5, maxlength: 1000, trim: true },
  },
  { timestamps: true }
);

reviewSchema.index({ exchangeId: 1, reviewerId: 1 }, { unique: true });

export const Review = mongoose.model<IReview>("Review", reviewSchema);
