import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { TOOLS, ToolCategory, ToolId } from "./ToolGrid";

type ToolShowcaseProps = {
  onSelectTool: (id: ToolId) => void;
  selectedCategory: ToolCategory;
  onSelectCategory: (category: ToolCategory) => void;
  searchQuery: string;
};

export default function ToolShowcase({
  onSelectTool,
  selectedCategory,
  onSelectCategory,
  searchQuery
}: ToolShowcaseProps) {
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
    <div className="space-y-6">
      {/* Category Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {[
            { id: "all" as const, label: "All Utilities" },
            { id: "image" as const, label: "Image Studio" },
            { id: "pdf" as const, label: "PDF Documents" }
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 dark:bg-white dark:text-slate-950"
                    : "border border-slate-200/80 bg-white/70 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <span className="text-xs font-semibold text-slate-400">
          Showing {filteredTools.length} {filteredTools.length === 1 ? "tool" : "tools"}
        </span>
      </div>

      {/* Grid of Tool Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.25 }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-soft backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/80 hover:shadow-xl hover:shadow-cyan-500/10 dark:border-white/[0.08] dark:bg-slate-900/70 dark:hover:border-cyan-500/40"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr ${tool.gradient} text-white shadow-md shadow-cyan-500/20 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon size={22} />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {tool.badge && (
                      <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-300">
                        {tool.badge}
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {tool.category.toUpperCase()}
                    </span>
                  </div>
                </div>

                <h4 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {tool.name}
                </h4>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {tool.tagline}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {tool.description}
                </p>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onSelectTool(tool.id)}
                  className="inline-flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-xs font-bold text-slate-800 transition-all group-hover:bg-cyan-600 group-hover:text-white dark:bg-slate-800/80 dark:text-slate-200 dark:group-hover:bg-cyan-600 dark:group-hover:text-white"
                >
                  <span>Launch Tool</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
