import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../../types";
import { LIFE_CONSTELLATION_NODES } from "../../data/categories";
import { CresciveLogo } from "../CresciveLogo";
import {
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Compass,
  GraduationCap,
  Briefcase,
  Rocket,
  RefreshCw,
  Check,
  ShieldAlert,
  Clock,
  Send,
  Zap,
  Bot,
  Layers,
  Shield,
  Milestone,
  ArrowUp
} from "lucide-react";

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0);

  // Form State
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<number>(17);
  const [chapters, setChapters] = useState<string[]>([]);
  const [becoming, setBecoming] = useState<string>("");
  const [selectedMatters, setSelectedMatters] = useState<string[]>([]);
  const [fiveYearVision, setFiveYearVision] = useState<string>("");
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const [customConstraint, setCustomConstraint] = useState<string>("");
  const [availableTime, setAvailableTime] = useState<string>("");
  const [nameConfirmed, setNameConfirmed] = useState<boolean>(false);

  const displayPreferredName = name.trim() || "Traveler";

  const toggleChapter = (chapterId: string) => {
    setChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((c) => c !== chapterId)
        : [...prev, chapterId]
    );
  };

  const toggleMatter = (matterId: string) => {
    setSelectedMatters((prev) =>
      prev.includes(matterId)
        ? prev.filter((m) => m !== matterId)
        : [...prev, matterId]
    );
  };

  const toggleConstraint = (constraintId: string) => {
    setSelectedConstraints((prev) =>
      prev.includes(constraintId)
        ? prev.filter((c) => c !== constraintId)
        : [...prev, constraintId]
    );
  };

  const getAgeReflection = (userAge: number) => {
    if (userAge < 20) return "You're early in the story. Every foundation built now multiplies.";
    if (userAge < 30) return "A defining chapter of compounding potential and deliberate choices.";
    if (userAge < 50) return "A powerful season of mastery, leverage, and intentional depth.";
    return "Rich experience meeting sovereign reinvention and enduring legacy.";
  };

  const handleFinish = () => {
    const finalProfile: UserProfile = {
      preferredName: name.trim() || "Traveler",
      age,
      chapter: chapters.length > 0 ? chapters : ["EXPLORING"],
      becoming: becoming.trim() || "Someone who consciously shapes their trajectory.",
      matters: selectedMatters.length > 0 ? selectedMatters : ["KNOWLEDGE", "HEALTH", "CREATIVITY"],
      fiveYearVision: fiveYearVision.trim(),
      constraints: selectedConstraints,
      customConstraint: customConstraint.trim(),
      availableTime: availableTime || "1 hour/day",
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    };
    onComplete(finalProfile);
  };

  return (
    <div id="onboarding-root" className={`relative min-h-screen w-full bg-[#050510] text-[#f5f5f0] flex flex-col justify-between ${step === 0 ? "overflow-y-auto scroll-smooth" : "overflow-hidden"}`}>
      {/* Dynamic Cosmic Background with Gold and Violet Glows matching Elegant Dark */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.1)_0%,transparent_70%)] animate-aurora" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(127,0,255,0.15)_0%,transparent_70%)] animate-aurora" style={{ animationDelay: "-6s" }} />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-[radial-gradient(circle,rgba(0,191,255,0.05)_0%,transparent_70%)] animate-aurora" style={{ animationDelay: "-12s" }} />
        
        {/* Subtle luminous star particles */}
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      {/* Top Header / Progress Indicator in Elegant Dark style */}
      <header className="relative z-20 px-6 sm:px-10 pt-7 pb-3 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif-cresive text-xl sm:text-2xl tracking-[0.3em] font-light text-[#D4AF37] uppercase">
              CRESCIVE
            </h1>
          </div>
          <p className="text-[10px] tracking-[0.4em] uppercase opacity-60 text-[#f5f5f0]">
            Your future, in progress
          </p>
        </div>

        {step > 0 ? (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] tracking-[0.2em] uppercase opacity-60 font-light">Phase 0{step}</span>
              <span className="text-[10px] font-mono text-[#D4AF37]">/ 09</span>
            </div>
            <div className="w-28 sm:w-36 h-[2px] bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B]"
                initial={{ width: 0 }}
                animate={{ width: `${(step / 9) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        ) : (
          <div className="text-right">
            <p className="text-[10px] tracking-[0.2em] uppercase opacity-40 mb-1 text-[#f5f5f0]">Initialization Phase</p>
            <div className="h-[1px] w-28 sm:w-36 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
          </div>
        )}
      </header>

      {/* Main Interactive Stage */}
      <main className={`relative z-10 flex-1 flex flex-col px-4 sm:px-6 py-6 mx-auto w-full ${step === 0 ? "max-w-4xl justify-start" : "max-w-lg justify-center"}`}>
        <AnimatePresence mode="wait">
          {/* STEP 0: The First Moment & Crescive Introduction */}
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center w-full"
            >
              {/* CURRENT TOP SECTION — PRESERVED EXACTLY AS IT IS */}
              <div className="flex flex-col items-center text-center my-auto min-h-[calc(100vh-160px)] justify-center py-6 sm:py-10 w-full max-w-lg mx-auto">
                <div className="relative mb-8">
                  <CresciveLogo className="w-28 h-28" roundedClassName="rounded-3xl" alt="Official CRESCIVE Logo" />
                  <div className="absolute -inset-2 rounded-3xl border border-cyan-500/20 animate-pulse opacity-30" style={{ animationDuration: "3s" }} />
                </div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-serif-cresive text-3xl sm:text-4xl tracking-[0.3em] font-light text-[#D4AF37] uppercase mb-2"
                >
                  CRESCIVE
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-[11px] tracking-[0.4em] uppercase opacity-60 mb-8 font-light"
                >
                  Your future, in progress.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="bg-[#101025]/60 backdrop-blur-md rounded-2xl p-6 border border-white/10 w-full max-w-sm mb-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                >
                  <p className="text-zinc-400 text-xs tracking-widest uppercase mb-1.5 font-light">
                    Before we build anything…
                  </p>
                  <p className="text-white text-lg font-light mb-3">
                    Who are you?
                  </p>
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-zinc-300 text-xs leading-relaxed font-light">
                      CRESCIVE was created by <span className="text-white font-medium">Brian Omuse</span>, a teenage creator and digital innovator from Malaba, Kenya.
                    </p>
                    <p className="text-zinc-400 text-[11px] leading-relaxed font-light mt-1">
                      Brian Omuse is the creator and founder of CRESCIVE.
                    </p>
                  </div>
                </motion.div>

                <motion.button
                  id="btn-begin-journey"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.3 }}
                  onClick={() => setStep(1)}
                  className="group relative w-full max-w-sm flex items-center justify-center space-x-3 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-8 py-4 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all hover:scale-105 active:scale-95 text-black font-bold tracking-[0.2em] text-xs uppercase cursor-pointer"
                >
                  <span>Let&apos;s begin with you</span>
                  <span className="text-black text-lg transition-transform group-hover:translate-x-1">→</span>
                </motion.button>

                {/* Subtle downward scroll indicator */}
                <div
                  onClick={() => {
                    const el = document.getElementById("about-crescive");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="mt-12 flex flex-col items-center opacity-40 hover:opacity-90 transition-opacity cursor-pointer select-none"
                >
                  <span className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 mb-1.5 font-light">
                    Explore Crescive
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#D4AF37] animate-bounce" />
                </div>
              </div>

              {/* NEW SECTION: ABOUT CRESCIVE */}
              <section
                id="about-crescive"
                className="w-full pt-16 pb-12 sm:pt-24 sm:pb-16 max-w-3xl mx-auto px-4 sm:px-6"
              >
                <div className="bg-[#0b0f1f]/80 backdrop-blur-md rounded-3xl border border-white/10 p-8 sm:p-12 shadow-[0_15px_45px_rgba(0,0,0,0.6)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-cyan-500/10 to-transparent pointer-events-none rounded-tr-3xl" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#D4AF37]/10 to-transparent pointer-events-none rounded-bl-3xl" />
                  
                  <div className="text-center mb-8 relative z-10">
                    <span className="text-[10px] tracking-[0.35em] uppercase text-cyan-400/80 font-medium block mb-2">
                      System Overview
                    </span>
                    <h2 className="font-serif-cresive text-2xl sm:text-3xl tracking-[0.25em] font-light text-[#D4AF37] uppercase">
                      WHAT IS CRESCIVE?
                    </h2>
                  </div>

                  <div className="space-y-4 text-center max-w-2xl mx-auto relative z-10">
                    <p className="text-zinc-200 text-sm sm:text-base leading-relaxed font-light">
                      CRESCIVE is an all-in-one life-navigation and personal achievement operating system designed to turn raw human potential into real, measurable momentum.
                    </p>
                    <p className="text-zinc-400 text-sm sm:text-base leading-relaxed font-light">
                      Instead of fragmenting your life across note apps, task managers, habit trackers, and vision boards, CRESCIVE unites everything into one unified, intelligent, forward-moving system.
                    </p>
                    <div className="pt-6 mt-6 border-t border-white/10">
                      <p className="text-zinc-400 text-xs sm:text-sm tracking-widest uppercase font-light mb-1">
                        It doesn’t just store your goals.
                      </p>
                      <p className="font-serif-cresive text-base sm:text-lg tracking-[0.15em] text-[#F5D77F] font-normal uppercase">
                        It builds the momentum to reach them.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* NEW SECTION: WHAT YOU CAN DO */}
              <section className="w-full py-12 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-10 sm:mb-12">
                  <span className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37]/80 font-medium block mb-2">
                    Core Capabilities
                  </span>
                  <h2 className="font-serif-cresive text-2xl sm:text-3xl tracking-[0.25em] font-light text-[#D4AF37] uppercase">
                    BUILT FOR THE WHOLE OF YOUR LIFE
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Card 1 */}
                  <div className="bg-[#0b0f1d]/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all hover:border-cyan-500/40 hover:bg-[#0f152a]/80 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between group">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center mb-4 text-[#D4AF37] group-hover:scale-110 transition-transform">
                        <Compass className="w-5 h-5" />
                      </div>
                      <h3 className="text-white text-base font-medium tracking-wide mb-2 group-hover:text-cyan-200 transition-colors">
                        1. Map Your Vision
                      </h3>
                      <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed font-light">
                        Define your 5-year direction, uncover what truly matters, and turn distant dreams into tangible milestones.
                      </p>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-[#0b0f1d]/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all hover:border-cyan-500/40 hover:bg-[#0f152a]/80 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between group">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
                        <Zap className="w-5 h-5" />
                      </div>
                      <h3 className="text-white text-base font-medium tracking-wide mb-2 group-hover:text-cyan-200 transition-colors">
                        2. Move With Precision
                      </h3>
                      <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed font-light">
                        Break big ambitions down into tactical &ldquo;Moves&rdquo; — the exact steps required to create real progress today.
                      </p>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-[#0b0f1d]/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all hover:border-cyan-500/40 hover:bg-[#0f152a]/80 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between group">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
                        <Bot className="w-5 h-5" />
                      </div>
                      <h3 className="text-white text-base font-medium tracking-wide mb-2 group-hover:text-cyan-200 transition-colors">
                        3. Navigate With AI
                      </h3>
                      <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed font-light">
                        Work alongside the CRESCIVE Navigator — an intelligent life companion that offers perspective, strategy, and guidance when you feel stuck.
                      </p>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-[#0b0f1d]/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all hover:border-cyan-500/40 hover:bg-[#0f152a]/80 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between group">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h3 className="text-white text-base font-medium tracking-wide mb-2 group-hover:text-cyan-200 transition-colors">
                        4. Track Every Domain
                      </h3>
                      <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed font-light">
                        Bring harmony to Health, Career, Finance, Mindset, Relationships, and Skills inside one cohesive dashboard.
                      </p>
                    </div>
                  </div>

                  {/* Card 5 */}
                  <div className="bg-[#0b0f1d]/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all hover:border-cyan-500/40 hover:bg-[#0f152a]/80 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between group">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mb-4 text-amber-400 group-hover:scale-110 transition-transform">
                        <Shield className="w-5 h-5" />
                      </div>
                      <h3 className="text-white text-base font-medium tracking-wide mb-2 group-hover:text-cyan-200 transition-colors">
                        5. Guard Your Focus
                      </h3>
                      <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed font-light">
                        Protect your attention with a dedicated Focus Engine designed for deep, uninterrupted execution.
                      </p>
                    </div>
                  </div>

                  {/* Card 6 */}
                  <div className="bg-[#0b0f1d]/70 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all hover:border-cyan-500/40 hover:bg-[#0f152a]/80 shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between group">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center mb-4 text-sky-400 group-hover:scale-110 transition-transform">
                        <Milestone className="w-5 h-5" />
                      </div>
                      <h3 className="text-white text-base font-medium tracking-wide mb-2 group-hover:text-cyan-200 transition-colors">
                        6. Own Your Journey
                      </h3>
                      <p className="text-zinc-400 text-xs sm:text-[13px] leading-relaxed font-light">
                        Collect milestones, track your personal evolution, and look back on the path you’ve walked.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* NEW SECTION: THE CRESCIVE JOURNEY */}
              <section className="w-full py-12 sm:py-16 max-w-3xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-8">
                  <span className="text-[10px] tracking-[0.35em] uppercase text-cyan-400/80 font-medium block mb-2">
                    Philosophy &amp; Ascent
                  </span>
                  <h2 className="font-serif-cresive text-2xl sm:text-3xl tracking-[0.25em] font-light text-[#D4AF37] uppercase">
                    A PATH DESIGNED FOR PROGRESS
                  </h2>
                </div>

                <div className="relative text-center px-6 sm:px-10 py-8 sm:py-10 rounded-3xl bg-gradient-to-b from-[#10142b]/70 to-[#070914]/90 border border-white/10 shadow-[0_15px_45px_rgba(0,0,0,0.5)]">
                  <p className="text-sm sm:text-base text-zinc-200 leading-relaxed font-light italic mb-6 max-w-2xl mx-auto">
                    &ldquo;Growth is rarely a straight line. It is a continuous ascent through discipline, curiosity, and action. CRESCIVE was created to accompany you through every stage of that climb — from the quiet moments of self-reflection to the highest summits of your ambition.&rdquo;
                  </p>
                  <div className="h-[1px] w-24 mx-auto bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent mb-6" />
                  <p className="text-xs sm:text-sm text-[#F5D77F] tracking-[0.2em] uppercase font-medium">
                    Wherever you are starting from, the next step belongs to you.
                  </p>
                </div>
              </section>

              {/* FINAL VISUAL SECTION — CRESCIVE JOURNEY IMAGE */}
              <section className="w-full pt-8 pb-12 sm:pb-16 max-w-2xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-6">
                  <span className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37]/80 font-medium block mb-1">
                    Vision &amp; Trajectory
                  </span>
                  <h3 className="font-serif-cresive text-lg sm:text-xl tracking-[0.2em] font-light text-zinc-300 uppercase">
                    The Crescive Journey
                  </h3>
                </div>

                <div className="relative rounded-2xl sm:rounded-3xl p-1 bg-gradient-to-b from-cyan-500/30 via-white/10 to-[#D4AF37]/30 shadow-[0_0_50px_rgba(0,191,255,0.15)]">
                  <div className="rounded-[14px] sm:rounded-[22px] overflow-hidden bg-[#070914] relative">
                    <img
                      src="/crescive-journey.png"
                      alt="The CRESCIVE Journey — People walking along a glowing path toward a futuristic city"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-contain block mx-auto transition-transform duration-700 hover:scale-[1.01]"
                    />
                  </div>
                </div>
              </section>

              {/* BOTTOM CALL TO ACTION */}
              <section className="w-full py-12 sm:py-16 flex flex-col items-center text-center px-4 sm:px-6 border-t border-white/10 max-w-3xl mx-auto">
                <p className="text-zinc-400 text-xs sm:text-sm tracking-[0.25em] uppercase font-light mb-6">
                  Your journey starts above.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md justify-center">
                  <button
                    id="btn-begin-journey-bottom"
                    onClick={() => setStep(1)}
                    className="group relative w-full sm:w-auto flex-1 flex items-center justify-center space-x-3 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-8 py-4 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all hover:scale-105 active:scale-95 text-black font-bold tracking-[0.2em] text-xs uppercase cursor-pointer"
                  >
                    <span>Let&apos;s begin with you</span>
                    <span className="text-black text-lg transition-transform group-hover:translate-x-1">→</span>
                  </button>

                  <button
                    id="btn-scroll-to-top"
                    onClick={() => {
                      const root = document.getElementById("onboarding-root");
                      if (root) {
                        root.scrollTo({ top: 0, behavior: "smooth" });
                      } else {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-4 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs uppercase tracking-widest font-medium transition-all cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Top</span>
                  </button>
                </div>
              </section>
            </motion.div>
          )}

          {/* STEP 1: The Sacred Name Screen */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center my-auto"
            >
              <div className="mb-2">
                <span className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                  01 — Identity
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display mt-1 text-white">
                  What&apos;s your name?
                </h2>
                <p className="text-zinc-400 text-sm mt-1.5 font-light">
                  The name CRESCIVE should call you.
                </p>
              </div>

              <div className="my-8 relative">
                <div className="relative">
                  <input
                    id="input-preferred-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setNameConfirmed(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && name.trim().length > 0) {
                        setNameConfirmed(true);
                      }
                    }}
                    placeholder="Enter your name"
                    autoFocus
                    className="w-full bg-black/40 border-b-2 border-[#D4AF37]/50 focus:border-[#F5D77F] px-2 py-4 text-2xl sm:text-3xl font-semibold tracking-wide text-white placeholder:text-zinc-600 focus:outline-none transition-all duration-300"
                  />
                  {name.trim().length > 0 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute right-3 top-5 w-6 h-6 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center"
                    >
                      <Check className="w-3.5 h-3.5 text-[#F5D77F]" />
                    </motion.div>
                  )}
                </div>

                {/* Golden typing response glow */}
                <div
                  className="h-1 w-full bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent transition-opacity duration-500"
                  style={{ opacity: name.trim().length > 0 ? 0.9 : 0.2 }}
                />
              </div>

              {name.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="crescive-glass rounded-xl p-4 border border-amber-300/20 mb-8"
                >
                  <p className="text-sm text-zinc-300">
                    Nice to meet you, <span className="font-semibold text-[#F5D77F]">{name.trim()}</span>.
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Let&apos;s build from where you are.
                  </p>
                </motion.div>
              )}

              <button
                id="btn-name-continue"
                disabled={name.trim().length === 0}
                onClick={() => setStep(2)}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  name.trim().length > 0
                    ? "gold-gradient-bg text-zinc-950 shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:brightness-110"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* STEP 2: Age Screen */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center my-auto"
            >
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                  02 — Starting Point
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display mt-1 text-white">
                  How old are you, {displayPreferredName}?
                </h2>
                <p className="text-zinc-400 text-sm mt-1.5 font-light">
                  Every journey has a starting point. Your starting point matters.
                </p>
              </div>

              {/* Huge Interactive Age Selector */}
              <div className="my-8 flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center gap-6">
                  <button
                    onClick={() => setAge((prev) => Math.max(10, prev - 1))}
                    className="w-12 h-12 rounded-full border border-amber-400/30 bg-white/5 flex items-center justify-center text-amber-200 hover:bg-amber-400/10 active:scale-95 transition-all cursor-pointer"
                    aria-label="Decrease age"
                  >
                    <ChevronDown className="w-6 h-6" />
                  </button>

                  <div className="relative px-6 py-3">
                    <motion.div
                      key={age}
                      initial={{ scale: 0.9, opacity: 0.7 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-7xl sm:text-8xl font-display font-extrabold gold-gradient-text tracking-tighter"
                    >
                      {age}
                    </motion.div>
                    <div className="absolute -inset-1 rounded-2xl border border-amber-400/20 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => setAge((prev) => Math.min(100, prev + 1))}
                    className="w-12 h-12 rounded-full border border-amber-400/30 bg-white/5 flex items-center justify-center text-amber-200 hover:bg-amber-400/10 active:scale-95 transition-all cursor-pointer"
                    aria-label="Increase age"
                  >
                    <ChevronUp className="w-6 h-6" />
                  </button>
                </div>

                {/* Dynamic Age Reflection Card */}
                <motion.div
                  key={`reflect-${age}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 cresive-glass rounded-xl px-5 py-3.5 border border-amber-300/20 max-w-sm text-center"
                >
                  <p className="text-xs font-semibold text-[#F5D77F]">
                    {age} years old
                  </p>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    {getAgeReflection(age)}
                  </p>
                </motion.div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-3.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:text-white hover:border-white/20 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="btn-age-continue"
                  onClick={() => setStep(3)}
                  className="flex-1 py-4 px-6 rounded-xl gold-gradient-bg text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Current Chapter (Where are you now?) */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center my-auto"
            >
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                  03 — Context
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display mt-1 text-white">
                  What chapter are you in right now, {displayPreferredName}?
                </h2>
                <p className="text-zinc-400 text-sm mt-1.5 font-light">
                  Everyone starts somewhere. Choose what resonates (select multiple if applicable).
                </p>
              </div>

              {/* Interactive Chapter Cards */}
              <div className="my-6 space-y-2.5">
                {[
                  {
                    id: "LEARNING",
                    title: "LEARNING",
                    subtitle: "School / university / self-learning",
                    desc: "Building knowledge and sharpening foundational skills",
                    icon: GraduationCap,
                    accent: "border-sky-400/40 text-sky-400",
                  },
                  {
                    id: "WORKING",
                    title: "WORKING",
                    subtitle: "Employed / looking / building career",
                    desc: "Growing through professional work and industry experience",
                    icon: Briefcase,
                    accent: "border-amber-400/40 text-amber-400",
                  },
                  {
                    id: "BUILDING",
                    title: "BUILDING",
                    subtitle: "Business / project / creative venture",
                    desc: "Creating something of your own from zero",
                    icon: Rocket,
                    accent: "border-yellow-400/40 text-yellow-400",
                  },
                  {
                    id: "EXPLORING",
                    title: "EXPLORING",
                    subtitle: "Still figuring things out",
                    desc: "Testing different directions and finding what clicks",
                    icon: Compass,
                    accent: "border-purple-400/40 text-purple-400",
                  },
                  {
                    id: "TRANSITIONING",
                    title: "TRANSITIONING",
                    subtitle: "Leaving one chapter and entering another",
                    desc: "Navigating deliberate change and new thresholds",
                    icon: RefreshCw,
                    accent: "border-emerald-400/40 text-emerald-400",
                  },
                ].map((item) => {
                  const isSelected = chapters.includes(item.id);
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => toggleChapter(item.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full text-left p-3.5 rounded-xl transition-all border flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-amber-500/15 via-purple-950/20 to-transparent border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                          : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                          isSelected ? "bg-[#D4AF37]/20 border-[#D4AF37]" : "bg-white/5 border-white/10"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? "text-[#F5D77F]" : "text-zinc-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-semibold tracking-wide ${isSelected ? "text-[#F5D77F]" : "text-white"}`}>
                            {item.title}
                          </h4>
                          {isSelected && <Check className="w-4 h-4 text-[#D4AF37]" />}
                        </div>
                        <p className="text-xs text-zinc-300 font-medium">{item.subtitle}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-3.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:text-white transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="btn-chapter-continue"
                  disabled={chapters.length === 0}
                  onClick={() => setStep(4)}
                  className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    chapters.length > 0
                      ? "gold-gradient-bg text-zinc-950 shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:brightness-110"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                  }`}
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: What are you becoming? */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center my-auto"
            >
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                  04 — Becoming Profile
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display mt-1 text-white">
                  {displayPreferredName}, who are you becoming?
                </h2>
                <p className="text-zinc-400 text-sm mt-1.5 font-light leading-relaxed">
                  If the next few years went really well… who would you become? Don&apos;t describe a generic wish. Describe the person you want to grow into.
                </p>
              </div>

              <div className="my-6">
                <div className="relative rounded-2xl border border-amber-400/25 bg-black/40 backdrop-blur-md p-4 focus-within:border-amber-300 focus-within:shadow-[0_0_25px_rgba(212,175,55,0.2)] transition-all">
                  <textarea
                    id="input-becoming"
                    rows={4}
                    value={becoming}
                    onChange={(e) => setBecoming(e.target.value)}
                    placeholder="I want to become someone who is financially independent, masters my craft, builds enduring technology, and lifts up my family..."
                    className="w-full bg-transparent text-white text-base placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed font-normal"
                    autoFocus
                  />
                  <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-2 border-t border-white/5 mt-2">
                    <span>Your Becoming statement</span>
                    <span>{becoming.length} characters</span>
                  </div>
                </div>

                {/* Quick intuitive thought-starters */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Master of my craft & builder",
                    "Financially independent & generous",
                    "Disciplined creator and leader",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBecoming(preset)}
                      className="text-[11px] py-1 px-3 rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:border-amber-400/40 hover:text-amber-200 transition-all cursor-pointer"
                    >
                      + &quot;{preset}&quot;
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="px-5 py-3.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:text-white transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="btn-becoming-continue"
                  disabled={becoming.trim().length === 0}
                  onClick={() => setStep(5)}
                  className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    becoming.trim().length > 0
                      ? "gold-gradient-bg text-zinc-950 shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:brightness-110"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                  }`}
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: What matters to you? (Constellation) */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center my-auto"
            >
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                  05 — Personal Universe
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display mt-1 text-white">
                  A future isn&apos;t built from one thing.
                </h2>
                <p className="text-zinc-400 text-sm mt-1.5 font-light">
                  What matters to you, {displayPreferredName}? Tap the dimensions that form your constellation.
                </p>
              </div>

              {/* Dynamic Constellation Grid with Central Glow */}
              <div className="my-6">
                <div className="relative bg-black/40 border border-amber-300/20 rounded-2xl p-4 overflow-hidden">
                  {/* Central Node representing the user */}
                  <div className="flex items-center justify-center my-3">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-[#FFF1C5] p-[2px] shadow-[0_0_30px_rgba(212,175,55,0.6)]">
                        <div className="w-full h-full rounded-full bg-[#0E1020] flex flex-col items-center justify-center">
                          <span className="text-[10px] font-mono tracking-widest text-amber-200 uppercase font-bold">
                            {displayPreferredName.slice(0, 6)}
                          </span>
                          <span className="text-[8px] text-zinc-400">CENTER</span>
                        </div>
                      </div>
                      <div className="absolute -inset-1 rounded-full border border-amber-300/30 animate-ping opacity-20 pointer-events-none" />
                    </div>
                  </div>

                  {/* Constellation Nodes */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                    {LIFE_CONSTELLATION_NODES.map((node) => {
                      const isSelected = selectedMatters.includes(node.id);
                      return (
                        <button
                          key={node.id}
                          onClick={() => toggleMatter(node.id)}
                          className={`py-2 px-3 rounded-lg border text-xs font-semibold tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-gradient-to-r from-amber-500/20 to-purple-950/30 border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                              : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                          }`}
                        >
                          <span>{node.label}</span>
                          <div
                            className={`w-2 h-2 rounded-full transition-all ${
                              isSelected ? "bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" : "bg-white/20"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-center text-amber-200/70 mt-4 italic">
                    {selectedMatters.length > 0
                      ? `${selectedMatters.length} dimensions actively illuminated around your center.`
                      : "Tap what matters to illuminate your universe."}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(4)}
                  className="px-5 py-3.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:text-white transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="btn-matters-continue"
                  disabled={selectedMatters.length === 0}
                  onClick={() => setStep(6)}
                  className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedMatters.length > 0
                      ? "gold-gradient-bg text-zinc-950 shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:brightness-110"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                  }`}
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 6: 5 Years From Now (Direction Before Objectives) */}
          {step === 6 && (
            <motion.div
              key="step-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center my-auto"
            >
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                  06 — Long Horizon
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display mt-1 text-white">
                  Imagine yourself 5 years from now.
                </h2>
                <p className="text-zinc-400 text-sm mt-1.5 font-light leading-relaxed">
                  What would make you look back and genuinely think: <br />
                  <span className="text-[#F5D77F] italic font-medium">
                    &quot;I&apos;m glad I became that person.&quot;
                  </span>
                </p>
              </div>

              <div className="my-6">
                <div className="relative rounded-2xl border border-amber-400/25 bg-black/40 backdrop-blur-md p-4 focus-within:border-amber-300 focus-within:shadow-[0_0_25px_rgba(212,175,55,0.2)] transition-all">
                  <textarea
                    id="input-five-year-vision"
                    rows={4}
                    value={fiveYearVision}
                    onChange={(e) => setFiveYearVision(e.target.value)}
                    placeholder="In 5 years, I want to look back knowing I didn't waste time on trivial distractions. I built real leverage, stayed healthy, mastered skills, and gave my family true security..."
                    className="w-full bg-transparent text-white text-base placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed font-normal"
                    autoFocus
                  />
                  <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-2 border-t border-white/5 mt-2">
                    <span>Direction before objectives</span>
                    <span>{fiveYearVision.length} chars</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(5)}
                  className="px-5 py-3.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:text-white transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="btn-vision-continue"
                  onClick={() => setStep(7)}
                  className="flex-1 py-4 px-6 rounded-xl gold-gradient-bg text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 7: Reality Check (Current Constraints) */}
          {step === 7 && (
            <motion.div
              key="step-7"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center my-auto"
            >
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                  07 — Reality Check
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display mt-1 text-white">
                  Now, the honest part.
                </h2>
                <p className="text-zinc-400 text-sm mt-1.5 font-light">
                  What&apos;s standing between you and that future? CRESCIVE needs to know your true starting conditions, not fantasy plans.
                </p>
              </div>

              <div className="my-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    "TIME",
                    "MONEY",
                    "DISCIPLINE",
                    "KNOWLEDGE",
                    "CONFIDENCE",
                    "ENVIRONMENT",
                    "DISTRACTIONS",
                    "UNCERTAINTY",
                    "I DON'T KNOW YET",
                  ].map((item) => {
                    const isSelected = selectedConstraints.includes(item);
                    return (
                      <button
                        key={item}
                        onClick={() => toggleConstraint(item)}
                        className={`p-2.5 rounded-lg border text-xs font-semibold tracking-wide transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-rose-950/30 border-rose-400/50 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                            : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <span>{item}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3">
                  <input
                    type="text"
                    value={customConstraint}
                    onChange={(e) => setCustomConstraint(e.target.value)}
                    placeholder="Something else? (Optional)"
                    className="w-full bg-white/5 border border-white/10 focus:border-amber-400/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(6)}
                  className="px-5 py-3.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:text-white transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="btn-constraints-continue"
                  onClick={() => setStep(8)}
                  className="flex-1 py-4 px-6 rounded-xl gold-gradient-bg text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 8: Your Time (Realistic Investment) */}
          {step === 8 && (
            <motion.div
              key="step-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col justify-center my-auto"
            >
              <div>
                <span className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-semibold">
                  08 — Realistic Time
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display mt-1 text-white">
                  How much time can you realistically invest?
                </h2>
                <p className="text-zinc-400 text-sm mt-1.5 font-light">
                  Not fantasy hours. CRESCIVE works with the life you actually have.
                </p>
              </div>

              <div className="my-6 space-y-2.5">
                {[
                  { id: "30 min/day", label: "30 min/day", desc: "Short, razor-sharp daily focus compounding over months" },
                  { id: "1 hour/day", label: "1 hour/day", desc: "Solid, sustainable progress without burning out" },
                  { id: "2 hours/day", label: "2 hours/day", desc: "Deep work commitment for rapid trajectory shifts" },
                  { id: "A few hours/week", label: "A few hours/week", desc: "Weekend or evening sprints tailored to tight schedules" },
                  { id: "It changes", label: "It changes", desc: "Dynamic schedule adapting to variable weeks" },
                  { id: "I'm not sure", label: "I'm not sure", desc: "We'll discover your natural rhythm as we move" },
                ].map((item) => {
                  const isSelected = availableTime === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setAvailableTime(item.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-amber-500/20 to-purple-950/30 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.25)]"
                          : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]"
                      }`}
                    >
                      <div>
                        <div className={`text-sm font-semibold ${isSelected ? "text-[#F5D77F]" : "text-white"}`}>
                          {item.label}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">{item.desc}</div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-[#D4AF37] bg-[#D4AF37]" : "border-white/20"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-black" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(7)}
                  className="px-5 py-3.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:text-white transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="btn-time-continue"
                  disabled={!availableTime}
                  onClick={() => setStep(9)}
                  className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    availableTime
                      ? "gold-gradient-bg text-zinc-950 shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:brightness-110"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
                  }`}
                >
                  <span>Build Trajectory</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 9: The Reveal (Meet your trajectory) — Styled according to Elegant Dark */}
          {step === 9 && (
            <motion.div
              key="step-9"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col justify-center my-auto text-center w-full max-w-xl mx-auto"
            >
              <div className="mb-6">
                <p className="text-amber-200/60 text-xs tracking-widest uppercase mb-2">
                  Synthesis Complete
                </p>
                <h2 className="text-3xl sm:text-4xl font-light tracking-tight mb-2 text-white">
                  Meet your trajectory, <span className="text-[#D4AF37]">{displayPreferredName}</span>.
                </h2>
                <p className="text-zinc-400 text-xs sm:text-sm italic">
                  This is the beginning of understanding where your choices can take you.
                </p>
              </div>

              {/* Trajectory Blueprint Nodes with connected gold line */}
              <div className="relative my-4 w-full">
                {/* Connecting gold divider line */}
                <div className="hidden sm:block absolute top-7 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-40 z-0" />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
                  {/* Node 1: Now */}
                  <div className="flex flex-col items-center p-3 rounded-2xl bg-[#101025]/70 border border-white/5 backdrop-blur-md">
                    <div className="w-12 h-12 rounded-full bg-[#101025] border border-[#D4AF37]/50 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                      <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                    </div>
                    <p className="text-[10px] tracking-widest uppercase text-[#D4AF37] font-bold mb-0.5">
                      You — Now
                    </p>
                    <p className="text-[11px] opacity-70 text-center text-zinc-300">
                      Age {age} · {chapters[0] || "Exploring"}
                    </p>
                  </div>

                  {/* Node 2: Values */}
                  <div className="flex flex-col items-center p-3 rounded-2xl bg-[#101025]/70 border border-white/5 backdrop-blur-md">
                    <div className="w-12 h-12 rounded-full bg-[#101025] border border-[#D4AF37]/50 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                      <Compass className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <p className="text-[10px] tracking-widest uppercase text-[#D4AF37] font-bold mb-0.5">
                      Values
                    </p>
                    <p className="text-[11px] opacity-70 text-center text-zinc-300 line-clamp-1">
                      {selectedMatters.slice(0, 2).join(" · ") || "Foundations"}
                    </p>
                  </div>

                  {/* Node 3: Commitment */}
                  <div className="flex flex-col items-center p-3 rounded-2xl bg-[#101025]/70 border border-white/5 backdrop-blur-md">
                    <div className="w-12 h-12 rounded-full bg-[#101025] border border-[#D4AF37]/50 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                      <Clock className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <p className="text-[10px] tracking-widest uppercase text-[#D4AF37] font-bold mb-0.5">
                      Daily Focus
                    </p>
                    <p className="text-[11px] opacity-70 text-center text-zinc-300">
                      {availableTime || "1 hr/day"}
                    </p>
                  </div>

                  {/* Node 4: Trajectory */}
                  <div className="flex flex-col items-center p-3 rounded-2xl bg-[#101025]/70 border border-white/5 backdrop-blur-md">
                    <div className="w-12 h-12 rounded-full bg-[#101025] border border-[#D4AF37]/50 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <p className="text-[10px] tracking-widest uppercase text-[#D4AF37] font-bold mb-0.5">
                      Trajectory
                    </p>
                    <p className="text-[11px] opacity-70 text-center text-zinc-300 line-clamp-1">
                      Conscious Becoming
                    </p>
                  </div>
                </div>
              </div>

              {/* Trajectory Dimensions Summary Box matching Design HTML */}
              <div className="my-4 bg-[#101025]/50 backdrop-blur-md border border-white/5 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <div className="sm:border-r border-white/10 sm:pr-4">
                  <p className="text-[10px] uppercase tracking-widest opacity-40 mb-1 text-[#f5f5f0]">
                    Core Constraints
                  </p>
                  <p className="text-xs text-amber-100/90 font-medium line-clamp-1">
                    {selectedConstraints.length > 0
                      ? selectedConstraints.slice(0, 2).join(" · ")
                      : "Self-governed focus"}
                  </p>
                </div>
                <div className="sm:border-r border-white/10 sm:pr-4">
                  <p className="text-[10px] uppercase tracking-widest opacity-40 mb-1 text-[#f5f5f0]">
                    Primary Value
                  </p>
                  <p className="text-xs text-amber-100/90 font-medium line-clamp-1">
                    {selectedMatters[0] || "Creative Mastery"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-40 mb-1 text-[#f5f5f0]">
                    Daily Commitment
                  </p>
                  <p className="text-xs text-amber-100/90 font-medium">
                    {availableTime || "Consistent Action"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <button
                  id="btn-enter-crescive"
                  onClick={handleFinish}
                  className="group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-8 py-4 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all hover:scale-105 active:scale-95 text-black font-bold tracking-[0.2em] text-xs uppercase cursor-pointer w-full"
                >
                  <span>Enter Crescive</span>
                  <span className="text-black text-xl transition-transform group-hover:translate-x-1">→</span>
                  <div className="absolute inset-0 rounded-full border border-white/20 scale-105 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all pointer-events-none" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer in Elegant Dark theme */}
      <footer className="relative z-10 px-6 sm:px-10 py-5 flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-white/5 text-[10px] opacity-50">
        <p className="max-w-md text-center sm:text-left leading-relaxed">
          CRESCIVE is a dynamic model. As you make decisions, your trajectory will adjust in real-time. This is not a prediction, but a manifestation of intent.
        </p>
        <p className="text-[#D4AF37] tracking-widest uppercase text-[9px] font-mono">
          CRESCIVE · Trajectory Engine
        </p>
      </footer>
    </div>
  );
};
