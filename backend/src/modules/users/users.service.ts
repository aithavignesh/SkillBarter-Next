import mongoose from "mongoose";
import { User, IUser } from "../../models/User";
import { Skill } from "../../models/Skill";
import { UserSkill } from "../../models/UserSkill";
import { Block } from "../../models/Block";
import { AnalyticsEvent } from "../../models/AnalyticsEvent";
import {
  OnboardingInput,
  ProfileUpdateInput,
  PublicUserProfile,
} from "@skillbarter/shared";
import { AppError } from "../../middleware/errorHandler";

export class UsersService {
  async completeOnboarding(userId: string, input: OnboardingInput): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    user.displayName = input.displayName;
    user.bio = input.bio || "";
    user.location = input.location || "";
    user.preferredSessionFormat = input.preferredSessionFormat;
    user.availability = input.availability || "Flexible";
    user.onboardingCompleted = true;

    // Process offered skills
    for (const item of input.offeredSkills) {
      const normalized = item.skillName.toLowerCase().trim();
      let skill = await Skill.findOne({ normalizedName: normalized });
      if (!skill) {
        skill = await Skill.create({
          name: item.skillName.trim(),
          normalizedName: normalized,
          category: item.category || "General",
          description: item.description || "",
        });
      }

      await UserSkill.findOneAndUpdate(
        { userId: user._id, skillId: skill._id, type: "offered" },
        {
          userId: user._id,
          skillId: skill._id,
          skillName: skill.name,
          category: skill.category,
          type: "offered",
          proficiency: item.proficiency,
          description: item.description || "",
          yearsExperience: item.yearsExperience || 1,
        },
        { upsert: true, new: true }
      );
    }

    // Process wanted skills
    for (const item of input.wantedSkills) {
      const normalized = item.skillName.toLowerCase().trim();
      let skill = await Skill.findOne({ normalizedName: normalized });
      if (!skill) {
        skill = await Skill.create({
          name: item.skillName.trim(),
          normalizedName: normalized,
          category: item.category || "General",
          description: item.description || "",
        });
      }

      await UserSkill.findOneAndUpdate(
        { userId: user._id, skillId: skill._id, type: "wanted" },
        {
          userId: user._id,
          skillId: skill._id,
          skillName: skill.name,
          category: skill.category,
          type: "wanted",
          proficiency: item.proficiency,
          description: item.description || "",
          yearsExperience: item.yearsExperience || 1,
        },
        { upsert: true, new: true }
      );
    }

    await user.save();

    await AnalyticsEvent.create({
      eventName: "ONBOARDING_COMPLETED",
      userId: user._id,
      timestamp: new Date(),
    });

    return user;
  }

  async getPublicProfile(targetUserId: string, requestingUserId?: string): Promise<PublicUserProfile> {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new AppError("Invalid user ID", 400, "INVALID_ID");
    }

    // Check blocking relationship
    if (requestingUserId && requestingUserId !== targetUserId) {
      const isBlocked = await Block.findOne({
        $or: [
          { blockerId: requestingUserId, blockedUserId: targetUserId },
          { blockerId: targetUserId, blockedUserId: requestingUserId },
        ],
      });
      if (isBlocked) {
        throw new AppError("Profile is not accessible", 404, "NOT_FOUND");
      }
    }

    const user = await User.findById(targetUserId);
    if (!user || user.isSuspended) {
      throw new AppError("User profile not found", 404, "NOT_FOUND");
    }

    if (!user.isProfilePublic && requestingUserId !== targetUserId) {
      throw new AppError("This user profile is private", 403, "PROFILE_PRIVATE");
    }

    const userSkills = await UserSkill.find({ userId: user._id });

    const offeredSkills = userSkills
      .filter((s) => s.type === "offered")
      .map((s) => ({
        id: s._id.toString(),
        skillId: s.skillId.toString(),
        name: s.skillName,
        category: s.category,
        proficiency: s.proficiency,
        description: s.description,
      }));

    const wantedSkills = userSkills
      .filter((s) => s.type === "wanted")
      .map((s) => ({
        id: s._id.toString(),
        skillId: s.skillId.toString(),
        name: s.skillName,
        category: s.category,
        proficiency: s.proficiency,
        description: s.description,
      }));

    return {
      id: user._id.toString(),
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      location: user.location,
      preferredSessionFormat: user.preferredSessionFormat,
      availability: user.availability,
      reputationScore: user.reputationScore,
      completedExchangesCount: user.completedExchangesCount,
      createdAt: user.createdAt.toISOString(),
      offeredSkills,
      wantedSkills,
    };
  }

  async updateProfile(userId: string, input: ProfileUpdateInput): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    // Only update explicit whitelisted fields - cannot touch role, email, password, reputation directly
    if (input.displayName !== undefined) user.displayName = input.displayName;
    if (input.bio !== undefined) user.bio = input.bio;
    if (input.location !== undefined) user.location = input.location;
    if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl;
    if (input.preferredSessionFormat !== undefined) user.preferredSessionFormat = input.preferredSessionFormat;
    if (input.availability !== undefined) user.availability = input.availability;
    if (input.isProfilePublic !== undefined) user.isProfilePublic = input.isProfilePublic;

    await user.save();

    await AnalyticsEvent.create({
      eventName: "PROFILE_UPDATED",
      userId: user._id,
      timestamp: new Date(),
    });

    return user;
  }
}

export const usersService = new UsersService();
