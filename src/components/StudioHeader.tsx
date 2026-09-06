import {
  ArrowLeft,
  ChevronDown,
  Command,
  GraduationCap,
  Grid,
  Lock,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Wand2
} from "lucide-react";
import { useState } from "react";
import { TOOLS, ToolId } from "./ToolGrid";

const STUDIO_TOOL_ORDER: ToolId[] = [
  "image-to-pdf",
  "resizer",
  "compressor",
  "pdf-compressor",
  "pdf-to-image",
  "pdf-splitter",
  "pdf-merger",
  "image-converter",
  "extender",
  "dimension-converter",
  "sign-pdf",
  "watermark-pdf",
  "rotate-pdf",
  "organize-pdf"
];

type StudioHeaderProps = {
  mode: "hub" | "studio";
  activeTool: ToolId;
  onSelectTool: (id: ToolId) => void;
  onBackToHub: () => void;
  onOpenCommandPalette: () => void;
  dark: boolean;
  onToggleDark: () => void;
};

export default function StudioHeader({
  mode,
  activeTool,
  onSelectTool,
  onBackToHub,
  onOpenCommandPalette,
  dark,
  onToggleDark
}: StudioHeaderProps) {
  const [toolMenuOpen, setToolMenuOpen] = useState(false);
  const currentToolDef = TOOLS.find((t) => t.id === activeTool) || TOOLS[0];
  const Icon = currentToolDef.icon;

  if (mode === "hub") {
    // Floating Capsule Dock for Hub View
    return (
      <header className="sticky top-4 z-40 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between rounded-full border border-slate-200/80 bg-white/80 px-4 py-2.5 shadow-soft backdrop-blur-2xl transition-all dark:border-white/[0.08] dark:bg-slate-900/80">
          {/* Logo */}
          <button
            type="button"
            onClick={onBackToHub}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-500 text-white shadow-sm">
              <Wand2 size={16} />
            </div>
            <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-sm sm:text-base">
              Image<span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">Pro</span>
            </span>
          </button>

          {/* Center Links / Quick Actions */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-bold border border-emerald-500/20">
              <GraduationCap size={14} className="text-emerald-500 animate-pulse" />
              Exam Form Fill Ready • 100% Free
            </span>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Command Palette Trigger */}
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-100/80 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Search size={13} className="text-cyan-500" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="rounded bg-white px-1.5 py-0.2 font-mono text-[10px] text-slate-400 dark:bg-slate-900">
                ⌘K
              </kbd>
            </button>

            {/* Privacy Badge */}
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={14} />
              <span>100% In-Browser</span>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleDark}
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-200/80 bg-white/90 text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Fullscreen Studio Workspace Header Bar with Horizontal Left-to-Right Tool Strip
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl transition-colors dark:border-white/[0.08] dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Left: Back to Hub button & Tool Switcher */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToHub}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={14} />
            <span>Back to Hub</span>
          </button>

          <span className="text-slate-300 dark:text-slate-700">/</span>

          {/* Quick Tool Switcher Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setToolMenuOpen(!toolMenuOpen)}
              className="flex items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-1.5 text-xs font-extrabold text-slate-900 transition hover:bg-slate-200/80 dark:bg-slate-800/80 dark:text-white dark:hover:bg-slate-700"
            >
              <div
                className={`grid h-5 w-5 place-items-center rounded-md bg-gradient-to-tr ${currentToolDef.gradient} text-white shadow-xs`}
              >
                <Icon size={12} />
              </div>
              <span>{currentToolDef.name}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {toolMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setToolMenuOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900">
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Active Tool
                  </p>
                  <div className="max-h-72 overflow-y-auto space-y-1">
                    {TOOLS.map((t) => {
                      const TIcon = t.icon;
                      const isCur = t.id === activeTool;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            onSelectTool(t.id);
                            setToolMenuOpen(false);
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition ${
                            isCur
                              ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold"
                              : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          <TIcon size={15} className={isCur ? "text-cyan-600" : "text-slate-400"} />
                          <span className="truncate">{t.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Search, Privacy, Theme */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-100/70 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300"
          >
            <Search size={14} className="text-cyan-500" />
            <kbd className="font-mono text-[10px] text-slate-400">⌘K</kbd>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Free & Unlimited</span>
          </div>

          <button
            type="button"
            onClick={onToggleDark}
            className="btn-secondary h-9 w-9 p-0 rounded-xl"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Horizontal Left-to-Right Tool Quick Bar */}
      <div className="border-t border-slate-200/60 bg-slate-50/70 px-4 py-2 dark:border-white/[0.06] dark:bg-slate-900/50">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto text-xs pb-0.5 scrollbar-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Studio Tools (Left ➔ Right):
          </span>
          {STUDIO_TOOL_ORDER.map((toolId) => {
            const t = TOOLS.find((item) => item.id === toolId);
            if (!t) return null;
            const TIcon = t.icon;
            const isActive = t.id === activeTool;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTool(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950"
                    : "border border-slate-200/80 bg-white/80 text-slate-600 hover:border-cyan-400 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-cyan-500"
                }`}
              >
                <TIcon size={13} className={isActive ? "text-cyan-400 dark:text-cyan-600" : "text-slate-400"} />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
