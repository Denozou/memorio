import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { X, Save, Loader2, Plus, Trash2, Check } from "lucide-react";
import type { Question, CreateQuestionRequest, CreateOptionRequest } from "../../types/admin";

interface QuestionFormProps {
  quizId: string;
  question: Question | null;
  onClose: () => void;
}

interface OptionFormData {
  optionText: string;
  isCorrect: boolean;
  displayOrder: number;
  tempId: string; // For tracking before save
}

export default function QuestionForm({ quizId, question, onClose }: QuestionFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateQuestionRequest>({
    questionText: "",
    questionType: "MULTIPLE_CHOICE",
    displayOrder: 0,
    explanation: "",
  });

  const [options, setOptions] = useState<OptionFormData[]>([
    { optionText: "", isCorrect: false, displayOrder: 0, tempId: crypto.randomUUID() },
    { optionText: "", isCorrect: false, displayOrder: 1, tempId: crypto.randomUUID() },
  ]);

  useEffect(() => {
    if (question) {
      setFormData({
        questionText: question.questionText,
        questionType: question.questionType,
        displayOrder: question.displayOrder,
        explanation: question.explanation || "",
      });
      // Note: We'd need to load options from the backend here
      // For now, keep default options
    }
  }, [question]);

  function addOption() {
    setOptions([
      ...options,
      {
        optionText: "",
        isCorrect: false,
        displayOrder: options.length,
        tempId: crypto.randomUUID(),
      },
    ]);
  }

  function removeOption(tempId: string) {
    if (options.length <= 2) {
      alert("You must have at least 2 options");
      return;
    }
    setOptions(options.filter(opt => opt.tempId !== tempId));
  }

  function updateOption(tempId: string, updates: Partial<OptionFormData>) {
    setOptions(options.map(opt => 
      opt.tempId === tempId ? { ...opt, ...updates } : opt
    ));
  }

  function toggleCorrectAnswer(tempId: string) {
    setOptions(options.map(opt => ({
      ...opt,
      isCorrect: opt.tempId === tempId ? !opt.isCorrect : opt.isCorrect,
    })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Validation
    const hasCorrectAnswer = options.some(opt => opt.isCorrect);
    if (!hasCorrectAnswer) {
      setError("Please mark at least one option as correct");
      setSaving(false);
      return;
    }

    const emptyOptions = options.filter(opt => !opt.optionText.trim());
    if (emptyOptions.length > 0) {
      setError("All options must have text");
      setSaving(false);
      return;
    }

    try {
      // Create or update question
      const { data: createdQuestion } = await api.post(
        `/api/admin/learning/quizzes/${quizId}/questions`,
        formData
      );

      // Create options for the question
      for (const option of options) {
        const optionData: CreateOptionRequest = {
          optionText: option.optionText,
          isCorrect: option.isCorrect,
          displayOrder: option.displayOrder,
        };
        await api.post(
          `/api/admin/learning/questions/${createdQuestion.id}/options`,
          optionData
        );
      }

      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.response?.data?.error || "Failed to save question");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="min-h-screen px-4 py-6 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50">
              {question ? "Edit Question" : "Add Question"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            <div className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                  Question <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-y"
                  placeholder="Enter your question"
                />
              </div>

              {/* Two Column Layout */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Question Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.questionType}
                    onChange={(e) => setFormData({ ...formData, questionType: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True/False</option>
                    <option value="FILL_BLANK">Fill in the Blank</option>
                  </select>
                </div>

              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                  Explanation (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-y"
                  placeholder="Explain the correct answer (shown after quiz completion)"
                />
              </div>

              {/* Answer Options */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-50">
                    Answer Options <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addOption}
                    className="px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors text-xs font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Option
                  </button>
                </div>

                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div
                      key={option.tempId}
                      className="flex gap-2 items-start p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                    >
                      {/* Correct Answer Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleCorrectAnswer(option.tempId)}
                        className={`flex-shrink-0 mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          option.isCorrect
                            ? "bg-green-500 border-green-500"
                            : "border-slate-300 dark:border-slate-600 hover:border-green-500"
                        }`}
                        title={option.isCorrect ? "Correct answer" : "Mark as correct"}
                      >
                        {option.isCorrect && <Check className="w-4 h-4 text-white" />}
                      </button>

                      {/* Option Text */}
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          value={option.optionText}
                          onChange={(e) => updateOption(option.tempId, { optionText: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          placeholder={`Option ${index + 1}`}
                        />
                      </div>

                      {/* Remove Button */}
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(option.tempId)}
                          className="flex-shrink-0 p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Remove option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Click the checkbox to mark correct answer(s). At least one option must be correct.
                </p>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-300/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {question ? "Update Question" : "Add Question"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
