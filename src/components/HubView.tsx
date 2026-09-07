import { motion } from "framer-motion";
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  HardDrive,
  Info,
  Linkedin,
  Lock,
  ShieldCheck,
  Sparkles,
  Upload,
  Zap
} from "lucide-react";
import { useState } from "react";
import OmniDropzone from "./OmniDropzone";
import { TOOLS, ToolCategory, ToolId } from "./ToolGrid";
import { VisitorStatsSection } from "./ui/VisitorCounter";

type HubViewProps = {
  onLaunchTool: (id: ToolId) => void;
  onOmniRoute: (id: ToolId, files: File[]) => void;
  onOpenAbout?: () => void;
};

export default function HubView({ onLaunchTool, onOmniRoute, onOpenAbout }: HubViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>("all");
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const filteredTools = TOOLS.filter((t) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "image") return t.category === "image" || t.id === "image-to-pdf";
    if (selectedCategory === "pdf") return t.category === "pdf";
    return true;
  });

  return (
    <div className="space-y-16 pb-16">
      {/* Cinematic Hero */}
      <section className="relative pt-6 sm:pt-10">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-sm"
          >
            <GraduationCap size={15} className="text-emerald-500 animate-pulse" />
            <span>Created for Students & Employees • 100% Accepted for All Examination & Job Forms</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-tight"
          >
            Turn Any File into{" "}
            <span className="bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-500 bg-clip-text text-transparent">
              Perfection.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mx-auto max-w-3xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300"
          >
            Engineered specifically for Students & Employees filling competitive examinations and recruitment forms (UPSC, SSC, NEET, JEE, GATE, IBPS, State PSC, Universities & Corporate Portals). Resize 35×45mm passport photos, scale 10–20KB signatures, compress PDF marksheets under 200KB, watermark, sign, and convert with 100% acceptance guarantee. Free, unlimited, and private.
          </motion.p>
        </div>

        {/* Central Omni-Dropzone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mx-auto mt-10 max-w-4xl"
        >
          <OmniDropzone onRouteWithFiles={onOmniRoute} />
        </motion.div>
      </section>

      {/* Categorized Interactive App Hub */}
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              Explore The Suite
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Studio Tools & Utilities
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            {[
              { id: "all" as const, label: `All Tools (${TOOLS.length})` },
              { id: "image" as const, label: `Image Studio (${TOOLS.filter((t) => t.category === "image" || t.id === "image-to-pdf").length})` },
              { id: "pdf" as const, label: `PDF Powerhouse (${TOOLS.filter((t) => t.category === "pdf").length})` }
            ].map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Tool Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool, index) => {
            const Icon = tool.icon;
            const isHovered = hoveredCardId === tool.id;

            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onMouseEnter={() => setHoveredCardId(tool.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoveredCardId(tool.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files);
                  if (files.length) onOmniRoute(tool.id, files);
                }}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-7 transition-all duration-300 ${
                  isHovered
                    ? "border-cyan-400/90 bg-white shadow-2xl -translate-y-1.5 shadow-cyan-500/10 dark:border-cyan-500/50 dark:bg-slate-900"
                    : "border-slate-200/80 bg-white/80 shadow-soft dark:border-white/[0.08] dark:bg-slate-900/60"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div
                      className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-tr ${tool.gradient} text-white shadow-md shadow-cyan-500/20 transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon size={26} />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {tool.badge && (
                        <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300">
                          {tool.badge}
                        </span>
                      )}
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {tool.category.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-cyan-700/80 dark:text-cyan-300/80">
                    {tool.tagline}
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    Drop file or click
                  </span>
                  <button
                    type="button"
                    onClick={() => onLaunchTool(tool.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-all group-hover:bg-cyan-600 dark:bg-white dark:text-slate-900 dark:group-hover:bg-cyan-400 dark:group-hover:text-slate-950"
                  >
                    <span>Launch</span>
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Value Pillars Banner */}
      <section className="mx-auto max-w-7xl rounded-3xl border border-slate-200/80 bg-white/70 p-8 sm:p-12 shadow-soft backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/60">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Privacy First Architecture
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Engineered for Absolute Security & Speed
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Unlike cloud-based tools that send your sensitive files to remote servers, ImagePro processes 100% of data locally.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-800/40 space-y-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Lock size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Zero Server Uploads
            </h4>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Your sensitive documents, photos, marksheets, and signatures never leave your browser memory.
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 dark:border-indigo-500/20 dark:bg-indigo-950/20 space-y-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <GraduationCap size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Exam Form Fill Ready</span>
            </h4>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Exact 35×45mm photos, 10–20KB signatures, and &lt;200KB PDF marksheets strictly accepted across all govt & college portals.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-800/40 space-y-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Zap size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Instant Hardware Speed
            </h4>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Zero upload queues, no network buffering. Processing finishes in milliseconds using local CPU and WebAssembly.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-800/40 space-y-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <HardDrive size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              100% Free & Unlimited
            </h4>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Prepare unlimited photos and multi-page PDFs with zero rate limits, sign-ups, subscriptions, or paywalls.
            </p>
          </div>
        </div>

        {/* Real-time Visitor & Community Stats Banner */}
        <VisitorStatsSection className="mt-8" />

        {onOpenAbout && (
          <div className="mt-8 flex items-center justify-center">
            <button
              type="button"
              onClick={onOpenAbout}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-xs font-bold text-cyan-700 hover:bg-cyan-500/20 dark:text-cyan-300 transition-all shadow-sm"
            >
              <Info size={15} />
              <span>Learn More About ImagePro Studio & Our Team</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {/* Creator Signature */}
        <div className="mt-6 flex flex-col items-center justify-center gap-1 text-center">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Created by{" "}
            <a
              href="https://www.linkedin.com/in/vinit-sammir"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-cyan-600 hover:text-[#0077b5] dark:text-cyan-400 dark:hover:text-[#38bdf8] underline decoration-cyan-500/30 underline-offset-2 transition-colors"
              title="View Vinit Sammir on LinkedIn"
            >
              <span>Vinit Sammir</span>
              <Linkedin size={12} className="text-[#0077b5] dark:text-[#38bdf8]" />
            </a>
            , Software Engineer — Cognizant
          </p>
          <p className="text-[11px] text-slate-400">
            100% In-Browser Creative Studio • 100% Free & Unlimited Forever • Zero Server Uploads
          </p>
        </div>
      </section>
    </div>
  );
}
