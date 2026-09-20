import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ArrowLeft,
  CheckSquare,
  Compass,
  Brain,
  User,
  Trophy,
  Flame,
  UserCheck,
  PartyPopper,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  ArrowRight,
  BookOpen,
} from "lucide-react";

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideSection {
  id: string;
  title: string;
  oneLiner: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderColor: string;
  badge: string;
  description: string;
  coreIdea?: string;
  highlights: string[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "moves",
    title: "MOVES",
    oneLiner: "Moves are small actions that help you grow.",
    icon: CheckSquare,
    accentColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    badge: "Core Action",
    description:
      "Moves are small actions that help you grow. Choose a Move and take action. Moves can help you work on your mind, health, creativity, focus, connection, and other areas of your life.",
    coreIdea: "Small action → XP → progress.",
    highlights: [
      "Pick simple daily actions across mind, health, creativity, or life.",
      "Complete a Move to earn XP and build positive momentum.",
      "Track your consistency and watch your growth compound.",
    ],
  },
  {
    id: "future",
    title: "FUTURE",
    oneLiner: "Plan where you're going and who you're becoming.",
    icon: Compass,
    accentColor: "text-sky-400",
    borderColor: "border-sky-500/30",
    badge: "Vision & Goals",
    description:
      "Future is where you think about where you want to go and the person you want to become. It helps you connect your goals and long-term direction with your daily growth journey.",
    coreIdea: "Purpose + Vision → Meaningful daily steps.",
    highlights: [
      "Clarify long-term aspirations and the person you strive to become.",
      "Align your day-to-day habits with your grander life direction.",
      "Review your vision regularly to stay motivated and centered.",
    ],
  },
  {
    id: "navigator",
    title: "NAVIGATOR",
    oneLiner: "Your guide through CRESCIVE.",
    icon: Brain,
    accentColor: "text-indigo-400",
    borderColor: "border-indigo-500/30",
    badge: "Built-in AI",
    description:
      "Navigator helps you find your way through CRESCIVE and access intelligent guidance and tools that support your journey. Ask questions, learn new topics, brainstorm ideas, write or debug code, and turn ambitions into practical Moves.",
    coreIdea: "Guiding compass: LEARN → GROW → CREATE → PROGRESS.",
    highlights: [
      "Ask where anything in the app is located whenever you need guidance.",
      "Learn STEM concepts, coding, math, or study roadmaps step-by-step.",
      "Turn big or vague ambitions into clear, discrete daily actions.",
    ],
  },
  {
    id: "profile",
    title: "PROFILE",
    oneLiner: "Your personal CRESCIVE space.",
    icon: User,
    accentColor: "text-[#D4AF37]",
    borderColor: "border-[#D4AF37]/30",
    badge: "Identity",
    description:
      "Profile is your personal CRESCIVE space. It allows you to see your identity, progress, achievements, settings, and other personal information available in your profile.",
    coreIdea: "Your unique growth story and personal records.",
    highlights: [
      "Customize your preferred name and profile photo anytime.",
      "Review your earned badges, streaks, and XP level.",
      "Manage notification chimes, vibration preferences, and data.",
    ],
  },
  {
    id: "leaderboard",
    title: "LEADERBOARD",
    oneLiner: "See your rank and XP progress.",
    icon: Trophy,
    accentColor: "text-amber-400",
    borderColor: "border-amber-500/30",
    badge: "Community",
    description:
      "See how your progress compares with other CRESCIVE users. XP can come from activities such as Moves, Daily Challenges, and games, according to the CRESCIVE XP system. Users can see their rank and progress.",
    coreIdea: "Healthy motivation through shared consistency.",
    highlights: [
      "Gain XP from completing Moves, Daily Challenges, and mini-games.",
      "Climb through Tier ranks from Seeker to Ascended Master.",
      "Stay inspired by seeing how consistent others are on their path.",
    ],
  },
  {
    id: "challenges",
    title: "DAILY CHALLENGES",
    oneLiner: "Take on something new today.",
    icon: Flame,
    accentColor: "text-orange-400",
    borderColor: "border-orange-500/30",
    badge: "Daily Momentum",
    description:
      "A new challenge gives you something to do today. Daily Challenges encourage users to take action, try something different, and keep moving forward with bonus XP rewards upon completion.",
    coreIdea: "Fresh inspiration every single day.",
    highlights: [
      "Receive a handpicked daily prompt designed to expand your comfort zone.",
      "Earn immediate bonus XP rewards when you complete the challenge.",
      "Build a streak of continuous daily action.",
    ],
  },
  {
    id: "creator",
    title: "ABOUT CREATOR",
    oneLiner: "Meet the creator behind CRESCIVE.",
    icon: UserCheck,
    accentColor: "text-rose-400",
    borderColor: "border-rose-500/30",
    badge: "Story & Vision",
    description:
      "This section introduces the creator behind CRESCIVE, Brian Omuse, and gives users context about the story and idea behind the app. Brian is a teenage creator and digital innovator from Malaba, Kenya, who built CRESCIVE to give anyone a structured path to personal progress.",
    coreIdea: "Built from Malaba, Kenya — made for progress everywhere.",
    highlights: [
      "Discover the founding vision and philosophy of CRESCIVE.",
      "Learn about Brian Omuse's story as a young builder and innovator.",
      "Understand why CRESCIVE focuses on small, consistent everyday actions.",
    ],
  },
  {
    id: "fun",
    title: "FUN ZONE",
    oneLiner: "Play, laugh, and take a break.",
    icon: PartyPopper,
    accentColor: "text-purple-400",
    borderColor: "border-purple-500/30",
    badge: "Play & Relax",
    description:
      "A place to have fun while you take a break from your growth journey. Fun Zone includes 3D mini-games, jokes, questions, and other interactive experiences. Fun is not separate from CRESCIVE — it is a lighter, more playful part of the app.",
    coreIdea: "Play and humor fuel long-term consistency.",
    highlights: [
      "Enjoy 3D mini-games designed for quick focus and relaxation.",
      "Discover clean, witty tech jokes to lighten your mood.",
      "Earn playful XP even while unwinding and taking a recharge break.",
    ],
  },
];

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  // Store expanded sections. By default, open the first 2 ("moves" and "future") for instant readability
  const [expandedIds, setExpandedIds] = useState<string[]>(["moves", "future"]);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Reset or adjust when opened
  useEffect(() => {
    if (isOpen) {
      // Keep scroll state clean
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  const toggleSection = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const expandAll = () => {
    setExpandedIds(GUIDE_SECTIONS.map((s) => s.id));
  };

  const collapseAll = () => {
    setExpandedIds([]);
  };

  const filteredSections =
    activeFilter === "all"
      ? GUIDE_SECTIONS
      : GUIDE_SECTIONS.filter((s) => s.id === activeFilter);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#050510]/85 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            id="how-to-use-crescive-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-guide-title"
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="relative z-10 w-full max-w-2xl bg-gradient-to-b from-[#12152e]/98 via-[#0e1024]/98 to-[#070914]/98 border border-[#D4AF37]/40 rounded-3xl p-5 sm:p-7 text-[#f5f5f0] shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_50px_rgba(212,175,55,0.16)] my-auto max-h-[90vh] flex flex-col"
          >
            {/* Top Navigation Bar: Back on Left, Title Eyebrow, Close X on Right */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <button
                id="help-guide-back-btn"
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                title="Back to previous screen"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-semibold tracking-wider uppercase text-[11px]">BACK</span>
              </button>

              <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-widest text-[#D4AF37] uppercase font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>USER GUIDE</span>
              </div>

              <button
                id="help-guide-close-btn"
                onClick={onClose}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Header Title Section */}
            <div className="pt-4 pb-3 text-center shrink-0">
              <h2
                id="help-guide-title"
                className="text-xl sm:text-2xl font-light font-serif-cresive text-white tracking-[0.18em] uppercase"
              >
                HOW TO USE CRESCIVE
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 font-light mt-1.5 max-w-md mx-auto leading-relaxed">
                Everything you need to know to get the most out of your growth journey.
              </p>
            </div>

            {/* Quick Action Bar: Filter Pills & Expand/Collapse Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 border-y border-white/5 text-xs shrink-0">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === "all"
                      ? "bg-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                      : "bg-[#101025] text-zinc-400 hover:text-white border border-white/5"
                  }`}
                >
                  All Sections ({GUIDE_SECTIONS.length})
                </button>
                {GUIDE_SECTIONS.slice(0, 4).map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setActiveFilter(sec.id);
                      if (!expandedIds.includes(sec.id)) {
                        setExpandedIds((prev) => [...prev, sec.id]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      activeFilter === sec.id
                        ? "bg-[#D4AF37] text-black shadow-[0_0_10px_rgba(212,175,55,0.4)]"
                        : "bg-[#101025] text-zinc-400 hover:text-white border border-white/5"
                    }`}
                  >
                    {sec.title}
                  </button>
                ))}
              </div>

              {/* Expand / Collapse All Toggle */}
              <div className="flex items-center gap-1.5 ml-auto text-[11px]">
                {expandedIds.length === GUIDE_SECTIONS.length ? (
                  <button
                    onClick={collapseAll}
                    className="text-zinc-400 hover:text-[#D4AF37] transition-colors cursor-pointer px-1 py-0.5"
                  >
                    Collapse all
                  </button>
                ) : (
                  <button
                    onClick={expandAll}
                    className="text-zinc-400 hover:text-[#D4AF37] transition-colors cursor-pointer px-1 py-0.5"
                  >
                    Expand all
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Accordion Cards of Every Main Section */}
            <div className="overflow-y-auto pr-1 space-y-3 mt-3 flex-1 safe-bottom-padding">
              {filteredSections.map((section) => {
                const isExpanded = expandedIds.includes(section.id);
                const Icon = section.icon;

                return (
                  <motion.div
                    key={section.id}
                    id={`help-section-${section.id}`}
                    initial={false}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-gradient-to-r from-[#0c0e20]/95 via-[#090b17]/95 to-[#0e1022]/95 ${
                      isExpanded
                        ? `${section.borderColor} shadow-[0_4px_20px_rgba(0,0,0,0.5)]`
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {/* Header Row (Always visible & interactive) */}
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className="w-full text-left p-4 flex items-center justify-between gap-3 cursor-pointer group"
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl bg-[#060814] border ${
                            isExpanded ? section.borderColor : "border-white/10"
                          } flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform`}
                        >
                          <Icon className={`w-5 h-5 ${section.accentColor}`} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-white tracking-wider uppercase">
                              {section.title}
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5 shrink-0 hidden sm:inline-block">
                              {section.badge}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 font-light truncate mt-0.5">
                            {section.oneLiner}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline-block">
                          {isExpanded ? "Hide" : "Details"}
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Animated Expandable Content */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key="content"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                        >
                          <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3 text-xs sm:text-sm text-zinc-300 font-light">
                            {/* Simple Explanation */}
                            <p className="leading-relaxed">{section.description}</p>

                            {/* Simple Core Idea Box */}
                            {section.coreIdea && (
                              <div className="p-2.5 rounded-xl bg-[#060814]/90 border border-white/10 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                <div className="text-xs font-mono font-medium text-[#D4AF37]">
                                  <span className="text-zinc-400 uppercase mr-1">Key Idea:</span>
                                  <span>{section.coreIdea}</span>
                                </div>
                              </div>
                            )}

                            {/* Quick Takeaway Bullets */}
                            <div className="space-y-1.5 pt-1">
                              {section.highlights.map((bullet, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                                  <span>{bullet}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom Dismiss Button: Return to exactly where the user was */}
            <div className="pt-3 border-t border-white/10 mt-3 shrink-0">
              <motion.button
                id="help-guide-got-it-btn"
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#FFF1C5] to-[#B8860B] text-black font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>GOT IT, BACK TO APP</span>
                <ArrowRight className="w-4 h-4 text-black stroke-[2.5]" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
