import mongoose, { Schema, Document } from "mongoose";

export interface IOtpChallenge extends Document {
  email?: string;
  phone?: string;
  challengeId?: string;
  providerChallengeId?: string;
  codeHash?: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const otpChallengeSchema = new Schema<IOtpChallenge>({
  email: { type: String, lowercase: true, trim: true, index: true },
  phone: { type: String, trim: true, index: true },
  challengeId: { type: String, unique: true, sparse: true, index: true },
  providerChallengeId: { type: String },
  codeHash: { type: String },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const OtpChallenge = mongoose.model<IOtpChallenge>("OtpChallenge", otpChallengeSchema);
