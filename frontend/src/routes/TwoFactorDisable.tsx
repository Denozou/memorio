import { useState, useRef } from "react";
import { api } from "../lib/api";
import { useNavigate, Link } from "react-router-dom";
import { Shield, AlertCircle, Eye, EyeOff } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

export default function TwoFactorDisable() {
  const nav = useNavigate();
  
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      const verificationCode = code.join("");
      
      if (!password) {
        setError("Please enter your password");
        setBusy(false);
        return;
      }

      if (verificationCode.length !== 6) {
        setError("Please enter all 6 digits");
        setBusy(false);
        return;
      }

      await api.post("/auth/2fa/disable", {
        password,
        code: verificationCode
      });

      nav("/profile", { state: { message: "Two-factor authentication has been disabled" } });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to disable 2FA";
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
              <img src="/favicon.ico" alt="Memorio logo" className="h-8 w-8" />
              <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">Memorio</span>
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-md px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 mb-4">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Disable Two-Factor Authentication
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Confirm your identity to disable 2FA
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-lg p-6 sm:p-8">
          {/* Warning */}
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Warning</p>
                <p>Disabling two-factor authentication will make your account less secure. You'll only need your password to sign in.</p>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
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
            </div>

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
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
                Enter the code from your authenticator app
              </p>
            </div>

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
              className="w-full px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable Two-Factor Authentication"
              )}
            </button>

            {/* Cancel Link */}
            <div className="text-center">
              <Link
                to="/profile"
                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
