import mongoose from "mongoose";
import { User, IUser } from "../../models/User";
import { UserSkill, IUserSkill } from "../../models/UserSkill";
import { Block } from "../../models/Block";
import { AnalyticsEvent } from "../../models/AnalyticsEvent";

export interface MatchResult {
  user: {
    id: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    location: string;
    preferredSessionFormat: string;
    availability: string;
    reputationScore: number;
    completedExchangesCount: number;
  };
  compatibilityScore: number;
  explanation: string;
  reciprocalMatch: boolean;
  theyTeachYouLearn: Array<{ skillId: string; name: string; proficiency: string }>;
  youTeachTheyLearn: Array<{ skillId: string; name: string; proficiency: string }>;
}

export class MatchesService {
  async discoverMatches(
    currentUserId?: string,
    query: {
      category?: string;
      search?: string;
      format?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ matches: MatchResult[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 12));

    // Excluded users (self and blocked)
    const excludedUserIds: mongoose.Types.ObjectId[] = [];
    let myOfferedSkills: IUserSkill[] = [];
    let myWantedSkills: IUserSkill[] = [];

    if (currentUserId) {
      const myObjId = new mongoose.Types.ObjectId(currentUserId);
      excludedUserIds.push(myObjId);

      const blocks = await Block.find({
        $or: [{ blockerId: myObjId }, { blockedUserId: myObjId }],
      });
      for (const b of blocks) {
        if (b.blockerId.toString() === currentUserId) excludedUserIds.push(b.blockedUserId);
        else excludedUserIds.push(b.blockerId);
      }

      [myOfferedSkills, myWantedSkills] = await Promise.all([
        UserSkill.find({ userId: myObjId, type: "offered" }),
        UserSkill.find({ userId: myObjId, type: "wanted" }),
      ]);
    }

    // Query candidates
    const userQuery: Record<string, unknown> = {
      _id: { $nin: excludedUserIds },
      isProfilePublic: true,
      isSuspended: false,
      isEmailVerified: true,
      onboardingCompleted: true,
    };

    if (query.format && query.format !== "any") {
      userQuery.preferredSessionFormat = { $in: [query.format, "any"] };
    }

    const candidateUsers = await User.find(userQuery).limit(100);

    // Fetch skills for all candidate users
    const candidateIds = candidateUsers.map((u) => u._id);
    const candidateSkills = await UserSkill.find({ userId: { $in: candidateIds } });

    const skillsByUser = new Map<string, IUserSkill[]>();
    for (const s of candidateSkills) {
      const uid = s.userId.toString();
      if (!skillsByUser.has(uid)) skillsByUser.set(uid, []);
      skillsByUser.get(uid)!.push(s);
    }

    const myWantedNames = new Set(myWantedSkills.map((s) => s.skillName.toLowerCase()));
    const myOfferedNames = new Set(myOfferedSkills.map((s) => s.skillName.toLowerCase()));

    const results: MatchResult[] = [];

    for (const candidate of candidateUsers) {
      const uid = candidate._id.toString();
      const userSkills = skillsByUser.get(uid) || [];

      const candidateOffered = userSkills.filter((s) => s.type === "offered");
      const candidateWanted = userSkills.filter((s) => s.type === "wanted");

      // Filter by category or search if specified
      if (query.category && query.category !== "all") {
        const hasCategory = userSkills.some(
          (s) => s.category.toLowerCase() === query.category?.toLowerCase()
        );
        if (!hasCategory) continue;
      }

      if (query.search) {
        const searchLower = query.search.toLowerCase();
        const matchesName = candidate.displayName.toLowerCase().includes(searchLower);
        const matchesSkill = userSkills.some((s) =>
          s.skillName.toLowerCase().includes(searchLower)
        );
        if (!matchesName && !matchesSkill) continue;
      }

      // Check skill overlaps
      const theyTeachYouLearn = candidateOffered
        .filter((s) => myWantedNames.has(s.skillName.toLowerCase()))
        .map((s) => ({
          skillId: s.skillId.toString(),
          name: s.skillName,
          proficiency: s.proficiency,
        }));

      const youTeachTheyLearn = candidateWanted
        .filter((s) => myOfferedNames.has(s.skillName.toLowerCase()))
        .map((s) => ({
          skillId: s.skillId.toString(),
          name: s.skillName,
          proficiency: s.proficiency,
        }));

      let score = 50; // base score
      let explanation = `${candidate.displayName} is ready to exchange skills.`;
      const isReciprocal = theyTeachYouLearn.length > 0 && youTeachTheyLearn.length > 0;

      if (isReciprocal) {
        score = 95;
        const teach = theyTeachYouLearn[0]?.name;
        const learn = youTeachTheyLearn[0]?.name;
        explanation = `Perfect reciprocal match! ${candidate.displayName} teaches ${teach} (which you want) and wants to learn ${learn} (which you teach).`;
      } else if (theyTeachYouLearn.length > 0) {
        score = 75;
        const teach = theyTeachYouLearn[0]?.name;
        explanation = `${candidate.displayName} teaches ${teach}, which matches your learning goals.`;
      } else if (youTeachTheyLearn.length > 0) {
        score = 65;
        const learn = youTeachTheyLearn[0]?.name;
        explanation = `${candidate.displayName} wants to learn ${learn}, which you can teach.`;
      } else {
        // Shared category interest bonus
        const sharedCategories = candidateOffered.filter((co) =>
          myOfferedSkills.some((mo) => mo.category === co.category)
        );
        if (sharedCategories.length > 0) {
          score = 55;
          explanation = `Shares interest in the ${sharedCategories[0]?.category} domain.`;
        }
      }

      results.push({
        user: {
          id: candidate._id.toString(),
          displayName: candidate.displayName,
          bio: candidate.bio,
          avatarUrl: candidate.avatarUrl,
          location: candidate.location,
          preferredSessionFormat: candidate.preferredSessionFormat,
          availability: candidate.availability,
          reputationScore: candidate.reputationScore,
          completedExchangesCount: candidate.completedExchangesCount,
        },
        compatibilityScore: score,
        explanation,
        reciprocalMatch: isReciprocal,
        theyTeachYouLearn,
        youTeachTheyLearn,
      });
    }

    // Sort by compatibilityScore descending, then reputationScore descending
    results.sort((a, b) => {
      if (b.compatibilityScore !== a.compatibilityScore) {
        return b.compatibilityScore - a.compatibilityScore;
      }
      return b.user.reputationScore - a.user.reputationScore;
    });

    const total = results.length;
    const paginated = results.slice((page - 1) * limit, page * limit);

    if (currentUserId) {
      await AnalyticsEvent.create({
        eventName: "MATCH_VIEWED",
        userId: new mongoose.Types.ObjectId(currentUserId),
        metadata: { matchCount: paginated.length },
        timestamp: new Date(),
      });
    }

    return {
      matches: paginated,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const matchesService = new MatchesService();
