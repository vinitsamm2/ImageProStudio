import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  GraduationCap,
  Loader2,
  QrCode,
  Share2,
  ShieldCheck,
  Smartphone,
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

  useEffect(() => {
    if (!isOpen || !file) {
      setQrDataUrl("");
      setDownloadUrl("");
      setLoading(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-slate-900 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-500 text-white shadow-sm shadow-cyan-500/20">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Download on Mobile
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scan QR Code with Phone Camera
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-white"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div className="py-5 space-y-5 text-center">
          {/* File Badge */}
          <div className="inline-flex max-w-full items-center gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:bg-indigo-950/30 dark:text-slate-200">
            <span className="truncate font-bold" title={current.name}>
              {current.name}
            </span>
            <span className="shrink-0 rounded-md bg-indigo-600 px-1.5 py-0.2 font-mono text-[10px] font-bold text-white">
              {formatBytes(fileSize)}
            </span>
          </div>

          {/* QR Code Container */}
          <div className="relative mx-auto flex h-64 w-64 items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-3 shadow-inner dark:border-white/[0.1] dark:bg-white">
            {loading ? (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Loader2 size={28} className="animate-spin text-cyan-600" />
                <span className="text-xs font-semibold">Generating QR Code...</span>
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Scan to download on mobile"
                className="h-full w-full rounded-xl object-contain shadow-xs"
              />
            ) : (
              <div className="text-xs text-slate-400">
                Failed to generate QR Code. Use direct share below.
              </div>
            )}
          </div>

          {/* Scan Instructions */}
          <div className="space-y-1">
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
              <Smartphone size={14} className="text-emerald-500" />
              <span>Point your phone camera to download</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              iPhone Camera, Google Lens, or any QR scanner downloads directly to your device.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleNativeShare}
              className="btn-primary py-2.5 text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
            >
              <Share2 size={13} />
              <span>Share File</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="btn-secondary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copied ? "Link Copied!" : "Copy Link"}</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06] text-xs">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="text-slate-500 hover:text-emerald-600 font-semibold transition"
            >
              Share via WhatsApp
            </button>

            <button
              type="button"
              onClick={() => downloadBlob(current.blob, current.name)}
              className="font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 flex items-center gap-1"
            >
              <Download size={12} />
              <span>Save on Computer</span>
            </button>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-center">
          <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1">
            <ShieldCheck size={12} />
            <span>Local Transfer • 100% Free & Unlimited • Zero Server Uploads</span>
          </p>
        </div>
      </div>
    </div>
  );
}
