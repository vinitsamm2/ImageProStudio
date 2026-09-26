import React from "react";
import { ShieldCheck, Lock, EyeOff, Cookie, CheckCircle2, AlertCircle, ExternalLink, Mail } from "lucide-react";

export default function PrivacyPolicyContent() {
  return (
    <div className="space-y-8 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/60 p-5 dark:border-emerald-500/20 dark:bg-emerald-950/30">
        <div className="flex items-start gap-3.5">
          <ShieldCheck size={28} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              100% In-Browser Client-Side Privacy Guarantee
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              ImagePro Studio operates on a <strong>zero-upload architecture</strong>. Your sensitive documents, government certificates, identity cards, passport photos, and handwritten signatures are processed entirely in your device’s local memory (RAM) using HTML5 Canvas, WebAssembly, and JavaScript. <strong>Zero bytes of your files are ever transmitted to or stored on our servers.</strong>
            </p>
            <div className="mt-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              Last Updated & Curated: September 26, 2026 • Effective Date: September 15, 2026
            </div>
          </div>
        </div>
      </div>

      {/* 1. Introduction & Overview */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-500/10 text-xs font-black text-cyan-600 dark:text-cyan-400">1</span>
          <span>Introduction & Publisher Information</span>
        </h3>
        <p>
          Welcome to <strong>ImagePro Studio</strong> (<a href="https://www.imageprostudio.in" className="text-cyan-600 dark:text-cyan-400 underline font-medium">https://www.imageprostudio.in</a>), developed and maintained by <strong>Vinit Sammir</strong> (Software Engineer at Cognizant). ImagePro Studio is an independent media processing workstation created to assist students, job candidates, government exam applicants, and professionals in preparing compliant photos, signatures, and documents.
        </p>
        <p>
          We are committed to maintaining the highest standards of user privacy, digital transparency, and data protection in full accordance with the <strong>Google AdSense Program Policies</strong>, the <strong>General Data Protection Regulation (GDPR)</strong>, and the <strong>California Consumer Privacy Act (CCPA)</strong>.
        </p>
      </section>

      {/* 2. Mandatory Google AdSense & Advertising Disclosures */}
      <section className="space-y-3 rounded-2xl border border-cyan-500/20 bg-cyan-50/40 p-5 dark:border-cyan-500/20 dark:bg-cyan-950/20">
        <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
          <Cookie size={20} className="shrink-0" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            2. Google AdSense & Third-Party Advertising Policy Disclosures
          </h3>
        </div>
        <p className="text-xs sm:text-sm">
          ImagePro Studio partners with Google to serve advertising on our website. To comply strictly with <strong>Google AdSense Content Policies and Google Publisher Policies</strong>, we provide the following required legal disclosures:
        </p>
        <ul className="space-y-2.5 text-xs sm:text-sm pl-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Third-Party Vendor Cookies:</strong> Third-party vendors, including Google, use cookies, web beacons, and similar technologies to serve ads based on a user's prior visits to this website or other websites on the Internet.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Google's Advertising Cookies:</strong> Google's use of advertising cookies (such as the DoubleClick DART cookie) enables it and its partners to serve ads to our users based on their visits to ImagePro Studio and/or other sites across the World Wide Web.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Personalized Advertising Opt-Out:</strong> Users may opt out of personalized advertising by visiting Google's{" "}
              <a
                href="https://myadcenter.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 font-bold underline inline-flex items-center gap-0.5"
              >
                Google My Ad Center / Ads Settings
                <ExternalLink size={11} />
              </a>. Alternatively, users can opt out of a third-party vendor's use of cookies for personalized advertising by visiting{" "}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 font-bold underline inline-flex items-center gap-0.5"
              >
                www.aboutads.info
                <ExternalLink size={11} />
              </a>{" "}
              or the{" "}
              <a
                href="https://optout.networkadvertising.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 font-bold underline inline-flex items-center gap-0.5"
              >
                Network Advertising Initiative (NAI) Opt-Out Page
                <ExternalLink size={11} />
              </a>.
            </span>
          </li>
        </ul>
        <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-cyan-500/20">
          Publisher ID: <code className="font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded text-cyan-600 dark:text-cyan-400 font-bold">ca-pub-5853403690463089</code> (verified via <a href="/ads.txt" className="underline">ads.txt</a>).
        </div>
      </section>

      {/* 3. The Zero-Upload Processing Architecture */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-500/10 text-xs font-black text-cyan-600 dark:text-cyan-400">3</span>
          <span>Zero Server Upload Architecture & Document Handling</span>
        </h3>
        <p>
          Unlike conventional cloud-based converters that upload documents to remote servers, ImagePro Studio executes all processing locally on the client’s CPU and GPU via modern web APIs:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/40">
            <h4 className="font-bold text-slate-900 dark:text-white">Image Processing Pipeline</h4>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Resizing, cropping, canvas padding, and KB compression run via the HTML5 2D Canvas context and WebAssembly. No files are uploaded to any server.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/40">
            <h4 className="font-bold text-slate-900 dark:text-white">PDF Manipulation Engine</h4>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Compression, merging, watermarking, signing, and Word conversions run inside browser memory via <code className="font-mono">pdf-lib</code> and Mozilla <code className="font-mono">PDF.js</code>.
            </p>
          </div>
        </div>
        <p>
          Because your files are never transmitted across the network, we cannot view, store, read, copy, or share your documents, marksheets, certificates, or personal identity materials under any circumstances.
        </p>
      </section>

      {/* 4. Local Storage & Functional Cookies */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-500/10 text-xs font-black text-cyan-600 dark:text-cyan-400">4</span>
          <span>Information We Store Locally (Client-Side Storage)</span>
        </h3>
        <p>
          ImagePro Studio uses browser <code className="font-mono px-1 rounded bg-slate-100 dark:bg-slate-800">localStorage</code> and <code className="font-mono px-1 rounded bg-slate-100 dark:bg-slate-800">sessionStorage</code> solely to deliver an ergonomic user experience:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li><strong>Theme Preference (<code className="font-mono">imagepro-theme</code>):</strong> Stores your choice of light mode or dark mode.</li>
          <li><strong>Language Selection (<code className="font-mono">imagepro-lang</code>):</strong> Stores your selected UI interface language.</li>
          <li><strong>Session Staging Shelf:</strong> Keeps files temporarily in your active browser session so you can route images seamlessly between tools without re-uploading.</li>
          <li><strong>Cookie Consent Preference (<code className="font-mono">imagepro-cookie-consent</code>):</strong> Remembers your consent choice.</li>
        </ul>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          This local data never leaves your device and can be cleared at any time by clearing your browser cache and cookies.
        </p>
      </section>

      {/* 5. GDPR Compliance */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-500/10 text-xs font-black text-cyan-600 dark:text-cyan-400">5</span>
          <span>GDPR Compliance (For European Union & EEA Residents)</span>
        </h3>
        <p>
          Under the General Data Protection Regulation (Regulation (EU) 2016/679), visitors residing in the European Union enjoy specific rights regarding personal data:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li><strong>Right to Access & Rectification:</strong> Since we do not collect or store user accounts, identities, or files, we possess no personal database of your identity.</li>
          <li><strong>Right to Erasure ("Right to be Forgotten"):</strong> You can wipe all local preferences instantly by clearing your browser storage.</li>
          <li><strong>Right to Opt Out of Advertising Cookies:</strong> You can reject non-essential cookies via our Cookie Consent banner or adjust consent in your browser settings.</li>
        </ul>
      </section>

      {/* 6. CCPA / CPRA Notice */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-500/10 text-xs font-black text-cyan-600 dark:text-cyan-400">6</span>
          <span>California Consumer Privacy Act (CCPA / CPRA)</span>
        </h3>
        <p>
          For California consumers, the California Consumer Privacy Act provides specific rights regarding personal information:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li><strong>We Do Not Sell Your Personal Information:</strong> ImagePro Studio does not sell, rent, or trade your personal information or uploaded file data to any third party.</li>
          <li><strong>We Do Not Retain File Data:</strong> File data remains strictly on your device.</li>
          <li><strong>Non-Discrimination:</strong> You will never be denied equal service or access for exercising your privacy rights.</li>
        </ul>
      </section>

      {/* 7. Children's Privacy */}
      <section className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-500/10 text-xs font-black text-cyan-600 dark:text-cyan-400">7</span>
          <span>Children's Online Privacy Protection (COPPA)</span>
        </h3>
        <p>
          ImagePro Studio does not knowingly solicit or collect personal information from children under the age of 13. Since our utilities execute locally without account registration, no child identity data is stored or processed on our infrastructure.
        </p>
      </section>

      {/* 8. Contact Information */}
      <section className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/70 dark:bg-slate-900/60">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Mail size={18} className="text-cyan-600 dark:text-cyan-400" />
          <span>8. Contact Us Regarding Privacy Matters</span>
        </h3>
        <p className="text-xs sm:text-sm">
          If you have questions, concerns, or requests regarding this Privacy Policy, our in-browser security architecture, or AdSense compliance, please contact our lead engineer and publisher:
        </p>
        <div className="text-xs space-y-1 pt-1 font-medium">
          <div><strong>Publisher / Site Owner:</strong> Vinit Sammir</div>
          <div><strong>Role:</strong> Software Engineer (Cognizant) & Founder of ImagePro Studio</div>
          <div><strong>Email:</strong> <a href="mailto:vinitsammir2@gmail.com" className="text-cyan-600 dark:text-cyan-400 underline font-bold">vinitsammir2@gmail.com</a></div>
          <div><strong>Website:</strong> <a href="https://www.imageprostudio.in" className="text-cyan-600 dark:text-cyan-400 underline">https://www.imageprostudio.in</a></div>
          <div><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/vinit-sammir" target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 underline">linkedin.com/in/vinit-sammir</a></div>
        </div>
      </section>
    </div>
  );
}
