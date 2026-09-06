import {
  Archive,
  ArrowDownUp,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Combine,
  Expand,
  FileImage,
  FileSignature,
  FileText,
  Grid,
  Info,
  Layers,
  Moon,
  Percent,
  RefreshCw,
  RotateCw,
  Scissors,
  Sparkles,
  Stamp,
  Sun,
  Wand2
} from "lucide-react";
import { ToolId } from "../ToolGrid";

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
    shortcut: "W",
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
  }
];

type ToolActivityRailProps = {
  activeTool: ToolId;
  onSelectTool: (id: ToolId) => void;
  onToggleCatalog: () => void;
  isCatalogOpen: boolean;
  onOpenAbout: () => void;
  dark: boolean;
  onToggleDark: () => void;
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
  const currentDef = STUDIO_TOOLS.find((t) => t.id === activeTool);

  return (
    <aside
      className={`relative z-30 flex flex-col justify-between border-r border-slate-200/80 bg-white/90 backdrop-blur-2xl transition-all duration-300 dark:border-white/[0.08] dark:bg-slate-950/80 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Top Header: Brand & Collapse Toggle */}
      <div>
        <div className="flex h-14 items-center justify-between border-b border-slate-200/70 px-3 dark:border-white/[0.06]">
          {!collapsed ? (
            <button
              type="button"
              onClick={onToggleCatalog}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-500 text-white shadow-sm transition group-hover:scale-105">
                <Wand2 size={16} />
              </div>
              <div>
                <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-sm flex items-center gap-1">
                  Image<span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Pro</span>
                  <span className="rounded bg-cyan-500/10 px-1.5 py-0.2 text-[9px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    STUDIO
                  </span>
                </span>
                <p className="text-[10px] text-slate-400 font-medium">100% In-Browser</p>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCatalog}
              title="ImagePro Studio"
              className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-500 text-white shadow-sm"
            >
              <Wand2 size={16} />
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
        <div className="p-2 border-b border-slate-200/60 dark:border-white/[0.05]">
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
            {!collapsed && <span>All Tools Catalog</span>}
          </button>
        </div>

        {/* Tool List Ordered Left-to-Right / Top-to-Bottom */}
        <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
          {!collapsed && (
            <div className="px-2 pt-1 pb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Studio Tools ({STUDIO_TOOLS.length})
              </span>
              <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                Priority: 1 & 2
              </span>
            </div>
          )}

          {STUDIO_TOOLS.map((tool) => {
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
                        {tool.name}
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

      {/* Bottom Rail Footer: Active Tool Vice-Versa Link & Dark Mode */}
      <div className="p-2.5 border-t border-slate-200/70 dark:border-white/[0.06] space-y-2">
        {/* Vice-Versa Quick Action Banner */}
        {currentDef?.viceVersaId && !collapsed && (
          <button
            type="button"
            onClick={() => onSelectTool(currentDef.viceVersaId!)}
            className="w-full flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-2 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-500/10 dark:text-indigo-300 dark:bg-indigo-950/30"
            title={`Switch to reciprocal tool: ${currentDef.viceVersaLabel}`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <ArrowLeftRight size={12} className="text-indigo-500" />
              <span className="truncate">⇄ {currentDef.viceVersaLabel}</span>
            </span>
            <span className="rounded bg-indigo-500/10 px-1 py-0.2 font-mono text-[9px] text-indigo-500">
              Flip
            </span>
          </button>
        )}

        {/* About Us Button */}
        <button
          type="button"
          onClick={onOpenAbout}
          className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white transition ${
            collapsed ? "justify-center px-0" : ""
          }`}
          title="About ImagePro Studio & Privacy Guarantee"
        >
          <Info size={15} className="text-cyan-500 shrink-0" />
          {!collapsed && <span>About Us</span>}
        </button>

        {/* Theme & Workspace Controls */}
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={onToggleDark}
            className={`flex items-center gap-2 rounded-xl p-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white ${
              collapsed ? "w-full justify-center" : ""
            }`}
            title={`Toggle ${dark ? "Light" : "Dark"} mode`}
          >
            {dark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            {!collapsed && <span>{dark ? "Light Mode" : "Dark Mode"}</span>}
          </button>

          {!collapsed && (
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400" title="100% Free Unlimited Use">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>100% Free</span>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.05] px-1 text-[10px]">
            <p className="font-bold text-slate-700 dark:text-slate-200">
              Created by Vinit Sammir
            </p>
            <p className="text-[9px] text-slate-400 font-medium">
              Software Engineer — Cognizant
            </p>
            <p className="mt-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
              100% Free • Unlimited Use
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
