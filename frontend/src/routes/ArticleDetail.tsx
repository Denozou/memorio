import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, BookOpen, CheckCircle, GraduationCap, LogOut, Menu, X, Layers } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ArticleDetailDto } from "../types/learning";

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [article, setArticle] = useState<ArticleDetailDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<ArticleDetailDto>(`/api/learning/articles/${slug}`);
        if (alive) setArticle(data);
      } catch (e: any) {
        if (alive) {
          setError(e?.response?.data?.error ?? "Failed to load article");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [slug]);

  async function handleMarkAsRead() {
    if (!article || article.hasRead) return;

    setMarkingRead(true);
    try {
      await api.post(`/api/learning/articles/${article.id}/mark-read`);
      setArticle({ ...article, hasRead: true });
    } catch (e: any) {
      console.error("Failed to mark as read", e);
    } finally {
      setMarkingRead(false);
    }
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

  const difficultyColor = article ? {
    1: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
    2: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200",
    3: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
  }[article.difficultyLevel] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300" : "";

  const difficultyLabel = article ? {
    1: "Beginner",
    2: "Intermediate",
    3: "Advanced",
  }[article.difficultyLevel] || "Unknown" : "";

  // Helper to format category name
  function formatCategoryTitle(category: string): string {
    const labels: Record<string, string> = {
      METHOD_OF_LOCI: "Method of Loci",
      STORY_METHOD: "Story Method",
      PEG_SYSTEM: "Peg System",
    };
    return labels[category] || category;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src="/favicon.ico" alt="Memorio logo" className="h-8 w-8" />
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
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Button */}
        <Link
          to="/learning"
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Learning Hub
        </Link>

        {loading && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            Loading article...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Link
              to="/learning"
              className="mt-4 inline-block text-sm text-red-700 dark:text-red-300 hover:underline"
            >
              Return to Learning Hub
            </Link>
          </div>
        )}

        {!loading && !error && article && (
          <>
            {/* Article Header */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm overflow-hidden mb-8">
              {/* Cover Image */}
              {article.coverImageUrl ? (
                <img
                  src={article.coverImageUrl}
                  alt={article.title}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center">
                  <BookOpen className="w-20 h-20 text-indigo-600 dark:text-indigo-400" />
                </div>
              )}

              <div className="p-6 sm:p-8">
                {/* Category Breadcrumb */}
                <div className="mb-4 flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-medium text-indigo-900 dark:text-indigo-100">
                      {formatCategoryTitle(article.techniqueCategory)}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400">·</span>
                    <span className="text-indigo-700 dark:text-indigo-300">
                      Article {article.sequenceInCategory}
                    </span>
                  </div>
                  {article.isIntroArticle && (
                    <span className="px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                      Introduction
                    </span>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColor}`}>
                    {difficultyLabel}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                    <Clock className="w-4 h-4" />
                    {article.estimatedReadMinutes} min read
                  </span>
                  {article.author && (
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      by {article.author}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 mb-3">
                  {article.title}
                </h1>

                {/* Subtitle */}
                {article.subtitle && (
                  <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                    {article.subtitle}
                  </p>
                )}

                {/* Progress Indicators */}
                <div className="flex flex-wrap items-center gap-3">
                  {article.hasRead && (
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Read
                    </span>
                  )}
                  {article.quizCompleted && article.quizScore !== null && (
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                      <GraduationCap className="w-4 h-4" />
                      Quiz: {article.quizScore}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-6 sm:p-8 mb-8">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {article.contentMarkdown}
                </ReactMarkdown>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {!article.hasRead && (
                <button
                  onClick={handleMarkAsRead}
                  disabled={markingRead}
                  className="flex-1 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  {markingRead ? "Marking..." : "Mark as Read"}
                </button>
              )}
              <Link
                to={`/learning/articles/${article.slug}/quiz`}
                className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 shadow"
              >
                <GraduationCap className="w-5 h-5" />
                {article.quizCompleted ? "Retake Quiz" : "Take Quiz"}
              </Link>
            </div>

            {/* Quiz Attempts Info */}
            {article.quizAttempts !== null && article.quizAttempts > 0 && (
              <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-300">
                You've attempted this quiz {article.quizAttempts} {article.quizAttempts === 1 ? "time" : "times"}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
