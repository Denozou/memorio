import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Brain, Mail, User, MessageSquare, Send, 
  CheckCircle, AlertCircle, Shield, Clock,
  ArrowLeft
} from "lucide-react";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";
import { api } from "../lib/api";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  companyFax: string; // Honeypot field - named to avoid autofill
  formLoadedAt: number;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

interface ContactResponse {
  message: string;
  referenceId: string;
  timestamp: string;
}

type SubmitStatus = "idle" | "submitting" | "success" | "error" | "rate_limited";

// Validation patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MIN_SUBJECT_LENGTH = 5;
const MAX_SUBJECT_LENGTH = 200;
const MIN_MESSAGE_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 5000;

export default function Contact() {
  const { t, i18n } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  
  // Form state
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
    companyFax: "", // Honeypot - should remain empty
    formLoadedAt: Date.now(),
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  // Reset form load time on mount (for timing-based bot detection)
  useEffect(() => {
    setFormData(prev => ({ ...prev, formLoadedAt: Date.now() }));
  }, []);

  // Character count for message
  useEffect(() => {
    setCharCount(formData.message.length);
  }, [formData.message]);

  // Validation function
  const validateField = useCallback((name: keyof ContactFormData, value: string): string | undefined => {
    switch (name) {
      case "name":
        if (!value.trim()) return t("contact.errors.nameRequired");
        if (value.trim().length < MIN_NAME_LENGTH) return t("contact.errors.nameTooShort");
        if (value.trim().length > MAX_NAME_LENGTH) return t("contact.errors.nameTooLong");
        return undefined;
      
      case "email":
        if (!value.trim()) return t("contact.errors.emailRequired");
        if (!EMAIL_REGEX.test(value.trim())) return t("contact.errors.emailInvalid");
        return undefined;
      
      case "subject":
        if (!value.trim()) return t("contact.errors.subjectRequired");
        if (value.trim().length < MIN_SUBJECT_LENGTH) return t("contact.errors.subjectTooShort");
        if (value.trim().length > MAX_SUBJECT_LENGTH) return t("contact.errors.subjectTooLong");
        return undefined;
      
      case "message":
        if (!value.trim()) return t("contact.errors.messageRequired");
        if (value.trim().length < MIN_MESSAGE_LENGTH) return t("contact.errors.messageTooShort");
        if (value.trim().length > MAX_MESSAGE_LENGTH) return t("contact.errors.messageTooLong");
        return undefined;
      
      default:
        return undefined;
    }
  }, [t]);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (["name", "email", "subject", "message"] as const).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  // Re-validate errors when language changes to update error messages
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const newErrors: FormErrors = {};
      (["name", "email", "subject", "message"] as const).forEach(field => {
        if (errors[field]) {
          const error = validateField(field, formData[field]);
          if (error) newErrors[field] = error;
        }
      });
      setErrors(newErrors);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (touched[name] && errors[name as keyof FormErrors]) {
      const error = validateField(name as keyof ContactFormData, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle blur for validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name as keyof ContactFormData, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ name: true, email: true, subject: true, message: true });
    
    // Validate form
    if (!validateForm()) {
      // Focus first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        element?.focus();
      }
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const response = await api.post<ContactResponse>("/api/contact", {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        companyFax: formData.companyFax, // Honeypot
        formLoadedAt: formData.formLoadedAt,
      });

      setStatus("success");
      setReferenceId(response.data.referenceId);
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        companyFax: "",
        formLoadedAt: Date.now(),
      });
      setTouched({});
      setErrors({});
      
    } catch (err: any) {
      const statusCode = err?.response?.status;
      
      if (statusCode === 429) {
        setStatus("rate_limited");
        setErrorMessage(t("contact.errors.rateLimited"));
      } else {
        setStatus("error");
        setErrorMessage(
          err?.response?.data?.error || 
          err?.response?.data?.message || 
          t("contact.errors.submitFailed")
        );
      }
    }
  };

  // Reset to form after success
  const handleSendAnother = () => {
    setStatus("idle");
    setReferenceId(null);
    setFormData(prev => ({ ...prev, formLoadedAt: Date.now() }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 antialiased">
      {/* Header */}
      <header className="border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur sticky top-0 z-50">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">Memorio</span>
            </Link>
            <div className="flex items-center gap-3">
              <LanguageSelector variant="compact" />
              <ThemeToggle />
              <Link 
                to="/login" 
                className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50 hidden sm:block"
              >
                {t("common.login")}
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t("contact.backToHome")}
        </Link>

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25 mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            {t("contact.title")}
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            {t("contact.subtitle")}
          </p>
        </div>

        {/* Success State */}
        {status === "success" && (
          <div className="rounded-3xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20 p-6 sm:p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              {t("contact.success.title")}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t("contact.success.message")}
            </p>
            {referenceId && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-6">
                <span className="text-sm text-slate-500 dark:text-slate-400">{t("contact.success.reference")}:</span>
                <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{referenceId}</code>
              </div>
            )}
            <button
              onClick={handleSendAnother}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
            >
              {t("contact.success.sendAnother")}
            </button>
          </div>
        )}

        {/* Rate Limited State */}
        {status === "rate_limited" && (
          <div className="rounded-3xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20 p-6 sm:p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 mb-4">
              <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              {t("contact.rateLimited.title")}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t("contact.rateLimited.message")}
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="px-6 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-50 font-medium transition-colors"
            >
              {t("contact.rateLimited.tryAgain")}
            </button>
          </div>
        )}

        {/* Form */}
        {(status === "idle" || status === "submitting" || status === "error") && (
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xl p-6 sm:p-8">
            {/* Security Badge */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6 justify-center">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>{t("contact.securityNote")}</span>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Honeypot field - hidden from users, bots will fill it */}
              <div className="absolute -left-[9999px] opacity-0 pointer-events-none" aria-hidden="true">
                <label htmlFor="company_fax">Fax</label>
                <input
                  type="text"
                  id="company_fax"
                  name="company_fax"
                  value={formData.companyFax}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyFax: e.target.value }))}
                  tabIndex={-1}
                  autoComplete="nope"
                />
              </div>

              {/* Name Input */}
              <div>
                <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                  <User className="w-4 h-4 text-slate-400" />
                  {t("contact.form.name")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t("contact.form.namePlaceholder")}
                  required
                  disabled={status === "submitting"}
                  maxLength={MAX_NAME_LENGTH}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    touched.name && errors.name 
                      ? "border-red-500 dark:border-red-500 focus:ring-red-500" 
                      : "border-slate-300/70 dark:border-slate-700 focus:ring-indigo-500"
                  } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                />
                {touched.name && errors.name && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {t("contact.form.email")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t("contact.form.emailPlaceholder")}
                  required
                  disabled={status === "submitting"}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    touched.email && errors.email 
                      ? "border-red-500 dark:border-red-500 focus:ring-red-500" 
                      : "border-slate-300/70 dark:border-slate-700 focus:ring-indigo-500"
                  } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                />
                {touched.email && errors.email && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Subject Input */}
              <div>
                <label htmlFor="subject" className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  {t("contact.form.subject")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t("contact.form.subjectPlaceholder")}
                  required
                  disabled={status === "submitting"}
                  maxLength={MAX_SUBJECT_LENGTH}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    touched.subject && errors.subject 
                      ? "border-red-500 dark:border-red-500 focus:ring-red-500" 
                      : "border-slate-300/70 dark:border-slate-700 focus:ring-indigo-500"
                  } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                />
                {touched.subject && errors.subject && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.subject}
                  </p>
                )}
              </div>

              {/* Message Textarea */}
              <div>
                <label htmlFor="message" className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  {t("contact.form.message")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={t("contact.form.messagePlaceholder")}
                  required
                  disabled={status === "submitting"}
                  rows={6}
                  maxLength={MAX_MESSAGE_LENGTH}
                  className={`w-full px-4 py-3 rounded-xl border resize-none ${
                    touched.message && errors.message 
                      ? "border-red-500 dark:border-red-500 focus:ring-red-500" 
                      : "border-slate-300/70 dark:border-slate-700 focus:ring-indigo-500"
                  } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                />
                <div className="flex justify-between items-center mt-1.5">
                  {touched.message && errors.message ? (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.message}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className={`text-xs ${
                    charCount > MAX_MESSAGE_LENGTH * 0.9 
                      ? "text-amber-500" 
                      : "text-slate-400"
                  }`}>
                    {charCount}/{MAX_MESSAGE_LENGTH}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {status === "error" && errorMessage && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400">{t("contact.errors.submitError")}</p>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full px-5 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
              >
                {status === "submitting" ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("contact.form.sending")}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t("contact.form.send")}
                  </>
                )}
              </button>

              {/* Privacy Note */}
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
                {t("contact.privacyNote")}
              </p>
            </form>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">
            {t("contact.faq.title")}
          </h3>
          <div className="space-y-4 text-left">
            <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="font-medium text-slate-900 dark:text-slate-50 mb-1">
                {t("contact.faq.q1")}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t("contact.faq.a1")}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="font-medium text-slate-900 dark:text-slate-50 mb-1">
                {t("contact.faq.q2")}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t("contact.faq.a2")}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <span className="font-medium">Memorio</span>
            </div>
            <div>© {new Date().getFullYear()} Memorio. {t("contact.footer.rights")}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
