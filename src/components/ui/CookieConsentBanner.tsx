import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, ShieldCheck, X } from "lucide-react";

type CookieConsentBannerProps = {
  onOpenCookiePolicy: () => void;
};

export default function CookieConsentBanner({ onOpenCookiePolicy }: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("imagepro-cookie-consent");
      if (!consent) {
        // Show after a brief delay so first paint is uninterrupted
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // ignore storage access errors
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("imagepro-cookie-consent", "accepted");
    } catch (e) {}
    setIsVisible(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem("imagepro-cookie-consent", "declined");
    } catch (e) {}
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl"
        >
          <div className="relative rounded-3xl border border-slate-200/90 bg-white/95 p-4 sm:p-5 shadow-2xl backdrop-blur-xl dark:border-white/[0.1] dark:bg-[#0c1222]/95 dark:text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Cookie size={20} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                      Privacy &amp; Cookie Transparency
                    </h4>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <ShieldCheck size={11} />
                      Zero Server Uploads
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    ImagePro Studio processes all documents locally in your browser memory. We and third parties (including Google AdSense) use cookies to support this free service, measure performance, and serve relevant advertisements based on prior visits.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={onOpenCookiePolicy}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  Learn More
                </button>
                <button
                  type="button"
                  onClick={handleDecline}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                >
                  Decline Non-Essential
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:brightness-105 transition-all"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
