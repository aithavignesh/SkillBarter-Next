import mongoose, { Schema, Document } from "mongoose";

export interface IOtpChallenge extends Document {
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
}

const otpChallengeSchema = new Schema<IOtpChallenge>({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const OtpChallenge = mongoose.model<IOtpChallenge>("OtpChallenge", otpChallengeSchema);
