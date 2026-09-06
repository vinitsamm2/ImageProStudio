import { useEffect, useState } from "react";

export default function FontSizeScaleControl({
  className = ""
}: {
  className?: string;
}) {
  const [scale, setScale] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("imagepro-font-scale");
      if (saved) {
        const parsed = Number(saved);
        if (parsed >= 80 && parsed <= 130) return parsed;
      }
    }
    return 100;
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (scale === 100) {
        document.documentElement.style.removeProperty("font-size");
      } else {
        document.documentElement.style.fontSize = `${scale}%`;
      }
      localStorage.setItem("imagepro-font-scale", String(scale));
    }
  }, [scale]);

  const decrease = () => {
    setScale((prev) => Math.max(80, prev - 5));
  };

  const increase = () => {
    setScale((prev) => Math.min(130, prev + 5));
  };

  const reset = () => {
    setScale(100);
  };

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-slate-200/80 bg-slate-50/90 p-0.5 dark:border-white/[0.08] dark:bg-slate-900/80 shadow-xs ${className}`}
      role="group"
      aria-label="Font Size Adjuster"
    >
      {/* Font Decreaser Button */}
      <button
        type="button"
        onClick={decrease}
        disabled={scale <= 80}
        className="flex h-7 px-2 items-center justify-center rounded-lg text-xs font-bold text-slate-600 transition hover:bg-white hover:text-cyan-600 disabled:opacity-30 disabled:pointer-events-none dark:text-slate-300 dark:hover:bg-slate-800"
        title="Decrease Font Size (A-)"
        aria-label="Decrease Font Size"
      >
        <span className="text-[11px] font-extrabold tracking-tighter">A-</span>
      </button>

      {/* Font Scale Indicator / Reset Button */}
      <button
        type="button"
        onClick={reset}
        className={`flex h-7 min-w-[42px] px-1.5 items-center justify-center rounded-lg text-[10px] font-mono font-bold transition ${
          scale !== 100
            ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20"
            : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        }`}
        title="Reset Font Size to 100% (Default)"
        aria-label={`Current font size ${scale}%. Click to reset.`}
      >
        {scale}%
      </button>

      {/* Font Increaser Button */}
      <button
        type="button"
        onClick={increase}
        disabled={scale >= 130}
        className="flex h-7 px-2 items-center justify-center rounded-lg text-xs font-bold text-slate-600 transition hover:bg-white hover:text-cyan-600 disabled:opacity-30 disabled:pointer-events-none dark:text-slate-300 dark:hover:bg-slate-800"
        title="Increase Font Size (A+)"
        aria-label="Increase Font Size"
      >
        <span className="text-[12px] font-extrabold tracking-tighter">A+</span>
      </button>
    </div>
  );
}
