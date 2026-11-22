import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Check,
  Code2,
  FileText,
  Globe,
  Mic,
} from 'lucide-react';
import { GenGPTIcon } from './GenGPTIcon';

interface LandingPageProps {
  onStartChat: () => void;
  onTryDemo: () => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartChat,
  onTryDemo,
  onOpenAuth,
}) => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#212121] text-[#0d0d0d] dark:text-[#ececec] overflow-y-auto">
      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-[#212121]/95 backdrop-blur-xs border-b border-black/8 dark:border-white/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
          >
            <GenGPTIcon size={24} className="text-[#0d0d0d] dark:text-white" />
            <span>OmniGPT</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#5d5d67] dark:text-[#b4b4b4]">
            <a
              href="#features"
              className="hover:text-[#0d0d0d] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#capabilities"
              className="hover:text-[#0d0d0d] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#pricing"
              className="hover:text-[#0d0d0d] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Pricing
            </a>
            <button
              type="button"
              onClick={onOpenAuth}
              className="hover:text-[#0d0d0d] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={onStartChat}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open OmniGPT
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="top" className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
        <h1
          className="font-bold tracking-tight text-balance mx-auto max-w-4xl"
          style={{ fontSize: 'clamp(2.25rem, 4.5vw, 3.75rem)', lineHeight: 1.08 }}
        >
          OmniGPT - Ask Anything. Build Anything. Write Anything.
        </h1>
        <p className="mt-5 text-base sm:text-lg text-[#5d5d67] dark:text-[#b4b4b4] max-w-2xl mx-auto leading-relaxed">
          Your all-in-one AI workspace for full working code, interactive HTML apps, CVs, school tutoring, business planning, real-time voice, and translation across Pidgin, Twi, Yoruba, Igbo, Hausa, French, and Spanish.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onStartChat}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span>Start Chatting Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onTryDemo}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-black/15 dark:border-white/15 hover:bg-black/4 dark:hover:bg-white/6 transition-colors cursor-pointer"
          >
            Try Demo Workspace
          </button>
        </div>
      </section>

      {/* Asymmetric Features Bento Grid */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 border-t border-black/8 dark:border-white/8">
        <div className="max-w-2xl mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-balance">
            Built for everyday answers, real engineering, and local context.
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#5d5d67] dark:text-[#b4b4b4]">
            Switch seamlessly between fast everyday chat, deep step-by-step reasoning, and live interactive HTML app previews.
          </p>
        </div>

        <div id="capabilities" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-[#f9f9f9] dark:bg-[#171717]">
            <Code2 className="w-5 h-5 text-[#10a37f] mb-3" />
            <h3 className="text-lg font-semibold">01. Complete Code &amp; Live HTML Apps</h3>
            <p className="mt-2 text-sm text-[#5d5d67] dark:text-[#b4b4b4] leading-relaxed max-w-xl">
              Generate complete working scripts, fix bugs, and download ready-to-run `.html` applications—or test them immediately in the split-screen Live Canvas.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-[#f9f9f9] dark:bg-[#171717]">
            <FileText className="w-5 h-5 text-[#10a37f] mb-3" />
            <h3 className="text-lg font-semibold">02. Writing &amp; CVs</h3>
            <p className="mt-2 text-sm text-[#5d5d67] dark:text-[#b4b4b4] leading-relaxed">
              Draft job-ready CVs, essays, emails, WhatsApp messages, songs, and structured business plans tailored to your tone.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-[#f9f9f9] dark:bg-[#171717]">
            <BookOpen className="w-5 h-5 text-[#10a37f] mb-3" />
            <h3 className="text-lg font-semibold">03. School &amp; Math Tutor</h3>
            <p className="mt-2 text-sm text-[#5d5d67] dark:text-[#b4b4b4] leading-relaxed">
              Break down science and algebra step by step, simplify tough concepts, and generate instant practice quizzes.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-[#f9f9f9] dark:bg-[#171717]">
            <Briefcase className="w-5 h-5 text-[#10a37f] mb-3" />
            <h3 className="text-lg font-semibold">04. Business &amp; Pricing</h3>
            <p className="mt-2 text-sm text-[#5d5d67] dark:text-[#b4b4b4] leading-relaxed">
              Build practical startup ideas with realistic local budgets, shop names, marketing copy, and pricing breakdowns.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-[#f9f9f9] dark:bg-[#171717]">
            <Globe className="w-5 h-5 text-[#10a37f] mb-3" />
            <h3 className="text-lg font-semibold">05. Natural Translation</h3>
            <p className="mt-2 text-sm text-[#5d5d67] dark:text-[#b4b4b4] leading-relaxed">
              Translate fluently across Pidgin, Twi, Yoruba, Igbo, Hausa, French, Spanish, and English with Tone presets.
            </p>
          </div>

          <div className="md:col-span-3 p-6 rounded-2xl border border-black/10 dark:border-white/10 bg-[#f9f9f9] dark:bg-[#171717] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-5 h-5 text-[#10a37f]" />
                <h3 className="text-lg font-semibold">06. Real-Time Voice, Visual Art &amp; Motion Video</h3>
              </div>
              <p className="text-sm text-[#5d5d67] dark:text-[#b4b4b4] leading-relaxed">
                Speak directly to OmniGPT with live mic dictation, Read Aloud speech playback, vector artwork (2x PNG/SVG), and exportable `.webm` motion clips.
              </p>
            </div>
            <button
              type="button"
              onClick={onStartChat}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#10a37f] text-white hover:bg-[#0e8f6f] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Launch Workspace
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 sm:px-6 py-16 border-t border-black/8 dark:border-white/8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Simple, transparent plans
          </h2>
          <p className="mt-2 text-sm text-[#5d5d67] dark:text-[#b4b4b4]">
            Start chatting immediately at zero cost, or upgrade for team workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Tier */}
          <div className="p-7 rounded-2xl border border-black/10 dark:border-white/12 bg-white dark:bg-[#171717] flex flex-col justify-between">
            <div>
              <div className="text-sm font-medium text-[#5d5d67] dark:text-[#9a9aa6]">
                For individuals &amp; students
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tabular-nums">$0</span>
                <span className="text-sm text-[#6e6e80]">/ month</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold">Free</h3>

              <ul className="mt-6 space-y-3 text-sm text-[#37373d] dark:text-[#d4d4d8]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#10a37f] shrink-0" />
                  Unlimited chat across Fast &amp; Smart models
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#10a37f] shrink-0" />
                  Full code generation with Copy &amp; Download .html
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#10a37f] shrink-0" />
                  Multilingual support (Pidgin, Twi, Yoruba, Igbo, Hausa, French)
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#10a37f] shrink-0" />
                  Local chat history &amp; Markdown/JSON export
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={onStartChat}
              className="mt-8 w-full py-2.5 rounded-xl text-sm font-semibold border border-black/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/8 transition-colors cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Tier */}
          <div className="p-7 rounded-2xl border border-[#10a37f] bg-[#f9f9f9] dark:bg-[#171717] flex flex-col justify-between">
            <div>
              <div className="text-sm font-medium text-[#10a37f]">
                For builders &amp; power creators
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tabular-nums">$15</span>
                <span className="text-sm text-[#6e6e80]">/ month</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold">Pro</h3>

              <ul className="mt-6 space-y-3 text-sm text-[#37373d] dark:text-[#d4d4d8]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#10a37f] shrink-0" />
                  Everything in Free plus Deep Think (XHIGH) reasoning
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#10a37f] shrink-0" />
                  Live split-screen HTML/JS App Canvas &amp; Console
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#10a37f] shrink-0" />
                  Real-time Voice + Vision, Podcast Studio &amp; Motion Video
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#10a37f] shrink-0" />
                  Priority web-grounded search &amp; file forge exports
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={onStartChat}
              className="mt-8 w-full py-2.5 rounded-xl text-sm font-semibold bg-[#0d0d0d] dark:bg-white text-white dark:text-[#0d0d0d] hover:opacity-90 transition-opacity cursor-pointer"
            >
              Try Pro Capabilities Now
            </button>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-black/8 dark:border-white/8 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6e6e80] dark:text-[#9a9aa6]">
          <div className="flex items-center gap-2 font-medium text-[#0d0d0d] dark:text-[#ececec]">
            <GenGPTIcon size={18} />
            <span>OmniGPT</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hover:underline">Features</a>
            <a href="#pricing" className="hover:underline">Pricing</a>
            <button type="button" onClick={onOpenAuth} className="hover:underline cursor-pointer">
              Account
            </button>
            <button type="button" onClick={onStartChat} className="hover:underline cursor-pointer">
              Open Chat
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
