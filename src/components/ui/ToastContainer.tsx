import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type Toast = {
  id: string;
  text: string;
  kind: "success" | "error" | "info";
};

export default function ToastContainer({
  toasts,
  onDismiss
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.kind === "success";
          const isError = toast.kind === "error";

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-center gap-3 rounded-2xl border p-3.5 shadow-xl backdrop-blur-xl transition-all ${
                isSuccess
                  ? "border-emerald-500/30 bg-white/95 text-slate-800 dark:border-emerald-500/30 dark:bg-slate-900/95 dark:text-emerald-100 shadow-emerald-500/5"
                  : isError
                  ? "border-rose-500/30 bg-white/95 text-slate-800 dark:border-rose-500/30 dark:bg-slate-900/95 dark:text-rose-100 shadow-rose-500/5"
                  : "border-cyan-500/30 bg-white/95 text-slate-800 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 shadow-cyan-500/5"
              }`}
            >
              <div
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl text-white ${
                  isSuccess
                    ? "bg-emerald-500 shadow-sm shadow-emerald-500/30"
                    : isError
                    ? "bg-rose-500 shadow-sm shadow-rose-500/30"
                    : "bg-cyan-500 shadow-sm shadow-cyan-500/30"
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 size={16} />
                ) : isError ? (
                  <AlertCircle size={16} />
                ) : (
                  <Info size={16} />
                )}
              </div>

              <p className="min-w-0 flex-1 text-xs font-semibold leading-relaxed">
                {toast.text}
              </p>

              <button
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
