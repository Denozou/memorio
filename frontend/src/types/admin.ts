import type { TechniqueCategory } from "./learning";

export interface CreateArticleRequest {
  slug: string;
  title: string;
  subtitle?: string;
  techniqueCategory: TechniqueCategory;
  difficultyLevel: number;
  contentMarkdown: string;
  coverImageUrl?: string;
  author?: string;
  estimatedReadMinutes: number;
  requiredSkillLevel?: number;  // Now optional
  sequenceInCategory: number;
  isIntroArticle: boolean;
  isPublished?: boolean;
}

export interface CreateQuizRequest {
  title: string;
  passingScore: number;
}

export interface CreateQuestionRequest {
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK";
  displayOrder: number;
  explanation?: string;
}

export interface CreateOptionRequest {
  optionText: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface Article {
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
  requiredSkillLevel: number | null;
  sequenceInCategory: number;
  isIntroArticle: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  articleId: string;
  title: string;
  passingScore: number;
  createdAt: string;
}

export interface Question {
  id: string;
  quizId: string;
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_BLANK";
  displayOrder: number;
  explanation: string | null;
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface ImageUploadResponse {
  imageId: string | null;
  message: string;
}
