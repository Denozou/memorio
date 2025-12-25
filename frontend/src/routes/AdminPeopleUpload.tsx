import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  LogOut, Menu, X, Shield, Brain, Upload, Users, 
  Database, TrendingUp, CheckCircle, AlertCircle, 
  Trash2, RefreshCw, UserPlus, Image as ImageIcon,
  Eye, EyeOff, Target
} from "lucide-react";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../components/ThemeToggle";
import { api } from "../lib/api";

type AdminTab = "upload" | "manage";

interface Person {
  id: string;
  personName: string;
  displayName: string;
  difficultyLevel: number;
  isActive: boolean;
  imageCount: number;
  createdAt: string;
}

interface UploadResult {
  status: string;
  message: string;
  personName: string;
  displayName: string;
  imageCount: number;
  difficultyLevel: number;
}

interface Statistics {
  totalPersons: number;
  totalImages: number;
  activePersons: number;
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
}

const DIFFICULTY_OPTIONS = [
  { value: 1, labelKey: "admin.easy", emoji: "🟢", descKey: "admin.simpleNames" },
  { value: 2, labelKey: "admin.medium", emoji: "🟡", descKey: "admin.moderateComplexity" },
  { value: 3, labelKey: "admin.hard", emoji: "🔴", descKey: "admin.challengingNames" },
];

