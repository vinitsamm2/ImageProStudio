import {
  Archive,
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Combine,
  Expand,
  ExternalLink,
  FileImage,
  FilePenLine,
  FileSignature,
  FileText,
  Grid,
  Layers,
  Percent,
  RefreshCw,
  RotateCw,
  Scissors,
  Sparkles,
  Stamp,
  Wand2,
  FileType,
  Lock,
  Unlock,
  FileDigit,
  ShieldCheck,
  Crop
} from "lucide-react";
import { ToolId } from "../ToolGrid";
import { useState } from "react";
import BrandLogo from "../ui/BrandLogo";
import { useLanguage } from "../../lib/i18n";

export type ToolItemDef = {
  id: ToolId;
  name: string;
  shortName: string;
  shortcut: string;
  category: "pdf" | "image";
  icon: typeof FileText;
  badge?: string;
  viceVersaId?: ToolId;
  viceVersaLabel?: string;
};

export const STUDIO_TOOLS: ToolItemDef[] = [
  {
    id: "edit-pdf",
    name: "PDF Editor",
    shortName: "Edit PDF",
    shortcut: "E",
    category: "pdf",
    icon: FilePenLine,
    badge: "PRO",
    viceVersaId: "pdf-compressor",
    viceVersaLabel: "PDF Compressor"
  },
  {
    id: "pdf-to-word",
    name: "PDF to Word / Docs",
    shortName: "PDF➔Word",
    shortcut: "W",
    category: "pdf",
    icon: FileType,
    badge: "6 Types",
    viceVersaId: "word-to-pdf",
    viceVersaLabel: "Word to PDF"
  },
  {
    id: "word-to-pdf",
    name: "Word to PDF",
    shortName: "Word➔PDF",
    shortcut: "D",
    category: "pdf",
    icon: FileText,
    badge: "Vice Versa",
    viceVersaId: "pdf-to-word",
    viceVersaLabel: "PDF to Word"
  },
  {
    id: "image-to-pdf",
    name: "Image to PDF",
    shortName: "To PDF",
    shortcut: "1",
    category: "pdf",
    icon: FileText,
    badge: "Priority",
    viceVersaId: "pdf-to-image",
    viceVersaLabel: "PDF to Image"
  },
  {
    id: "resizer",
    name: "Image Resizer",
    shortName: "Resizer",
    shortcut: "2",
    category: "image",
    icon: ArrowDownUp,
    badge: "Presets",
    viceVersaId: "dimension-converter",
    viceVersaLabel: "Unit Calc"
  },
  {
    id: "compressor",
    name: "Image Compressor",
    shortName: "Img Compress",
    shortcut: "3",
    category: "image",
    icon: Archive,
    badge: "Pro",
    viceVersaId: "pdf-compressor",
    viceVersaLabel: "PDF Compressor"
  },
  {
    id: "pdf-to-image",
    name: "PDF to Image / JPG / JPEG",
    shortName: "PDF➔JPG",
    shortcut: "4",
    category: "pdf",
    icon: FileImage,
    viceVersaId: "image-to-pdf",
    viceVersaLabel: "Image to PDF"
  },
  {
    id: "pdf-splitter",
    name: "PDF Splitter",
    shortName: "Splitter",
    shortcut: "5",
    category: "pdf",
    icon: Scissors,
    viceVersaId: "pdf-merger",
    viceVersaLabel: "PDF Merger"
  },
  {
    id: "pdf-merger",
    name: "PDF Merger",
    shortName: "Merger",
    shortcut: "6",
    category: "pdf",
    icon: Combine,
    viceVersaId: "pdf-splitter",
    viceVersaLabel: "PDF Splitter"
  },
  {
    id: "image-converter",
    name: "Format Converter",
    shortName: "Convert",
    shortcut: "7",
    category: "image",
    icon: RefreshCw,
    viceVersaId: "compressor",
    viceVersaLabel: "Image Compressor"
  },
  {
    id: "dimension-converter",
    name: "Unit & DPI Calc",
    shortName: "DPI Calc",
    shortcut: "8",
    category: "image",
    icon: Percent,
    viceVersaId: "resizer",
    viceVersaLabel: "Image Resizer"
  },
  {
    id: "extender",
    name: "Canvas Extender",
    shortName: "Extend",
    shortcut: "9",
    category: "image",
    icon: Expand,
    viceVersaId: "resizer",
    viceVersaLabel: "Image Resizer"
  },
  {
    id: "sign-pdf",
    name: "Sign PDF",
    shortName: "Sign",
    shortcut: "S",
    category: "pdf",
    icon: FileSignature,
    badge: "New",
    viceVersaId: "watermark-pdf",
    viceVersaLabel: "Watermark PDF"
  },
  {
    id: "watermark-pdf",
    name: "Watermark PDF",
    shortName: "Watermark",
    shortcut: "M",
    category: "pdf",
    icon: Stamp,
    badge: "New",
    viceVersaId: "sign-pdf",
    viceVersaLabel: "Sign PDF"
  },
  {
    id: "rotate-pdf",
    name: "Rotate PDF",
    shortName: "Rotate",
    shortcut: "R",
    category: "pdf",
    icon: RotateCw,
    badge: "New",
    viceVersaId: "organize-pdf",
    viceVersaLabel: "Organize PDF"
  },
  {
    id: "organize-pdf",
    name: "Organize PDF",
    shortName: "Organize",
    shortcut: "O",
    category: "pdf",
    icon: Layers,
    badge: "New",
    viceVersaId: "rotate-pdf",
    viceVersaLabel: "Rotate PDF"
  },
  {
    id: "pdf-compressor",
    name: "PDF Compressor",
    shortName: "PDF Compress",
    shortcut: "C",
    category: "pdf",
    icon: Archive,
    badge: "New",
    viceVersaId: "compressor",
    viceVersaLabel: "Image Compressor"
  },
  {
    id: "protect-pdf",
    name: "Protect PDF",
    shortName: "Protect",
    shortcut: "P",
    category: "pdf",
    icon: Lock,
    badge: "AES-256",
    viceVersaId: "unlock-pdf",
    viceVersaLabel: "Unlock PDF"
  },
  {
    id: "unlock-pdf",
    name: "Unlock PDF",
    shortName: "Unlock",
    shortcut: "U",
    category: "pdf",
    icon: Unlock,
    badge: "Security",
    viceVersaId: "protect-pdf",
    viceVersaLabel: "Protect PDF"
  },
  {
    id: "page-number-pdf",
    name: "Add Page Numbers",
    shortName: "Page Nos",
    shortcut: "N",
    category: "pdf",
    icon: FileDigit,
    badge: "New",
    viceVersaId: "watermark-pdf",
    viceVersaLabel: "Watermark PDF"
  },
  {
    id: "pdf-text-extractor",
    name: "PDF Text Extractor",
    shortName: "Extract Text",
    shortcut: "T",
    category: "pdf",
    icon: FileText,
    badge: "New",
    viceVersaId: "pdf-to-word",
    viceVersaLabel: "PDF to Word"
  },
  {
    id: "exif-cleaner",
    name: "Image EXIF Cleaner",
    shortName: "EXIF Clean",
    shortcut: "X",
    category: "image",
    icon: ShieldCheck,
    badge: "Privacy",
    viceVersaId: "compressor",
    viceVersaLabel: "Image Compressor"
  },
  {
    id: "crop-pdf",
    name: "Crop PDF",
    shortName: "Crop",
    shortcut: "K",
    category: "pdf",
    icon: Crop,
    badge: "Trim",
    viceVersaId: "rotate-pdf",
    viceVersaLabel: "Rotate PDF"
  }
];

