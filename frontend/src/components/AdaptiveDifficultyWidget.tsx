import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { DashboardDTO, SkillMasteryDTO } from "../types/adaptive";
import { Brain, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AdaptiveDifficultyWidget() {
  const { t } = useTranslation();
  const [dashboard, setDashboard] = useState<DashboardDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<DashboardDTO>("/api/adaptive/dashboard");
        if (alive) setDashboard(data);
      } catch (e: any) {
        if (alive) setError(e?.response?.data?.error ?? "Failed to load adaptive difficulty data");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const formatSkillName = (skillType: string): string => {
    const names: Record<string, string> = {
      WORD_LINKING: t('exercises.wordLinking'),
      NAMES_FACES: t('exercises.namesFaces'),
      NUMBER_PEG: t('exercises.numberPeg'),
      QUIZ: "Quiz",
    };
    return names[skillType] || skillType;
  };

  const getSkillIcon = (skillType: string): string => {
    const icons: Record<string, string> = {
      WORD_LINKING: "🔗",
      NAMES_FACES: "👤",
      NUMBER_PEG: "🔢",
      QUIZ: "📝",
    };
    return icons[skillType] || "📚";
  };

  const getSkillRoute = (skillType: string): string => {
    const routes: Record<string, string> = {
      WORD_LINKING: "/exercise/word-linking",
      NAMES_FACES: "/exercise/names-faces",
      NUMBER_PEG: "/exercise/number-peg",
    };
    return routes[skillType] || "/";
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-300">
            <Brain className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-50">{t('dashboard.adaptiveLearning')}</h2>
        </div>
        <div className="text-sm text-slate-500">{t('dashboard.loadingMasteryData')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-300">
            <Brain className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-50">{t('dashboard.adaptiveLearning')}</h2>
        </div>
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  if (!dashboard || dashboard.stats.totalSkills === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-300">
            <Brain className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-50">{t('dashboard.adaptiveLearning')}</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t('dashboard.completeExercisesPrompt')}
        </p>
      </div>
    );
  }

  const { stats, skillsDueForReview, skillsNeedingPractice } = dashboard;
  const masteryPercent = Math.round(stats.averageMastery * 100);

  // Filter out QUIZ skills - only show the three main exercises
  const mainExerciseTypes = ['WORD_LINKING', 'NAMES_FACES', 'NUMBER_PEG'];
  const filteredDueForReview = skillsDueForReview.filter(skill => mainExerciseTypes.includes(skill.skillType));
  const filteredNeedingPractice = skillsNeedingPractice.filter(skill => mainExerciseTypes.includes(skill.skillType));

  return (
    <div className="space-y-6">
      {/* Overall Stats Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-300">
            <Brain className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-50">{t('dashboard.adaptiveLearning')}</h2>
        </div>

        {/* Overall Mastery Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('dashboard.overallMastery')}
            </span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-200">
              {masteryPercent}%
            </span>
          </div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {stats.totalSkills}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('dashboard.totalSkills')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.masteredSkills}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('dashboard.mastered')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-200">
              {stats.skillsDueForReview}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('dashboard.dueToday')}</div>
          </div>
        </div>
      </div>

      {/* Skills Due for Review */}
      {filteredDueForReview.length > 0 && (
        <div className="rounded-2xl border border-orange-200 dark:border-orange-800 shadow-sm p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:bg-none dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/70 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-300" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">
              Ready to Review ({filteredDueForReview.length})
            </h3>
          </div>
          <div className="space-y-3">
            {filteredDueForReview.map((skill) => (
              <SkillCard key={skill.id} skill={skill} formatSkillName={formatSkillName} getSkillIcon={getSkillIcon} getSkillRoute={getSkillRoute} type="review" />
            ))}
          </div>
        </div>
      )}

      {/* Skills Needing Practice */}
      {filteredNeedingPractice.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">
              {t('dashboard.needsPractice')} ({filteredNeedingPractice.length})
            </h3>
          </div>
          <div className="space-y-3">
            {filteredNeedingPractice.slice(0, 3).map((skill) => (
              <SkillCard key={skill.id} skill={skill} formatSkillName={formatSkillName} getSkillIcon={getSkillIcon} getSkillRoute={getSkillRoute} type="practice" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type SkillCardProps = {
  skill: SkillMasteryDTO;
  formatSkillName: (skillType: string) => string;
  getSkillIcon: (skillType: string) => string;
  getSkillRoute: (skillType: string) => string;
  type: "review" | "practice";
};

function SkillCard({ skill, formatSkillName, getSkillIcon, getSkillRoute, type }: SkillCardProps) {
  const { t } = useTranslation();
  const masteryPercent = Math.round(skill.probabilityKnown * 100);
  // Ensure minimum visible width for progress bar (at least 10% if there's any progress)
  const displayPercent = masteryPercent > 0 ? Math.max(masteryPercent, 10) : 0;
  const route = getSkillRoute(skill.skillType);

  return (
    <Link
      to={route}
      className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-4 hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="text-2xl">{getSkillIcon(skill.skillType)}</div>
          <div className="flex-1">
            <div className="font-medium text-slate-900 dark:text-slate-50 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {formatSkillName(skill.skillType)}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {masteryPercent}% {t('dashboard.mastered').toLowerCase()}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">•</span>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {skill.totalAttempts} {t('dashboard.attempts')}
              </span>
            </div>
            {/* Mini progress bar */}
            <div className="mt-2 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full transition-all bg-orange-500"
                style={{ width: `${displayPercent}%` }}
              />
            </div>
          </div>
        </div>
        <div className="ml-4">
          {type === "review" ? (
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-200">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">{t('common.review')}</span>
            </div>
          ) : skill.mastered ? (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{t('dashboard.mastered')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-200">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{t('dashboard.practice')}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
