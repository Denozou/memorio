import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LogOut, Menu, X, Shield, Brain, Upload, BookMarked, 
  Database, TrendingUp, CheckCircle, AlertCircle, 
  Download, Trash2, RefreshCw, Languages, BookOpen
} from "lucide-react";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../components/ThemeToggle";
import { api } from "../lib/api";

type AdminTab = "upload" | "manage";

interface LanguageStats {
  code: string;
  count: number;
}

interface UploadResult {
  status: string;
  language: string;
  pos: string;
  totalLines: number;
  inserted: number;
  skipped: number;
}

// Only nouns are suitable for the Word Linking memory exercise
const POS_OPTIONS = [
  { value: "NOUN", labelKey: "admin.noun", emoji: "📦" },
];

// Only include languages with full UI translation support
// When adding new UI translations, add them here
const LANGUAGE_OPTIONS = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
];

export default function AdminWordUpload() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("upload");
  const [languageStats, setLanguageStats] = useState<LanguageStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadLanguageStats();
  }, []);

  async function loadLanguageStats() {
    try {
      setStatsLoading(true);
      const { data } = await api.get<LanguageStats[]>("/lexicon/languages");
      setLanguageStats(data);
    } catch (e) {
      console.error("Failed to load language stats", e);
    } finally {
      setStatsLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">Memorio</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                {t('common.dashboard')}
              </Link>
              <Link to="/learning" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                {t('common.learning')}
              </Link>
              <Link to="/admin/learning" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                {t('admin.learningAdmin')}
              </Link>
              <Link to="/admin/words" className="text-sm text-slate-900 dark:text-slate-50 font-medium flex items-center gap-1">
                <Shield className="w-4 h-4" />
                {t('admin.wordAdmin')}
              </Link>
              <Link to="/admin/people" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                {t('admin.peopleAdmin')}
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
                className="p-2 rounded-lg border border-slate-300/70 dark:border-slate-700 text-slate-700 dark:text-slate-300"
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
                <Link to="/learning" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.learning')}
                </Link>
                <Link to="/admin/learning" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  {t('admin.learningAdmin')}
                </Link>
                <Link to="/admin/words" className="py-2 text-slate-900 dark:text-slate-50 font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <Shield className="w-4 h-4" />
                  {t('admin.wordAdmin')}
                </Link>
                <Link to="/admin/people" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  {t('admin.peopleAdmin')}
                </Link>
                <Link to="/profile" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.profile')}
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="py-2 text-left text-slate-600 dark:text-slate-300 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  {t('common.logout')}
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2 sm:gap-3">
            <Database className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-indigo-600 dark:text-indigo-400" />
            {t('admin.wordDatabaseManager')}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
            {t('admin.wordDatabaseDesc')}
          </p>
        </div>

        {/* Statistics Cards - Mobile First */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <StatCard
            icon={<Languages size={20} color="#ffffff" strokeWidth={2} style={{ stroke: '#ffffff', fill: 'none' }} />}
            label={t('admin.languages')}
            value={languageStats.length.toString()}
            color="indigo"
            loading={statsLoading}
          />
          <StatCard
            icon={<BookMarked size={20} color="#ffffff" strokeWidth={2} style={{ stroke: '#ffffff', fill: 'none' }} />}
            label={t('admin.totalWords')}
            value={languageStats.reduce((sum, lang) => sum + lang.count, 0).toLocaleString()}
            color="emerald"
            loading={statsLoading}
          />
          <StatCard
            icon={<TrendingUp size={20} color="#ffffff" strokeWidth={2} style={{ stroke: '#ffffff', fill: 'none' }} />}
            label={t('admin.largestDatabase')}
            value={languageStats.length > 0 ? languageStats.reduce((max, lang) => lang.count > max.count ? lang : max, languageStats[0]).code.toUpperCase() : "-"}
            color="violet"
            loading={statsLoading}
          />
          <StatCard
            icon={<Database size={20} color="#ffffff" strokeWidth={2} style={{ stroke: '#ffffff', fill: 'none' }} />}
            label={t('admin.averagePerLang')}
            value={languageStats.length > 0 ? Math.round(languageStats.reduce((sum, lang) => sum + lang.count, 0) / languageStats.length).toLocaleString() : "0"}
            color="amber"
            loading={statsLoading}
          />
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex-shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all ${
                activeTab === "upload"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t('admin.uploadWords')}</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("manage")}
              className={`flex-shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all ${
                activeTab === "manage"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t('admin.manageDatabase')}</span>
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-4 sm:p-6 lg:p-8">
          {activeTab === "upload" && <UploadPanel onUploadSuccess={loadLanguageStats} />}
          {activeTab === "manage" && <ManagePanel languageStats={languageStats} onRefresh={loadLanguageStats} />}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color, loading }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: string;
  loading?: boolean;
}) {
  const bgClasses = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-700",
    violet: "bg-violet-500",
    amber: "bg-amber-600",
  }[color];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${bgClasses} shadow-sm flex items-center justify-center stat-icon-white`}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        {loading ? (
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">{value}</p>
        )}
      </div>
    </div>
  );
}

