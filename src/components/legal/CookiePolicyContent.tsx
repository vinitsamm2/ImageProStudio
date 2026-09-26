import React from "react";
import { Cookie, ShieldAlert, CheckCircle2, Settings, ExternalLink, Mail } from "lucide-react";

export default function CookiePolicyContent() {
  return (
    <div className="space-y-8 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
      {/* Header Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-50/60 p-5 dark:border-amber-500/20 dark:bg-amber-950/30">
        <div className="flex items-start gap-3.5">
          <Cookie size={28} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Cookie Policy & Tracking Transparency
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This Cookie Policy explains how ImagePro Studio uses cookies, local storage, and similar technologies to enhance your experience, maintain site functionality, and serve advertisements via <strong>Google AdSense</strong>.
            </p>
            <div className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              Last Updated: September 26, 2026 • Compliant with Google AdSense Policies & GDPR
            </div>
          </div>
        </div>
      </div>

      {/* 1. What Are Cookies? */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-500/10 text-xs font-black text-cyan-600 dark:text-cyan-400">1</span>
          <span>What Are Cookies & Web Storage?</span>
        </h3>
        <p>
          Cookies are small text files stored in your web browser by websites you visit. They are widely used to make websites work efficiently, remember your preferences, and provide relevant advertising. Modern web applications also use <strong>HTML5 Local Storage</strong> (<code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">localStorage</code>), which stores client-side data without sending it to servers with every HTTP request.
        </p>
      </section>

      {/* 2. Categories of Cookies Used */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-500/10 text-xs font-black text-cyan-600 dark:text-cyan-400">2</span>
          <span>Cookies & Local Storage Employed on ImagePro Studio</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/[0.08] dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
              <CheckCircle2 size={16} />
              <span>1. Functional & Strictly Necessary (Local Storage)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Essential for the workstation to remember your UI settings. Stored strictly in your browser's local sandbox:
            </p>
            <ul className="text-xs space-y-1 list-disc pl-4 text-slate-500 dark:text-slate-400">
              <li><code className="font-mono">imagepro-theme</code>: Remembers light or dark mode.</li>
              <li><code className="font-mono">imagepro-lang</code>: Remembers your selected language.</li>
              <li><code className="font-mono">imagepro-cookie-consent</code>: Stores your cookie banner choice.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-white/[0.08] dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
              <Cookie size={16} />
              <span>2. Third-Party Advertising Cookies (Google AdSense)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Google uses cookies (such as DoubleClick) to deliver relevant advertisements based on your browsing history across the web. These ads generate revenue that enables us to keep ImagePro Studio <strong>100% free and unlimited forever</strong>.
            </p>
            <div className="text-[11px] text-slate-400">
              Publisher ID: <code className="font-mono">ca-pub-5853403690463089</code>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Managing and Opting Out */}
      <section className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 dark:border-white/[0.06] dark:bg-slate-900/40">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings size={18} className="text-cyan-600 dark:text-cyan-400" />
          <span>3. How to Opt-Out or Manage Cookies</span>
        </h3>
        <p className="text-xs sm:text-sm">
          You have full control over cookie preferences:
        </p>
        <ul className="space-y-2 text-xs sm:text-sm list-disc pl-5">
          <li>
            <strong>Personalized Google Ads Opt-Out:</strong> Visit{" "}
            <a
              href="https://myadcenter.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 dark:text-cyan-400 font-bold underline inline-flex items-center gap-1"
            >
              Google My Ad Center
              <ExternalLink size={11} />
            </a>{" "}
            to turn off ad personalization across all Google partner sites.
          </li>
          <li>
            <strong>Industry-Wide Opt-Out:</strong> Visit the{" "}
            <a
              href="https://www.aboutads.info/choices/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 dark:text-cyan-400 font-bold underline inline-flex items-center gap-1"
            >
              Digital Advertising Alliance (DAA)
              <ExternalLink size={11} />
            </a>{" "}
            or{" "}
            <a
              href="https://optout.networkadvertising.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 dark:text-cyan-400 font-bold underline inline-flex items-center gap-1"
            >
              Network Advertising Initiative (NAI)
              <ExternalLink size={11} />
            </a>.
          </li>
          <li>
            <strong>Browser Settings:</strong> You can block or delete third-party cookies directly in your browser preferences (Chrome: <em>Settings &gt; Privacy and Security &gt; Third-party cookies</em>).
          </li>
        </ul>
      </section>

      {/* 4. Contact */}
      <section className="space-y-2 text-xs text-slate-500 dark:text-slate-400 pt-2">
        <p>
          For additional questions regarding our cookie practices, reach out to <a href="mailto:support@imageprostudio.in" className="text-cyan-600 dark:text-cyan-400 underline font-medium">support@imageprostudio.in</a>.
        </p>
      </section>
    </div>
  );
}
