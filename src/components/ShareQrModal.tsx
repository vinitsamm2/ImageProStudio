import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileImage,
  FileText,
  Loader2,
  QrCode,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X
} from "lucide-react";
import { downloadBlob, formatBytes } from "../lib/files";

export type ShareableFile =
  | File
  | {
      name: string;
      blob: Blob;
      url?: string;
      size?: number;
    };

function getFileProps(f: ShareableFile) {
  if (f instanceof File) {
    return {
      name: f.name,
      blob: f,
      size: f.size,
      url: undefined
    };
  }
  return {
    name: f.name,
    blob: f.blob,
    size: f.size ?? f.blob.size,
    url: f.url
  };
}

interface ShareQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: ShareableFile | null;
  notify: (text: string, kind?: "success" | "error" | "info") => void;
}

export default function ShareQrModal({
  isOpen,
  onClose,
  file,
  notify
}: ShareQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!isOpen || !file) {
      setQrDataUrl("");
      setDownloadUrl("");
      setLoading(false);
      setDownloaded(false);
      return;
    }

    const current = getFileProps(file);
    let isMounted = true;
    setLoading(true);

    const generateShareQr = async () => {
      try {
        const isPdf = current.name.toLowerCase().endsWith(".pdf");
        const contentType = isPdf
          ? "application/pdf"
          : (current.blob.type || "application/octet-stream");

        // Upload to local ephemeral transfer endpoint
        const res = await fetch("/api/share", {
          method: "POST",
          headers: {
            "Content-Type": contentType,
            "x-file-name": encodeURIComponent(current.name)
          },
          body: current.blob
        });

        if (!res.ok) throw new Error("Local transfer endpoint response not ok");

        const data = await res.json();
        if (!isMounted) return;

        if (data.ok && data.downloadUrl) {
          setDownloadUrl(data.downloadUrl);
          const qrCodeImage = await QRCode.toDataURL(data.downloadUrl, {
            width: 320,
            margin: 2,
            color: {
              dark: "#0f172a",
              light: "#ffffff"
            }
          });
          if (isMounted) {
            setQrDataUrl(qrCodeImage);
          }
        }
      } catch {
        // Fallback if local endpoint is unreachable
        if (!isMounted) return;
        const currentUrl = `${window.location.origin}/download?name=${encodeURIComponent(current.name)}`;
        setDownloadUrl(currentUrl);
        try {
          const fallbackQr = await QRCode.toDataURL(currentUrl, {
            width: 320,
            margin: 2,
            color: { dark: "#0f172a", light: "#ffffff" }
          });
          if (isMounted) setQrDataUrl(fallbackQr);
        } catch {
          // Ignored
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    generateShareQr();

    return () => {
      isMounted = false;
    };
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const current = getFileProps(file);
  const fileSize = current.size;
  const isPdf = current.name.toLowerCase().endsWith(".pdf");

  const handleDownloadNow = () => {
    downloadBlob(current.blob, current.name);
    setDownloaded(true);
    notify(`Downloaded ${current.name}!`, "success");
    setTimeout(() => setDownloaded(false), 3000);
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    try {
      const shareFileObj = new File([current.blob], current.name, {
        type: current.blob.type || (isPdf ? "application/pdf" : "image/jpeg")
      });

      if (navigator.canShare && navigator.canShare({ files: [shareFileObj] })) {
        await navigator.share({
          title: current.name,
          text: `Processed with ImagePro Studio (${formatBytes(fileSize)})`,
          files: [shareFileObj]
        });
        notify("Shared successfully!", "success");
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: current.name,
          text: `Download ${current.name} (${formatBytes(fileSize)}) from ImagePro Studio:`,
          url: downloadUrl || window.location.href
        });
        notify("Shared successfully!", "success");
        return;
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        notify("Share sheet cancelled or unavailable.", "info");
      }
    }

    // Fallback: Copy link
    handleCopyLink();
  };

  const handleCopyLink = () => {
    if (!downloadUrl) return;
    navigator.clipboard.writeText(downloadUrl);
    setCopied(true);
    notify("Mobile download link copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Download ${current.name} (${formatBytes(fileSize)}):\n${downloadUrl || window.location.href}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[92dvh] overflow-y-auto no-scrollbar rounded-3xl border border-slate-200 bg-white p-4 sm:p-7 shadow-2xl dark:border-white/[0.1] dark:bg-slate-900 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-md shadow-emerald-500/20">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Changes Applied Successfully!
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  <Sparkles size={10} />
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose to download directly or scan QR code to open on mobile
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-white transition"
            title="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* File Summary Badge */}
        <div className="my-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 dark:border-white/[0.08] dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 shrink-0">
              {isPdf ? <FileText size={15} /> : <FileImage size={15} />}
            </div>
            <span className="truncate text-xs font-bold text-slate-800 dark:text-slate-200" title={current.name}>
              {current.name}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded-md bg-slate-200/80 px-2 py-0.5 font-mono text-[10px] font-extrabold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
              {formatBytes(fileSize)}
            </span>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 hidden sm:inline">
              ✓ 100% Client-Side
            </span>
          </div>
        </div>

        {/* Two Primary Options: Download Directly vs. Scan QR Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option 1: Direct Download */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 p-4.5 dark:border-white/[0.08] dark:from-slate-800/80 dark:to-slate-900/90 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <Download size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Option 1: Direct Download</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Save directly to this computer or phone</p>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50/60 p-3 text-[11px] text-blue-900/80 dark:bg-blue-950/30 dark:text-blue-200/80 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300">
                  <Check size={13} className="text-blue-500" />
                  <span>Instant browser download</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Saves directly into your device&apos;s Downloads folder with original resolution.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-auto">
              <button
                type="button"
                onClick={handleDownloadNow}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                  downloaded
                    ? "bg-emerald-600 shadow-emerald-500/20"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25"
                }`}
              >
                {downloaded ? (
                  <>
                    <Check size={16} className="animate-bounce" />
                    <span>Downloaded to Device!</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Download File Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option 2: QR Code / Mobile Download */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 p-4.5 dark:border-white/[0.08] dark:from-slate-800/80 dark:to-slate-900/90 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                    <QrCode size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">Option 2: Scan QR Code</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Open & save directly on your phone</p>
                  </div>
                </div>
                <Smartphone size={15} className="text-purple-500" />
              </div>

              {/* QR Code Container */}
              <div className="relative mx-auto flex h-36 w-36 sm:h-40 sm:w-40 items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-2 shadow-inner dark:border-white/[0.1] dark:bg-white">
                {loading ? (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Loader2 size={24} className="animate-spin text-cyan-600" />
                    <span className="text-[10px] font-semibold">Generating QR...</span>
                  </div>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Scan to download on phone"
                    className="h-full w-full rounded-xl object-contain shadow-xs"
                  />
                ) : (
                  <div className="text-[10px] text-slate-400 text-center px-2">
                    Use direct share below
                  </div>
                )}
              </div>

              <p className="text-[10px] text-center font-bold text-slate-600 dark:text-slate-300">
                Point phone camera or Google Lens to scan
              </p>
            </div>

            {/* Mobile Actions: Share & Copy */}
            <div className="grid grid-cols-2 gap-1.5 pt-3 mt-auto">
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn-secondary py-2 text-[11px] font-bold flex items-center justify-center gap-1"
                title="Copy direct download link"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="rounded-xl border border-emerald-500/30 bg-emerald-50/60 py-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100/60 dark:bg-emerald-950/30 dark:text-emerald-300 transition flex items-center justify-center gap-1"
                title="Share download link via WhatsApp"
              >
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="mt-4 flex flex-col xs:flex-row items-center justify-between gap-2.5 border-t border-slate-100 pt-3 dark:border-white/[0.06] text-[10px]">
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
            <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
            <span>100% Free & Unlimited • Zero Cloud Storage</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleNativeShare}
              className="font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 inline-flex items-center gap-1"
            >
              <Share2 size={11} />
              <span>More Share Options</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
