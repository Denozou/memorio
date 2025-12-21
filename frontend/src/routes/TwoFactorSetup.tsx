import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Shield, Download, Copy, Check, AlertCircle, Smartphone, Key } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

type SetupResp = {
  secret: string;
  qrCodeDataUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
};

export default function TwoFactorSetup() {
  const nav = useNavigate();
  
  const [step, setStep] = useState<"loading" | "scan" | "verify" | "backup" | "complete">("loading");
  const [setupData, setSetupData] = useState<SetupResp | null>(null);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    initSetup();
  }, []);

  useEffect(() => {
    if (step === "verify" && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  async function initSetup() {
    try {
      const response = await api.post<SetupResp>("/auth/2fa/setup");
      setSetupData(response.data);
      setStep("scan");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to initialize 2FA setup";
      setError(msg);
      setTimeout(() => nav("/profile"), 3000);
    }
  }

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

  async function verifyCode() {
    setBusy(true);
    setError(null);

    try {
      const verificationCode = code.join("");
      
      if (verificationCode.length !== 6) {
        setError("Please enter all 6 digits");
        setBusy(false);
        return;
      }

      await api.post("/auth/2fa/confirm", { code: verificationCode });
      setStep("backup");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Invalid verification code";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  function copyBackupCodes() {
    if (!setupData?.backupCodes) return;
    
    const text = setupData.backupCodes.join("\n");
    navigator.clipboard.writeText(text);
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  }

  function downloadBackupCodes() {
    if (!setupData?.backupCodes) return;
    
    const text = `Memorio - Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${setupData.backupCodes.join("\n")}\n\nKeep these codes in a safe place. Each code can only be used once.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memorio-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyManualKey() {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
  }

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Setting up 2FA...</p>
        </div>
      </div>
    );
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
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <div className={`flex items-center gap-2 ${step === "scan" || step === "verify" || step === "backup" || step === "complete" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-600"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step === "scan" || step === "verify" || step === "backup" || step === "complete" ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                1
              </div>
              <span className="hidden sm:inline text-sm font-medium">Scan</span>
            </div>
            <div className="w-8 sm:w-16 h-0.5 bg-slate-200 dark:bg-slate-700" />
            <div className={`flex items-center gap-2 ${step === "verify" || step === "backup" || step === "complete" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-600"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step === "verify" || step === "backup" || step === "complete" ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                2
              </div>
              <span className="hidden sm:inline text-sm font-medium">Verify</span>
            </div>
            <div className="w-8 sm:w-16 h-0.5 bg-slate-200 dark:bg-slate-700" />
            <div className={`flex items-center gap-2 ${step === "backup" || step === "complete" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-600"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step === "backup" || step === "complete" ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                3
              </div>
              <span className="hidden sm:inline text-sm font-medium">Backup</span>
            </div>
          </div>
        </div>

        {/* Step: Scan QR Code */}
        {step === "scan" && setupData && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 mb-4">
                <Smartphone className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">
                Scan QR Code
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Use your authenticator app to scan this QR code
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-lg p-6 sm:p-8">
              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white rounded-2xl shadow-md">
                  <img 
                    src={setupData.qrCodeDataUrl} 
                    alt="2FA QR Code" 
                    className="w-64 h-64"
                  />
                </div>
              </div>

              {/* Recommended Apps */}
              <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
                  Recommended authenticator apps:
                </p>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Google Authenticator</li>
                  <li>• Microsoft Authenticator</li>
                  <li>• Authy</li>
                  <li>• 1Password</li>
                </ul>
              </div>

              {/* Manual Entry */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  {showManualEntry ? "Hide manual entry key" : "Can't scan? Enter manually"}
                </button>
                
                {showManualEntry && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                      Enter this key in your authenticator app:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-slate-50 break-all">
                        {setupData.secret}
                      </code>
                      <button
                        type="button"
                        onClick={copyManualKey}
                        className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                        aria-label="Copy manual entry key"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Continue Button */}
              <button
                onClick={() => setStep("verify")}
                className="w-full mt-6 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Verify Code */}
        {step === "verify" && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 mb-4">
                <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">
                Verify Setup
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-lg p-6 sm:p-8">
              <form onSubmit={(e) => { e.preventDefault(); verifyCode(); }} className="space-y-6">
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
                      Verify & Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => setStep("scan")}
                  disabled={busy}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Step: Backup Codes */}
        {step === "backup" && setupData && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 mb-4">
                <Key className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">
                Save Backup Codes
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Store these codes in a safe place. Each can only be used once.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-lg p-6 sm:p-8">
              {/* Warning */}
              <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">Important!</p>
                    <p>Save these backup codes now. You won't be able to see them again. Use them if you lose access to your authenticator app.</p>
                  </div>
                </div>
              </div>

              {/* Backup Codes */}
              <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {setupData.backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-900 dark:text-slate-50 text-center"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={downloadBackupCodes}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={copyBackupCodes}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300/70 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  {copiedBackup ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Complete Button */}
              <button
                onClick={() => nav("/profile")}
                className="w-full px-5 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Complete Setup
              </button>
            </div>
          </div>
        )}

        {/* Cancel Link */}
        {step !== "backup" && (
          <div className="text-center">
            <Link
              to="/profile"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
            >
              Cancel setup
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
