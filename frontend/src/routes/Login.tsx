import {useState, useEffect} from "react";
import {api} from "../lib/api";
import {useNavigate, useSearchParams, Link} from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Brain } from "lucide-react";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSelector from "../components/LanguageSelector";

type LoginResp = {
    message: string;
    user: {
        id: string;
        email: string;
        displayName: string;
        role: string;
    };
};

type TwoFactorRequiredResp = {
    message: string;
    tempToken: string;
    twoFactorRequired: boolean;
};

export default function Login(){
    const { t } = useTranslation();
    const nav = useNavigate();
    const [searchParams] = useSearchParams();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string|null>(null);
    const [busy, setBusy] = useState(false);
    
    useEffect(() => {
      const oauthError = searchParams.get('error');
      if (oauthError === 'oauth2_failed'){
        setError(t('auth.oauth2Failed'));
      }else if (oauthError === 'oauth2_missing_tokens'){
        setError(t('auth.oauth2Missing'));
      }
    }, [searchParams]);
    async function onSubmit(e: React.FormEvent){
        e.preventDefault();
        setBusy(true);
        setError(null);
        try{
            const response = await api.post<LoginResp | TwoFactorRequiredResp>("/auth/login", {email, password});
            
            // Check if 2FA is required
            if ('twoFactorRequired' in response.data && response.data.twoFactorRequired) {
                nav("/auth/2fa/verify", { state: { tempToken: response.data.tempToken } });
                return;
            }
            
            nav("/dashboard");
        }catch(err: any){
            const msg = err?.response?.data?.message ?? t('auth.loginFailed');
            setError(msg);
        }finally{
            setBusy(false);
        }
    }
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 antialiased">
        {/* Header */}
        <header className="border-b border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur">
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
                <Link to="/signup" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50">
                  {t('common.signup')}
                </Link>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-md px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {t('auth.welcomeBack')}
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {t('auth.signInToContinue')}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-lg p-6 sm:p-8">
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                  {t('common.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={busy}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                  {t('common.password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={busy}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="text-right">
                  <Link 
                    to="/auth/forgot-password" 
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy}
                className="w-full px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    {t('common.login')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-sm text-slate-500 dark:text-slate-400">{t('auth.orContinueWith')}</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-3">
                <a
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/oauth2/authorization/google`}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('auth.continueWithGoogle')}
                </a>

                <a
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/oauth2/authorization/facebook`}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  {t('auth.continueWithFacebook')}
                </a>
              </div>
            </form>

            {/* Sign Up Link */}
            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
              {t('auth.dontHaveAccount')}{" "}
              <Link to="/signup" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                {t('common.signup')}
              </Link>
            </p>
          </div>
        </main>
      </div>
    );   
}