function UploadPanel({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedPos, setSelectedPos] = useState("NOUN");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  function handleFileSelect(selectedFile: File) {
    setError(null);
    setResult(null);

    if (!selectedFile.name.endsWith(".txt")) {
      setError(t('admin.pleaseSelectTxtFile'));
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError(t('admin.fileSizeTooLarge'));
      return;
    }

    setFile(selectedFile);
  }

  async function handleUpload() {
    if (!file) {
      setError(t('admin.pleaseSelectFile'));
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("lang", selectedLanguage);
      formData.append("pos", selectedPos);

      const { data } = await api.post<UploadResult>(
        "/admin/lexicon/import/plain",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(data);
      setFile(null);
      onUploadSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || t('admin.failedToUploadWords'));
    } finally {
      setUploading(false);
    }
  }

  const selectedLangObj = LANGUAGE_OPTIONS.find(l => l.code === selectedLanguage);
  const selectedPosObj = POS_OPTIONS.find(p => p.value === selectedPos);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 sm:p-5">
        <div className="flex gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm sm:text-base">{t('admin.uploadInstructions')}</h3>
            <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>{t('admin.fileMustBeTxt')}</li>
              <li>{t('admin.oneWordPerLine')}</li>
              <li>{t('admin.maxFileSize')}</li>
              <li>{t('admin.wordsAutoDeduplicated')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Language Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('admin.language')}
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Part of Speech Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('admin.partOfSpeech')}
          </label>
          <select
            value={selectedPos}
            onChange={(e) => setSelectedPos(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
          >
            {POS_OPTIONS.map((pos) => (
              <option key={pos.value} value={pos.value}>
                {pos.emoji} {t(pos.labelKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* File Upload Area */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t('admin.wordListFile')}
        </label>
        <div
          className={`relative rounded-xl border-2 border-dashed transition-all ${
            dragActive
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
          } p-8 sm:p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".txt"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <Upload className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
          {file ? (
            <div className="space-y-2">
              <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-50 flex items-center justify-center gap-2">
                <BookMarked className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                {file.name}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="text-xs sm:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
              >
                {t('admin.removeFile')}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300">
                {t('admin.dropFileHere')}
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {t('admin.maxFileSizeShort')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">{t('admin.readyToUpload')}</span>
          <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 font-mono text-xs">
            {selectedLangObj?.flag} {selectedLangObj?.name} · {selectedPosObj?.emoji} {selectedPosObj ? t(selectedPosObj.labelKey) : ''}
          </span>
        </div>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {uploading ? (
            <>
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              {t('admin.uploading')}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              {t('admin.uploadWords')}
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">{t('admin.uploadFailed')}</p>
            <p className="text-sm text-red-700 dark:text-red-200 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success Display */}
      {result && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-base sm:text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                {t('admin.uploadSuccessful')}
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-200 mt-1">
                {t('admin.wordsAddedToDatabase')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
            <ResultStat label={t('admin.totalLines')} value={result.totalLines} color="blue" />
            <ResultStat label={t('admin.inserted')} value={result.inserted} color="green" />
            <ResultStat label={t('admin.skipped')} value={result.skipped} color="amber" />
          </div>
        </div>
      )}
    </div>
  );
}

function ResultStat({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800",
    green: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800",
  }[color];

  return (
    <div className={`rounded-lg border p-3 sm:p-4 ${colorClasses}`}>
      <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}

function ManagePanel({ languageStats, onRefresh }: { languageStats: LanguageStats[]; onRefresh: () => void }) {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }

  const sortedStats = [...languageStats].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50">{t('admin.databaseOverview')}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t('admin.currentWordCounts')}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {t('admin.refresh')}
        </button>
      </div>

      {/* Language List */}
      {sortedStats.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-sm sm:text-base">{t('admin.noWordsYet')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedStats.map((lang, index) => {
            const langInfo = LANGUAGE_OPTIONS.find(l => l.code === lang.code);
            const percentage = Math.round((lang.count / sortedStats.reduce((sum, l) => sum + l.count, 0)) * 100);
            
            return (
              <div
                key={lang.code}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white font-bold text-sm sm:text-base shadow-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm sm:text-base">
                        {langInfo?.flag || "🌐"} {langInfo?.name || lang.code.toUpperCase()}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {lang.code}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50">
                      {lang.count.toLocaleString()}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {percentage}% {t('admin.ofTotal')}
                    </p>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Download Instructions */}
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 sm:p-5">
        <div className="flex gap-3">
          <Download className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2 text-sm sm:text-base">{t('admin.wordListSources')}</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {t('admin.wordListSourcesDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
