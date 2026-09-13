import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Trophy } from "lucide-react";

interface XpEvent {
  id: string;
  amount: number;
  reason: string;
  isPersonalBest?: boolean;
}

export const XpFeedbackToast: React.FC = () => {
  const [activeEvents, setActiveEvents] = useState<XpEvent[]>([]);

  useEffect(() => {
    const handleXpGained = (e: Event) => {
      const customEvent = e as CustomEvent<{
        amount: number;
        reason: string;
        isPersonalBest?: boolean;
      }>;
      const { amount, reason, isPersonalBest } = customEvent.detail;
      if (amount <= 0) return;

      const newEvent: XpEvent = {
        id: `${Date.now()}-${Math.random()}`,
        amount,
        reason,
        isPersonalBest,
      };

      setActiveEvents((prev) => [...prev.slice(-3), newEvent]);

      setTimeout(() => {
        setActiveEvents((prev) => prev.filter((item) => item.id !== newEvent.id));
      }, 2400);
    };

    window.addEventListener("crescive:xp_gained", handleXpGained);
    return () => window.removeEventListener("crescive:xp_gained", handleXpGained);
  }, []);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex flex-col items-center gap-2">
      <AnimatePresence>
        {activeEvents.map((evt) => (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#FFF1C5] to-[#D4AF37] text-black font-extrabold text-sm shadow-[0_10px_35px_rgba(212,175,55,0.6)] border border-amber-100 flex items-center gap-2"
          >
            {evt.isPersonalBest ? (
              <Trophy className="w-4 h-4 fill-black text-black shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 fill-black text-black shrink-0 animate-spin" />
            )}
            <span className="font-mono tracking-tight">+{evt.amount} XP</span>
            <span className="text-xs font-semibold opacity-80 border-l border-black/20 pl-2">
              {evt.reason}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
