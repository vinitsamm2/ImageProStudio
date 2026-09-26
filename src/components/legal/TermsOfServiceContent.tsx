import React from "react";
import { FileCheck, AlertTriangle, ShieldCheck, Scale, Mail, CheckCircle2 } from "lucide-react";

export default function TermsOfServiceContent() {
  return (
    <div className="space-y-8 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
      {/* Header Banner */}
      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-50/60 p-5 dark:border-cyan-500/20 dark:bg-cyan-950/30">
        <div className="flex items-start gap-3.5">
          <Scale size={28} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Terms of Service & Usage Agreement
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              By accessing and using ImagePro Studio (<strong>imageprostudio.in</strong>), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our services.
            </p>
            <div className="mt-2 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
              Effective Date: January 1, 2025 • Last Updated: September 26, 2026
            </div>
          </div>
        </div>
      </div>

      {/* 1. Description of Services */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-500/10 text-xs font-black text-cyan-600 dark:text-cyan-400">1</span>
          <span>Description of Service & 100% Free Accessibility</span>
        </h3>
        <p>
          ImagePro Studio provides a comprehensive suite of in-browser digital image and document manipulation tools, including but not limited to: Image Resizing, Image Compression to target KB, PDF Compression under 200KB/100KB, two-way PDF to Word conversions, PDF editing, watermarking, signature scaling, and file organization.
        </p>
        <p>
          The service is provided <strong>100% free of charge</strong>, with no subscription tiers, no mandatory accounts, no watermarks attached to output files, and no daily volume limitations.
        </p>
      </section>

      {/* 2. Client-Side Execution & Privacy Guarantee */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-500/10 text-xs font-black text-cyan-600 dark:text-cyan-400">2</span>
          <span>Client-Side Processing & Document Confidentiality</span>
        </h3>
        <p>
          All operations performed on ImagePro Studio occur locally within your web browser using HTML5 Canvas, JavaScript, and WebAssembly. Your documents, photos, marksheets, and signatures are never uploaded to any remote server or third-party cloud.
        </p>
        <p>
          Because we never store or transmit your files, ImagePro Studio does not claim, assume, or retain any ownership, licensing, or intellectual property rights over any file you process on the website. <strong>You retain 100% unencumbered copyright and ownership over your files.</strong>
        </p>
      </section>

      {/* 3. Acceptable Use Policy */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-500/10 text-xs font-black text-cyan-600 dark:text-cyan-400">3</span>
          <span>Acceptable Use & User Conduct</span>
        </h3>
        <p>
          You agree to use ImagePro Studio only for lawful purposes. You agree not to:
        </p>
        <ul className="space-y-1.5 list-disc pl-5 text-xs sm:text-sm">
          <li>Attempt to reverse engineer, decompile, or attack the underlying client-side application scripts in an effort to compromise website integrity.</li>
          <li>Execute automated high-frequency denial-of-service scripts or scrapers against the web host.</li>
          <li>Use the platform to forge fraudulent documents or misrepresent credentials on official government portals.</li>
        </ul>
      </section>

      {/* 4. Portal Acceptance Disclaimer & User Responsibility */}
      <section className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-50/50 p-5 dark:border-amber-500/20 dark:bg-amber-950/20">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <AlertTriangle size={20} className="shrink-0" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            4. Form Filling & Exam Portal Guidelines Disclaimer
          </h3>
        </div>
        <p className="text-xs sm:text-sm">
          ImagePro Studio provides carefully tuned presets designed to conform strictly with guidelines published by exam and recruitment authorities (such as UPSC, SSC, NEET, JEE, GATE, IBPS, and State PSCs).
        </p>
        <p className="text-xs sm:text-sm">
          However, examination authorities and corporate portals may revise their dimension, DPI, or file size regulations at any time. <strong>Users are strongly advised to verify final generated file dimensions, file size in KB, and visual clarity against their specific exam notification or bulletin before submitting online.</strong>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          ImagePro Studio and its developer assume no liability for application rejections arising from incorrect user input or portal regulatory changes.
        </p>
      </section>

      {/* 5. Limitation of Liability */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-500/10 text-xs font-black text-cyan-600 dark:text-cyan-400">5</span>
          <span>Limitation of Liability & "As Is" Warranty</span>
        </h3>
        <p>
          ImagePro Studio is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. In no event shall ImagePro Studio, its author, or affiliates be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use of or inability to use this service.
        </p>
      </section>

      {/* 6. Governing Law & Contact */}
      <section className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/70 dark:bg-slate-900/60">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Mail size={18} className="text-cyan-600 dark:text-cyan-400" />
          <span>6. Inquiries & Legal Contact</span>
        </h3>
        <p className="text-xs sm:text-sm">
          If you have questions regarding these Terms of Service or need to report any compliance issue, please contact us:
        </p>
        <div className="text-xs space-y-1 pt-1 font-medium">
          <div><strong>Publisher:</strong> Vinit Sammir (Software Engineer — Cognizant)</div>
          <div><strong>Email:</strong> <a href="mailto:support@imageprostudio.in" className="text-cyan-600 dark:text-cyan-400 underline font-bold">support@imageprostudio.in</a></div>
          <div><strong>Official Website:</strong> <a href="https://www.imageprostudio.in" className="text-cyan-600 dark:text-cyan-400 underline">https://www.imageprostudio.in</a></div>
        </div>
      </section>
    </div>
  );
}
