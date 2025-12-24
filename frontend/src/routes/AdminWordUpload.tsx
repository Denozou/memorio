import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LogOut, Menu, X, Shield, Brain, Upload, BookMarked, 
  Database, TrendingUp, CheckCircle, AlertCircle, 
  Download, Trash2, RefreshCw, Languages, BookOpen
} from "lucide-react";
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

const PARTS_OF_SPEECH = [
  { value: "NOUN", label: "Noun", emoji: "📦" },
  { value: "VERB", label: "Verb", emoji: "⚡" },
  { value: "ADJ", label: "Adjective", emoji: "🎨" },
  { value: "ADV", label: "Adverb", emoji: "🔄" },
  { value: "PRON", label: "Pronoun", emoji: "👤" },
  { value: "PREP", label: "Preposition", emoji: "➡️" },
  { value: "CONJ", label: "Conjunction", emoji: "🔗" },
  { value: "INTERJ", label: "Interjection", emoji: "❗" },
  { value: "OTHER", label: "Other", emoji: "📝" },
];

const LANGUAGE_OPTIONS = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
];

export default function AdminWordUpload() {
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
                Dashboard
              </Link>
              <Link to="/learning" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                Learning
              </Link>
              <Link to="/admin/learning" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                Learning Admin
              </Link>
              <Link to="/admin/words" className="text-sm text-slate-900 dark:text-slate-50 font-medium flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Word Admin
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
                <Link to="/learning" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  Learning
                </Link>
                <Link to="/admin/learning" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  Learning Admin
                </Link>
                <Link to="/admin/words" className="py-2 text-slate-900 dark:text-slate-50 font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <Shield className="w-4 h-4" />
                  Word Admin
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
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Title */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2 sm:gap-3">
            <Database className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-indigo-600 dark:text-indigo-400" />
            Word Database Manager
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Upload and manage words for the Word Linking exercise
          </p>
        </div>

        {/* Statistics Cards - Mobile First */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <StatCard
            icon={<Languages size={20} color="#ffffff" strokeWidth={2} style={{ stroke: '#ffffff', fill: 'none' }} />}
            label="Languages"
            value={languageStats.length.toString()}
            color="indigo"
            loading={statsLoading}
          />
          <StatCard
            icon={<BookMarked size={20} color="#ffffff" strokeWidth={2} style={{ stroke: '#ffffff', fill: 'none' }} />}
            label="Total Words"
            value={languageStats.reduce((sum, lang) => sum + lang.count, 0).toLocaleString()}
            color="emerald"
            loading={statsLoading}
          />
          <StatCard
            icon={<TrendingUp size={20} color="#ffffff" strokeWidth={2} style={{ stroke: '#ffffff', fill: 'none' }} />}
            label="Largest Database"
            value={languageStats.length > 0 ? languageStats.reduce((max, lang) => lang.count > max.count ? lang : max, languageStats[0]).code.toUpperCase() : "-"}
            color="violet"
            loading={statsLoading}
          />
          <StatCard
            icon={<Database size={20} color="#ffffff" strokeWidth={2} style={{ stroke: '#ffffff', fill: 'none' }} />}
            label="Average per Lang"
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
                <span>Upload Words</span>
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
                <span>Manage Database</span>
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
      setError("Please select a .txt file");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setFile(selectedFile);
  }

  async function handleUpload() {
    if (!file) {
      setError("Please select a file");
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
      setError(e?.response?.data?.error || e?.message || "Failed to upload words");
    } finally {
      setUploading(false);
    }
  }

  const selectedLangObj = LANGUAGE_OPTIONS.find(l => l.code === selectedLanguage);
  const selectedPosObj = PARTS_OF_SPEECH.find(p => p.value === selectedPos);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 sm:p-5">
        <div className="flex gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm sm:text-base">Upload Instructions</h3>
            <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>File must be a plain <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded">.txt</code> file</li>
              <li>One word per line (duplicates will be skipped)</li>
              <li>Maximum file size: 10MB, Maximum lines: 100,000</li>
              <li>Words are case-insensitive and automatically deduplicated</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Language Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Language
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
            Part of Speech
          </label>
          <select
            value={selectedPos}
            onChange={(e) => setSelectedPos(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
          >
            {PARTS_OF_SPEECH.map((pos) => (
              <option key={pos.value} value={pos.value}>
                {pos.emoji} {pos.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* File Upload Area */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Word List File
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
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300">
                Drop your .txt file here or click to browse
              </p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Maximum file size: 10MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Ready to upload:</span>
          <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 font-mono text-xs">
            {selectedLangObj?.flag} {selectedLangObj?.name} · {selectedPosObj?.emoji} {selectedPosObj?.label}
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
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              Upload Words
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">Upload Failed</p>
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
                Upload Successful!
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-200 mt-1">
                Words have been added to the database
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4">
            <ResultStat label="Total Lines" value={result.totalLines} color="blue" />
            <ResultStat label="Inserted" value={result.inserted} color="green" />
            <ResultStat label="Skipped" value={result.skipped} color="amber" />
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
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50">Database Overview</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Current word counts by language
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Language List */}
      {sortedStats.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-sm sm:text-base">No words in database yet. Start by uploading your first word list!</p>
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
                      {percentage}% of total
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
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2 text-sm sm:text-base">Word List Sources</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              You can obtain word lists from frequency dictionaries, language corpora, or create custom lists. 
              Ensure words are properly formatted (one per line) and encoded in UTF-8.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
