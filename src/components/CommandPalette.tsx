import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Info,
  Moon,
  Search,
  Sparkles,
  Sun,
  X
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TOOLS, ToolId } from "./ToolGrid";

type CommandPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (id: ToolId) => void;
  onOpenAbout?: () => void;
  dark: boolean;
  onToggleDark: () => void;
};

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectTool,
  onOpenAbout,
  dark,
  onToggleDark
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTools = TOOLS.filter((tool) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.tagline.toLowerCase().includes(q) ||
      tool.id.includes(q)
    );
  });

  // Reset index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredTools.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev <= 0 ? Math.max(0, filteredTools.length - 1) : prev - 1
        );
      } else if (e.key === "Enter" && filteredTools[selectedIndex]) {
        e.preventDefault();
        onSelectTool(filteredTools[selectedIndex].id);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredTools, selectedIndex, onSelectTool, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* Spotlight Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.16 }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-2xl dark:border-white/[0.1] dark:bg-slate-900/95"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 border-b border-slate-200/80 px-4 py-3.5 dark:border-slate-800">
              <Search size={18} className="text-cyan-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any tool or action (e.g. compress, pdf to image, resize)..."
                className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
              />
              <kbd className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredTools.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No tools found matching &ldquo;{query}&rdquo;
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Available Studio Tools ({filteredTools.length})
                  </div>
                  {filteredTools.map((tool, index) => {
                    const Icon = tool.icon;
                    const isSelected = selectedIndex === index;

                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => {
                          onSelectTool(tool.id);
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-all ${
                          isSelected
                            ? "bg-gradient-to-r from-cyan-500/15 via-teal-500/10 to-transparent text-slate-900 dark:text-white"
                            : "text-slate-700 hover:bg-slate-100/60 dark:text-slate-300 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition ${
                              isSelected
                                ? `bg-gradient-to-tr ${tool.gradient} text-white shadow-sm`
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{tool.name}</p>
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {tool.tagline}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {tool.category.toUpperCase()}
                          </span>
                          <ArrowRight
                            size={14}
                            className={`transition-transform ${
                              isSelected ? "translate-x-0.5 text-cyan-500" : "opacity-30"
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Footer Action Bar */}
            <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/70 px-4 py-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border px-1 py-0.5 font-mono text-[9px] dark:border-slate-700">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border px-1 py-0.5 font-mono text-[9px] dark:border-slate-700">↵</kbd>
                  Open
                </span>
              </div>

              <div className="flex items-center gap-3">
                {onOpenAbout && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAbout();
                    }}
                    className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400"
                  >
                    <Info size={13} className="text-cyan-500" />
                    About Us
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onToggleDark();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-cyan-600 dark:text-slate-300 dark:hover:text-cyan-400"
                >
                  {dark ? <Sun size={13} /> : <Moon size={13} />}
                  Switch to {dark ? "Light" : "Dark"} Mode
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
