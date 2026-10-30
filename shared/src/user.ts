import { z } from "zod";

export const sessionFormatEnum = z.enum(["video", "chat", "in_person", "any"]);
export type SessionFormat = z.infer<typeof sessionFormatEnum>;

export const userSkillItemSchema = z.object({
  skillName: z.string().min(1).max(50).trim(),
  category: z.string().min(1).max(50).trim().default("General"),
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
  description: z.string().max(500).optional().default(""),
  yearsExperience: z.number().min(0).max(50).optional().default(1),
});

export type UserSkillItem = z.infer<typeof userSkillItemSchema>;

export const onboardingSchema = z.object({
  displayName: z.string().min(2).max(50).trim(),
  bio: z.string().max(1000).trim().optional().default(""),
  location: z.string().max(100).trim().optional().default(""),
  preferredSessionFormat: sessionFormatEnum.default("video"),
  availability: z.string().max(200).trim().optional().default("Flexible"),
  offeredSkills: z.array(userSkillItemSchema).min(1, "Please offer at least one skill to teach"),
  wantedSkills: z.array(userSkillItemSchema).min(1, "Please list at least one skill you want to learn"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(50).trim().optional(),
  bio: z.string().max(1000).trim().optional(),
  location: z.string().max(100).trim().optional(),
  avatarUrl: z.string().url().or(z.literal("")).optional(),
  preferredSessionFormat: sessionFormatEnum.optional(),
  availability: z.string().max(200).trim().optional(),
  isProfilePublic: z.boolean().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export interface PublicUserProfile {
  id: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  location?: string;
  preferredSessionFormat: SessionFormat;
  availability?: string;
  reputationScore: number;
  completedExchangesCount: number;
  createdAt: string;
  offeredSkills: Array<{
    id: string;
    skillId: string;
    name: string;
    category: string;
    proficiency: string;
    description?: string;
  }>;
  wantedSkills: Array<{
    id: string;
    skillId: string;
    name: string;
    category: string;
    proficiency: string;
    description?: string;
  }>;
}
