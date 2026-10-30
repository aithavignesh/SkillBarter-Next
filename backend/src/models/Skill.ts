import mongoose, { Schema, Document } from "mongoose";

export interface ISkill extends Document {
  name: string;
  normalizedName: string;
  category: string;
  description: string;
  approved: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, required: true, default: "Other", index: true },
    description: { type: String, default: "" },
    approved: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Skill = mongoose.model<ISkill>("Skill", skillSchema);
