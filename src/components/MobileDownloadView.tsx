import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileCheck,
  FileImage,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  Share2,
  ShieldCheck,
  Smartphone,
  Wand2
} from "lucide-react";
import { formatBytes } from "../lib/files";

interface FileMeta {
  name: string;
  size: number;
  type: string;
}

export default function MobileDownloadView({
  downloadId,
  onGoToStudio
}: {
  downloadId: string;
  onGoToStudio: () => void;
}) {
  const [meta, setMeta] = useState<FileMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const directFileUrl = `/api/share/file/${downloadId}`;

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`/api/share/info/${downloadId}`);
        if (!res.ok) throw new Error("File expired or not found on transfer session.");
        const data = await res.json();
        if (data.ok) {
          setMeta({ name: data.name, size: data.size, type: data.type });
        } else {
          setError(data.error || "File expired.");
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [downloadId]);

  const handleDownload = () => {
    setDownloading(true);
    const link = document.createElement("a");
    link.href = directFileUrl;
    link.download = meta?.name || "download";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => setDownloading(false), 2000);
  };

  const handleShareMobile = async () => {
    if (!meta) return;
    try {
      const res = await fetch(directFileUrl);
      const blob = await res.blob();
      const file = new File([blob], meta.name, { type: meta.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: meta.name
        });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  const isPdf = meta?.name.toLowerCase().endsWith(".pdf");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-500 text-white shadow-md">
            <Wand2 size={18} />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
              Image<span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Pro</span>
              <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 text-[9px] font-mono font-bold text-cyan-400">
                MOBILE
              </span>
            </span>
            <p className="text-[10px] text-slate-400 font-medium">100% Free & Unlimited</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onGoToStudio}
          className="rounded-xl border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/[0.1]"
        >
          Open Studio
        </button>
      </header>

      {/* Main Card */}
      <main className="my-auto py-8 max-w-sm mx-auto w-full space-y-6 text-center">
        {loading ? (
          <div className="rounded-3xl border border-white/[0.08] bg-slate-900/80 p-8 space-y-4">
            <Loader2 size={36} className="animate-spin text-cyan-400 mx-auto" />
            <p className="text-sm font-bold text-slate-300">Retrieving file from your computer...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6 space-y-3">
            <p className="text-sm font-bold text-rose-400">File Expired or Unavailable</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transfer sessions expire after 1 hour or when the computer's dev server stops.
            </p>
            <button
              type="button"
              onClick={onGoToStudio}
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              Go to ImagePro Studio
            </button>
          </div>
        ) : meta ? (
          <div className="rounded-3xl border border-white/[0.1] bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl space-y-6">
            {/* File Icon & Badge */}
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-teal-500/10 to-indigo-500/20 border border-cyan-500/30 text-cyan-400">
              {isPdf ? <FileText size={36} className="text-rose-400" /> : <FileImage size={36} />}
              <span className="absolute -bottom-2 -right-2 rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                Ready
              </span>
            </div>

            {/* File Information */}
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-white truncate px-2" title={meta.name}>
                {meta.name}
              </h2>
              <div className="flex items-center justify-center gap-2 font-mono text-xs text-slate-400">
                <span className="font-bold text-cyan-400">{formatBytes(meta.size)}</span>
                <span>•</span>
                <span className="uppercase">{isPdf ? "PDF Document" : "Image File"}</span>
              </div>
            </div>

            {/* Exam Acceptance Banner */}
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-xs text-indigo-200 text-left flex items-start gap-2.5">
              <GraduationCap size={18} className="text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-indigo-300">Exam Form Ready</p>
                <p className="text-[11px] text-indigo-200/80 leading-snug">
                  Calibrated for 100% acceptance on UPSC, SSC, NEET, JEE & University portals.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="btn-primary w-full py-3.5 text-sm font-extrabold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Download to Mobile</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShareMobile}
                className="btn-secondary w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Share2 size={15} />
                <span>Save to Files / Share</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Security & Creator Note */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-[11px] font-bold text-emerald-400">
            <ShieldCheck size={13} />
            <span>Direct Computer-to-Mobile Transfer • 100% Free</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Created by <strong className="text-slate-400">Vinit Sammir</strong>, Software Engineer — Cognizant
          </p>
        </div>
      </main>

      {/* Mobile Footer */}
      <footer className="text-center text-[10px] text-slate-500 border-t border-white/[0.06] pt-4">
        ImagePro Studio • 100% Free Unlimited In-Browser Document & Photo Suite
      </footer>
    </div>
  );
}
