import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Clock, CheckCircle, Lock, LogOut, Menu, X, GraduationCap, TrendingUp, ChevronDown, ChevronUp, Unlock } from "lucide-react";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../components/ThemeToggle";
import type { ArticleListDto, TechniqueCategory, UserProgressDto } from "../types/learning";

interface CategoryGroup {
  category: TechniqueCategory;
  categoryTitle: string;
  articles: ArticleListDto[];
  completedCount: number;
  totalCount: number;
}

export default function LearningHub() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [articles, setArticles] = useState<ArticleListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [progress, setProgress] = useState<UserProgressDto | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<TechniqueCategory | "ALL">("ALL");
  const [expandedCategories, setExpandedCategories] = useState<Set<TechniqueCategory>>(new Set());

  useEffect(() => {
    let alive = true;

    // Load articles
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<ArticleListDto[]>("/api/learning/articles");
        if (alive) setArticles(data);
      } catch (e: any) {
        if (alive) setError(e?.response?.data?.error ?? "Failed to load articles");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    // Load progress
    (async () => {
      setLoadingProgress(true);
      try {
        const { data } = await api.get<UserProgressDto>("/api/learning/progress");
        if (alive) setProgress(data);
      } catch (e: any) {
        console.error("Failed to load progress", e);
      } finally {
        if (alive) setLoadingProgress(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
      nav("/login");
    } catch (e) {
      console.error("Logout failed", e);
      nav("/login");
    }
  }

  // Helper function to format category name
  function formatCategoryTitle(category: TechniqueCategory): string {
    const labels: Record<TechniqueCategory, string> = {
      METHOD_OF_LOCI: t('learning.methodOfLoci'),
      STORY_METHOD: t('learning.storyMethod'),
      PEG_SYSTEM: t('learning.pegSystem'),
    };
    return labels[category];
  }

  // Helper function to check if an article is accessible
  function isArticleAccessible(article: ArticleListDto, allArticles: ArticleListDto[]): boolean {
    console.log(`Checking accessibility for: ${article.title} (seq: ${article.sequenceInCategory}, intro: ${article.isIntroArticle})`);
    
    // Intro articles are always accessible
    if (article.isIntroArticle) {
      console.log('  → Accessible (intro article)');
      return true;
    }

    // If this is the first article in the category (sequence 1), it should be accessible
    // only if it's an intro article (already handled above)
    if (article.sequenceInCategory === 1) {
      console.log('  → Locked (non-intro with sequence 1)');
      return false; // Non-intro articles with sequence 1 shouldn't exist, but lock them if they do
    }

    // Find previous article in the same category
    const previousArticle = allArticles.find(
      a => a.techniqueCategory === article.techniqueCategory && 
           a.sequenceInCategory === article.sequenceInCategory - 1
    );

    console.log(`  Previous article (seq ${article.sequenceInCategory - 1}):`, previousArticle ? `${previousArticle.title} (completed: ${previousArticle.quizCompleted})` : 'NOT FOUND');

    // If no previous article found, something is wrong with the data (gap in sequence)
    // Lock the article to be safe
    if (!previousArticle) {
      console.log('  → Locked (no previous article found)');
      return false;
    }

    // Previous article must have completed quiz to unlock this one
    const accessible = previousArticle.quizCompleted === true;
    console.log(`  → ${accessible ? 'Accessible' : 'Locked'} (previous quiz ${accessible ? 'completed' : 'not completed'})`);
    return accessible;
  }

  // Group articles by category
  const categoryGroups: CategoryGroup[] = (() => {
    const filteredArticles = selectedCategory === "ALL" 
      ? articles 
      : articles.filter(a => a.techniqueCategory === selectedCategory);

    const groupMap = new Map<TechniqueCategory, CategoryGroup>();

    filteredArticles.forEach(article => {
      if (!groupMap.has(article.techniqueCategory)) {
        groupMap.set(article.techniqueCategory, {
          category: article.techniqueCategory,
          categoryTitle: formatCategoryTitle(article.techniqueCategory),
          articles: [],
          completedCount: 0,
          totalCount: 0,
        });
      }

      const group = groupMap.get(article.techniqueCategory)!;
      group.articles.push(article);
      group.totalCount++;
      if (article.quizCompleted) group.completedCount++;
    });

    // Sort articles within each group by sequence
    groupMap.forEach(group => {
      group.articles.sort((a, b) => a.sequenceInCategory - b.sequenceInCategory);
    });

    return Array.from(groupMap.values());
  })();

  function toggleCategory(category: TechniqueCategory) {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

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
                {t('common.dashboard')}
              </Link>
              <Link to="/leaderboard" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                Leaderboard
              </Link>
              <Link to="/learning" className="text-sm text-slate-900 dark:text-slate-50 font-medium">
                {t('common.learning')}
              </Link>
              <Link to="/profile" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                {t('common.profile')}
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl border border-slate-300/70 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {t('common.logout')}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                className="p-2 rounded-lg border border-slate-300/70 dark:border-slate-700"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? t('exercises.closeMenu') : t('exercises.openMenu')}
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
                  {t('common.dashboard')}
                </Link>
                <Link to="/leaderboard" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  Leaderboard
                </Link>
                <Link to="/learning" className="py-2 text-slate-900 dark:text-slate-50 font-medium" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.learning')}
                </Link>
                <Link to="/profile" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.profile')}
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="py-2 text-left text-slate-600 dark:text-slate-300 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('common.logout')}
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10" />
            {t('learning.learningHub')}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {t('learning.masterTechniques')}
          </p>
        </div>

        {/* Progress Card */}
        {!loadingProgress && progress && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-50">{t('learning.yourProgress')}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                  {progress.completedArticles}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{t('learning.completed')}</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                  {Math.round(progress.completionPercentage)}%
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{t('learning.overall')}</div>
              </div>
              {progress.lastActivity && (
                <div className="col-span-2 sm:col-span-1">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {formatDate(progress.lastActivity)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{t('learning.lastActivity')}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedCategory === "ALL"
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {t('learning.allTechniques')}
            </button>
            <button
              onClick={() => setSelectedCategory("METHOD_OF_LOCI")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedCategory === "METHOD_OF_LOCI"
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {t('learning.methodOfLoci')}
            </button>
            <button
              onClick={() => setSelectedCategory("STORY_METHOD")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedCategory === "STORY_METHOD"
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {t('learning.storyMethod')}
            </button>
            <button
              onClick={() => setSelectedCategory("PEG_SYSTEM")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedCategory === "PEG_SYSTEM"
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {t('learning.pegSystem')}
            </button>
          </div>
        </div>

        {/* Topics List */}
        {loading && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            {t('learning.loadingArticles')}
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && categoryGroups.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No articles found in this category
          </div>
        )}

        {!loading && !error && categoryGroups.length > 0 && (
          <div className="space-y-6">
            {categoryGroups.map((categoryGroup) => (
              <CategoryCard
                key={categoryGroup.category}
                categoryGroup={categoryGroup}
                isExpanded={expandedCategories.has(categoryGroup.category)}
                onToggle={() => toggleCategory(categoryGroup.category)}
                allArticles={articles}
                isArticleAccessible={isArticleAccessible}
                t={t}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Category Card Component (collapsible section for each category)
function CategoryCard({ 
  categoryGroup, 
  isExpanded, 
  onToggle, 
  allArticles,
  isArticleAccessible,
  t
}: { 
  categoryGroup: CategoryGroup; 
  isExpanded: boolean; 
  onToggle: () => void;
  allArticles: ArticleListDto[];
  isArticleAccessible: (article: ArticleListDto, allArticles: ArticleListDto[]) => boolean;
  t: any;
}) {
  const progressPercentage = categoryGroup.totalCount > 0 
    ? Math.round((categoryGroup.completedCount / categoryGroup.totalCount) * 100) 
    : 0;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm overflow-hidden">
      {/* Category Header - Clickable to expand/collapse */}
      <button
        onClick={onToggle}
        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-slate-50 truncate">
              {categoryGroup.categoryTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {t('learning.ofCompleted', { 
                completed: categoryGroup.completedCount, 
                total: categoryGroup.totalCount, 
                percent: progressPercentage 
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
          {/* Progress Circle on Mobile */}
          <div className="relative h-10 w-10 sm:h-12 sm:w-12">
            <svg className="transform -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                className="stroke-indigo-600 dark:stroke-indigo-400"
                strokeWidth="3"
                strokeDasharray={`${progressPercentage * 0.88} 88`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-900 dark:text-slate-50">
              {progressPercentage}%
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          )}
        </div>
      </button>

      {/* Articles List - Shown when expanded */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-800 p-3 sm:p-6 space-y-3 sm:space-y-4">
          {categoryGroup.articles.map((article) => {
            const isAccessible = isArticleAccessible(article, allArticles);
            return (
              <ArticleCard 
                key={article.id} 
                article={article} 
                isAccessible={isAccessible}
                t={t}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// Individual Article Card (Compact version for topic list)
function ArticleCard({ 
  article, 
  isAccessible,
  t
}: { 
  article: ArticleListDto; 
  isAccessible: boolean;
  t: any;
}) {
  const difficultyColor = {
    1: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
    2: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200",
    3: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
  }[article.difficultyLevel] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";

  const difficultyLabel = {
    1: t('learning.beginner'),
    2: t('learning.intermediate'),
    3: t('learning.advanced'),
  }[article.difficultyLevel] || "Unknown";

  const cardClassName = `group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col sm:flex-row gap-4 transition-all ${
    isAccessible 
      ? 'hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer' 
      : 'opacity-60 cursor-not-allowed'
  }`;

  const cardContent = (
    <>
      {/* Cover Image or Placeholder - Hidden on mobile, shown on tablet+ */}
      <div className="hidden sm:block w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
        {article.coverImageUrl ? (
          <img
            src={article.coverImageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/30 dark:to-violet-950/30 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
        )}
      </div>

      {/* Article Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {article.sequenceInCategory}
              </span>
              <h4 className={`font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-50 truncate ${
                isAccessible ? 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400' : ''
              }`}>
                {article.title}
              </h4>
            </div>
            {article.subtitle && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-1 sm:line-clamp-2 mt-1">
                {article.subtitle}
              </p>
            )}
          </div>
          
          {/* Lock/Unlock Status */}
          <div className="flex-shrink-0">
            {isAccessible ? (
              article.quizCompleted ? (
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Unlock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              )
            ) : (
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor}`}>
            {difficultyLabel}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
            <Clock className="w-3 h-3" />
            {article.estimatedReadMinutes} min
          </span>
          {article.hasRead && !article.quizCompleted && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle className="w-3 h-3" />
              Read
            </span>
          )}
          {article.quizCompleted && article.quizScore !== null && (
            <span className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              <GraduationCap className="w-3 h-3" />
              {article.quizScore}%
            </span>
          )}
          {!isAccessible && (
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-300 font-medium">
              <Lock className="w-3 h-3" />
              {t('learning.completePrevious')}
            </span>
          )}
        </div>
      </div>
    </>
  );

  return isAccessible ? (
    <Link to={`/learning/articles/${article.slug}`} className={cardClassName}>
      {cardContent}
    </Link>
  ) : (
    <div className={cardClassName}>
      {cardContent}
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}
