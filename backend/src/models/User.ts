import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  phone?: string;
  passwordHash: string;
  passwordChangedAt?: Date;
  displayName: string;
  role: "user" | "admin";
  isEmailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  bio: string;
  location: string;
  avatarUrl: string;
  preferredSessionFormat: "video" | "chat" | "in_person" | "any";
  availability: string;
  isProfilePublic: boolean;
  onboardingCompleted: boolean;
  reputationScore: number;
  completedExchangesCount: number;
  isSuspended: boolean;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, sparse: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    passwordChangedAt: { type: Date },
    displayName: { type: String, required: true, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    isEmailVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpiresAt: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpiresAt: { type: Date },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    preferredSessionFormat: {
      type: String,
      enum: ["video", "chat", "in_person", "any"],
      default: "video",
    },
    availability: { type: String, default: "Flexible" },
    isProfilePublic: { type: Boolean, default: true },
    onboardingCompleted: { type: Boolean, default: false },
    reputationScore: { type: Number, default: 5.0, min: 1, max: 5 },
    completedExchangesCount: { type: Number, default: 0, min: 0 },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
