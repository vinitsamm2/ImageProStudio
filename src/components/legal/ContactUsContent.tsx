import React, { useState } from "react";
import { Mail, Send, CheckCircle2, MessageSquare, Linkedin, Clock, HelpCircle, Sparkles } from "lucide-react";

export default function ContactUsContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("Exam Preset Request");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;
    
    // Create mailto link fallback so user's client opens with their exact message
    const subject = encodeURIComponent(`[ImagePro Studio Support] ${topic} from ${name || "User"}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\nMessage:\n${message}`);
    const mailtoUrl = `mailto:support@imageprostudio.in?subject=${subject}&body=${body}`;
    
    // Simulate instantaneous confirmation & open email client
    setSubmitted(true);
    window.open(mailtoUrl, "_blank");
  };

  return (
    <div className="space-y-8 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
      {/* Header Banner */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-50/60 p-5 dark:border-blue-500/20 dark:bg-blue-950/30">
        <div className="flex items-start gap-3.5">
          <MessageSquare size={28} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Get in Touch with ImagePro Studio
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Have questions about exam portal guidelines, want to request a custom dimension preset, or found an issue? We're here to help. Our lead engineer typically responds within <strong>24 to 48 hours</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Column: Direct Details & Publisher Bio */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-xs dark:border-white/[0.08] dark:bg-slate-900/60 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Direct Contact Channels
            </h3>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-2.5 text-xs">
                <Mail size={16} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Official Support Email</div>
                  <a
                    href="mailto:support@imageprostudio.in"
                    className="text-cyan-600 dark:text-cyan-400 underline font-medium"
                  >
                    support@imageprostudio.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <Clock size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Response Time Commitment</div>
                  <div className="text-slate-500 dark:text-slate-400">Within 24–48 business hours</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <Linkedin size={16} className="text-[#0077b5] dark:text-[#38bdf8] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Developer & Creator</div>
                  <a
                    href="https://www.linkedin.com/in/vinit-sammir"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 dark:text-cyan-400 underline font-medium"
                  >
                    Vinit Sammir (LinkedIn Profile)
                  </a>
                  <div className="text-[11px] text-slate-400 mt-0.5">Software Engineer — Cognizant</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/[0.06] dark:bg-slate-900/40 text-xs space-y-2">
            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              <span>Exam Preset Requests</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Applying for a specific State PSC, University Entrance, or International Visa with unusual photo or document requirements? Send us the official notification link and we will add a 1-click preset to ImagePro Studio within 48 hours!
            </p>
          </div>
        </div>

        {/* Right Column: Support / Feedback Form */}
        <div className="md:col-span-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-xs dark:border-white/[0.08] dark:bg-slate-900/60">
            {submitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Thank You for Reaching Out!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                  Your message has been initiated. If your email client didn't open automatically, you can always write to us directly at{" "}
                  <a href="mailto:support@imageprostudio.in" className="text-cyan-600 dark:text-cyan-400 font-bold underline">
                    support@imageprostudio.in
                  </a>.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="btn-secondary h-8 px-4 text-xs font-bold mt-2"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Topic / Category
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="Exam Preset Request">Exam Form Preset Request (UPSC, SSC, State PSC)</option>
                    <option value="Bug Report">Technical Bug or Issue</option>
                    <option value="Feature Suggestion">Feature Suggestion or Tool Idea</option>
                    <option value="Privacy / AdSense Inquiry">Privacy, AdChoices or Cookie Inquiry</option>
                    <option value="General Inquiry">General Question / Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your question, request, or portal requirements in detail..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:brightness-105 transition-all"
                >
                  <Send size={13} />
                  <span>Send Message to ImagePro Support</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