export default function AdminPeopleUpload() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("upload");
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  async function loadStatistics() {
    try {
      setStatsLoading(true);
      const { data } = await api.get<Statistics>("/api/admin/faces/status");
      setStatistics(data);
    } catch (e) {
      console.error("Failed to load statistics", e);
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
              <Link to="/admin/words" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                {t('admin.wordAdmin')}
              </Link>
              <Link to="/admin/people" className="text-sm text-slate-900 dark:text-slate-50 font-medium flex items-center gap-1">
                <Shield className="w-4 h-4" />
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
                <Link to="/admin/words" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  {t('admin.wordAdmin')}
                </Link>
                <Link to="/admin/people" className="py-2 text-slate-900 dark:text-slate-50 font-medium flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <Shield className="w-4 h-4" />
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
            <Users className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-indigo-600 dark:text-indigo-400" />
            {t('admin.peopleDatabaseManager')}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
            {t('admin.peopleDatabaseDesc')}
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 sm:mb-8">
            <StatCard
              icon={<Users className="w-5 h-5 text-white" />}
              label={t('admin.totalPeople')}
              value={statistics.totalPersons.toString()}
              color="indigo"
              loading={statsLoading}
            />
            <StatCard
              icon={<ImageIcon className="w-5 h-5 text-white" />}
              label={t('admin.totalImages')}
              value={statistics.totalImages.toLocaleString()}
              color="emerald"
              loading={statsLoading}
            />
            <StatCard
              icon={<Eye className="w-5 h-5 text-white" />}
              label={t('admin.active')}
              value={statistics.activePersons.toString()}
              color="violet"
              loading={statsLoading}
            />
            <StatCard
              icon={<Target className="w-5 h-5 text-white" />}
              label={t('admin.easy')}
              value={statistics.difficultyBreakdown.easy.toString()}
              color="green"
              loading={statsLoading}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              label={t('admin.avgImages')}
              value={statistics.totalPersons > 0 ? Math.round(statistics.totalImages / statistics.totalPersons).toString() : "0"}
              color="amber"
              loading={statsLoading}
            />
          </div>
        )}

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
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{t('admin.uploadPerson')}</span>
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
                <span>{t('admin.managePeople')}</span>
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm p-4 sm:p-6 lg:p-8">
          {activeTab === "upload" && <UploadPanel onUploadSuccess={loadStatistics} />}
          {activeTab === "manage" && <ManagePanel onRefresh={loadStatistics} />}
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
    green: "bg-green-600",
  }[color] || "bg-slate-500";

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${bgClasses} shadow-sm flex items-center justify-center`}>
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
  const [displayName, setDisplayName] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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

    if (e.dataTransfer.files) {
      handleFilesSelect(Array.from(e.dataTransfer.files));
    }
  }

  function handleFilesSelect(selectedFiles: File[]) {
    setError(null);
    setResult(null);

    const imageFiles = selectedFiles.filter(file => file.type.startsWith("image/"));
    
    if (imageFiles.length === 0) {
      setError(t('admin.pleaseSelectImageFiles'));
      return;
    }

    if (imageFiles.length > 10) {
      setError(t('admin.maxTenImages'));
      return;
    }

    for (const file of imageFiles) {
      if (file.size > 10 * 1024 * 1024) {
        setError(t('admin.eachImageLessThan10MB'));
        return;
      }
    }

    setImages(imageFiles);

    const previews = imageFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (!displayName.trim()) {
      setError(t('admin.pleaseEnterDisplayName'));
      return;
    }

    if (images.length === 0) {
      setError(t('admin.pleaseSelectOneImage'));
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("displayName", displayName.trim());
      formData.append("difficultyLevel", difficultyLevel.toString());
      
      images.forEach((image) => {
        formData.append("images", image);
      });

      const { data } = await api.post<UploadResult>(
        "/api/admin/faces/person",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResult(data);
      setDisplayName("");
      setImages([]);
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setImagePreviews([]);
      setDifficultyLevel(1);
      onUploadSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || t('admin.failedToUploadPerson'));
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const selectedDifficulty = DIFFICULTY_OPTIONS.find(d => d.value === difficultyLevel);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 sm:p-5">
        <div className="flex gap-3">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm sm:text-base">{t('admin.uploadInstructions')}</h3>
            <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li>{t('admin.uploadInstructionsPeople')}</li>
              <li>{t('admin.imageFormats')}</li>
              <li>{t('admin.firstImagePrimary')}</li>
              <li>{t('admin.enterPersonName')}</li>
              <li>{t('admin.selectDifficultyLevel')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Person Name Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t('admin.personFullName')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t('admin.egJohnSmith')}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
        />
      </div>

      {/* Difficulty Level Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          {t('admin.difficultyLevel')} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DIFFICULTY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDifficultyLevel(option.value)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                difficultyLevel === option.value
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{option.emoji}</span>
                <span className="font-semibold text-slate-900 dark:text-slate-50">{t(option.labelKey)}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">{t(option.descKey)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Image Upload Area */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t('admin.faceImages')} <span className="text-red-500">*</span> <span className="text-slate-500 font-normal">{t('admin.oneToTenImages')}</span>
        </label>
        
        {images.length === 0 ? (
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
            onClick={() => document.getElementById("images-input")?.click()}
          >
            <input
              id="images-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handleFilesSelect(Array.from(e.target.files))}
              className="hidden"
            />
            <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
            <p className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('admin.dropImagesHere')}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {t('admin.imageFormatsShort')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Previews */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {index === 0 && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-indigo-600 text-white text-xs font-bold">
                      {t('admin.primary')}
                    </div>
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-center mt-1 text-slate-600 dark:text-slate-400">
                    {(images[index].size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ))}
              
              {/* Add More Button */}
              {images.length < 10 && (
                <div
                  className="aspect-square rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  onClick={() => document.getElementById("images-input")?.click()}
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">{t('admin.addMore')}</p>
                  </div>
                </div>
              )}
            </div>
            
            <input
              id="images-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  const newFiles = Array.from(e.target.files);
                  const totalFiles = [...images, ...newFiles].slice(0, 10);
                  handleFilesSelect(totalFiles);
                }
              }}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <span className="font-medium text-slate-700 dark:text-slate-300">{t('admin.readyToUpload')}</span>
          <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 text-xs">
            {selectedDifficulty?.emoji} {selectedDifficulty ? t(selectedDifficulty.labelKey) : ''} • {images.length} {images.length === 1 ? t('admin.image') : t('admin.images')}
          </span>
        </div>
        <button
          onClick={handleUpload}
          disabled={!displayName.trim() || images.length === 0 || uploading}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {uploading ? (
            <>
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              {t('admin.uploading')}
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              {t('admin.uploadPerson')}
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
                {result.displayName} {t('admin.personAddedToDatabase')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <ResultStat label={t('admin.personName')} value={result.displayName} color="blue" />
            <ResultStat label={t('admin.imagesUploaded')} value={result.imageCount.toString()} color="green" />
            <ResultStat label={t('admin.difficulty')} value={DIFFICULTY_OPTIONS.find(d => d.value === result.difficultyLevel) ? t(DIFFICULTY_OPTIONS.find(d => d.value === result.difficultyLevel)!.labelKey) : ""} color="amber" />
          </div>
        </div>
      )}
    </div>
  );
}

function ResultStat({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800",
    green: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800",
  }[color];

  return (
    <div className={`rounded-lg border p-3 sm:p-4 ${colorClasses}`}>
      <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
      <p className="text-base sm:text-lg font-bold truncate">{value}</p>
    </div>
  );
}

function ManagePanel({ onRefresh }: { onRefresh: () => void }) {
  const { t } = useTranslation();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadPeople();
  }, []);

  async function loadPeople() {
    try {
      setLoading(true);
      const { data } = await api.get<Person[]>("/api/admin/faces/people");
      setPeople(data);
    } catch (e) {
      console.error("Failed to load people", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(personName: string, displayName: string) {
    if (!confirm(t('admin.confirmDeletePerson', { name: displayName }))) {
      return;
    }

    try {
      setDeleting(personName);
      await api.delete(`/api/admin/faces/person/${personName}`);
      await loadPeople();
      await onRefresh();
    } catch (e) {
      console.error("Failed to delete person", e);
      alert(t('admin.failedToDeletePerson'));
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleActive(person: Person) {
    try {
      const endpoint = person.isActive ? "deactivate" : "activate";
      await api.put(`/api/admin/faces/person/${person.personName}/${endpoint}`);
      await loadPeople();
      await onRefresh();
    } catch (e) {
      console.error("Failed to toggle person status", e);
    }
  }

  const sortedPeople = [...people].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getDifficultyBadge = (level: number) => {
    const config = DIFFICULTY_OPTIONS.find(d => d.value === level);
    return config ? `${config.emoji} ${t(config.labelKey)}` : `${t('admin.level')} ${level}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50">{t('admin.peopleDatabase')}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {people.length} {people.length === 1 ? t('admin.personInDatabase') : t('admin.peopleInDatabase')}
          </p>
        </div>
        <button
          onClick={() => { loadPeople(); onRefresh(); }}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {t('admin.refresh')}
        </button>
      </div>

      {/* People List */}
      {loading && people.length === 0 ? (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-slate-400 animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">{t('admin.loadingPeople')}</p>
        </div>
      ) : people.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-sm sm:text-base">{t('admin.noPeopleYet')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedPeople.map((person) => (
            <div
              key={person.id}
              className={`rounded-xl border bg-white dark:bg-slate-900 p-4 sm:p-5 hover:shadow-md transition-all ${
                person.isActive 
                  ? "border-slate-200 dark:border-slate-800" 
                  : "border-slate-300 dark:border-slate-700 opacity-60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-base sm:text-lg truncate">
                      {person.displayName}
                    </h3>
                    {!person.isActive && (
                      <span className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> {t('admin.inactive')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" />
                      {person.imageCount} {person.imageCount === 1 ? t('admin.image') : t('admin.images')}
                    </span>
                    <span>•</span>
                    <span>{getDifficultyBadge(person.difficultyLevel)}</span>
                    <span>•</span>
                    <span className="text-slate-500 dark:text-slate-500">
                      {t('admin.added')} {new Date(person.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(person)}
                    className={`px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                      person.isActive
                        ? "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        : "border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                    }`}
                  >
                    {person.isActive ? (
                      <span className="flex items-center gap-1">
                        <EyeOff className="w-4 h-4" /> {t('admin.deactivate')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" /> {t('admin.activate')}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(person.personName, person.displayName)}
                    disabled={deleting === person.personName}
                    className="px-3 py-2 rounded-lg border border-red-300 dark:border-red-500 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-1 text-xs sm:text-sm font-medium disabled:opacity-50"
                  >
                    {deleting === person.personName ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{t('admin.delete')}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
