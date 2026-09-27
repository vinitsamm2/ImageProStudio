import React from "react";
import {
  ExternalLink,
  GraduationCap,
  Heart,
  Linkedin,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import { ToolId } from "../ToolGrid";

type SiteFooterProps = {
  onSelectTool?: (toolId: ToolId) => void;
  onOpenLegal?: (tab: "privacy" | "terms" | "contact" | "cookies") => void;
  onOpenAbout?: () => void;
};

export default function SiteFooter({
  onSelectTool,
  onOpenLegal,
  onOpenAbout
}: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  const handleToolClick = (toolId: ToolId, e: React.MouseEvent) => {
    e.preventDefault();
    if (onSelectTool) {
      onSelectTool(toolId);
    }
  };

  const handleLegalClick = (
    tab: "privacy" | "terms" | "contact" | "cookies",
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    if (onOpenLegal) {
      onOpenLegal(tab);
    }
  };

  const handleAboutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpenAbout) {
      onOpenAbout();
    }
  };

  return (
    <footer className="mt-16 border-t border-slate-200/80 bg-white/70 backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#080d1a]/80 text-slate-600 dark:text-slate-400 text-xs transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        {/* Top 5-Column Navigation Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Column 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo size={40} showText subtitle="The Local-First In-Browser Media Workstation" />
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              ImagePro Studio is a private, client-side digital studio built to ensure 100% accepted photos, signatures, and PDF certificates for competitive examinations (UPSC, SSC, NEET, JEE, GATE, IBPS) and professional workflows.
            </p>

            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-2.5 dark:bg-emerald-950/20 max-w-sm">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <div className="text-[11px] leading-tight text-emerald-800 dark:text-emerald-300 font-medium">
                <strong>100% In-Browser Privacy:</strong> Files stay in RAM and are never transmitted to external servers.
              </div>
            </div>

            <div className="pt-1 flex items-center gap-2 text-xs">
              <span>Created by</span>
              <a
                href="https://www.linkedin.com/in/vinit-sammir"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-slate-900 hover:text-[#0077b5] dark:text-white dark:hover:text-[#38bdf8] transition-colors underline decoration-slate-300 dark:decoration-slate-700 underline-offset-2"
                title="Connect with Vinit Sammir on LinkedIn"
              >
                <Linkedin size={12} className="text-[#0077b5] dark:text-[#38bdf8]" />
                <span>Vinit Sammir</span>
                <ExternalLink size={10} className="opacity-50" />
              </a>
              <span className="text-slate-400">• Software Engineer, Cognizant</span>
            </div>
          </div>

          {/* Column 2: Popular Image Utilities */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Image Utilities
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/image-resizer"
                  onClick={(e) => handleToolClick("resizer", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Image Resizer (35×45mm)
                </a>
              </li>
              <li>
                <a
                  href="/image-compressor"
                  onClick={(e) => handleToolClick("compressor", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Image Compressor (Target KB)
                </a>
              </li>
              <li>
                <a
                  href="/remove-background"
                  onClick={(e) => handleToolClick("remove-background", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors font-semibold text-pink-600 dark:text-pink-400"
                >
                  Remove Background (AI / Matting)
                </a>
              </li>
              <li>
                <a
                  href="/image-to-pdf"
                  onClick={(e) => handleToolClick("image-to-pdf", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Image to PDF Converter
                </a>
              </li>
              <li>
                <a
                  href="/image-converter"
                  onClick={(e) => handleToolClick("image-converter", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Multi-Format Image Converter
                </a>
              </li>
              <li>
                <a
                  href="/canvas-extender"
                  onClick={(e) => handleToolClick("extender", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Canvas Background Extender
                </a>
              </li>
              <li>
                <a
                  href="/exif-cleaner"
                  onClick={(e) => handleToolClick("exif-cleaner", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Photo EXIF &amp; Metadata Cleaner
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: PDF Powerhouse */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              PDF Powerhouse
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/pdf-compressor"
                  onClick={(e) => handleToolClick("pdf-compressor", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  PDF Compressor (&lt;200KB / &lt;100KB)
                </a>
              </li>
              <li>
                <a
                  href="/pdf-to-word"
                  onClick={(e) => handleToolClick("pdf-to-word", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  PDF to Editable Word (DOCX)
                </a>
              </li>
              <li>
                <a
                  href="/word-to-pdf"
                  onClick={(e) => handleToolClick("word-to-pdf", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Word to PDF Converter
                </a>
              </li>
              <li>
                <a
                  href="/pdf-editor"
                  onClick={(e) => handleToolClick("edit-pdf", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Full In-Browser PDF Editor
                </a>
              </li>
              <li>
                <a
                  href="/pdf-merger"
                  onClick={(e) => handleToolClick("pdf-merger", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  PDF Document Merger
                </a>
              </li>
              <li>
                <a
                  href="/sign-pdf"
                  onClick={(e) => handleToolClick("sign-pdf", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  PDF Digital Signature
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Trust Policies (MANDATORY FOR ADSENSE) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Trust &amp; Governance
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/privacy-policy"
                  onClick={(e) => handleLegalClick("privacy", e)}
                  className="font-semibold text-slate-800 hover:text-cyan-600 dark:text-slate-200 dark:hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck size={13} className="text-emerald-500" />
                  <span>Privacy Policy (GDPR/CCPA)</span>
                </a>
              </li>
              <li>
                <a
                  href="/terms-of-service"
                  onClick={(e) => handleLegalClick("terms", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Terms of Service &amp; Usage
                </a>
              </li>
              <li>
                <a
                  href="/cookie-policy"
                  onClick={(e) => handleLegalClick("cookies", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Cookie Policy &amp; AdChoices
                </a>
              </li>
              <li>
                <a
                  href="/contact-us"
                  onClick={(e) => handleLegalClick("contact", e)}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                >
                  <Mail size={12} className="text-cyan-500" />
                  <span>Contact Us &amp; Support</span>
                </a>
              </li>
              <li>
                <a
                  href="/about-us"
                  onClick={handleAboutClick}
                  className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  About Our Mission &amp; Team
                </a>
              </li>
              <li>
                <a
                  href="/ads.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-mono text-[10px]"
                >
                  Google ads.txt Verification
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Verified Publisher Statement */}
        <div className="border-t border-slate-200/80 pt-6 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              &copy; {currentYear} <strong>ImagePro Studio</strong>. All rights reserved. Built with pride for students, applicants, and creators worldwide.
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Google AdSense Verified Publisher ID: <code className="font-mono">ca-pub-5853403690463089</code> • 100% In-Browser Local Processing Engine
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={(e) => handleLegalClick("privacy", e)}
              className="text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            >
              Privacy Policy
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={(e) => handleLegalClick("terms", e)}
              className="text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            >
              Terms
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={(e) => handleLegalClick("contact", e)}
              className="text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            >
              Support
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
