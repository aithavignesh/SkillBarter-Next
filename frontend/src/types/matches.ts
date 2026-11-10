export type MatchSkillDto = {
  skillId: string;
  name: string;
  proficiency: string;
};

export type MatchResultDto = {
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
  theyTeachYouLearn: MatchSkillDto[];
  youTeachTheyLearn: MatchSkillDto[];
};
