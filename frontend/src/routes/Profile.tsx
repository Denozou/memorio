import { useEffect, useState, useMemo } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, Edit2, XCircle, Check, Shield, User, Mail, Globe, Calendar, TrendingUp, Zap, Target, Lock, CheckCircle2, AlertCircle, Sparkles, Brain, Lightbulb, Download, Trash2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";
import ReviewNotificationBadge from "../components/ReviewNotificationBadge";
import { useTutorial } from "../contexts/TutorialContext";

// Types
interface LinkedProvider {
  provider: string;
  providerUserId: string;
  connectedAt: string;
}

interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  pictureUrl: string | null;
  role: string;
  skillLevel: number;
  preferredLanguage: string | null;
  createdAt: string;
  linkedProviders: LinkedProvider[];
  twoFactorEnabled: boolean;
}

interface UpdateProfileRequest {
  displayName?: string;
  email?: string;
  pictureUrl?: string;
  preferredLanguage?: string;
}

const LANG_LABELS: Record<string, string> = {
  en: "English",
  pl: "Polski",
  //додати більше, як додам інші мови
};

const PROVIDER_ICONS: Record<string, string> = {
  google: "",
  facebook: "",

  
};

const PROVIDER_NAMES: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
};

export default function Profile() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { showTutorial } = useTutorial();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<UpdateProfileRequest>({});

  // GDPR state
  const [exportingData, setExportingData] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get<UserProfile>("/users/profile");
      setProfile(response.data);
      setFormData({
        displayName: response.data.displayName || "",
        email: response.data.email,
        pictureUrl: response.data.pictureUrl || "",
        preferredLanguage: response.data.preferredLanguage || "en"
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await api.put<UserProfile>("/users/profile", formData);
      setProfile(response.data);
      setEditing(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || "",
        email: profile.email,
        pictureUrl: profile.pictureUrl || "",
        preferredLanguage: profile.preferredLanguage || "en"
      });
    }
    setEditing(false);
    setError(null);
  };

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
      nav("/login");
    } catch (e) {
      console.error("Logout failed", e);
      nav("/login");
    }
  }

  // GDPR: Export user data
  async function handleExportData() {
    try {
      setExportingData(true);
      setError(null);

      const response = await api.get("/users/me/export", {
        responseType: "blob"
      });

      // Create download link
      const blob = new Blob([response.data], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `memorio-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(t("profile.dataExported", "Your data has been exported successfully!"));
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err?.response?.data?.message || t("profile.exportFailed", "Failed to export data. Please try again."));
    } finally {
      setExportingData(false);
    }
  }

  // GDPR: Delete user account
  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") return;

    try {
      setDeletingAccount(true);
      setError(null);

      await api.delete("/users/me");

      // Redirect to landing page after successful deletion
      nav("/", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || t("profile.deleteFailed", "Failed to delete account. Please try again."));
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate account age in days
  const accountAge = useMemo(() => {
    if (!profile) return 0;
    const created = new Date(profile.createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }, [profile]);

  // Calculate account completion percentage
  const completionPercent = useMemo(() => {
    if (!profile) return 0;
    let score = 0;
    if (profile.displayName) score += 25;
    if (profile.email) score += 25;
    if (profile.preferredLanguage) score += 20;
    if (profile.twoFactorEnabled) score += 30;
    return score;
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
          <div className="text-lg font-medium text-slate-600 dark:text-slate-400">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center">
        <div className="text-red-600 dark:text-red-400 text-center p-8 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" />
          <p className="font-semibold">Failed to load profile.</p>
          <p className="text-sm mt-2">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 antialiased relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-3xl" />
      </div>
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
              <Link to="/dashboard" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 inline-flex items-center">
                {t('common.dashboard')}
                <ReviewNotificationBadge />
              </Link>
              <Link to="/leaderboard" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                {t('common.leaderboard')}
              </Link>
              <Link to="/learning" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                {t('common.learning')}
              </Link>
              <Link to="/profile" className="text-sm text-slate-900 dark:text-slate-50 font-medium">
                {t('common.profile')}
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={showTutorial}
                className="px-4 py-2 rounded-xl border border-purple-300/70 dark:border-purple-700 text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center gap-2"
                title={t('tutorial.viewTutorial', 'View Tutorial')}
              >
                <Lightbulb className="w-4 h-4" />
                <span className="hidden lg:inline">{t('tutorial.tutorial', 'Tutorial')}</span>
              </button>
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
                <Link to="/dashboard" className="py-2 text-slate-600 dark:text-slate-300 inline-flex items-center" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.dashboard')}
                  <ReviewNotificationBadge />
                </Link>
                <Link to="/leaderboard" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.leaderboard')}
                </Link>
                <Link to="/learning" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.learning')}
                </Link>
                <Link to="/profile" className="py-2 text-slate-900 dark:text-slate-50 font-medium" onClick={() => setMobileMenuOpen(false)}>
                  {t('common.profile')}
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); showTutorial(); }}
                  className="py-2 text-left text-purple-600 dark:text-purple-400 flex items-center gap-2"
                >
                  <Lightbulb className="w-4 h-4" />
                  {t('tutorial.tutorial', 'Tutorial')}
                </button>
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
      <main className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Hero Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                    {t('profile.title')}
                  </h1>
                </div>
              </div>
              <p className="mt-2 text-base sm:text-lg text-slate-600 dark:text-slate-400 font-medium">
                {t('profile.preferences')}
              </p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                <Edit2 className="w-5 h-5" />
                {t('common.edit')}
              </button>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 p-5 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-800 p-5 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{success}</p>
          </div>
        )}

        {/* Stats Overview Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label={t('profile.daysActive')}
            value={accountAge}
            color="indigo"
            delay={0}
          />
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            label={t('exercises.skillLevel')}
            value={profile.skillLevel}
            color="violet"
            delay={100}
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label={t('profile.profileCompletion')}
            value={`${completionPercent}%`}
            color="emerald"
            delay={200}
          />
          <StatCard
            icon={<Shield className="w-5 h-5" />}
            label={t('profile.security')}
            value={profile.twoFactorEnabled ? t('profile.protected') : t('profile.basic')}
            valueClassName="text-xl sm:text-2xl"
            color={profile.twoFactorEnabled ? "green" : "amber"}
            delay={300}
          />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Identity Card */}
            <div className="group relative rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500">
              {/* Gradient Aurora Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/10 dark:from-indigo-600/20 dark:via-violet-600/20 dark:to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Floating gradient orbs */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/30 to-violet-400/30 dark:from-indigo-600/20 dark:to-violet-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-400/30 to-purple-400/30 dark:from-violet-600/20 dark:to-purple-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />

              <div className="relative p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Avatar with circular progress */}
                  <div className="relative flex-shrink-0">
                    <svg className="w-32 h-32 sm:w-36 sm:h-36 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200 dark:text-slate-700" />
                      <circle 
                        cx="60" 
                        cy="60" 
                        r="54" 
                        fill="none" 
                        stroke="url(#gradient)" 
                        strokeWidth="4" 
                        strokeLinecap="round"
                        strokeDasharray={`${completionPercent * 3.39} 339`}
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl sm:text-4xl font-black text-white shadow-lg border-4 border-white dark:border-slate-900">
                        {profile.pictureUrl ? (
                          <img src={profile.pictureUrl} alt={profile.displayName || profile.email} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          (profile.displayName || profile.email).charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-lg border-2 border-white dark:border-slate-900 whitespace-nowrap">
                      {completionPercent}% {t('profile.complete')}
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-50 truncate">
                        {profile.displayName || t('profile.noDisplayName')}
                      </h2>
                      {profile.twoFactorEnabled && (
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center" title="2FA Enabled">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium mb-4">
                      {profile.email}
                    </p>
                    
                    {/* Meta Info Pills */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {profile.role}
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(profile.createdAt)}
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Level {profile.skillLevel}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">
                  {t('profile.accountInfo')}
                </h3>
              </div>
              
              <div className="space-y-5">
                {/* Display Name */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                    <User className="w-4 h-4" />
                    {t('common.displayName')}
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.displayName || ""}
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      placeholder={t('profile.enterDisplayName')}
                    />
                  ) : (
                    <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 font-medium">
                      {profile.displayName || <span className="text-slate-400 italic">{t('profile.noDisplayNameSet')}</span>}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                    <Mail className="w-4 h-4" />
                    {t('common.email')}
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  ) : (
                    <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 font-medium">
                      {profile.email}
                    </div>
                  )}
                </div>

                {/* Language Selector - Changes both UI and exercise content */}
                <LanguageSelector />
              </div>
            </div>
          </div>

          {/* Right Column - Security & Settings */}
          <div className="space-y-6">

            {/* Security Card */}
            <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  profile.twoFactorEnabled 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                    : 'bg-amber-100 dark:bg-amber-900/30'
                }`}>
                  <Shield className={`w-5 h-5 ${
                    profile.twoFactorEnabled 
                      ? 'text-emerald-500 dark:text-emerald-300' 
                      : 'text-amber-500 dark:text-amber-300'
                  }`} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">
                  {t('profile.twoFactor')}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-slate-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{t('profile.status')}</span>
                  </div>
                  {profile.twoFactorEnabled ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-300" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{t('profile.twoFactorEnabled')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-800">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{t('profile.notActive')}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {profile.twoFactorEnabled 
                    ? t('profile.twoFactorEnabledDesc')
                    : t('profile.twoFactorDisabledDesc')
                  }
                </p>

                {profile.twoFactorEnabled ? (
                  <button
                    onClick={() => nav("/auth/2fa/disable")}
                    className="w-full px-4 py-3 rounded-xl border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-105 active:scale-95"
                  >
                    {t('profile.disable2FA')}
                  </button>
                ) : (
                  <button
                    onClick={() => nav("/auth/2fa/setup")}
                    className="w-full px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                  >
                    {t('profile.enable2FA')}
                  </button>
                )}
              </div>
            </div>

            {/* Linked Accounts Card */}
            <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">
                  {t('profile.linkedAccounts')}
                </h3>
              </div>

              {profile.linkedProviders.length > 0 ? (
                <div className="space-y-3">
                  {profile.linkedProviders.map((provider, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                    >
                      <div className="text-2xl flex-shrink-0">
                        {PROVIDER_ICONS[provider.provider.toLowerCase()] || "🔗"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 dark:text-slate-50 capitalize truncate">
                          {PROVIDER_NAMES[provider.provider.toLowerCase()] || provider.provider}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {formatDate(provider.connectedAt)}
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                  <div className="text-3xl mb-2">🔗</div>
                  <p className="font-medium">{t('profile.noLinkedAccounts')}</p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Data & Privacy Section - Full Width (GDPR Danger Zone) */}
        <div className="mt-8 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">
                  {t('profile.dataPrivacy', 'Data & Privacy')}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('profile.dataPrivacySubtitle', 'Manage your personal data and account')}
                </p>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Data Card */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                    <Download className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-slate-50 mb-1">
                      {t('profile.exportData', 'Export Your Data')}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                      {t('profile.exportDescription', 'Download a copy of all your personal data including exercise history, progress, and account information.')}
                    </p>
                    <button
                      onClick={handleExportData}
                      disabled={exportingData}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      {exportingData ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {t('profile.exporting', 'Exporting...')}
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          {t('profile.downloadData', 'Download My Data')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Delete Account Card */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-red-700 dark:text-red-400 mb-1">
                      {t('profile.deleteAccount', 'Delete Account')}
                    </h4>
                    <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4 leading-relaxed">
                      {t('profile.deleteDescription', 'Permanently delete your account and all associated data. This action cannot be undone.')}
                    </p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-5 py-2.5 rounded-xl border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('profile.deleteMyAccount', 'Delete My Account')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed bottom on mobile when editing */}
        {editing && (
          <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t-2 border-slate-200 dark:border-slate-800 lg:relative lg:bg-transparent lg:dark:bg-transparent lg:backdrop-blur-none lg:border-0 lg:mt-6 lg:p-0">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                <XCircle className="w-5 h-5" />
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {t('profile.saveChanges')}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !deletingAccount && setShowDeleteModal(false)}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Warning Icon */}
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 text-center mb-2">
                {t('profile.confirmDelete', 'Delete Your Account?')}
              </h3>

              <p className="text-slate-600 dark:text-slate-400 text-center mb-4">
                {t('profile.deleteWarning', 'This will permanently delete your account and all associated data including:')}
              </p>

              <ul className="text-sm text-slate-600 dark:text-slate-400 mb-6 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {t('profile.deleteItem1', 'All exercise history and progress')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {t('profile.deleteItem2', 'Badges and achievements')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {t('profile.deleteItem3', 'Learning progress and quiz results')}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {t('profile.deleteItem4', 'Account settings and preferences')}
                </li>
              </ul>

              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {t('profile.typeDelete', 'Type DELETE to confirm')}
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  disabled={deletingAccount}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all disabled:opacity-50"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  disabled={deletingAccount}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || deletingAccount}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deletingAccount ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('profile.deleting', 'Deleting...')}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      {t('profile.deleteForever', 'Delete Forever')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Animated Stat Card Component
function StatCard({ 
  icon, 
  label, 
  value, 
  valueClassName = "text-2xl sm:text-3xl",
  color = "indigo", 
  delay = 0 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string | number;
  valueClassName?: string;
  color?: string;
  delay?: number;
}) {
  const colorClasses = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    violet: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
  };

  return (
    <div 
      className="group rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-default"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`inline-flex p-2.5 rounded-xl mb-3 ${colorClasses[color as keyof typeof colorClasses]}`}>
        {icon}
      </div>
      <div className={`font-black text-slate-900 dark:text-slate-50 leading-none mb-1 ${valueClassName}`}>
        {value}
      </div>
      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}