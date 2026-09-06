import {
  Command,
  Grid,
  Lock,
  Moon,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  Wand2
} from "lucide-react";

type HeaderProps = {
  dark: boolean;
  onToggleDark: () => void;
  onOpenCommandPalette: () => void;
  viewMode: "studio" | "gallery";
  onSetViewMode: (mode: "studio" | "gallery") => void;
  onResetTool: () => void;
};

export default function Header({
  dark,
  onToggleDark,
  onOpenCommandPalette,
  viewMode,
  onSetViewMode,
  onResetTool
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-2xl transition-colors dark:border-white/[0.08] dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <button
          onClick={onResetTool}
          className="group flex items-center gap-3 text-left transition focus:outline-none"
          aria-label="ImagePro Tools Home"
        >
          <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-indigo-600 text-white shadow-md shadow-cyan-500/25 transition-transform duration-200 group-hover:scale-105">
            <Wand2 size={20} className="transition-transform duration-300 group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                Image<span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">Pro</span>
              </span>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase text-cyan-700 dark:text-cyan-300">
                Studio
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Private Client-Side Suite
            </p>
          </div>
        </button>

        {/* View Switcher: Studio Workspace vs All Tools Gallery */}
        <div className="hidden md:flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={() => onSetViewMode("studio")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === "studio"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Sliders size={13} />
            Studio Workspace
          </button>
          <button
            type="button"
            onClick={() => onSetViewMode("gallery")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === "gallery"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Grid size={13} />
            All Tools Gallery
          </button>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          {/* Command Palette Button */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-100/70 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Search size={14} className="text-cyan-500" />
            <span className="hidden sm:inline">Search Tools</span>
            <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800">
              ⌘K
            </kbd>
          </button>

          {/* Privacy Badge */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>100% In-Browser</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDark}
            className="btn-secondary h-9 w-9 p-0 rounded-xl"
            aria-label="Toggle theme"
            title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {dark ? (
              <Sun size={17} className="text-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon size={17} className="text-slate-700 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
