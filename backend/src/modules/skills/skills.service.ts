import mongoose from "mongoose";
import { Skill, ISkill } from "../../models/Skill";
import { UserSkill, IUserSkill } from "../../models/UserSkill";
import { AnalyticsEvent } from "../../models/AnalyticsEvent";
import {
  SkillCreateInput,
  UserSkillCreateInput,
  UserSkillUpdateInput,
} from "@skillbarter/shared";
import { AppError } from "../../middleware/errorHandler";

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error &&
    (error as { code?: unknown }).code === 11000;
}

export class SkillsService {
  async listSkills(query: { category?: string; search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { approved: true };
    if (query.category && query.category !== "all") {
      filter.category = query.category;
    }
    if (query.search?.trim()) {
      // Treat user input as literal text rather than a raw regular expression.
      // This avoids unexpectedly broad matches and regex-based query abuse.
      const escapedSearch = [...query.search.trim()]
        .map((character) => ".*+?^${}()|[]\\".includes(character) ? "\\" + character : character)
        .join("");
      filter.name = { $regex: escapedSearch, $options: "i" };
    }

    const [skills, total] = await Promise.all([
      Skill.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Skill.countDocuments(filter),
    ]);

    return {
      skills: skills.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        category: s.category,
        description: s.description,
        approved: s.approved,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createSkill(input: SkillCreateInput, userId?: string): Promise<ISkill> {
    const normalized = input.name.toLowerCase().trim();
    let skill = await Skill.findOne({ normalizedName: normalized });
    if (skill) {
      return skill;
    }

    try {
      skill = await Skill.create({
        name: input.name.trim(),
        normalizedName: normalized,
        category: input.category || "Other",
        description: input.description || "",
        createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      });
    } catch (error) {
      // A concurrent request may have inserted the same normalized name after our lookup.
      if (!isDuplicateKeyError(error)) throw error;
      const concurrentlyCreated = await Skill.findOne({ normalizedName: normalized });
      if (!concurrentlyCreated) throw error;
      skill = concurrentlyCreated;
    }

    return skill;
  }

  async getUserSkills(userId: string) {
    const skills = await UserSkill.find({ userId });
    return skills.map((s) => ({
      id: s._id.toString(),
      userId: s.userId.toString(),
      skillId: s.skillId.toString(),
      name: s.skillName,
      category: s.category,
      type: s.type,
      proficiency: s.proficiency,
      description: s.description,
      yearsExperience: s.yearsExperience,
    }));
  }

  async addUserSkill(userId: string, input: UserSkillCreateInput): Promise<IUserSkill> {
    const normalized = input.name.toLowerCase().trim();
    let skill = await Skill.findOne({ normalizedName: normalized });
    if (!skill) {
      try {
        skill = await Skill.create({
          name: input.name.trim(),
          normalizedName: normalized,
          category: input.category || "Other",
          description: input.description || "",
          createdBy: new mongoose.Types.ObjectId(userId),
        });
      } catch (error) {
        // Resolve concurrent creation through the unique normalizedName index.
        if (!isDuplicateKeyError(error)) throw error;
        const concurrentlyCreated = await Skill.findOne({ normalizedName: normalized });
        if (!concurrentlyCreated) throw error;
        skill = concurrentlyCreated;
      }
    }

    const existing = await UserSkill.findOne({
      userId,
      skillId: skill._id,
      type: input.type,
    });

    if (existing) {
      existing.proficiency = input.proficiency;
      existing.description = input.description || "";
      existing.yearsExperience = input.yearsExperience ?? 1;
      await existing.save();
      return existing;
    }

    let userSkill: IUserSkill;
    try {
      userSkill = await UserSkill.create({
        userId: new mongoose.Types.ObjectId(userId),
        skillId: skill._id,
        skillName: skill.name,
        category: skill.category,
        type: input.type,
        proficiency: input.proficiency,
        description: input.description || "",
        yearsExperience: input.yearsExperience ?? 1,
      });
    } catch (error) {
      // The compound unique index prevents duplicate associations under concurrent requests.
      if (!isDuplicateKeyError(error)) throw error;
      const concurrentlyCreated = await UserSkill.findOne({
        userId,
        skillId: skill._id,
        type: input.type,
      });
      if (!concurrentlyCreated) throw error;
      concurrentlyCreated.proficiency = input.proficiency;
      concurrentlyCreated.description = input.description || "";
      concurrentlyCreated.yearsExperience = input.yearsExperience ?? 1;
      await concurrentlyCreated.save();
      return concurrentlyCreated;
    }

    await AnalyticsEvent.create({
      eventName: "SKILL_ADDED",
      userId: new mongoose.Types.ObjectId(userId),
      metadata: { skillName: skill.name, type: input.type },
      timestamp: new Date(),
    });

    return userSkill;
  }

  async updateUserSkill(
    userId: string,
    userSkillId: string,
    input: UserSkillUpdateInput
  ): Promise<IUserSkill> {
    const userSkill = await UserSkill.findOne({ _id: userSkillId, userId });
    if (!userSkill) {
      throw new AppError("Skill association not found or not owned by you", 404, "NOT_FOUND");
    }

    if (input.proficiency) userSkill.proficiency = input.proficiency;
    if (input.description !== undefined) userSkill.description = input.description;
    if (input.yearsExperience !== undefined) userSkill.yearsExperience = input.yearsExperience;

    await userSkill.save();
    return userSkill;
  }

  async removeUserSkill(userId: string, userSkillId: string): Promise<void> {
    const result = await UserSkill.deleteOne({ _id: userSkillId, userId });
    if (result.deletedCount === 0) {
      throw new AppError("Skill association not found or not owned by you", 404, "NOT_FOUND");
    }
  }
}

export const skillsService = new SkillsService();
