export type SkillMasteryDTO = {
  id: string;
  skillType: string;
  conceptId: string | null;
  probabilityKnown: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracyRate: number;
  mastered: boolean;
  needsReview: boolean;
  nextReviewAt: string | null;
  lastAttemptAt: string | null;
  reviewIntervalDays: number;
  easeFactor: number;
};

export type MasteryStatsDTO = {
  totalSkills: number;
  masteredSkills: number;
  skillsDueForReview: number;
  averageMastery: number;
  skillsNeedingPractice: number;
};

export type DashboardDTO = {
  stats: MasteryStatsDTO;
  skillsDueForReview: SkillMasteryDTO[];
  skillsNeedingPractice: SkillMasteryDTO[];
  masteredSkills: SkillMasteryDTO[];
};

export type ReviewCountDTO = {
  count: number;
};
