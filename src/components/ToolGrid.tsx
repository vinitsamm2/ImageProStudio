import { motion } from "framer-motion";
import {
  Archive,
  ArrowDownUp,
  Combine,
  Expand,
  FileImage,
  FilePenLine,
  FileSignature,
  FileText,
  ImageIcon,
  Layers,
  LucideIcon,
  Percent,
  RefreshCw,
  RotateCw,
  Scissors,
  Sparkles,
  Stamp,
  FileType
} from "lucide-react";

export type ToolId =
  | "image-to-pdf"
  | "resizer"
  | "compressor"
  | "pdf-compressor"
  | "extender"
  | "dimension-converter"
  | "pdf-splitter"
  | "pdf-merger"
  | "pdf-to-image"
  | "image-converter"
  | "watermark-pdf"
  | "rotate-pdf"
  | "organize-pdf"
  | "sign-pdf"
  | "edit-pdf"
  | "pdf-to-word";

export type ToolCategory = "all" | "image" | "pdf";

export type ToolDef = {
  id: ToolId;
  name: string;
  tagline: string;
  description: string;
  category: "image" | "pdf";
  icon: LucideIcon;
  badge?: string;
  gradient: string;
};

export const TOOLS: ToolDef[] = [
  {
    id: "edit-pdf",
    name: "PDF Editor",
    tagline: "Annotate, draw, redact, text & shape tools",
    description: "Full in-browser PDF editor: add text, draw freehand, highlight, permanently redact sensitive data, insert stamps, shapes, and images.",
    category: "pdf",
    icon: FilePenLine,
    badge: "PRO Suite",
    gradient: "from-blue-500 via-indigo-500 to-cyan-500"
  },
  {
    id: "pdf-to-word",
    name: "PDF to Word / Docs",
    tagline: "Convert to .DOC, .DOCX, .DOCM, .DOT, .DOTX & .DOTM",
    description: "Export PDF documents to 6 Microsoft Word and Office formats with headings, lists, and layout preserved.",
    category: "pdf",
    icon: FileType,
    badge: "6 Formats",
    gradient: "from-blue-600 via-indigo-600 to-sky-500"
  },
  {
    id: "image-to-pdf",
    name: "Image to PDF",
    tagline: "Convert pictures into clean documents",
    description: "Arrange images, set page sizes (A4/A3/Letter), margins, and export one PDF.",
    category: "pdf",
    icon: FileText,
    badge: "High Demand",
    gradient: "from-indigo-500 to-violet-500"
  },
  {
    id: "resizer",
    name: "Image Resizer",
    tagline: "Custom dimensions & social presets",
    description: "Resize by px, mm, cm, in, %, with aspect ratio lock and custom DPI.",
    category: "image",
    icon: ArrowDownUp,
    badge: "Preset Rich",
    gradient: "from-cyan-500 to-blue-500"
  },
  {
    id: "compressor",
    name: "Image Compressor",
    tagline: "Shrink file size without losing quality",
    description: "Batch-compress JPG, PNG, WEBP with live savings meter and quality presets.",
    category: "image",
    icon: Archive,
    badge: "Popular",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    id: "pdf-compressor",
    name: "PDF Compressor",
    tagline: "Shrink PDF document size without losing clarity",
    description: "Compress PDF files with Extreme, Recommended, or Low presets, live size indicator, and page previews.",
    category: "pdf",
    icon: Archive,
    badge: "High Demand",
    gradient: "from-teal-600 to-emerald-600"
  },
  {
    id: "pdf-merger",
    name: "PDF Merger",
    tagline: "Combine multiple PDFs into one",
    description: "Reorder documents effortlessly and merge into a single clean PDF file.",
    category: "pdf",
    icon: Combine,
    gradient: "from-purple-500 to-pink-500"
  },
  {
    id: "pdf-splitter",
    name: "PDF Splitter",
    tagline: "Extract pages or custom ranges",
    description: "Split every page, custom ranges (1-3, 5), or click visual page thumbnails.",
    category: "pdf",
    icon: Scissors,
    gradient: "from-rose-500 to-orange-500"
  },
  {
    id: "pdf-to-image",
    name: "PDF to Image / JPG / JPEG",
    tagline: "Convert PDF pages to JPG, JPEG, JEPG & All Formats",
    description: "Extract PDF pages to JPG, JPEG, JEPG, PNG, WebP, TIFF, BMP, SVG, AVIF, GIF with custom DPI & live file size indicator.",
    category: "pdf",
    icon: FileImage,
    badge: "10 Formats",
    gradient: "from-amber-500 to-yellow-500"
  },
  {
    id: "image-converter",
    name: "Format Converter",
    tagline: "Switch between JPG, PNG, WEBP",
    description: "Batch-convert multiple images between web and high-resolution print formats.",
    category: "image",
    icon: RefreshCw,
    gradient: "from-sky-500 to-indigo-500"
  },
  {
    id: "extender",
    name: "Canvas Extender",
    tagline: "Expand borders without stretching",
    description: "Add padded margins with solid color or transparency around your photos.",
    category: "image",
    icon: Expand,
    gradient: "from-violet-500 to-fuchsia-500"
  },
  {
    id: "dimension-converter",
    name: "Unit & DPI Calculator",
    tagline: "Live pixel to mm/cm/inch conversions",
    description: "Instant physical print dimension calculations at any chosen DPI resolution.",
    category: "image",
    icon: Percent,
    gradient: "from-teal-500 to-emerald-500"
  },
  {
    id: "sign-pdf",
    name: "Sign PDF",
    tagline: "Draw, type, or stamp electronic signatures",
    description: "Create official signatures with stroke smoothing, elegant cursive fonts, or image stamps, and place them interactively on pages.",
    category: "pdf",
    icon: FileSignature,
    badge: "Essential",
    gradient: "from-blue-600 to-indigo-600"
  },
  {
    id: "watermark-pdf",
    name: "Watermark PDF",
    tagline: "Protect documents with text or image stamps",
    description: "Stamp customized text or company logos with full opacity, rotation angle, and 9-point grid or repeating tile patterns.",
    category: "pdf",
    icon: Stamp,
    badge: "Security",
    gradient: "from-teal-500 to-cyan-600"
  },
  {
    id: "rotate-pdf",
    name: "Rotate PDF",
    tagline: "Orient pages permanently and losslessly",
    description: "Rotate all pages at once or click individual page cards to orient 90°, 180°, or 270° with live visual feedback.",
    category: "pdf",
    icon: RotateCw,
    gradient: "from-amber-500 to-orange-500"
  },
  {
    id: "organize-pdf",
    name: "Organize PDF",
    tagline: "Sort, duplicate, rotate & delete pages",
    description: "Drag and drop page cards to reorder your PDF, trim unwanted pages, or duplicate sections with instant export.",
    category: "pdf",
    icon: Layers,
    badge: "Interactive",
    gradient: "from-purple-600 to-indigo-600"
  }
];