type ToolActivityRailProps = {
  activeTool: ToolId;
  onSelectTool: (id: ToolId) => void;
  onToggleCatalog: () => void;
  isCatalogOpen: boolean;
  onOpenAbout?: () => void;
  dark?: boolean;
  onToggleDark?: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export default function ToolActivityRail({
  activeTool,
  onSelectTool,
  onToggleCatalog,
  isCatalogOpen,
  onOpenAbout,
  dark,
  onToggleDark,
  collapsed,
  onToggleCollapsed
}: ToolActivityRailProps) {
  const { t } = useLanguage();
  const [categoryFilter, setCategoryFilter] = useState<"all" | "pdf" | "image">("all");

  const displayedTools = STUDIO_TOOLS.filter((t) => {
    if (categoryFilter === "all") return true;
    return t.category === categoryFilter;
  });

  return (
    <aside
      className={`relative z-30 flex flex-col justify-between border-r border-slate-200/80 bg-white/90 backdrop-blur-2xl transition-all duration-300 dark:border-white/[0.08] dark:bg-slate-950/80 h-full ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Top Header: Brand & Collapse Toggle */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/70 px-3 dark:border-white/[0.06]">
          {!collapsed ? (
            <button
              type="button"
              onClick={onToggleCatalog}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
              title="ImagePro Studio - Open Catalog"
            >
              <BrandLogo size={32} showText subtitle={t("tagline", "100% In-Browser")} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCatalog}
              title="ImagePro Studio - Open Catalog"
              className="mx-auto block p-0.5 rounded-xl transition hover:scale-105"
            >
              <BrandLogo size={32} />
            </button>
          )}

          <button
            type="button"
            onClick={onToggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* View Switcher: Catalog vs Active Studio */}
        <div className="p-2 shrink-0 border-b border-slate-200/60 dark:border-white/[0.05]">
          <button
            type="button"
            onClick={onToggleCatalog}
            className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold transition ${
              isCatalogOpen
                ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
            } ${collapsed ? "justify-center px-0" : ""}`}
            title="Browse All 9 Tools Catalog"
          >
            <Grid size={15} />
            {!collapsed && <span>{t("allTools", "All Tools Catalog")}</span>}
          </button>
        </div>

        {/* Category Filter Pills when Expanded */}
        {!collapsed && (
          <div className="flex items-center gap-1 px-2 py-1.5 shrink-0 border-b border-slate-200/60 dark:border-white/[0.05] bg-slate-50/50 dark:bg-slate-900/30">
            {[
              { id: "all" as const, label: `${t("all", "All")} (${STUDIO_TOOLS.length})` },
              { id: "pdf" as const, label: `${t("pdf", "PDFs")} (${STUDIO_TOOLS.filter((t) => t.category === "pdf").length})` },
              { id: "image" as const, label: `${t("image", "Images")} (${STUDIO_TOOLS.filter((t) => t.category === "image").length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`flex-1 rounded-lg py-1 text-[10px] font-extrabold transition-all ${
                  categoryFilter === tab.id
                    ? "bg-cyan-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Tool List Ordered Left-to-Right / Top-to-Bottom */}
        <div className="p-2 space-y-1 overflow-y-auto flex-1 min-h-0">
          {!collapsed && (
            <div className="px-2 pt-1 pb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {categoryFilter === "pdf" ? "PDF Tools" : categoryFilter === "image" ? "Image Tools" : "Studio Tools"} ({displayedTools.length})
              </span>
              <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                Priority: 1 & 2
              </span>
            </div>
          )}

          {displayedTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id && !isCatalogOpen;

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectTool(tool.id)}
                title={`${tool.name} (Shortcut: ${tool.shortcut})`}
                className={`group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/15 via-teal-500/10 to-indigo-500/15 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/30 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-slate-200"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <div
                  className={`grid h-7 w-7 place-items-center rounded-lg transition-colors ${
                    isActive
                      ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/30"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:group-hover:bg-slate-800 dark:group-hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                </div>

                {!collapsed && (
                  <div className="flex flex-1 items-center justify-between overflow-hidden text-left">
                    <div className="truncate">
                      <p className="truncate text-xs font-semibold leading-tight">
                        {t(tool.id, tool.name)}
                      </p>
                      {tool.badge && (
                        <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <kbd className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-400 group-hover:text-slate-600 dark:bg-slate-900 dark:text-slate-500 dark:group-hover:text-slate-300">
                      {tool.shortcut}
                    </kbd>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Rail Footer: 100% Free & Copyright Notice */}
      <div className="p-2.5 border-t border-slate-200/70 dark:border-white/[0.06] space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400" title="100% Free Unlimited Use">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t("freeBadge", "100% Free & Unlimited")}</span>
          </div>
        )}

        {!collapsed && (
          <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.05] px-1 text-[10px]">
            <a
              href="https://www.linkedin.com/in/vinit-sammir"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-[#0077b5] dark:text-slate-200 dark:hover:text-[#38bdf8] transition-colors"
              title="Connect with Vinit Sammir on LinkedIn"
            >
              <span>Created by Vinit Sammir</span>
              <ExternalLink size={9} className="opacity-50 group-hover:opacity-100" />
            </a>
            <p className="text-[9px] text-slate-400 font-medium">
              Software Engineer — Cognizant
            </p>
            <p className="mt-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
              100% Free • Unlimited Use
            </p>
            <div className="sidebar-copyright text-[10px] leading-snug text-slate-400 dark:text-slate-500 mt-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.05]">
              <p>&copy; {new Date().getFullYear()} ImagePro Studio. All rights reserved.</p>
              <p className="mt-0.5 text-[8.5px] leading-tight text-slate-400/80 dark:text-slate-500/80">
                Your files are processed locally in your browser and never stored on any server.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
