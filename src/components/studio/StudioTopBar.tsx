import {
  ArrowLeftRight,
  ChevronDown,
  GraduationCap,
  Grid,
  HardDrive,
  Info,
  Layers,
  Menu,
  Moon,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Wand2
} from "lucide-react";
import { useState } from "react";
import { ToolId } from "../ToolGrid";
import { STUDIO_TOOLS } from "./ToolActivityRail";
import FontSizeScaleControl from "../ui/FontSizeScaleControl";

type StudioTopBarProps = {
  activeTool: ToolId;
  onSelectTool: (id: ToolId) => void;
  isCatalogOpen: boolean;
  onToggleCatalog: () => void;
  onOpenCommandPalette: () => void;
  onOpenAbout?: () => void;
  dark: boolean;
  onToggleDark: () => void;
  onToggleMobileRail: () => void;
  onResetTool?: () => void;
  stagedFileCount: number;
};

export default function StudioTopBar({
  activeTool,
  onSelectTool,
  isCatalogOpen,
  onToggleCatalog,
  onOpenCommandPalette,
  onOpenAbout,
  dark,
  onToggleDark,
  onToggleMobileRail,
  onResetTool,
  stagedFileCount
}: StudioTopBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const currentTool = STUDIO_TOOLS.find((t) => t.id === activeTool) || STUDIO_TOOLS[0];
  const Icon = currentTool.icon;

  return (
    <header className="relative z-20 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-2xl transition-all dark:border-white/[0.08] dark:bg-slate-950/70 sm:px-6">
      {/* Left: Mobile Menu & Breadcrumb with Tool Selector */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileRail}
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.06] lg:hidden"
          title="Open Tool Menu"
        >
          <Menu size={18} />
        </button>

        {/* Tool Dropdown Breadcrumb */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50/80 px-3 py-1.5 text-xs font-bold text-slate-800 transition hover:bg-slate-100 dark:border-white/[0.06] dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <div className="grid h-5 w-5 place-items-center rounded-md bg-cyan-600 text-white shadow-xs">
              <Icon size={12} />
            </div>
            <span className="font-extrabold">{currentTool.name}</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {/* Quick Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/[0.1] dark:bg-slate-900 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Active Tool
                </div>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {STUDIO_TOOLS.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => {
                          onSelectTool(tool.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                          activeTool === tool.id
                            ? "bg-cyan-500/10 text-cyan-600 font-bold dark:text-cyan-400"
                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ToolIcon size={14} className="text-slate-400" />
                          <span>{tool.name}</span>
                        </div>
                        <kbd className="rounded bg-slate-100 px-1.5 py-0.2 font-mono text-[9px] text-slate-400 dark:bg-slate-800">
                          {tool.shortcut}
                        </kbd>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Vice-Versa Quick Action In TopBar */}
        {currentTool.viceVersaId && (
          <button
            type="button"
            onClick={() => onSelectTool(currentTool.viceVersaId!)}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-700 transition hover:bg-indigo-500/20 dark:text-indigo-300 dark:bg-indigo-950/40"
            title={`Quick switch to reciprocal tool: ${currentTool.viceVersaLabel}`}
          >
            <ArrowLeftRight size={12} className="text-indigo-500" />
            <span>Switch to {currentTool.viceVersaLabel}</span>
          </button>
        )}
      </div>

      {/* Center: Mode Capsule Toggle (Studio Canvas vs Catalog Overview) */}
      <div className="hidden md:flex items-center rounded-full border border-slate-200/80 bg-slate-100/80 p-1 dark:border-white/[0.08] dark:bg-slate-900/80">
        <button
          type="button"
          onClick={() => isCatalogOpen && onToggleCatalog()}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
            !isCatalogOpen
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Sparkles size={12} className="text-cyan-500" />
          <span>Studio Canvas</span>
        </button>
        <button
          type="button"
          onClick={() => !isCatalogOpen && onToggleCatalog()}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all ${
            isCatalogOpen
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Grid size={12} />
          <span>Catalog View</span>
        </button>
      </div>

      {/* Right: Search, Sandbox Badge, Theme Toggle */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/90 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
          title="Open Command Palette (⌘K)"
        >
          <Search size={13} className="text-cyan-500" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="rounded bg-white px-1.5 py-0.2 font-mono text-[10px] text-slate-400 dark:bg-slate-800">
            ⌘K
          </kbd>
        </button>

        {/* Exam Form Fill & 100% Free Badge */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 shadow-xs" title="Created for Students & Employees • 100% Accepted for All Examination & Job Forms">
          <GraduationCap size={13} className="text-emerald-500" />
          <span>Exam Form Fill Ready • 100% Free</span>
        </div>

        {/* About Us Trigger */}
        {onOpenAbout && (
          <button
            type="button"
            onClick={onOpenAbout}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/90 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-white hover:text-cyan-600 dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800"
            title="About ImagePro Studio"
          >
            <Info size={13} className="text-cyan-500" />
            <span>About Us</span>
          </button>
        )}

        {/* Global Accessibility Font Increaser & Decreaser */}
        <FontSizeScaleControl className="hidden sm:inline-flex" />

        {/* Dark/Light Switcher */}
        <button
          type="button"
          onClick={onToggleDark}
          className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-white hover:text-slate-900 dark:border-white/[0.08] dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          title={`Toggle ${dark ? "Light" : "Dark"} mode`}
        >
          {dark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
        </button>

        {/* Reset Session / Tool */}
        {onResetTool && (
          <button
            type="button"
            onClick={onResetTool}
            className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:border-white/[0.08] dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-rose-950/30"
            title="Reset current tool"
          >
            <RotateCcw size={13} />
          </button>
        )}
      </div>
    </header>
  );
}