type ToolGridProps = {
  activeTool: ToolId;
  onSelectTool: (id: ToolId) => void;
  selectedCategory: ToolCategory;
  onSelectCategory: (category: ToolCategory) => void;
  searchQuery: string;
};

export default function ToolGrid({
  activeTool,
  onSelectTool,
  selectedCategory,
  onSelectCategory,
  searchQuery
}: ToolGridProps) {
  const filteredTools = TOOLS.filter((tool) => {
    const matchesCategory =
      selectedCategory === "all" || tool.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.tagline.toLowerCase().includes(query) ||
      tool.id.includes(query);
    return matchesCategory && matchesQuery;
  });

  return (
    <aside className="space-y-4">
      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white/70 p-1.5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/60">
        {[
          { id: "all" as const, label: "All Tools", count: TOOLS.length },
          { id: "image" as const, label: "Images", count: TOOLS.filter((t) => t.category === "image").length },
          { id: "pdf" as const, label: "PDFs", count: TOOLS.filter((t) => t.category === "pdf").length }
        ].map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`relative flex-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
                isSelected
                  ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                  isSelected
                    ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                    : "bg-slate-200/60 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tool List / Buttons */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {filteredTools.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white/50 p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
            No tools match &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          filteredTools.map((tool, index) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;

            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                onClick={() => onSelectTool(tool.id)}
                className={`group relative flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 focus:outline-none ${
                  isActive
                    ? "border-cyan-500 bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-transparent shadow-soft ring-2 ring-cyan-500/20 dark:border-cyan-400 dark:from-cyan-950/50 dark:to-transparent"
                    : "border-slate-200/80 bg-white/80 hover:border-slate-300 hover:bg-white hover:shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                }`}
              >
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-tr ${tool.gradient} text-white shadow-md shadow-cyan-500/20`
                      : "bg-slate-100 text-slate-600 group-hover:scale-105 group-hover:text-cyan-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:text-cyan-400"
                  }`}
                >
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`truncate text-sm font-bold ${
                        isActive
                          ? "text-cyan-950 dark:text-white"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {tool.name}
                    </span>
                    {tool.badge && (
                      <span className="shrink-0 rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                    {tool.tagline}
                  </p>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </aside>
  );
}
