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

      {/* Ongoing Curation & Structural Maintenance Banner */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-50/40 p-4 dark:border-white/[0.08] dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Ongoing Curation &amp; Structural Maintenance</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                Active 2026 Standards
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Verified against current UPSC, SSC, NTA (NEET/JEE), and IBPS portal technical bulletins. Maintained by Vinit Sammir (Software Engineer, Cognizant).
            </p>
          </div>
        </div>
        <div className="text-[11px] font-mono text-slate-400 shrink-0 sm:text-right">
          Build v1.2.4 • Client Engine
        </div>
      </div>

      {/* Official Exam Portal Upload Specification Matrix */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-xs backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/[0.06]">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Official Exam Portal Specification Standards Reference</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Reference dimensions, file size limits, and formats mandated by major recruitment &amp; entrance exam boards:
            </p>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2.5 pr-4">Authority / Examination</th>
                <th className="py-2.5 px-4">Photo Dimensions</th>
                <th className="py-2.5 px-4">Signature Specifications</th>
                <th className="py-2.5 px-4">Document / PDF Cap</th>
                <th className="py-2.5 pl-4">Background &amp; Format</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-600 dark:text-slate-300">
              <tr>
                <td className="py-2.5 pr-4 font-bold text-slate-900 dark:text-white">UPSC Civil Services</td>
                <td className="py-2.5 px-4">350×350 to 1000×1000 px (35×45mm, 20–50 KB)</td>
                <td className="py-2.5 px-4">350×350 to 1000×1000 px (10–20 KB)</td>
                <td className="py-2.5 px-4">&lt; 300 KB PDF</td>
                <td className="py-2.5 pl-4">JPG, Plain white background</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-bold text-slate-900 dark:text-white">SSC (CGL, CHSL, MTS)</td>
                <td className="py-2.5 px-4">3.5 cm × 4.5 cm (20–50 KB)</td>
                <td className="py-2.5 px-4">4.0 cm × 2.0 cm (10–20 KB)</td>
                <td className="py-2.5 px-4">&lt; 200 KB PDF</td>
                <td className="py-2.5 pl-4">JPG/JPEG, Light background</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-bold text-slate-900 dark:text-white">NTA NEET UG &amp; JEE Main</td>
                <td className="py-2.5 px-4">10–200 KB (80% face coverage, ears visible)</td>
                <td className="py-2.5 px-4">4–30 KB (Running handwriting)</td>
                <td className="py-2.5 px-4">50–300 KB PDF</td>
                <td className="py-2.5 pl-4">JPG/PDF, White background</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-bold text-slate-900 dark:text-white">IBPS (PO, Clerk, SO)</td>
                <td className="py-2.5 px-4">200×230 px (20–50 KB)</td>
                <td className="py-2.5 px-4">140×60 px (10–20 KB, Black ink)</td>
                <td className="py-2.5 px-4">&lt; 500 KB PDF</td>
                <td className="py-2.5 pl-4">JPG/JPEG format</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-bold text-slate-900 dark:text-white">State PSCs &amp; Universities</td>
                <td className="py-2.5 px-4">Exact 35×45mm / &le; 50 KB</td>
                <td className="py-2.5 px-4">Exact 35×15mm / &le; 20 KB</td>
                <td className="py-2.5 px-4">&lt; 100 KB or 200 KB PDF</td>
                <td className="py-2.5 pl-4">Standard JPG or PDF</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* In-Browser Technical Deep Dive: Why Client-Side Processing is Superior */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-5 sm:p-6 shadow-xs backdrop-blur-md dark:border-white/[0.08] dark:bg-slate-900/50 space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Zap size={16} className="text-amber-500" />
          <span>How In-Browser Image &amp; Document Processing Works</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">Iterative Binary Compression Engine</h4>
            <p>
              When you specify a target file size in KB (e.g. exactly 50 KB for an exam photo or &lt; 200 KB for a PDF marksheet), ImagePro Studio uses an iterative binary search algorithm over quantization tables. It calculates the mathematically optimal JPEG quality parameter down to 0.01 precision, and intelligently downscales pixel dimensions only when necessary, avoiding compression artifacts and preserving fine facial and text features.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">True Zero-Network Confidentiality</h4>
            <p>
              Traditional cloud utilities upload your private identity files to remote third-party servers, creating data privacy and interception risks. ImagePro Studio executes 100% of image rendering, bicubic resampling, and vector PDF compilation inside your browser’s isolated JavaScript sandbox. Zero bytes leave your device, ensuring total compliance with privacy laws and zero breach risks.
            </p>
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
