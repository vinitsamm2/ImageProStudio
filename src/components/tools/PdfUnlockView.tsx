import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  QrCode,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Unlock,
  X
} from "lucide-react";
import UploadZone from "../UploadZone";
import {
  downloadBlob,
  formatBytes,
  readPdfInfo,
  PdfFileInfo
} from "../../lib/files";
import { decryptPDF, isEncrypted } from "@pdfsmaller/pdf-decrypt";

type ToastNotify = (text: string, kind?: "success" | "error" | "info") => void;

export default function PdfUnlockView({
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
  const [file, setFile] = useState<File | null>(null);
  const [encInfo, setEncInfo] = useState<{
    encrypted: boolean;
    algorithm?: "AES-256" | "RC4";
    version?: number;
    revision?: number;
    keyLength?: number;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [unlockedBlob, setUnlockedBlob] = useState<Blob | null>(null);
  const [unlockedFile, setUnlockedFile] = useState<File | null>(null);
  const [unlockedPdfInfo, setUnlockedPdfInfo] = useState<PdfFileInfo | null>(null);

  const inspectPdf = async (picked: File) => {
    setFile(picked);
    setPassword("");
    setUnlockedBlob(null);
    setUnlockedFile(null);
    setUnlockedPdfInfo(null);
    setChecking(true);

    try {
      const buffer = await picked.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const res = await isEncrypted(bytes);
      setEncInfo(res);

      if (!res.encrypted) {
        notify("This PDF is not password protected. You can already view and edit it.", "info");
      } else {
        notify(`Encrypted PDF detected (${res.algorithm || "Protected"}). Enter password to unlock.`, "info");
      }
    } catch {
      notify("Failed to inspect PDF encryption header.", "error");
    } finally {
      setChecking(false);
    }
  };

  const load = async (files: File[]) => {
    const picked = files[0];
    if (!picked) return;
    inspectPdf(picked);
  };

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      load(initialFiles);
    }
  }, [initialFiles]);

  const handleUnlock = async () => {
    if (!file) return notify("Upload a PDF file first.", "error");
    if (!password.trim()) return notify("Please enter the document password.", "error");

    setBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const decryptedBytes = await decryptPDF(bytes, password);

      const blob = new Blob([decryptedBytes as any], { type: "application/pdf" });
      const outName = `${file.name.replace(/\.pdf$/i, "")}-unlocked.pdf`;
      const generated = new File([blob], outName, { type: "application/pdf" });

      setUnlockedBlob(blob);
      setUnlockedFile(generated);

      // Read unencrypted PDF info for page count and preview thumbnail
      try {
        const info = await readPdfInfo(generated, 1);
        setUnlockedPdfInfo(info);
      } catch {
        // Thumbnail generation optional
      }

      notify("PDF successfully unlocked! Password removed.", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Incorrect password or failed to decrypt.";
      notify(msg.includes("password") ? "Incorrect password. Please try again." : msg, "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = () => {
    if (!unlockedBlob || !unlockedFile) return;
    if (onShareFile) {
      onShareFile(unlockedFile);
    } else {
      downloadBlob(unlockedBlob, unlockedFile.name);
    }
  };

  return (
    <div className="space-y-4">
      {onSwitchViceVersa && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs dark:bg-indigo-950/20">
          <span className="font-medium text-slate-700 dark:text-indigo-200">
            Need to add a password to an unencrypted PDF? Switch to Protect PDF.
          </span>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="btn-secondary h-8 gap-1.5 px-3 text-xs font-bold cursor-pointer"
          >
            <ArrowLeftRight size={13} />
            <span>Switch to Protect PDF</span>
          </button>
        </div>
      )}

      {!file ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 text-white shadow-md shadow-indigo-500/20">
                <Unlock size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Unlock PDF</h2>
                  <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    Password Remover
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Remove passwords and restrictions from secured PDFs. Download clean, unencrypted files ready for viewing and editing.
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
            label="Drag & Drop Locked PDF Here"
            helperText="Decrypts 100% locally on your device with hardware Web Crypto acceleration"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                {unlockedBlob ? <Unlock size={20} /> : <Lock size={20} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-xs">
                    {file.name}
                  </h3>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {formatBytes(file.size)}
                  </span>
                  {encInfo?.encrypted ? (
                    <span className="rounded-full bg-rose-100 dark:bg-rose-950/50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                      Locked ({encInfo.algorithm || "Protected"})
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Not Encrypted
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {unlockedBlob ? "Unlocked and ready to download" : "Enter password to decrypt"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFile(null);
                setEncInfo(null);
                setPassword("");
                setUnlockedBlob(null);
                setUnlockedFile(null);
                setUnlockedPdfInfo(null);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 dark:border-white/[0.1] dark:bg-slate-800 dark:text-slate-300 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <X size={14} />
              <span>Change File</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Password Entry or Unlocked State */}
            <div className="lg:col-span-7 space-y-5">
              {!unlockedBlob ? (
                <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-white/[0.06]">
                    <KeyRound size={18} className="text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Enter PDF Password
                    </h4>
                  </div>

                  {checking ? (
                    <div className="flex items-center gap-2 py-4 text-xs font-bold text-slate-500">
                      <RefreshCw size={14} className="animate-spin text-indigo-600" />
                      <span>Checking PDF encryption structure...</span>
                    </div>
                  ) : encInfo?.encrypted ? (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        This document is encrypted with{" "}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {encInfo.algorithm || "Standard PDF Encryption"}
                        </span>
                        . Enter the password once to permanently remove password security from this copy.
                      </p>

                      <div className="space-y-1.5">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>Document Password</span>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
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
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUnlock();
                            }}
                            placeholder="Enter password..."
                            autoFocus
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-white/[0.08] dark:bg-slate-800/60 dark:text-white dark:focus:border-indigo-400"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleUnlock}
                        disabled={busy || !password.trim()}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-6 h-12 text-sm font-black text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {busy ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            <span>Decrypting Document...</span>
                          </>
                        ) : (
                          <>
                            <Unlock size={16} />
                            <span>Unlock & Remove Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="py-4 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        <CheckCircle2 size={16} />
                        <span>This document is already unencrypted!</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        There is no password restriction on this file. You can already open, edit, and print it without entering a password.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Unlocked Success State */
                <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 shadow-sm backdrop-blur-md dark:border-emerald-500/20 dark:bg-emerald-950/20 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        PDF Successfully Unlocked!
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        All passwords and permissions have been removed.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 h-12 text-sm font-black text-white shadow-lg shadow-emerald-500/25 hover:opacity-95 transition-all cursor-pointer"
                    >
                      <Download size={16} />
                      <span>Download Unlocked PDF</span>
                    </button>

                    {unlockedFile && onShareFile && (
                      <button
                        type="button"
                        onClick={() => onShareFile(unlockedFile)}
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 h-12 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 shadow-xs transition-all cursor-pointer"
                      >
                        <QrCode size={16} />
                        <span>Share via QR</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Visual Status & Privacy */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 flex flex-col items-center text-center space-y-3">
                <div className="relative w-40 h-56 rounded-2xl border border-slate-200 overflow-hidden shadow-md bg-slate-50 dark:border-slate-800 dark:bg-slate-950 flex items-center justify-center">
                  {unlockedPdfInfo?.thumbnails[0] ? (
                    <img
                      src={unlockedPdfInfo.thumbnails[0]}
                      alt="Unlocked Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400 p-3">
                      {unlockedBlob ? (
                        <>
                          <Unlock size={32} className="text-emerald-500" />
                          <span className="text-[11px] font-bold text-emerald-600">Unlocked</span>
                        </>
                      ) : (
                        <>
                          <Lock size={32} className="text-indigo-400" />
                          <span className="text-[11px] font-bold">Password Protected</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {unlockedFile ? unlockedFile.name : file.name}
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatBytes(unlockedFile ? unlockedFile.size : file.size)}
                  </p>
                </div>
              </div>

              {/* Zero Server Upload Security Banner */}
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs dark:bg-emerald-950/20 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck size={16} />
                  <span>Decrypted Privately In-Browser</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Decryption happens directly inside your web browser without uploading anything to a remote server. Your confidential files stay 100% private.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
