import React from "react";

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

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 ${onClick ? "cursor-pointer group select-none" : ""} ${className}`}
    >
      <div
        style={{ width: pixelSize, height: pixelSize }}
        className="relative shrink-0 transition-transform duration-300 group-hover:scale-105"
      >
        <img
          src="/logo.svg"
          alt="ImagePro Studio Logo"
          width={pixelSize}
          height={pixelSize}
          className="h-full w-full object-contain drop-shadow-md"
          loading="eager"
          decoding="async"
        />
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
