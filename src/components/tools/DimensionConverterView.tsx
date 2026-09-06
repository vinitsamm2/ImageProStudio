import { useState } from "react";
import { ArrowLeftRight, Copy, Monitor, Percent, Printer, Sparkles } from "lucide-react";
import { MetricCard, NumberField, OptionGrid, Select } from "../ui/Controls";
import { Unit, convertLength } from "../../lib/files";

export default function DimensionConverterView({
  onSwitchViceVersa
}: {
  onSwitchViceVersa?: () => void;
}) {
  const [dpi, setDpi] = useState(300);
  const [inputUnit, setInputUnit] = useState<Unit>("px");
  const [inputWidth, setInputWidth] = useState(1920);
  const [inputHeight, setInputHeight] = useState(1080);

  // Convert input value to Pixels as baseline
  const widthPx = convertLength(inputWidth, inputUnit, "px", dpi);
  const heightPx = convertLength(inputHeight, inputUnit, "px", dpi);

  // Calculate all other units from pixels
  const widthMm = convertLength(widthPx, "px", "mm", dpi);
  const heightMm = convertLength(heightPx, "px", "mm", dpi);
  const widthCm = widthMm / 10;
  const heightCm = heightMm / 10;
  const widthIn = convertLength(widthPx, "px", "in", dpi);
  const heightIn = convertLength(heightPx, "px", "in", dpi);

  const megaPixels = ((widthPx * heightPx) / 1_000_000).toFixed(2);

  // Swap Width and Height (Portrait ⟷ Landscape)
  const swapDimensions = () => {
    const temp = inputWidth;
    setInputWidth(inputHeight);
    setInputHeight(temp);
  };

  // Vice-versa unit switch: toggles between Pixels and Physical mm/in
  const toggleUnitViceVersa = () => {
    if (inputUnit === "px") {
      setInputUnit("mm");
      setInputWidth(Math.round(widthMm * 10) / 10);
      setInputHeight(Math.round(heightMm * 10) / 10);
    } else {
      setInputUnit("px");
      setInputWidth(Math.round(widthPx));
      setInputHeight(Math.round(heightPx));
    }
  };

  return (
    <div className="space-y-6">
      {onSwitchViceVersa && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs dark:bg-indigo-950/20">
          <span className="font-medium text-slate-700 dark:text-indigo-200">
            Ready to apply target dimensions or social presets directly to an image?
          </span>
          <button
            type="button"
            onClick={onSwitchViceVersa}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-white px-3 py-1.5 font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300"
          >
            <ArrowLeftRight size={13} />
            Switch to Image Resizer
          </button>
        </div>
      )}
      <div className="panel space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Bidirectional Unit & DPI Calculator</span>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Vice-Versa
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Convert from Pixels to Physical Print (mm/cm/in) OR from Physical Print back to Pixels at any DPI
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleUnitViceVersa}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-700 transition hover:bg-cyan-500/20 dark:text-cyan-300"
              title="Toggle between Pixels and Millimeters input"
            >
              <ArrowLeftRight size={13} />
              {inputUnit === "px" ? "Switch: Input Physical MM ➔ PX" : "Switch: Input Pixels ➔ MM"}
            </button>
            <button
              type="button"
              onClick={swapDimensions}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
              title="Swap Width and Height (Portrait ⟷ Landscape)"
            >
              ⇄ Swap W / H
            </button>
          </div>
        </div>

        {/* DPI Presets */}
        <div className="space-y-2">
          <span className="label block">DPI Resolution Presets</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "72 DPI (Standard Web)", val: 72, icon: Monitor },
              { label: "150 DPI (Draft Print)", val: 150, icon: Printer },
              { label: "300 DPI (Studio Print)", val: 300, icon: Printer },
              { label: "600 DPI (High-End Fine Art)", val: 600, icon: Sparkles }
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setDpi(preset.val)}
                className={`rounded-xl border p-2.5 text-left transition ${
                  dpi === preset.val
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                    : "border-slate-200/80 bg-slate-50/60 hover:bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300"
                }`}
              >
                <preset.icon size={15} className="mb-1 text-cyan-500" />
                <p className="text-xs font-bold">{preset.val} DPI</p>
                <p className="text-[10px] text-slate-400">{preset.label.split(" (")[1]?.replace(")", "")}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Input Configuration */}
        <div className="border-t border-slate-200/80 pt-4 dark:border-slate-800 space-y-4">
          <OptionGrid>
            <Select
              label="Input Unit (Change to calculate vice versa)"
              value={inputUnit}
              onChange={(v) => setInputUnit(v as Unit)}
              options={[
                { label: "Pixels (px) — Screen & Digital", value: "px" },
                { label: "Millimeters (mm) — Metric Print", value: "mm" },
                { label: "Centimeters (cm) — Metric Display", value: "cm" },
                { label: "Inches (in) — US Imperial Print", value: "in" }
              ]}
            />
            <NumberField
              label="DPI Resolution"
              value={dpi}
              onChange={setDpi}
              min={1}
              suffix="DPI"
            />
          </OptionGrid>

          <OptionGrid>
            <NumberField
              label={`Input Width (${inputUnit})`}
              value={inputWidth}
              onChange={setInputWidth}
              min={0.1}
              suffix={inputUnit}
            />
            <NumberField
              label={`Input Height (${inputUnit})`}
              value={inputHeight}
              onChange={setInputHeight}
              min={0.1}
              suffix={inputUnit}
            />
          </OptionGrid>
        </div>

        {/* Quick Presets for both Screen & Print */}
        <div className="border-t border-slate-200/80 pt-3 dark:border-slate-800">
          <span className="label block mb-2">Popular Size Presets (Auto-converts)</span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Full HD (1080p)", w: 1920, h: 1080, u: "px" as Unit },
              { label: "4K UHD", w: 3840, h: 2160, u: "px" as Unit },
              { label: "Instagram Square", w: 1080, h: 1080, u: "px" as Unit },
              { label: "A4 Paper (210×297mm)", w: 210, h: 297, u: "mm" as Unit },
              { label: "US Letter (8.5×11in)", w: 8.5, h: 11, u: "in" as Unit },
              { label: "Passport (35×45mm)", w: 35, h: 45, u: "mm" as Unit }
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setInputUnit(p.u);
                  setInputWidth(p.w);
                  setInputHeight(p.h);
                }}
                className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-cyan-400 hover:bg-cyan-50/40 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Synchronized Results (All 4 Units) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Pixels (px)"
          value={`${Math.round(widthPx)} × ${Math.round(heightPx)} px`}
          subtext={`${megaPixels} MP • ${(widthPx / heightPx).toFixed(2)}:1 Ratio`}
        />
        <MetricCard
          label="Millimeters (mm)"
          value={`${widthMm.toFixed(1)} × ${heightMm.toFixed(1)} mm`}
          subtext={`${(widthMm / 25.4).toFixed(2)}″ at ${dpi} DPI`}
        />
        <MetricCard
          label="Centimeters (cm)"
          value={`${widthCm.toFixed(2)} × ${heightCm.toFixed(2)} cm`}
          subtext={`Width: ${widthCm.toFixed(1)}cm • H: ${heightCm.toFixed(1)}cm`}
        />
        <MetricCard
          label="Inches (in)"
          value={`${widthIn.toFixed(2)}″ × ${heightIn.toFixed(2)}″`}
          subtext={`Print scale at ${dpi} DPI`}
        />
      </div>

      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-transparent p-4 text-xs text-slate-700 dark:text-slate-300">
        <p className="font-semibold text-cyan-900 dark:text-cyan-200 mb-1">
          Vice-Versa Conversion Formula:
        </p>
        <p>
          • <strong>Pixels to Physical:</strong> Size (in) = Pixels / {dpi} | Size (mm) = (Pixels / {dpi}) × 25.4
        </p>
        <p className="mt-1">
          • <strong>Physical to Pixels:</strong> Pixels = Size (in) × {dpi} | Pixels = (Size (mm) / 25.4) × {dpi}
        </p>
      </div>
    </div>
  );
}
