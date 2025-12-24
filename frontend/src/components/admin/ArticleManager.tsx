import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, X } from "lucide-react";
import type { ArticleListDto } from "../../types/learning";
import ArticleForm from "./ArticleForm";

export default function ArticleManager() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<ArticleListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleListDto | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  async function loadArticles() {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<ArticleListDto[]>("/api/learning/articles");
      setArticles(data);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? t('admin.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('admin.confirmDelete'))) {
      return;
    }

    try {
      await api.delete(`/api/admin/learning/articles/${id}`);
      setArticles(articles.filter(a => a.id !== id));
    } catch (e: any) {
      alert(e?.response?.data?.error ?? t('admin.deleteArticleFailed'));
    }
  }

  function handleEdit(article: ArticleListDto) {
    setEditingArticle(article);
    setShowCreateModal(true);
  }

  function handleCreateNew() {
    setEditingArticle(null);
    setShowCreateModal(true);
  }

  function handleModalClose() {
    setShowCreateModal(false);
    setEditingArticle(null);
    loadArticles();
  }

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Header Actions - Mobile First */}
      <div className="mb-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
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
        <button
          onClick={handleCreateNew}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          {t('admin.createArticle')}
        </button>
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

      {/* Articles List - Mobile First */}
      {!loading && !error && (
        <>
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <p className="text-sm">
                {searchQuery ? t('admin.noArticlesMatch') : t('admin.noArticlesYet')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <ArticleForm
          article={editingArticle}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

// Article Card Component - Mobile First
function ArticleCard({
  article,
  onEdit,
  onDelete,
}: {
  article: ArticleListDto;
  onEdit: (article: ArticleListDto) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  
  const categoryLabel = {
    METHOD_OF_LOCI: t('admin.methodOfLoci'),
    STORY_METHOD: t('admin.storyMethod'),
    PEG_SYSTEM: t('admin.pegSystem'),
  }[article.techniqueCategory];

  const difficultyColor = {
    1: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
    2: "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200",
    3: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
    4: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
    5: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200",
  }[article.difficultyLevel] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-4 hover:shadow-md transition-shadow">
      {/* Mobile Layout */}
      <div className="space-y-3">
        {/* Title and Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate">
              {article.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              /{article.slug}
            </p>
          </div>
          <div className="flex-shrink-0">
            {article.isPublished ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                <Eye className="w-3 h-3" />
                {t('admin.published')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium">
                <EyeOff className="w-3 h-3" />
                {t('admin.draft')}
              </span>
            )}
          </div>
        </div>

        {/* Metadata - Wrapping on mobile */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
            {categoryLabel}
          </span>
          <span className={`px-2 py-1 rounded-full font-medium ${difficultyColor}`}>
            {t('admin.level')} {article.difficultyLevel}
          </span>
          <span className="px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium">
            {t('admin.seq')} #{article.sequenceInCategory}
          </span>
          {article.isIntroArticle && (
            <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
              {t('admin.intro')}
            </span>
          )}
          <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {article.estimatedReadMinutes} {t('admin.min')}
          </span>

        </div>

        {/* Actions - Full width on mobile */}
        <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onEdit(article)}
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Edit2 className="w-4 h-4" />
            {t('admin.edit')}
          </button>
          <button
            onClick={() => onDelete(article.id)}
            className="flex-1 px-3 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            {t('admin.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
