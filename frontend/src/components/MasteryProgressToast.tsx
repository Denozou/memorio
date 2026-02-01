import { useEffect, useState } from "react";
import { TrendingUp, CheckCircle, Target } from "lucide-react";
import { useTranslation } from "react-i18next";

type MasteryProgressToastProps = {
  skillType: string;
  oldMastery: number;
  newMastery: number;
  show: boolean;
  onClose: () => void;
};

export default function MasteryProgressToast({
  skillType,
  oldMastery,
  newMastery,
  show,
  onClose,
}: MasteryProgressToastProps) {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show && !visible) return null;

  const oldPercent = Math.round(oldMastery * 100);
  const newPercent = Math.round(newMastery * 100);
  const improvement = newPercent - oldPercent;
  const isMastered = newMastery >= 0.95;

  const formatSkillName = (type: string): string => {
    const keyMap: Record<string, string> = {
      WORD_LINKING: 'exercises.wordLinking',
      NAMES_FACES: 'exercises.namesFaces',
      NUMBER_PEG: 'exercises.numberPeg',
      QUIZ: 'learning.quiz',
    };
    return t(keyMap[type] || type);
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              isMastered
                ? "bg-green-100 dark:bg-green-900/30"
                : "bg-purple-100 dark:bg-purple-900/30"
            }`}
          >
            {isMastered ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-900 dark:text-slate-50 mb-1">
              {isMastered ? t('dashboard.skillMastered') : t('dashboard.progressUpdate')}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              <span className="font-medium">{formatSkillName(skillType)}</span>
              {isMastered ? (
                <span> {t('dashboard.skillMastered').replace('🎉 ', '').toLowerCase()} 🚀</span>
              ) : (
                <>
                  {" "}
                  +{" "}
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {improvement}%
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isMastered
                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                      : "bg-gradient-to-r from-purple-500 to-indigo-500"
                  }`}
                  style={{ width: `${newPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {newPercent}%
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
