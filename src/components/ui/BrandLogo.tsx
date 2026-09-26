import React from "react";
import { Wand2 } from "lucide-react";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg" | "xl" | number;
  showText?: boolean;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
};

export default function BrandLogo({
  size = "md",
  showText = false,
  subtitle,
  className = "",
  onClick
}: BrandLogoProps) {
  const pixelSize =
    typeof size === "number"
      ? size
      : size === "sm"
      ? 28
      : size === "md"
      ? 34
      : size === "lg"
      ? 42
      : 56;

  const iconSize = Math.max(14, Math.round(pixelSize * 0.5));

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 ${onClick ? "cursor-pointer group select-none" : ""} ${className}`}
    >
      {/* The Very First Iconic Gradient Emblem with Wand2 */}
      <div
        style={{ width: pixelSize, height: pixelSize }}
        className="relative shrink-0 grid place-items-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-500 text-white shadow-md shadow-cyan-500/25 transition-transform duration-300 group-hover:scale-105"
      >
        <Wand2 size={iconSize} className="transition-transform duration-300 group-hover:rotate-12" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
        </span>
      </div>

      {showText && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-sm sm:text-base">
              Image
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Pro
              </span>
            </span>
            <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-mono font-bold text-cyan-600 dark:text-cyan-400 tracking-wider">
              STUDIO
            </span>
          </div>
          {subtitle && (
            <p className="mt-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
