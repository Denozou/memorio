import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, GraduationCap, LogOut, Menu, X, Trophy, RotateCcw } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import type { QuizDto, QuizResultDto, SubmitQuizRequest } from "../types/learning";

export default function ArticleQuiz() {
  const { slug } = useParams<{ slug: string }>();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAnswers, setSelectedAnswers] = useState<Map<string, string>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResultDto | null>(null);

  useEffect(() => {
    if (!slug) return;
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<QuizDto>(`/api/learning/articles/${slug}/quiz`);
        if (alive) setQuiz(data);
      } catch (e: any) {
        if (alive) {
          setError(e?.response?.data?.error ?? "Failed to load quiz");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [slug]);

  function handleSelectAnswer(questionId: string, optionId: string) {
    if (result) return; // Don't allow changes after submission
    const newAnswers = new Map(selectedAnswers);
    newAnswers.set(questionId, optionId);
    setSelectedAnswers(newAnswers);
  }

  async function handleSubmit() {
    if (!quiz || result) return;

    // Check if all questions are answered
    const allAnswered = quiz.questions.every(q => selectedAnswers.has(q.id));
    if (!allAnswered) {
      alert("Please answer all questions before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const request: SubmitQuizRequest = {
        quizId: quiz.id,
        selectedOptionIds: Array.from(selectedAnswers.values()),
      };

      const { data } = await api.post<QuizResultDto>("/api/learning/quiz/submit", request);
      setResult(data);
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetake() {
    setSelectedAnswers(new Map());
    setResult(null);
  }

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
      nav("/login");
    } catch (e) {
      console.error("Logout failed", e);
      nav("/login");
    }
  }

  const progress = quiz ? (selectedAnswers.size / quiz.questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md" aria-hidden />
              <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">Memorio</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                Dashboard
              </Link>
              <Link to="/learning" className="text-sm text-slate-900 dark:text-slate-50 font-medium">
                Learning
              </Link>
              <Link to="/profile" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                Profile
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl border border-slate-300/70 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                className="p-2 rounded-lg border border-slate-300/70 dark:border-slate-700"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-slate-200/70 dark:border-slate-800">
              <div className="flex flex-col gap-2">
                <Link to="/dashboard" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link to="/learning" className="py-2 text-slate-900 dark:text-slate-50 font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Learning
                </Link>
                <Link to="/profile" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  Profile
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="py-2 text-left text-slate-600 dark:text-slate-300 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Button */}
        <Link
          to={`/learning/articles/${slug}`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Article
        </Link>

        {loading && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            Loading quiz...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Link
              to={`/learning/articles/${slug}`}
              className="mt-4 inline-block text-sm text-red-700 dark:text-red-300 hover:underline"
            >
              Return to Article
            </Link>
          </div>
        )}

        {!loading && !error && quiz && !result && (
          <>
            {/* Quiz Header */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-6 sm:p-8 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                    {quiz.title}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {quiz.questions.length} questions • Passing score: {quiz.passingScore}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300 mb-2">
                  <span>Progress</span>
                  <span>{selectedAnswers.size} / {quiz.questions.length}</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-6 mb-8">
              {quiz.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-6"
                >
                  <div className="flex gap-3 mb-4">
                    <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex-1">
                      {question.questionText}
                    </h3>
                  </div>

                  <div className="space-y-2 ml-11">
                    {question.options.map((option) => {
                      const isSelected = selectedAnswers.get(question.id) === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleSelectAnswer(question.id, option.id)}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-200 dark:ring-indigo-900/40"
                              : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex-shrink-0 h-5 w-5 rounded-full border-2 transition-all ${
                                isSelected
                                  ? "border-indigo-600 bg-indigo-600"
                                  : "border-slate-300 dark:border-slate-600"
                              }`}
                            >
                              {isSelected && (
                                <CheckCircle className="w-full h-full text-white" />
                              )}
                            </div>
                            <span className="text-slate-900 dark:text-slate-50">
                              {option.optionText}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting || selectedAnswers.size < quiz.questions.length}
              className="w-full px-6 py-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-semibold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </>
        )}

        {/* Results */}
        {!loading && !error && result && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-6 sm:p-8">
            {/* Result Icon */}
            <div className="text-center mb-6">
              {result.passed ? (
                <div className="inline-flex h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-4">
                  <Trophy className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="inline-flex h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30 items-center justify-center mb-4">
                  <XCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                </div>
              )}

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-2">
                {result.passed ? "Congratulations!" : "Keep Practicing!"}
              </h2>
              <p className="text-slate-600 dark:text-slate-300">{result.message}</p>
            </div>

            {/* Score Details */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                  {result.percentage}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Score</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                  {result.correctAnswers}/{result.totalQuestions}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Correct</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                  {result.passingScore}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Required</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Retake Quiz
              </button>
              <Link
                to={`/learning/articles/${slug}`}
                className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 shadow"
              >
                Back to Article
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
