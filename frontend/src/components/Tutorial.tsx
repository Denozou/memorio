import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Brain, Link, User, Hash, CheckCircle, BookOpen } from "lucide-react";
import { api } from "../lib/api";
import { useTranslation } from "react-i18next";

interface TutorialProps {
  onComplete: () => void;
}

export default function Tutorial({ onComplete }: TutorialProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const steps = [
    {
      title: t('tutorial.welcome.title', 'Welcome to Memorio!'),
      icon: Brain,
      content: t('tutorial.welcome.content', 'Your journey to mastering memory techniques starts here. This quick tour will help you understand how to use the platform and get the most out of your practice.'),
      color: "purple"
    },
    {
      title: t('tutorial.wordLinking.title', 'Word Linking'),
      icon: Link,
      content: t('tutorial.wordLinking.content', 'Create vivid mental associations between words to remember them. You\'ll study a list of words, then recall them by building a chain of connections. The more creative and bizarre your associations, the better!'),
      steps: [
        t('tutorial.wordLinking.step1', 'Study phase: Read and visualize connections between words'),
        t('tutorial.wordLinking.step2', 'Recall phase: Enter the words in any order you remember'),
        t('tutorial.wordLinking.step3', 'Get feedback on your accuracy and see what you missed')
      ],
      color: "blue"
    },
    {
      title: t('tutorial.namesFaces.title', 'Names & Faces'),
      icon: User,
      content: t('tutorial.namesFaces.content', 'Master the art of remembering names by associating faces with memorable features. Study faces paired with names, then test your recall by matching them correctly.'),
      steps: [
        t('tutorial.namesFaces.step1', 'Study phase: Look at each face and associate it with the name'),
        t('tutorial.namesFaces.step2', 'Recall phase: Type the correct name for each face shown'),
        t('tutorial.namesFaces.step3', 'Learn which associations worked and which need practice')
      ],
      color: "green"
    },
    {
      title: t('tutorial.numberPeg.title', 'Number Peg System'),
      icon: Hash,
      content: t('tutorial.numberPeg.content', 'Use the peg system to memorize numbers by converting them into memorable images. Each digit (0-9) has a corresponding word or image. Create stories linking these images to remember sequences.'),
      steps: [
        t('tutorial.numberPeg.step1', 'Study phase: See digits paired with their peg words'),
        t('tutorial.numberPeg.step2', 'Create a mental story connecting all the peg images'),
        t('tutorial.numberPeg.step3', 'Recall phase: Enter the digit sequence you remember')
      ],
      color: "amber"
    },
    {
      title: t('tutorial.learningHub.title', 'Learning Hub'),
      icon: BookOpen,
      content: t('tutorial.learningHub.content', 'Expand your knowledge with curated articles and interactive quizzes. The Learning Hub provides in-depth guides on memory techniques, study strategies, and cognitive science.'),
      steps: [
        t('tutorial.learningHub.step1', 'Browse articles organized by categories and topics'),
        t('tutorial.learningHub.step2', 'Read comprehensive guides on memory techniques'),
        t('tutorial.learningHub.step3', 'Test your knowledge with interactive quizzes')
      ],
      color: "teal"
    },
    {
      title: t('tutorial.adaptiveLearning.title', 'Adaptive Learning'),
      icon: Brain,
      content: t('tutorial.adaptiveLearning.content', 'The platform adapts to your skill level automatically. As you improve, exercises become more challenging. Your mastery is tracked using a smart algorithm that knows when you need to review.'),
      steps: [
        t('tutorial.adaptiveLearning.step1', 'Start at your current level and progress naturally'),
        t('tutorial.adaptiveLearning.step2', 'Review skills when they\'re about to be forgotten'),
        t('tutorial.adaptiveLearning.step3', 'Track your progress with detailed analytics')
      ],
      color: "indigo"
    }
  ];

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsClosing(true);
    try {
      await api.post("/users/complete-tutorial");
    } catch (error) {
      console.error("Failed to mark tutorial as completed:", error);
    }
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; headerGradient: string; buttonGradient: string }> = {
      purple: {
        bg: "bg-purple-100 dark:bg-purple-600",
        text: "text-purple-700 dark:text-white",
        border: "border-purple-200 dark:border-purple-800",
        headerGradient: "linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #6366f1 100%)",
        buttonGradient: "linear-gradient(to right, #a855f7, #6366f1)"
      },
      blue: {
        bg: "bg-blue-100 dark:bg-blue-600",
        text: "text-blue-700 dark:text-white",
        border: "border-blue-200 dark:border-blue-800",
        headerGradient: "linear-gradient(135deg, #3b82f6 0%, #0ea5e9 50%, #06b6d4 100%)",
        buttonGradient: "linear-gradient(to right, #3b82f6, #06b6d4)"
      },
      green: {
        bg: "bg-green-100 dark:bg-green-600",
        text: "text-green-700 dark:text-white",
        border: "border-green-200 dark:border-green-800",
        headerGradient: "linear-gradient(135deg, #22c55e 0%, #10b981 50%, #14b8a6 100%)",
        buttonGradient: "linear-gradient(to right, #22c55e, #14b8a6)"
      },
      amber: {
        bg: "bg-amber-100 dark:bg-amber-600",
        text: "text-amber-700 dark:text-white",
        border: "border-amber-200 dark:border-amber-800",
        headerGradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)",
        buttonGradient: "linear-gradient(to right, #f59e0b, #ef4444)"
      },
      teal: {
        bg: "bg-teal-100 dark:bg-teal-600",
        text: "text-teal-700 dark:text-white",
        border: "border-teal-200 dark:border-teal-800",
        headerGradient: "linear-gradient(135deg, #14b8a6 0%, #06b6d4 50%, #0ea5e9 100%)",
        buttonGradient: "linear-gradient(to right, #14b8a6, #0ea5e9)"
      },
      indigo: {
        bg: "bg-indigo-100 dark:bg-indigo-600",
        text: "text-indigo-700 dark:text-white",
        border: "border-indigo-200 dark:border-indigo-800",
        headerGradient: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
        buttonGradient: "linear-gradient(to right, #6366f1, #a855f7)"
      }
    };
    return colors[color] || colors.purple;
  };

  const colors = getColorClasses(currentStepData.color);
  const Icon = currentStepData.icon;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ${isClosing ? 'scale-95' : 'scale-100'}`}>
        
        {/* Header */}
        <div className="relative p-6 sm:p-8" style={{ background: colors.headerGradient }}>
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            aria-label="Close tutorial"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className={`h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {currentStepData.title}
              </h2>
              <p className="text-sm text-white/80 mt-1">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%`, background: colors.buttonGradient }}
          />
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[50vh]">
          <p className="text-slate-700 dark:text-slate-300 text-base sm:text-lg leading-relaxed mb-6">
            {currentStepData.content}
          </p>

          {currentStepData.steps && (
            <div className="space-y-3">
              {currentStepData.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`mt-0.5 h-6 w-6 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-xs font-bold ${colors.text}`}>{index + 1}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                isFirstStep
                  ? 'opacity-0 pointer-events-none'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t('common.previous', 'Previous')}</span>
              </div>
            </button>

            {/* Step Indicators */}
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8'
                      : index < currentStep
                      ? 'w-2 bg-green-500'
                      : 'w-2 bg-slate-300 dark:bg-slate-600'
                  }`}
                  style={index === currentStep ? { background: colors.buttonGradient } : undefined}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-4 py-1.5 sm:px-6 sm:py-2 rounded-xl font-medium text-white text-sm sm:text-base hover:opacity-90 transition-opacity shadow-md"
              style={{ background: colors.buttonGradient }}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                {isLastStep ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{t('tutorial.getStarted', 'Get Started')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('common.next', 'Next')}</span>
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
