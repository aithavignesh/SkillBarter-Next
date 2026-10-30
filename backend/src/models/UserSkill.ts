import mongoose, { Schema, Document } from "mongoose";

export interface IUserSkill extends Document {
  userId: mongoose.Types.ObjectId;
  skillId: mongoose.Types.ObjectId;
  skillName: string;
  category: string;
  type: "offered" | "wanted";
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  description: string;
  yearsExperience: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSkillSchema = new Schema<IUserSkill>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    skillId: { type: Schema.Types.ObjectId, ref: "Skill", required: true, index: true },
    skillName: { type: String, required: true },
    category: { type: String, required: true },
    type: { type: String, enum: ["offered", "wanted"], required: true, index: true },
    proficiency: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "intermediate",
    },
    description: { type: String, default: "" },
    yearsExperience: { type: Number, default: 1, min: 0, max: 50 },
  },
  { timestamps: true }
);

userSkillSchema.index({ userId: 1, skillId: 1, type: 1 }, { unique: true });

export const UserSkill = mongoose.model<IUserSkill>("UserSkill", userSkillSchema);
