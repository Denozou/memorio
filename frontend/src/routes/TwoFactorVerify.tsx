import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowRight, Shield, AlertCircle } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

type VerifyResp = {
  message: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
  };
};

export default function TwoFactorVerify() {
  const nav = useNavigate();
  const location = useLocation();
  const tempToken = location.state?.tempToken;

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!tempToken) {
      nav("/login");
    }
  }, [tempToken, nav]);

  useEffect(() => {
    if (!useBackupCode && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [useBackupCode]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    const newCode = [...code];
    
    for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
      newCode[i] = pastedData[i];
    }
    
    setCode(newCode);
    
    const nextEmptyIndex = newCode.findIndex(c => !c);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const verificationCode = useBackupCode ? backupCode : code.join("");
      
      if (!verificationCode || (useBackupCode ? verificationCode.length < 8 : verificationCode.length !== 6)) {
        setError(useBackupCode ? "Please enter a valid backup code" : "Please enter all 6 digits");
        setBusy(false);
        return;
      }

      await api.post<VerifyResp>("/auth/2fa/verify", {
        tempToken,
        code: verificationCode,
        isBackupCode: useBackupCode
      });

      nav("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Verification failed";
      setError(msg);
    } finally {
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
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md" aria-hidden />
              <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">Memorio</span>
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-md px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 mb-4">
            <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Two-Factor Authentication
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {useBackupCode 
              ? "Enter one of your backup codes"
              : "Enter the 6-digit code from your authenticator app"
            }
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-lg p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {!useBackupCode ? (
              <>
                {/* 6-Digit Code Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-3 text-center">
                    Verification Code
                  </label>
                  <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleCodeChange(index, e.target.value)}
                        onKeyDown={e => handleKeyDown(index, e)}
                        disabled={busy}
                        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        aria-label={`Digit ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Backup Code Input */}
                <div>
                  <label htmlFor="backupCode" className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                    Backup Code
                  </label>
                  <input
                    id="backupCode"
                    type="text"
                    value={backupCode}
                    onChange={e => setBackupCode(e.target.value)}
                    placeholder="xxxx-xxxx"
                    required
                    disabled={busy}
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-center text-lg font-mono tracking-wider"
                  />
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
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
                  Verifying...
                </>
              ) : (
                <>
                  Verify
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Toggle Backup Code */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setError(null);
                  setCode(["", "", "", "", "", ""]);
                  setBackupCode("");
                }}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
              >
                {useBackupCode ? "Use authenticator code" : "Use backup code instead"}
              </button>
            </div>

            {/* Back to Login */}
            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
              >
                Back to login
              </Link>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <div className="mt-6 rounded-2xl bg-slate-100 dark:bg-slate-800/50 p-4 text-center">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            <Shield className="w-4 h-4 inline mr-1" />
            Your account is protected with two-factor authentication
          </p>
        </div>
      </main>
    </div>
  );
}
