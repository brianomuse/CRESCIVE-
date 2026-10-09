import React, { useState } from "react";
import {
  X,
  Sparkles,
  Flame,
  CheckCircle2,
  Compass,
  Radio,
  Send,
  Target,
  ShieldCheck,
} from "lucide-react";
import { UserProfile, MoveItem } from "../../types";
import { GrowthMilestoneShare } from "../../lib/firebase";

interface MilestoneShareModalProps {
  onClose: () => void;
  onShare: (milestone: GrowthMilestoneShare) => void;
  userProfile: UserProfile | null;
  targetUserName: string;
}

export const MilestoneShareModal: React.FC<MilestoneShareModalProps> = ({
  onClose,
  onShare,
  userProfile,
  targetUserName,
}) => {
  const [selectedType, setSelectedType] = useState<
    "move" | "streak" | "becoming" | "focus"
  >("move");

  // Custom selection inputs
  const [moveTitle, setMoveTitle] = useState("Daily Deep Work Session");
  const [moveDomain, setMoveDomain] = useState("Focus & Craft");
  const [streakDays, setStreakDays] = useState(3);
  const [focusArea, setFocusArea] = useState("Physical Health & Vitality");

  const commonMoves = [
    { title: "Morning Hydration & Sunlight Walk", domain: "Physical Vitality" },
    { title: "45-Minute Deep Focus Sprint", domain: "Craft & Creation" },
    { title: "Mindful Reflection & Journaling", domain: "Emotional Resilience" },
    { title: "10-Page Growth Reading", domain: "Learning & Wisdom" },
  ];

  const lifeFocusOptions = [
    "Physical Health & Vitality",
    "Mental Clarity & Mindfulness",
    "Career & Craft Excellence",
    "Relationships & Deep Connection",
    "Creative Expression",
    "Financial Discipline & Stewardship",
  ];

  const handleConfirmShare = () => {
    let milestonePayload: GrowthMilestoneShare;

    switch (selectedType) {
      case "move":
        milestonePayload = {
          type: "move",
          title: moveTitle.trim() || "Daily Move Completed",
          subtitle: `Domain: ${moveDomain}`,
          category: moveDomain,
          icon: "🌱",
        };
        break;
      case "streak":
        milestonePayload = {
          type: "streak",
          title: `${streakDays}-Day Consistency Streak`,
          subtitle: "Continuous daily progress in CRESCIVE",
          category: "Streak Milestone",
          icon: "🔥",
        };
        break;
      case "becoming":
        milestonePayload = {
          type: "becoming",
          title: userProfile?.becoming || "Striving for continuous growth",
          subtitle: "Personal Becoming Aspiration",
          category: "Becoming",
          icon: "✨",
        };
        break;
      case "focus":
        milestonePayload = {
          type: "focus",
          title: focusArea,
          subtitle: "Current Life Dimension Focus",
          category: "15 Map Focus",
          icon: "🎯",
        };
        break;
    }

    onShare(milestonePayload);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#161632] via-[#101026] to-[#0A0A18] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-[#f5f5f0] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#f5f5f0]/60 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Growth Milestone Sharing</span>
          </div>
          <h3 className="text-xl font-extrabold tracking-tight text-[#f5f5f0]">
            Share a Milestone with {targetUserName}
          </h3>
          <p className="text-xs text-[#f5f5f0]/60 leading-relaxed">
            Inspire each other on the path of becoming. Select an explicit milestone you wish to share. Private notes and reflections are never shared.
          </p>
        </div>

        {/* Milestone Type Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setSelectedType("move")}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
              selectedType === "move"
                ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                : "border-white/10 hover:border-white/20 bg-white/5 text-[#f5f5f0]/70"
            }`}
          >
            <span className="text-lg">🌱</span>
            <span className="text-xs font-bold leading-tight">Daily Move</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType("streak")}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
              selectedType === "streak"
                ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                : "border-white/10 hover:border-white/20 bg-white/5 text-[#f5f5f0]/70"
            }`}
          >
            <span className="text-lg">🔥</span>
            <span className="text-xs font-bold leading-tight">Streak</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType("becoming")}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
              selectedType === "becoming"
                ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                : "border-white/10 hover:border-white/20 bg-white/5 text-[#f5f5f0]/70"
            }`}
          >
            <span className="text-lg">✨</span>
            <span className="text-xs font-bold leading-tight">Becoming</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType("focus")}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
              selectedType === "focus"
                ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                : "border-white/10 hover:border-white/20 bg-white/5 text-[#f5f5f0]/70"
            }`}
          >
            <span className="text-lg">🎯</span>
            <span className="text-xs font-bold leading-tight">Life Focus</span>
          </button>
        </div>

        {/* Selected Type Configuration */}
        <div className="p-4 rounded-2xl bg-black/40 border border-[#D4AF37]/20 space-y-3">
          {selectedType === "move" && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Move Title
              </label>
              <input
                type="text"
                value={moveTitle}
                onChange={(e) => setMoveTitle(e.target.value)}
                placeholder="e.g. Completed 30 min morning study..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#D4AF37]/60 text-xs sm:text-sm text-[#f5f5f0] focus:outline-none"
              />

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-[#f5f5f0]/50">
                  Quick Select Common Moves:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {commonMoves.map((m) => (
                    <button
                      key={m.title}
                      type="button"
                      onClick={() => {
                        setMoveTitle(m.title);
                        setMoveDomain(m.domain);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-[#f5f5f0]/80 transition-colors text-left"
                    >
                      {m.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedType === "streak" && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Streak Days Completed
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={streakDays}
                  onChange={(e) => setStreakDays(Number(e.target.value) || 1)}
                  className="w-24 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#D4AF37]/60 text-base font-bold text-center text-[#f5f5f0] focus:outline-none"
                />
                <span className="text-xs sm:text-sm text-[#f5f5f0]/70">
                  consecutive days of intentional action
                </span>
              </div>
              <p className="text-[11px] text-[#f5f5f0]/50 italic">
                Celebrate your consistency! Shared directly into your 1-on-1 direct chat.
              </p>
            </div>
          )}

          {selectedType === "becoming" && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Your Becoming Statement
              </label>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm italic text-[#f5f5f0]/90">
                "{userProfile?.becoming || "Striving for continuous growth and progress."}"
              </div>
              <p className="text-[11px] text-[#f5f5f0]/50">
                Shares your CRESCIVE becoming aspiration with {targetUserName}.
              </p>
            </div>
          )}

          {selectedType === "focus" && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Choose Life Dimension Focus (15 Map)
              </label>
              <select
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14142B] border border-white/10 focus:border-[#D4AF37]/60 text-xs sm:text-sm text-[#f5f5f0] focus:outline-none"
              >
                {lifeFocusOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#14142B] text-white">
                    {opt}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[#f5f5f0]/50 italic">
                Let your friend know where your energy is focused today for accountability.
              </p>
            </div>
          )}
        </div>

        {/* Privacy Guard Notice */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>
            Zero private data leakage. Only the selected milestone summary above will be transmitted.
          </span>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#f5f5f0]/70 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmShare}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-xs tracking-wide flex items-center gap-1.5 shadow-[0_4px_15px_rgba(212,175,55,0.3)] transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Share Milestone
          </button>
        </div>
      </div>
    </div>
  );
};
