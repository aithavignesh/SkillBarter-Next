import mongoose, { Schema, Document } from "mongoose";

export interface IExchangeSession extends Document {
  exchangeId: mongoose.Types.ObjectId;
  proposedById: mongoose.Types.ObjectId;
  title: string;
  startTime: Date;
  endTime: Date;
  status: "PROPOSED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes: string;
  meetingLink: string;
  createdAt: Date;
  updatedAt: Date;
}

const exchangeSessionSchema = new Schema<IExchangeSession>(
  {
    exchangeId: { type: Schema.Types.ObjectId, ref: "Exchange", required: true, index: true },
    proposedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["PROPOSED", "CONFIRMED", "CANCELLED", "COMPLETED"],
      default: "PROPOSED",
      index: true,
    },
    notes: { type: String, default: "" },
    meetingLink: { type: String, default: "" },
  },
  { timestamps: true }
);

export const ExchangeSession = mongoose.model<IExchangeSession>(
  "ExchangeSession",
  exchangeSessionSchema
);
