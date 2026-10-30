import mongoose, { Schema, Document } from "mongoose";

export interface IExchange extends Document {
  requesterId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  offeredSkillId: mongoose.Types.ObjectId;
  wantedSkillId: mongoose.Types.ObjectId;
  status:
    | "DRAFT"
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED"
    | "SCHEDULED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "DISPUTED";
  proposalDescription: string;
  cancellationReason?: string;
  disputeReason?: string;
  completionStatus: {
    requesterConfirmed: boolean;
    recipientConfirmed: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const exchangeSchema = new Schema<IExchange>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    offeredSkillId: { type: Schema.Types.ObjectId, ref: "Skill", required: true },
    wantedSkillId: { type: Schema.Types.ObjectId, ref: "Skill", required: true },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING",
        "ACCEPTED",
        "REJECTED",
        "SCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "DISPUTED",
      ],
      default: "PENDING",
      index: true,
    },
    proposalDescription: { type: String, required: true },
    cancellationReason: { type: String },
    disputeReason: { type: String },
    completionStatus: {
      requesterConfirmed: { type: Boolean, default: false },
      recipientConfirmed: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

exchangeSchema.index({ requesterId: 1, recipientId: 1, status: 1 });

export const Exchange = mongoose.model<IExchange>("Exchange", exchangeSchema);
