import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Lock,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";
import { ToolId, TOOLS } from "../ToolGrid";
import { TOOL_ROUTES } from "../../lib/toolRoutes";

type ToolSeoSectionProps = {
  toolId: ToolId;
  onSelectTool: (id: ToolId) => void;
};

export default function ToolSeoSection({ toolId, onSelectTool }: ToolSeoSectionProps) {
  const seo = TOOL_ROUTES[toolId];
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  if (!seo) return null;

  const relatedTools = (seo.relatedToolIds || [])
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <div className="mt-12 space-y-8 pt-8 border-t border-slate-200/80 dark:border-white/[0.08]">
      {/* Header & Tagline */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
          <Sparkles size={13} />
          <span>Official Tool Guide & Specifications</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {seo.h1}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {seo.tagline}
        </p>
      </div>

      {/* 3-Step How-To Guide */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Zap size={16} className="text-blue-600 dark:text-blue-400" />
          <span>How to use this tool in 3 easy steps</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {seo.howToSteps.map((step) => (
            <div
              key={step.step}
              className="relative rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-xs backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/50 space-y-2.5 transition-all hover:border-blue-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-black text-white shadow-xs">
                  {step.step}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step {step.step}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {step.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust & Portal Compliance Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 dark:border-white/[0.08] dark:bg-slate-900/40 flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">100% Client-Side Privacy</h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Files never touch external servers or clouds.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 dark:border-white/[0.08] dark:bg-slate-900/40 flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Official Portal Standard</h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">UPSC, SSC, NEET, JEE & corporate form verified.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 dark:border-white/[0.08] dark:bg-slate-900/40 flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <Zap size={18} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Instant Processing</h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Hardware-accelerated WebAssembly rendering.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 dark:border-white/[0.08] dark:bg-slate-900/40 flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
            <Lock size={18} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">No Watermarks or Caps</h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Unlimited document conversions forever.</p>
          </div>
        </div>
      </div>

      {/* Tool-Specific FAQ Accordion */}
      {seo.faqs.length > 0 && (
        <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-white/[0.06]">
            <HelpCircle size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-2.5">
            {seo.faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/70 bg-slate-50/50 dark:border-white/[0.06] dark:bg-slate-800/30 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left cursor-pointer gap-3"
                  >
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {faq.question}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-blue-600 dark:text-blue-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/50 dark:border-white/[0.04]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Related Tools Recommendations */}
      {relatedTools.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Related Tools You May Need
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {relatedTools.map((t) => {
              if (!t) return null;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTool(t.id)}
                  className="group rounded-2xl border border-slate-200/80 bg-white/70 p-3.5 text-left shadow-xs backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/50 hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {t.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {t.tagline}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
