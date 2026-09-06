import { ChevronDown, Copy, Check } from "lucide-react";
import { ReactNode, useState } from "react";

export function OptionGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3.5 sm:grid-cols-2">{children}</div>;
}

export function Select({
  label,
  value,
  onChange,
  options,
  helper
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | { label: string; value: string }>;
  helper?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="label block">{label}</span>
      <div className="relative">
        <select
          className="field appearance-none pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => {
            const optVal = typeof option === "string" ? option : option.value;
            const optLabel = typeof option === "string" ? option : option.label;
            return (
              <option key={optVal} value={optVal} className="dark:bg-slate-900">
                {optLabel}
              </option>
            );
          })}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
      {helper && <span className="text-[11px] text-slate-500">{helper}</span>}
    </label>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {suffix && <span className="text-[11px] font-mono text-slate-400">{suffix}</span>}
      </div>
      <div className="relative">
        <input
          className={`field font-mono ${suffix ? "pr-12" : ""}`}
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? Math.round(value * 100) / 100 : 0}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  helper
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="label block">{label}</span>
      <input
        className="field"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {helper && <span className="text-[11px] text-slate-400">{helper}</span>}
    </label>
  );
}

export function MetricCard({
  label,
  value,
  subtext,
  icon: Icon
}: {
  label: string;
  value: string;
  subtext?: string;
  icon?: any;
}) {
  const [copied, setCopied] = useState(false);

  const copyVal = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="group relative rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-cyan-400/40 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/80">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {Icon && <Icon size={16} className="text-cyan-500" />}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
          {value}
        </span>
        <button
          onClick={copyVal}
          className="rounded-lg p-1 text-slate-400 opacity-60 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Copy value"
          aria-label={`Copy ${value}`}
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>
      {subtext && <p className="mt-1 text-[11px] text-slate-400">{subtext}</p>}
    </div>
  );
}
