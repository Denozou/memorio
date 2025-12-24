export type TechniqueCategory = "METHOD_OF_LOCI" | "STORY_METHOD" | "PEG_SYSTEM";

export type QuestionType = "MULTIPLE_CHOICE";

export interface ArticleListDto {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  techniqueCategory: TechniqueCategory;
  difficultyLevel: number;
  estimatedReadMinutes: number;
  requiredSkillLevel: number;
  sequenceInCategory: number;
  isIntroArticle: boolean;
  coverImageUrl: string | null;
  displayOrder: number;
  author: string | null;
  contentMarkdown: string;
  isPublished: boolean;
  language: string;  // ISO 639-1 language code
  hasRead: boolean | null;
  quizCompleted: boolean | null;
  quizScore: number | null;
}

export interface ArticleDetailDto {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  techniqueCategory: TechniqueCategory;
  difficultyLevel: number;
  contentMarkdown: string;
  coverImageUrl: string | null;
  author: string | null;
  estimatedReadMinutes: number;
  requiredSkillLevel: number;
  sequenceInCategory: number;
  isIntroArticle: boolean;
  language: string;  // ISO 639-1 language code
  createdAt: string;
  hasRead: boolean | null;
  quizCompleted: boolean | null;
  quizScore: number | null;
  quizAttempts: number | null;
}

export interface QuizDto {
  id: string;
  articleId: string;
  title: string;
  passingScore: number;
  questions: QuestionDto[];
}

export interface QuestionDto {
  id: string;
  questionText: string;
  questionType: QuestionType;
  displayOrder: number;
  options: OptionDto[];
}

export interface OptionDto {
  id: string;
  optionText: string;
  displayOrder: number;
}

export interface QuizResultDto {
  quizId: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  message: string;
}

export interface SubmitQuizRequest {
  quizId: string;
  selectedOptionIds: string[];
}

export interface UserProgressDto {
  completedArticles: number;
  completionPercentage: number;
  lastActivity: string | null;
}
