import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { Plus, Edit2, HelpCircle, Search, X, ChevronRight } from "lucide-react";
import type { Article, Quiz, Question } from "../../types/admin";
import QuizForm from "./QuizForm";
import QuestionForm from "./QuestionForm";

export default function QuizManager() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<Article[]>("/api/learning/articles");
      setArticles(data);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? t('admin.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }

  function handleSelectArticle(article: Article) {
    setSelectedArticle(article);
  }

  function handleBack() {
    setSelectedArticle(null);
  }

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {!selectedArticle ? (
        // Article Selection View
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
              {t('admin.selectArticle')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('admin.selectArticleDesc')}
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('admin.searchArticles')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin.loadingArticles')}</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Articles List */}
          {!loading && !error && (
            <>
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <p className="text-sm">
                    {searchQuery ? t('admin.noArticlesMatch') : t('admin.noArticlesAvailable')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleSelectArticle(article)}
                      className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-50 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {article.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            /{article.slug}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // Quiz Management View for Selected Article
        <QuizDetailView article={selectedArticle} onBack={handleBack} />
      )}
    </div>
  );
}

// Quiz Detail View Component
function QuizDetailView({ article, onBack }: { article: Article; onBack: () => void }) {
  const { t } = useTranslation();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [showCreateQuestionModal, setShowCreateQuestionModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  useEffect(() => {
    loadQuiz();
  }, [article.id]);

  async function loadQuiz() {
    try {
      setLoading(true);
      setError(null);
      // Try to fetch the quiz for this article
      const { data } = await api.get(`/api/learning/articles/${article.slug}/quiz`);
      setQuiz(data);
      // Load questions if quiz exists
      if (data?.id) {
        await loadQuestions(data.id);
      }
    } catch (e: any) {
      // Quiz might not exist yet - that's okay
      if (e?.response?.status === 404) {
        setQuiz(null);
        setQuestions([]);
      } else {
        setError(e?.response?.data?.error ?? t('admin.failedToLoadQuiz'));
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadQuestions(quizId: string) {
    try {
      const { data } = await api.get<Question[]>(`/api/admin/learning/quizzes/${quizId}/questions`);
      setQuestions(data);
    } catch (e: any) {
      console.error("Failed to load questions", e);
      setQuestions([]);
    }
  }

  async function handleCreateQuiz(quizData: { title: string; passingScore: number }) {
    try {
      const { data } = await api.post(`/api/admin/learning/articles/${article.id}/quiz`, quizData);
      setQuiz(data);
      setShowCreateQuizModal(false);
    } catch (e: any) {
      const errorMsg = e?.response?.data?.error ?? "Failed to create quiz";
      setError(errorMsg);
      setShowCreateQuizModal(false);
    }
  }

  function handleAddQuestion() {
    if (!quiz) {
      alert(t('admin.createQuizFirst'));
      return;
    }
    setSelectedQuestion(null);
    setShowCreateQuestionModal(true);
  }

  return (
    <div>
      {/* Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
        >
          ← {t('admin.backToArticles')}
        </button>
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50">
          {article.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {t('admin.manageQuizContent')}
        </p>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('admin.loadingQuiz')}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400 mb-6">
          {error}
        </div>
      )}

      {!loading && !quiz && (
        <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
          <HelpCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            {t('admin.noQuizYet')}
          </p>
          <button
            onClick={() => setShowCreateQuizModal(true)}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('admin.createQuiz')}
          </button>
        </div>
      )}

      {!loading && quiz && (
        <div className="space-y-6">
          {/* Quiz Info Card */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-50">
                  {quiz.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {t('admin.passingScore')}: {quiz.passingScore}%
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                {t('admin.active')}
              </span>
            </div>
          </div>

          {/* Questions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-900 dark:text-slate-50">
                {t('admin.questions')} ({questions.length})
              </h4>
              <button
                onClick={handleAddQuestion}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                {t('admin.addQuestion')}
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('admin.noQuestionsYet')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onEdit={() => {
                      setSelectedQuestion(question);
                      setShowCreateQuestionModal(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Quiz Modal */}
      {showCreateQuizModal && (
        <CreateQuizModal
          onClose={() => setShowCreateQuizModal(false)}
          onCreate={handleCreateQuiz}
        />
      )}

      {/* Create/Edit Question Modal */}
      {showCreateQuestionModal && quiz && (
        <QuestionFormModal
          quizId={quiz.id}
          question={selectedQuestion}
          onClose={() => {
            setShowCreateQuestionModal(false);
            setSelectedQuestion(null);
            loadQuiz();
          }}
        />
      )}
    </div>
  );
}

// Question Card Component
function QuestionCard({
  question,
  onEdit,
}: {
  question: Question;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <p className="font-medium text-slate-900 dark:text-slate-50">
            {question.questionText}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
              {question.questionType.replace(/_/g, ' ')}
            </span>
            <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs">
              {t('admin.order')}: {question.displayOrder}
            </span>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>
      </div>
      {question.explanation && (
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 pl-3 border-l-2 border-slate-300 dark:border-slate-700">
          {question.explanation}
        </p>
      )}
    </div>
  );
}

// Use the real form components
function CreateQuizModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { title: string; passingScore: number }) => void;
}) {
  return <QuizForm onClose={onClose} onCreate={onCreate} />;
}

function QuestionFormModal({
  quizId,
  question,
  onClose,
}: {
  quizId: string;
  question: Question | null;
  onClose: () => void;
}) {
  return <QuestionForm quizId={quizId} question={question} onClose={onClose} />;
}
