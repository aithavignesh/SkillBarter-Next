import mongoose, { Schema, Document } from "mongoose";

export interface IBlock extends Document {
  blockerId: mongoose.Types.ObjectId;
  blockedUserId: mongoose.Types.ObjectId;
  reason?: string;
  createdAt: Date;
}

const blockSchema = new Schema<IBlock>(
  {
    blockerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    blockedUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reason: { type: String, maxlength: 300 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

blockSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });

export const Block = mongoose.model<IBlock>("Block", blockSchema);
