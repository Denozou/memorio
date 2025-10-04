import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Button from "../components/ui/Button";

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
  // add more as you import more languages
};

const PROVIDER_ICONS: Record<string, string> = {
  google: "",
  facebook: "",

  // add more providers as needed
};

const PROVIDER_NAMES: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  // add more providers as needed
};

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<UpdateProfileRequest>({});
  const [languages, setLanguages] = useState<Array<{ code: string; label: string }>>([
    { code: "en", label: "English" }
  ]);

  useEffect(() => {
    loadProfile();
    loadLanguages();
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

  const loadLanguages = async () => {
    try {
      const response = await api.get<Array<{ code: string; count: number }>>("/lexicon/languages");
      const opts = response.data.map(r => ({
        code: r.code,
        label: LANG_LABELS[r.code] ?? r.code
      }));
      if (opts.length > 0) setLanguages(opts);
    } catch (err) {
      // fallback: keep 'en' only
      setLanguages([{ code: "en", label: "English" }]);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{
        padding: 24,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "400px"
      }}>
        <div style={{ fontSize: 18, color: "#6b7280" }}>Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: "#ef4444", textAlign: "center" }}>
          Failed to load profile. Please try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: 24,
      maxWidth: 800,
      margin: "0 auto",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 32
      }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#111827",
          margin: 0
        }}>
          Profile
        </h1>
        {!editing && (
          <Button
            variant="primary"
            onClick={() => setEditing(true)}
            style={{ padding: "8px 16px" }}
          >
            Edit Profile
          </Button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#dc2626",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          color: "#16a34a",
          padding: 12,
          borderRadius: 8,
          marginBottom: 16
        }}>
          {success}
        </div>
      )}

      {/* Profile Card */}
      <div style={{
        background: "white",
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb",
        overflow: "hidden"
      }}>
        {/* Profile Header */}
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: 24,
          color: "white"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: profile.pictureUrl ? `url(${profile.pictureUrl})` : "#ffffff20",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: "bold",
              border: "3px solid rgba(255,255,255,0.3)"
            }}>
              {!profile.pictureUrl && (profile.displayName || profile.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{
                fontSize: 24,
                fontWeight: 600,
                margin: 0,
                marginBottom: 4
              }}>
                {profile.displayName || "No display name"}
              </h2>
              <p style={{
                fontSize: 16,
                opacity: 0.9,
                margin: 0
              }}>
                {profile.email}
              </p>
              <div style={{
                fontSize: 14,
                opacity: 0.8,
                marginTop: 8
              }}>
                Member since {formatDate(profile.createdAt)} • {profile.role}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div style={{ padding: 24 }}>
          <div style={{ display: "grid", gap: 24 }}>
            {/* Basic Information */}
            <div>
              <h3 style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 16,
                margin: 0,

              }}>
                Basic Information
              </h3>
              <div style={{ display: "grid", gap: 16 }}>
                {/* Display Name */}
                <div>
                  <label style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6
                  }}>
                    Display Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.displayName || ""}
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        fontSize: 14,
                        boxSizing: "border-box"
                      }}
                      placeholder="Enter your display name"
                    />
                  ) : (
                    <div style={{
                      padding: "10px 0",
                      fontSize: 14,
                      color: profile.displayName ? "#111827" : "#6b7280"
                    }}>
                      {profile.displayName || "No display name set"}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6
                  }}>
                    Email
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        fontSize: 14,
                        boxSizing: "border-box"
                      }}
                    />
                  ) : (
                    <div style={{ padding: "10px 0", fontSize: 14, color: "#111827" }}>
                      {profile.email}
                    </div>
                  )}
                </div>

                {/* Preferred Language */}
                <div>
                  <label style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: 6
                  }}>
                    Preferred Language
                  </label>
                  {editing ? (
                    <select
                      value={formData.preferredLanguage || "en"}
                      onChange={(e) => setFormData({...formData, preferredLanguage: e.target.value})}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        fontSize: 14,
                        boxSizing: "border-box"
                      }}
                    >
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ padding: "10px 0", fontSize: 14, color: "#111827" }}>
                      {LANG_LABELS[profile.preferredLanguage || "en"] || profile.preferredLanguage || "English"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Linked Accounts */}
            <div>
              <h3 style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#374151",
                margin: 0,
                marginBottom: 16
              }}>
                Linked Accounts
              </h3>
              {profile.linkedProviders.length > 0 ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {profile.linkedProviders.map((provider, index) => (
                    <div key={index} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      background: "#f9fafb",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb"
                    }}>
                      <div style={{ fontSize: 20 }}>
                        {PROVIDER_ICONS[provider.provider.toLowerCase()] || ""}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: "#111827",
                          textTransform: "capitalize"
                        }}>
                          {PROVIDER_NAMES[provider.provider.toLowerCase()] || provider.provider}
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          Connected on {formatDate(provider.connectedAt)}
                        </div>
                      </div>
                      <div style={{
                        padding: "4px 8px",
                        background: "#dcfce7",
                        color: "#16a34a",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        Connected
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: 16,
                  textAlign: "center",
                  color: "#6b7280",
                  fontSize: 14,
                  background: "#f9fafb",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb"
                }}>
                  No linked accounts yet
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {editing && (
              <div style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                paddingTop: 16,
                borderTop: "1px solid #e5e7eb"
              }}>
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={saving}
                  style={{ padding: "8px 16px" }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ padding: "8px 16px" }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}