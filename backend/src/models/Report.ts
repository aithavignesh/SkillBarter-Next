import mongoose, { Schema, Document } from "mongoose";

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  targetType: "user" | "message" | "review" | "community_post";
  targetId: string;
  reason: string;
  description: string;
  status: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
  resolvedById?: mongoose.Types.ObjectId;
  moderationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: {
      type: String,
      enum: ["user", "message", "review", "community_post"],
      required: true,
      index: true,
    },
    targetId: { type: String, required: true },
    reason: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"],
      default: "PENDING",
      index: true,
    },
    resolvedById: { type: Schema.Types.ObjectId, ref: "User" },
    moderationNotes: { type: String },
  },
  { timestamps: true }
);

export const Report = mongoose.model<IReport>("Report", reportSchema);
