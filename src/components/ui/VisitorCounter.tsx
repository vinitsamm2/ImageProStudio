import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Eye,
  Globe2,
  GraduationCap,
  Info,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap
} from "lucide-react";
import { useState } from "react";
import { useVisitorStats } from "../../lib/useVisitorStats";

/**
 * TopBar Compact Visitor Counter Badge with Live Indicator & Popover
 */
export function VisitorCounterBadge({ className = "" }: { className?: string }) {
  const { formattedTotal, compactTotal, formattedToday, activeNow } = useVisitorStats();
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/90 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:border-cyan-400 hover:bg-white dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-cyan-500/50 dark:hover:bg-slate-800 shadow-xs"
        title="View Community Usage & Live Visitor Statistics"
      >
        {/* Pulsing Live Online Indicator */}
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>

        <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px]">
          {activeNow} Live
        </span>

        <span className="text-slate-300 dark:text-slate-700">•</span>

        <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200">
          <Eye size={12} className="text-cyan-500" />
          <span>{compactTotal}</span>
        </span>

        <ChevronDown
          size={11}
          className={`text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180 text-cyan-500" : "group-hover:text-slate-600 dark:group-hover:text-slate-300"
          }`}
        />
      </button>

      {/* Popover Details Menu */}
      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl backdrop-blur-xl dark:border-white/[0.1] dark:bg-slate-900 text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-tr from-cyan-500 to-teal-500 text-white shadow-xs">
                    <Globe2 size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Visitor Statistics
                    </h4>
                    <p className="text-[10px] text-slate-400">Real-Time Community Usage</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 py-3">
                {/* Total Visitors */}
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-50/50 p-2.5 dark:border-cyan-500/20 dark:bg-cyan-950/20">
                  <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400">
                    <Eye size={13} />
                    <span className="font-mono text-[9px] font-bold uppercase">Total</span>
                  </div>
                  <div className="mt-1 font-mono text-base font-extrabold text-slate-900 dark:text-white">
                    {formattedTotal}
                  </div>
                  <p className="text-[9px] text-slate-400">All-time site visitors</p>
                </div>

                {/* Active Live */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-2.5 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="font-mono text-[9px] font-bold uppercase">Active</span>
                  </div>
                  <div className="mt-1 font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {activeNow} Online
                  </div>
                  <p className="text-[9px] text-slate-400">Students & Pros now</p>
                </div>

                {/* Today's Visits */}
                <div className="col-span-2 rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Calendar size={13} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        Visits Today
                      </p>
                      <p className="text-[9px] text-slate-400">Updated continuously</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                    {formattedToday}
                  </span>
                </div>
              </div>

              {/* Privacy Footer */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2 text-center">
                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1">
                  <ShieldCheck size={12} />
                  <span>100% In-Browser • Zero Server File Uploads</span>
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * High-Fidelity Community Stats Banner for HubView & About Page
 */
export function VisitorStatsSection({ className = "" }: { className?: string }) {
  const { formattedTotal, formattedToday, activeNow } = useVisitorStats();

  return (
    <div
      className={`rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/60 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/60 pb-4 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-500 text-white shadow-sm shadow-cyan-500/20">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Community Impact & Live Visitor Count</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                LIVE
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trusted by students, job applicants, and professionals across India & worldwide.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 self-start sm:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>{activeNow} Active Users Online Now</span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-3">
        {/* Total Visitors */}
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-tr from-cyan-500/10 via-teal-500/5 to-transparent p-4 dark:bg-slate-950/40">
          <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400">
            <Eye size={18} />
            <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold">
              ALL-TIME
            </span>
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-slate-900 dark:text-white">
            {formattedTotal}+
          </div>
          <p className="mt-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Total Site Visitors
          </p>
          <p className="text-[11px] text-slate-400">Processed without server uploads</p>
        </div>

        {/* Active Online Now */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent p-4 dark:bg-slate-950/40">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <Users size={18} />
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold">
              CONCURRENT
            </span>
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {activeNow} Live
          </div>
          <p className="mt-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Active Right Now
          </p>
          <p className="text-[11px] text-slate-400">Filling exam & job forms</p>
        </div>

        {/* Today's Visits */}
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent p-4 dark:bg-slate-950/40">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <Calendar size={18} />
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold">
              TODAY
            </span>
          </div>
          <div className="mt-2 font-mono text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {formattedToday}+
          </div>
          <p className="mt-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Visitors Today
          </p>
          <p className="text-[11px] text-slate-400">Growing student community</p>
        </div>
      </div>
    </div>
  );
}
