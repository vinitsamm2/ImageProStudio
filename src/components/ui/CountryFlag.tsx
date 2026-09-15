import React from "react";
import { LanguageCode } from "../../lib/i18n";

type CountryFlagProps = {
  code: LanguageCode;
  className?: string;
  size?: number;
};

export default function CountryFlag({ code, className = "", size = 18 }: CountryFlagProps) {
  const width = Math.round(size * 1.4);
  const height = size;

  switch (code) {
    case "ja": // Japan
      return (
        <svg
          width={width}
          height={height}
          viewBox="0 0 900 600"
          className={`rounded-[3px] shadow-xs shrink-0 border border-slate-300/60 dark:border-white/10 ${className}`}
        >
          <rect width="900" height="600" fill="#ffffff" />
          <circle cx="450" cy="300" r="180" fill="#bc002d" />
        </svg>
      );

    case "ko": // South Korea
      return (
        <svg
          width={width}
          height={height}
          viewBox="0 0 900 600"
          className={`rounded-[3px] shadow-xs shrink-0 border border-slate-300/60 dark:border-white/10 ${className}`}
        >
          <rect width="900" height="600" fill="#ffffff" />
          {/* Taegeuk Circle */}
          <g transform="rotate(-33.69 450 300)">
            <path d="M450 150 A150 150 0 0 1 450 450 A75 75 0 0 0 450 300 A75 75 0 0 1 450 150 Z" fill="#cd2e3a" />
            <path d="M450 150 A75 75 0 0 0 450 300 A75 75 0 0 1 450 450 A150 150 0 0 1 450 150 Z" fill="#0047a0" />
          </g>
          {/* Trigrams */}
          <g fill="#000000" transform="translate(450 300) scale(0.65)">
            {/* Top-Left: Geon (3 solid bars) */}
            <g transform="translate(-320, -180) rotate(-33.69)">
              <rect x="-40" y="-35" width="80" height="14" rx="2" />
              <rect x="-40" y="-10" width="80" height="14" rx="2" />
              <rect x="-40" y="15" width="80" height="14" rx="2" />
            </g>
            {/* Bottom-Right: Gon (3 broken bars) */}
            <g transform="translate(320, 180) rotate(-33.69)">
              <rect x="-40" y="-35" width="34" height="14" rx="2" /><rect x="6" y="-35" width="34" height="14" rx="2" />
              <rect x="-40" y="-10" width="34" height="14" rx="2" /><rect x="6" y="-10" width="34" height="14" rx="2" />
              <rect x="-40" y="15" width="34" height="14" rx="2" /><rect x="6" y="15" width="34" height="14" rx="2" />
            </g>
            {/* Top-Right: Gam (broken, solid, broken) */}
            <g transform="translate(320, -180) rotate(33.69)">
              <rect x="-40" y="-35" width="34" height="14" rx="2" /><rect x="6" y="-35" width="34" height="14" rx="2" />
              <rect x="-40" y="-10" width="80" height="14" rx="2" />
              <rect x="-40" y="15" width="34" height="14" rx="2" /><rect x="6" y="15" width="34" height="14" rx="2" />
            </g>
            {/* Bottom-Left: Ri (solid, broken, solid) */}
            <g transform="translate(-320, 180) rotate(33.69)">
              <rect x="-40" y="-35" width="80" height="14" rx="2" />
              <rect x="-40" y="-10" width="34" height="14" rx="2" /><rect x="6" y="-10" width="34" height="14" rx="2" />
              <rect x="-40" y="15" width="80" height="14" rx="2" />
            </g>
          </g>
        </svg>
      );

    case "zh": // China
      return (
        <svg
          width={width}
          height={height}
          viewBox="0 0 900 600"
          className={`rounded-[3px] shadow-xs shrink-0 border border-slate-300/60 dark:border-white/10 ${className}`}
        >
          <rect width="900" height="600" fill="#de2910" />
          {/* Main Big Star */}
          <polygon
            points="150,40 180,130 270,130 198,185 225,275 150,220 75,275 102,185 30,130 120,130"
            fill="#ffde00"
            transform="translate(150,150) scale(0.6) translate(-150,-150)"
          />
          {/* 4 Small Stars */}
          <polygon points="300,50 307,72 330,72 312,85 318,107 300,94 282,107 288,85 270,72 293,72" fill="#ffde00" transform="rotate(-15 300 70)" />
          <polygon points="360,110 367,132 390,132 372,145 378,167 360,154 342,167 348,145 330,132 353,132" fill="#ffde00" transform="rotate(10 360 130)" />
          <polygon points="360,200 367,222 390,222 372,235 378,257 360,244 342,257 348,235 330,222 353,222" fill="#ffde00" transform="rotate(35 360 220)" />
          <polygon points="300,260 307,282 330,282 312,295 318,317 300,304 282,317 288,295 270,282 293,282" fill="#ffde00" transform="rotate(5 300 280)" />
        </svg>
      );

    case "hi": // India
      return (
        <svg
          width={width}
          height={height}
          viewBox="0 0 900 600"
          className={`rounded-[3px] shadow-xs shrink-0 border border-slate-300/60 dark:border-white/10 ${className}`}
        >
          <rect width="900" height="200" fill="#ff9933" />
          <rect y="200" width="900" height="200" fill="#ffffff" />
          <rect y="400" width="900" height="200" fill="#138808" />
          <circle cx="450" cy="300" r="80" stroke="#000080" stroke-width="8" fill="none" />
          <circle cx="450" cy="300" r="16" fill="#000080" />
          <g stroke="#000080" stroke-width="4">
            {[...Array(24)].map((_, i) => (
              <line
                key={i}
                x1="450"
                y1="300"
                x2={450 + 80 * Math.cos((i * 15 * Math.PI) / 180)}
                y2={300 + 80 * Math.sin((i * 15 * Math.PI) / 180)}
              />
            ))}
          </g>
        </svg>
      );

    case "es": // Spain
      return (
        <svg
          width={width}
          height={height}
          viewBox="0 0 900 600"
          className={`rounded-[3px] shadow-xs shrink-0 border border-slate-300/60 dark:border-white/10 ${className}`}
        >
          <rect width="900" height="150" fill="#aa151b" />
          <rect y="150" width="900" height="300" fill="#f1bf00" />
          <rect y="450" width="900" height="150" fill="#aa151b" />
        </svg>
      );

    case "fr": // France
      return (
        <svg
          width={width}
          height={height}
          viewBox="0 0 900 600"
          className={`rounded-[3px] shadow-xs shrink-0 border border-slate-300/60 dark:border-white/10 ${className}`}
        >
          <rect width="300" height="600" fill="#002654" />
          <rect x="300" width="300" height="600" fill="#ffffff" />
          <rect x="600" width="300" height="600" fill="#ed2939" />
        </svg>
      );

    case "de": // Germany
      return (
        <svg
          width={width}
          height={height}
          viewBox="0 0 900 600"
          className={`rounded-[3px] shadow-xs shrink-0 border border-slate-300/60 dark:border-white/10 ${className}`}
        >
          <rect width="900" height="200" fill="#000000" />
          <rect y="200" width="900" height="200" fill="#dd0000" />
          <rect y="400" width="900" height="200" fill="#ffce00" />
        </svg>
      );

    case "en": // USA / Global
    default:
      return (
        <svg
          width={width}
          height={height}
          viewBox="0 0 900 600"
          className={`rounded-[3px] shadow-xs shrink-0 border border-slate-300/60 dark:border-white/10 ${className}`}
        >
          {/* 13 Stripes */}
          {[...Array(13)].map((_, i) => (
            <rect
              key={i}
              y={(i * 600) / 13}
              width="900"
              height={600 / 13 + 0.5}
              fill={i % 2 === 0 ? "#b22234" : "#ffffff"}
            />
          ))}
          {/* Blue Canton */}
          <rect width="360" height={(600 * 7) / 13} fill="#3c3b6e" />
          {/* Stars grid */}
          <circle cx="90" cy="80" r="14" fill="#ffffff" />
          <circle cx="180" cy="80" r="14" fill="#ffffff" />
          <circle cx="270" cy="80" r="14" fill="#ffffff" />
          <circle cx="135" cy="150" r="14" fill="#ffffff" />
          <circle cx="225" cy="150" r="14" fill="#ffffff" />
          <circle cx="90" cy="220" r="14" fill="#ffffff" />
          <circle cx="180" cy="220" r="14" fill="#ffffff" />
          <circle cx="270" cy="220" r="14" fill="#ffffff" />
        </svg>
      );
  }
}
