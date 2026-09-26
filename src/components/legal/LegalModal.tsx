import { AnimatePresence, motion } from "framer-motion";
import {
  Cookie,
  FileCheck,
  Mail,
  Scale,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";
import React, { useEffect, useState } from "react";
import BrandLogo from "../ui/BrandLogo";
import PrivacyPolicyContent from "./PrivacyPolicyContent";
import TermsOfServiceContent from "./TermsOfServiceContent";
import ContactUsContent from "./ContactUsContent";
import CookiePolicyContent from "./CookiePolicyContent";

export type LegalTabId = "privacy" | "terms" | "contact" | "cookies";

type LegalModalProps = {
  isOpen: boolean;
  initialTab?: LegalTabId;
  onClose: () => void;
  onSelectTab?: (tab: LegalTabId) => void;
};

const TABS: { id: LegalTabId; label: string; icon: React.ElementType; title: string }[] = [
  { id: "privacy", label: "Privacy Policy", icon: ShieldCheck, title: "Official Privacy Policy & AdSense Disclosures" },
  { id: "terms", label: "Terms of Service", icon: Scale, title: "Terms of Service & Usage Agreement" },
  { id: "contact", label: "Contact Us", icon: Mail, title: "Contact Support & Developer Team" },
  { id: "cookies", label: "Cookie Policy", icon: Cookie, title: "Cookie Policy & AdChoices Transparency" }
];

export default function LegalModal({
  isOpen,
  initialTab = "privacy",
  onClose,
  onSelectTab
}: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTabId>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const handleTabChange = (tab: LegalTabId) => {
    setActiveTab(tab);
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  if (!isOpen) return null;

  const currentTabDef = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Dialog Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-white/[0.1] dark:bg-[#0b0f19] dark:text-white"
        >
          {/* Top Ambient Glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-indigo-500/20 blur-3xl" />

          {/* Modal Header */}
          <div className="relative flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-white/[0.08] shrink-0">
            <div className="flex items-center gap-3">
              <BrandLogo size={36} />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {currentTabDef.title}
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ImagePro Studio Legal, Trust &amp; Transparency Center
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.08] dark:hover:text-white transition-colors"
              title="Close dialog"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tab Navigation Strip */}
          <div className="flex items-center gap-1 border-b border-slate-200/80 px-6 pt-2 bg-slate-50/50 dark:border-white/[0.06] dark:bg-slate-900/30 overflow-x-auto no-scrollbar shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "text-cyan-600 dark:text-cyan-400"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="legal-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-teal-500"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Modal Content Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 overscroll-contain">
            {activeTab === "privacy" && <PrivacyPolicyContent />}
            {activeTab === "terms" && <TermsOfServiceContent />}
            {activeTab === "contact" && <ContactUsContent />}
            {activeTab === "cookies" && <CookiePolicyContent />}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/60 px-6 py-3.5 dark:border-white/[0.08] dark:bg-slate-900/60 shrink-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>100% In-Browser Privacy • Google AdSense Verified Partner</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary h-8 px-4 text-xs font-bold"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
