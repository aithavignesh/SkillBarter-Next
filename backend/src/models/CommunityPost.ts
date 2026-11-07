import mongoose, { Schema, Document } from "mongoose";

export interface ICommunityPost extends Document {
  authorId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  tags: string[];
  likesCount: number;
  likedBy?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const communityPostSchema = new Schema<ICommunityPost>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true }],
    likesCount: { type: Number, default: 0, min: 0 },
    likedBy: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
  },
  { timestamps: true }
);

communityPostSchema.index({ createdAt: -1 });

export const CommunityPost = mongoose.model<ICommunityPost>("CommunityPost", communityPostSchema);
