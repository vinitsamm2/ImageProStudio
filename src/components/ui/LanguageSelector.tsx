import React, { useState, useRef, useEffect } from "react";
import { useLanguage, LANGUAGES, LanguageCode } from "../../lib/i18n";
import CountryFlag from "./CountryFlag";
import { ChevronDown, Check, Globe } from "lucide-react";

type LanguageSelectorProps = {
  className?: string;
  variant?: "default" | "compact";
};

export default function LanguageSelector({ className = "", variant = "default" }: LanguageSelectorProps) {
  const { language, setLanguage, currentMeta } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-50/90 px-2 sm:px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-white hover:text-cyan-600 dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800 transition shadow-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        title={`Language: ${currentMeta.nativeName} (${currentMeta.country})`}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <CountryFlag code={currentMeta.code} size={15} />
        <span className={variant === "compact" ? "hidden" : "hidden sm:inline-block font-semibold"}>
          {currentMeta.nativeName}
        </span>
        <ChevronDown
          size={12}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] md:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="absolute right-0 top-full mt-1.5 z-50 w-64 sm:w-72 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-white/[0.1] dark:bg-slate-900/95 animate-in fade-in zoom-in-95 duration-150"
            role="menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 dark:border-white/[0.06] mb-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <Globe size={13} className="text-cyan-500" />
                <span>Languages / 言語 / 언어</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">8 Locales</span>
            </div>

            {/* List */}
            <div className="max-h-72 overflow-y-auto space-y-0.5">
              {LANGUAGES.map((lang) => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    role="menuitem"
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition group ${
                      isSelected
                        ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CountryFlag code={lang.code} size={18} />
                      <div className="text-left truncate">
                        <div className="font-bold leading-tight flex items-center gap-1.5">
                          <span>{lang.nativeName}</span>
                          {lang.code !== "en" && (
                            <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                              ({lang.name})
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {lang.country}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-600 text-white shadow-xs">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer note */}
            <div className="mt-1 border-t border-slate-100 dark:border-white/[0.06] pt-1.5 px-2 text-[10px] text-center text-slate-400 dark:text-slate-500">
              Instant in-browser translation • Local only
            </div>
          </div>
        </>
      )}
    </div>
  );
}
