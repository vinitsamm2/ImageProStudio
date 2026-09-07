import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Cpu,
  ExternalLink,
  Github,
  HardDrive,
  Heart,
  Info,
  Linkedin,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
  Zap
} from "lucide-react";
import { useState } from "react";
import { useVisitorStats } from "../lib/useVisitorStats";

type AboutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenTool?: (toolId: any) => void;
};

type TabId = "story" | "privacy" | "engine" | "values";

export default function AboutModal({ isOpen, onClose, onOpenTool }: AboutModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("story");
  const { formattedTotal, activeNow } = useVisitorStats();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-white/[0.1] dark:bg-[#0b0f19] dark:text-white"
        >
          {/* Top Ambient Glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-indigo-500/20 blur-3xl" />

          {/* Modal Header */}
          <div className="relative flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-500 text-white shadow-md shadow-cyan-500/25">
                <Wand2 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                    About Image<span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Pro</span> Studio
                  </h2>
                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    v1.2.0 PRO
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  The Local-First In-Browser Media Workstation
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

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200/80 px-6 pt-2 bg-slate-50/50 dark:border-white/[0.06] dark:bg-slate-900/30">
            {[
              { id: "story" as const, label: "Our Story & Mission", icon: Sparkles },
              { id: "privacy" as const, label: "100% Privacy Guarantee", icon: ShieldCheck },
              { id: "engine" as const, label: "Architecture & Engine", icon: Cpu },
              { id: "values" as const, label: "Our Philosophy", icon: Heart }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? "text-cyan-600 dark:text-cyan-400"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="about-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-teal-500"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Body */}
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
            {activeTab === "story" && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Why We Created ImagePro Studio
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white">Created for Students and Employees:</strong> Millions of students and job applicants face frustrating upload rejections when submitting online forms for competitive examinations (UPSC, SSC, NEET, JEE, GATE, IBPS, State PSC, University Admissions) and corporate recruitment portals. Strict rules demand exact 35×45mm passport photos, 35×15mm signature boxes, 10–20KB file size caps, and &lt;200KB PDF marksheets.
                  </p>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white">100% Form Acceptance Guarantee:</strong> We engineered ImagePro Studio to ensure every single photo, signature, and document is 100% compliant and guaranteed to be accepted by exam portals on the very first upload. Best of all, it runs entirely inside your browser using client-side WebAssembly, Canvas, and JavaScript with zero server uploads, zero subscription paywalls, and unlimited free use.
                  </p>
                </div>

                {/* 4 Metric Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-50/50 p-3 dark:bg-cyan-950/20 text-center">
                    <div className="text-xl font-black text-cyan-600 dark:text-cyan-400">0 KB</div>
                    <div className="mt-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      Zero Uploads
                    </div>
                    <p className="mt-0.5 text-[9px] text-slate-400">100% in-browser</p>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-3 dark:bg-emerald-950/20 text-center">
                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">100%</div>
                    <div className="mt-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      Private & Offline
                    </div>
                    <p className="mt-0.5 text-[9px] text-slate-400">Zero data retention</p>
                  </div>

                  <div className="rounded-2xl border border-indigo-500/20 bg-indigo-50/50 p-3 dark:bg-indigo-950/20 text-center">
                    <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">100% Free</div>
                    <div className="mt-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      Forever Unlimited
                    </div>
                    <p className="mt-0.5 text-[9px] text-slate-400">Zero subscriptions</p>
                  </div>

                  <div className="rounded-2xl border border-teal-500/20 bg-teal-50/50 p-3 dark:bg-teal-950/20 text-center">
                    <div className="text-xl font-black text-teal-600 dark:text-teal-400">{formattedTotal}</div>
                    <div className="mt-0.5 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      <span>{activeNow} Online</span>
                    </div>
                    <p className="mt-0.5 text-[9px] text-slate-400">Total Site Visits</p>
                  </div>
                </div>

                {/* Creator Profile Card */}
                <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-indigo-500/10 p-4 dark:border-white/[0.1] dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-500 text-white font-black text-lg shadow-md shadow-cyan-500/20">
                      VS
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href="https://www.linkedin.com/in/vinit-sammir"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1 text-sm font-extrabold text-slate-900 hover:text-[#0077b5] dark:text-white dark:hover:text-[#38bdf8] transition-colors"
                          title="Open Vinit Sammir's LinkedIn Profile"
                        >
                          <span>Vinit Sammir</span>
                          <ExternalLink size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                        </a>
                        <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:text-cyan-300">
                          Creator & Engineer
                        </span>
                      </div>
                      <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                        Software Engineer — Cognizant
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-lg">
                        Created for Students and Employees to effortlessly prepare 100% accepted photos, signatures, and documents for all examination and recruitment portals.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <span className="rounded-xl border border-cyan-500/30 bg-white/90 px-3 py-1.5 text-xs font-extrabold text-slate-800 dark:border-white/[0.08] dark:bg-slate-800 dark:text-slate-200 shadow-xs">
                      Cognizant
                    </span>
                    <a
                      href="https://www.linkedin.com/in/vinit-sammir"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#0077b5]/30 bg-[#0077b5]/10 px-3 py-1.5 text-xs font-bold text-[#0077b5] hover:bg-[#0077b5] hover:text-white dark:text-[#38bdf8] dark:hover:bg-[#0077b5] dark:hover:text-white transition-all shadow-xs group"
                      title="Connect with Vinit Sammir on LinkedIn"
                    >
                      <Linkedin size={13} className="shrink-0 transition-transform group-hover:scale-110" />
                      <span>LinkedIn Profile</span>
                      <ExternalLink size={11} className="opacity-60 group-hover:opacity-100" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 dark:bg-emerald-950/30">
                  <ShieldCheck size={24} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                      Our Ironclad In-Browser Privacy Guarantee
                    </h4>
                    <p className="text-xs leading-relaxed text-emerald-700/90 dark:text-emerald-300/90">
                      When you process medical records, passports, tax documents, client photos, or personal files, they stay 100% in your device's memory. We cannot see, store, or transmit your documents because there is simply no backend server receiving them.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    How We Guarantee Zero Server Contact
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span><strong>100% Free & Unlimited Forever</strong> — Convert unlimited documents & photos with zero daily quotas, sign-ups, or paywalls.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span><strong>No file uploads</strong> — Browser <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 font-mono">Blob</code> and <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 font-mono">ArrayBuffer</code> handles files in RAM.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span><strong>No accounts or email required</strong> — Start converting immediately with no signup friction.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span><strong>No telemetry on document contents</strong> — Zero tracking or logging of file names, contents, or previews.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span><strong>Works 100% offline</strong> — You can disconnect your internet and every tool continues running smoothly.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "engine" && (
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  ImagePro Studio is built with state-of-the-art web standards to deliver desktop-grade performance directly inside modern browsers:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-white/[0.06] dark:bg-slate-900/60">
                    <div className="flex items-center gap-2">
                      <Code2 size={16} className="text-cyan-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">PDF-Lib Engine</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      High-performance pure JavaScript document generation, page rotation, image embedding, and PDF merging.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-white/[0.06] dark:bg-slate-900/60">
                    <div className="flex items-center gap-2">
                      <HardDrive size={16} className="text-teal-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">PDF.js WebAssembly Worker</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Mozilla's industry-standard vector renderer with custom DPI scaling (72 to 300+ DPI) and rasterization.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-white/[0.06] dark:bg-slate-900/60">
                    <div className="flex items-center gap-2">
                      <Zap size={16} className="text-amber-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">HTML5 Canvas 2D Pipeline</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Bicubic image resampling, aspect-ratio transformations, canvas expansion, and multi-format encoding (WebP, PNG, JPG).
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 dark:border-white/[0.06] dark:bg-slate-900/60">
                    <div className="flex items-center gap-2">
                      <RefreshCw size={16} className="text-indigo-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">JSZip Architecture</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Instant client-side multi-file archiving for one-click bulk exports without network latency.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "values" && (
              <div className="space-y-4">
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Our Core Principles
                  </h4>
                  <p>
                    <strong>1. Local-First Above All:</strong> If a task can run on the user's processor and GPU, it must run there. The browser is a powerful operating system environment.
                  </p>
                  <p>
                    <strong>2. Studio Ergonomics:</strong> Utilities shouldn't look like dated 2005 websites with intrusive ads. Creators deserve clean dark modes, responsive shortcuts, and intuitive left-to-right pipelines.
                  </p>
                  <p>
                    <strong>3. True Vice-Versa Symmetry:</strong> Every tool that converts A to B should provide a frictionless, one-click bridge back from B to A.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/[0.08] dark:bg-slate-900/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Created for Creators, Designers & Professionals
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Made with care for speed, security, and effortless workflows.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    100% Free & Unlimited
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/60 px-6 py-3.5 dark:border-white/[0.08] dark:bg-slate-900/60">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="font-bold text-emerald-600 dark:text-emerald-400">100% Free & Unlimited</span>
                <span>•</span>
                <span>In-Browser Local Engine</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1">
                <span>Created by</span>
                <a
                  href="https://www.linkedin.com/in/vinit-sammir"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-slate-800 hover:text-[#0077b5] dark:text-white dark:hover:text-[#38bdf8] transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2"
                  title="Connect on LinkedIn"
                >
                  <Linkedin size={12} className="text-[#0077b5] dark:text-[#38bdf8]" />
                  <span>Vinit Sammir</span>
                </a>
                <span>, Software Engineer — Cognizant</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn-secondary h-8 px-4 text-xs font-bold"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
