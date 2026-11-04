import mongoose, { Schema, Document } from "mongoose";

export interface IAuthCooldown extends Document {
  key: string;
  expiresAt: Date;
  createdAt: Date;
}

const authCooldownSchema = new Schema<IAuthCooldown>({
  key: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  createdAt: { type: Date, default: Date.now },
});

export const AuthCooldown = mongoose.model<IAuthCooldown>("AuthCooldown", authCooldownSchema);
