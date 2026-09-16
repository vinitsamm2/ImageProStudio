import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  QrCode,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  X
} from "lucide-react";
import UploadZone from "../UploadZone";
import {
  PdfFileInfo,
  downloadBlob,
  formatBytes,
  readPdfInfo
} from "../../lib/files";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

export default function PdfProtectView({
  notify,
  initialFiles,
  onSwitchViceVersa,
  onShareFile
}: {
  notify: ToastNotify;
  initialFiles?: File[];
  onSwitchViceVersa?: () => void;
  onShareFile?: (file: File) => void;
}) {
  const [info, setInfo] = useState<PdfFileInfo | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [algorithm, setAlgorithm] = useState<"AES-256" | "RC4">("AES-256");
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(true);
  const [allowModifying, setAllowModifying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [protectedFile, setProtectedFile] = useState<File | null>(null);

  const load = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    try {
      const pdf = await readPdfInfo(picked, 1);
      setInfo(pdf);
      setProtectedFile(null);
      notify(`Loaded PDF with ${pdf.pages} page(s).`, "info");
    } catch {
      notify("Could not read PDF document.", "error");
    }
  };

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      load(initialFiles);
    }
  }, [initialFiles]);

  const calculateStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "None", color: "bg-slate-200" };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score: 1, label: "Weak", color: "bg-rose-500" };
    if (score <= 3) return { score: 2, label: "Medium", color: "bg-amber-500" };
    if (score <= 4) return { score: 3, label: "Strong", color: "bg-emerald-500" };
    return { score: 4, label: "Very Strong", color: "bg-blue-600" };
  };

  const strength = calculateStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleProtect = async () => {
    if (!info) return notify("Upload a PDF document first.", "error");
    if (!password) return notify("Please enter an encryption password.", "error");
    if (password !== confirmPassword) {
      return notify("Passwords do not match. Please check again.", "error");
    }

    setBusy(true);
    try {
      const arrayBuffer = await info.file.arrayBuffer();
      const pdfBytes = new Uint8Array(arrayBuffer);

      const encryptedBytes = await encryptPDF(pdfBytes, password, {
        algorithm,
        allowPrinting,
        allowModifying,
        allowCopying,
        allowAnnotating: allowModifying
      });

      const blob = new Blob([encryptedBytes as any], { type: "application/pdf" });
      const outName = `${info.file.name.replace(/\.pdf$/i, "")}-protected.pdf`;
      const generated = new File([blob], outName, { type: "application/pdf" });

      setProtectedFile(generated);

      if (onShareFile) {
        onShareFile(generated);
      } else {
        downloadBlob(blob, outName);
      }

      notify("PDF successfully protected with password!", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to encrypt PDF.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {onSwitchViceVersa && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs dark:bg-indigo-950/20">
          <span className="font-medium text-slate-700 dark:text-indigo-200">
            Already have a locked PDF? Remove password protection with Unlock PDF.
          </span>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="btn-secondary h-8 gap-1.5 px-3 text-xs font-bold cursor-pointer"
          >
            <ArrowLeftRight size={13} />
            <span>Switch to Unlock PDF</span>
          </button>
        </div>
      )}

      {!info ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-blue-500/20">
                <Lock size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Protect PDF</h2>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    AES-256 Military Grade
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Secure any PDF with 256-bit encryption. Zero file uploads — everything encrypts 100% locally in your browser.
                </p>
              </div>
            </div>
          </div>

          <UploadZone
            accept="application/pdf"
            formats="PDF"
            files={[]}
            onFiles={load}
            multiple={false}
            label="Drag & Drop PDF to Password Protect"
            helperText="Encrypted completely on your device using Web Crypto API"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Lock size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-xs">
                    {info.file.name}
                  </h3>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {formatBytes(info.file.size)}
                  </span>
                  <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {info.pages} Page(s)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Ready to encrypt</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setInfo(null);
                setPassword("");
                setConfirmPassword("");
                setProtectedFile(null);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:border-white/[0.1] dark:bg-slate-800 dark:text-slate-300 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <X size={14} />
              <span>Change File</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Password & Permissions Settings */}
            <div className="lg:col-span-7 space-y-5">
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-white/[0.06]">
                  <KeyRound size={18} className="text-blue-600 dark:text-blue-400" />
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Set Security Password
                  </h4>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Password</span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{showPassword ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a secure password..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-white/[0.08] dark:bg-slate-800/60 dark:text-white dark:focus:border-blue-400"
                    />
                  </div>

                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>Strength</span>
                        <span className={strength.score >= 3 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}>
                          {strength.label}
                        </span>
                      </div>
                      <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full flex-1 transition-all ${
                              step <= strength.score ? strength.color : "opacity-20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password to confirm..."
                      className={`w-full rounded-2xl border px-4 py-2.5 text-sm font-medium focus:outline-none ${
                        confirmPassword.length > 0
                          ? passwordsMatch
                            ? "border-emerald-400 bg-emerald-50/30 text-slate-800 dark:border-emerald-500/40 dark:bg-emerald-950/20 dark:text-white"
                            : "border-rose-400 bg-rose-50/30 text-slate-800 dark:border-rose-500/40 dark:bg-rose-950/20 dark:text-white"
                          : "border-slate-200 bg-slate-50/50 text-slate-800 focus:border-blue-500 focus:bg-white dark:border-white/[0.08] dark:bg-slate-800/60 dark:text-white"
                      }`}
                    />
                    {confirmPassword.length > 0 && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs">
                        {passwordsMatch ? (
                          <Check size={16} className="text-emerald-600" />
                        ) : (
                          <ShieldAlert size={16} className="text-rose-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Algorithm Choice */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Encryption Standard
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAlgorithm("AES-256")}
                      className={`flex flex-col items-start rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                        algorithm === "AES-256"
                          ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20"
                          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-black text-xs text-slate-900 dark:text-white">
                        <span>AES-256 (PDF 2.0)</span>
                        <span className="rounded bg-blue-600 text-white text-[9px] px-1 py-0.2 font-bold">Recommended</span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        High-grade standard used by Adobe Acrobat and modern readers.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAlgorithm("RC4")}
                      className={`flex flex-col items-start rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                        algorithm === "RC4"
                          ? "border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20"
                          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-white/[0.08] dark:bg-slate-800/50"
                      }`}
                    >
                      <div className="font-black text-xs text-slate-900 dark:text-white">
                        RC4 128-bit
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        Compatible with legacy PDF 1.4 readers and vintage devices.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Permissions Toggles */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Document Permissions
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-700 dark:border-white/[0.08] dark:bg-slate-800/40 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowPrinting}
                        onChange={(e) => setAllowPrinting(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>Allow Print</span>
                    </label>

                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-700 dark:border-white/[0.08] dark:bg-slate-800/40 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowCopying}
                        onChange={(e) => setAllowCopying(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>Allow Copy</span>
                    </label>

                    <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-700 dark:border-white/[0.08] dark:bg-slate-800/40 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowModifying}
                        onChange={(e) => setAllowModifying(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>Allow Edit</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleProtect}
                  disabled={busy || !passwordsMatch}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-6 h-12 text-sm font-black text-white shadow-lg shadow-blue-500/25 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {busy ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Encrypting PDF with Web Crypto...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Encrypt & Download Protected PDF</span>
                    </>
                  )}
                </button>

                {protectedFile && onShareFile && (
                  <button
                    type="button"
                    onClick={() => onShareFile(protectedFile)}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-4 h-12 text-xs font-bold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-400 shadow-xs transition-all cursor-pointer"
                  >
                    <QrCode size={16} />
                    <span>Send to Phone</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Preview & Privacy Badge */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 flex flex-col items-center text-center space-y-3">
                <div className="relative w-40 h-56 rounded-2xl border border-slate-200 overflow-hidden shadow-md bg-slate-50 dark:border-slate-800 dark:bg-slate-950 flex items-center justify-center">
                  {info.thumbnails[0] ? (
                    <img
                      src={info.thumbnails[0]}
                      alt="Cover Preview"
                      className="w-full h-full object-contain filter"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs font-bold">PDF Document</div>
                  )}
                  {password && passwordsMatch && (
                    <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-3 animate-in fade-in">
                      <ShieldCheck size={36} className="text-emerald-400 mb-1" />
                      <span className="text-xs font-black">Encrypted</span>
                      <span className="text-[10px] text-blue-100">{algorithm}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {info.file.name}
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {info.pages} Page(s) • {formatBytes(info.file.size)}
                  </p>
                </div>
              </div>

              {/* Zero Server Upload Security Banner */}
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs dark:bg-emerald-950/20 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck size={16} />
                  <span>100% Client-Side Privacy Guaranteed</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your password and document never touch any external server. Encryption is executed directly in your browser's hardware crypto engine.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
