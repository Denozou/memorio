import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, Edit2, XCircle, Check, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<UpdateProfileRequest>({});

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-lg text-slate-500 dark:text-slate-400">{t('common.loading')}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-red-600 dark:text-red-400 text-center">
          Failed to load profile. Please try refreshing the page.
        </div>
      </div>
    );
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
              <Link to="/learning" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                Learning
              </Link>
              <Link to="/profile" className="text-sm text-slate-900 dark:text-slate-50 font-medium">
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
                  {t('common.dashboard')}
                </Link>
                <Link to="/leaderboard" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  Leaderboard
                </Link>
                <Link to="/learning" className="py-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(false)}>
                  Learning
                </Link>
                <Link to="/profile" className="py-2 text-slate-900 dark:text-slate-50 font-medium" onClick={() => setMobileMenuOpen(false)}>
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
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {t('profile.title')}
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {t('profile.preferences')}
            </p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
            >
              <Edit2 className="w-4 h-4" />
              {t('common.edit')}
            </button>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-sm text-green-600 dark:text-green-400">
            {success}
          </div>
        )}

        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl sm:text-4xl font-bold text-white border-4 border-white/30">
                {!profile.pictureUrl && (profile.displayName || profile.email).charAt(0).toUpperCase()}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {profile.displayName || "No display name"}
                </h2>
                <p className="text-white/90 mt-1">
                  {profile.email}
                </p>
                <div className="text-sm text-white/80 mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span>{t('profile.memberSince')} {formatDate(profile.createdAt)}</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium">{profile.role}</span>
                  <span>•</span>
                  <span>{t('profile.skillLevel')} {profile.skillLevel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6 sm:p-8">
            <div className="space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  {t('profile.accountInfo')}
                </h3>
                <div className="space-y-4">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                      {t('common.displayName')}
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.displayName || ""}
                        onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter your display name"
                      />
                    ) : (
                      <div className="py-3 text-sm text-slate-900 dark:text-slate-50">
                        {profile.displayName || <span className="text-slate-400">No display name set</span>}
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                      {t('common.email')}
                    </label>
                    {editing ? (
                      <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="py-3 text-sm text-slate-900 dark:text-slate-50">
                        {profile.email}
                      </div>
                    )}
                  </div>

                  {/* Language Selector - Changes both UI and exercise content */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">
                      {t('profile.language')}
                    </h4>
                    <LanguageSelector />
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      {t('profile.languageDesc')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  {t('profile.twoFactor')}
                </h3>
                <div className="p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${profile.twoFactorEnabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        <Shield className={`w-6 h-6 ${profile.twoFactorEnabled ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-slate-900 dark:text-slate-50">
                          {t('profile.twoFactor')}
                        </h4>
                        {profile.twoFactorEnabled && (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                            {t('profile.twoFactorEnabled')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                        {profile.twoFactorEnabled 
                          ? "Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app when signing in."
                          : "Add an extra layer of security to your account by requiring a verification code in addition to your password."
                        }
                      </p>
                      {profile.twoFactorEnabled ? (
                        <button
                          onClick={() => nav("/auth/2fa/disable")}
                          className="px-4 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          {t('profile.disable2FA')}
                        </button>
                      ) : (
                        <button
                          onClick={() => nav("/auth/2fa/setup")}
                          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm hover:shadow transition-all"
                        >
                          {t('profile.enable2FA')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked Accounts */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  {t('profile.linkedAccounts')}
                </h3>
                {profile.linkedProviders.length > 0 ? (
                  <div className="space-y-3">
                    {profile.linkedProviders.map((provider, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                      >
                        <div className="text-2xl">
                          {PROVIDER_ICONS[provider.provider.toLowerCase()] || "🔗"}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 dark:text-slate-50 capitalize">
                            {PROVIDER_NAMES[provider.provider.toLowerCase()] || provider.provider}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {t('profile.connectedAt')} {formatDate(provider.connectedAt)}
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                          {t('profile.connectedAt')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    {t('profile.noLinkedAccounts')}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {editing && (
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex-1 sm:flex-initial px-5 py-3 rounded-xl border border-slate-300/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {t('profile.saveChanges')}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}