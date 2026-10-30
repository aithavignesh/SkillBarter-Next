import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  exchangeId?: mongoose.Types.ObjectId;
  lastMessageAt: Date;
  lastMessageText: string;
  lastMessageSenderId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    exchangeId: { type: Schema.Types.ObjectId, ref: "Exchange" },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastMessageText: { type: String, default: "" },
    lastMessageSenderId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model<IConversation>("Conversation", conversationSchema);
