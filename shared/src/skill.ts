import { z } from "zod";

export const skillCategories = [
  "Software Development",
  "Design & Creative",
  "Languages",
  "Business & Marketing",
  "Music & Audio",
  "Academics & Science",
  "Health & Fitness",
  "Cooking & Culinary",
  "Crafts & DIY",
  "Other",
] as const;

export const skillCreateSchema = z.object({
  name: z.string().min(2, "Skill name must be at least 2 characters").max(50).trim(),
  category: z.string().min(2).max(50).trim().default("Other"),
  description: z.string().max(500).trim().optional().default(""),
});

export type SkillCreateInput = z.infer<typeof skillCreateSchema>;

export const userSkillCreateSchema = z.object({
  skillId: z.string().optional(),
  name: z.string().min(2).max(50).trim(),
  category: z.string().min(2).max(50).trim().default("Other"),
  type: z.enum(["offered", "wanted"]),
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
  description: z.string().max(500).trim().optional().default(""),
  yearsExperience: z.number().min(0).max(50).optional().default(1),
});

export type UserSkillCreateInput = z.infer<typeof userSkillCreateSchema>;

export const userSkillUpdateSchema = z.object({
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  description: z.string().max(500).trim().optional(),
  yearsExperience: z.number().min(0).max(50).optional(),
});

export type UserSkillUpdateInput = z.infer<typeof userSkillUpdateSchema>;

export interface SkillDto {
  id: string;
  name: string;
  category: string;
  description?: string;
  approved: boolean;
}

export interface UserSkillDto {
  id: string;
  userId: string;
  skillId: string;
  name: string;
  category: string;
  type: "offered" | "wanted";
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  description?: string;
  yearsExperience: number;
}
