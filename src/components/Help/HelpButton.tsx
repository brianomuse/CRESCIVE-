import React from "react";
import { motion } from "motion/react";
import { HelpCircle, ChevronRight } from "lucide-react";

interface HelpButtonProps {
  onClick: () => void;
  className?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ onClick, className = "" }) => {
  return (
    <motion.button
      id="crescive-help-btn"
      type="button"
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full max-w-md mx-auto group relative overflow-hidden rounded-2xl border border-[#D4AF37]/35 hover:border-[#D4AF37]/70 bg-gradient-to-r from-[#12152e]/85 via-[#0e1024]/90 to-[#12152e]/85 p-3.5 sm:p-4 text-center shadow-[0_8px_25px_rgba(0,0,0,0.5),0_0_20px_rgba(212,175,55,0.1)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.7),0_0_25px_rgba(212,175,55,0.22)] transition-all cursor-pointer select-none ${className}`}
      aria-label="Help: how to use the app"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.08)_0%,transparent_70%)] group-hover:opacity-100 opacity-60 transition-opacity" />

      {/* Content wrapper with the exact text arrangement requested */}
      <div className="relative z-10 flex items-center justify-between px-2">
        {/* Left icon with subtle gold border */}
        <div className="w-8 h-8 rounded-xl bg-[#090b17] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37]/60 group-hover:scale-105 transition-all shrink-0">
          <HelpCircle className="w-4 h-4" />
        </div>

        {/* Centered exact text arrangement:
            Line 1: HELP (main label)
            Line 2: how to use the app (smaller supporting text) */}
        <div className="flex-1 flex flex-col items-center justify-center px-3">
          <span className="text-sm sm:text-base font-bold tracking-[0.25em] text-[#D4AF37] uppercase group-hover:text-[#F3E5AB] transition-colors leading-tight">
            HELP
          </span>
          <span className="text-[11px] sm:text-xs text-zinc-400 font-light tracking-wide lowercase mt-0.5 group-hover:text-zinc-300 transition-colors">
            how to use the app
          </span>
        </div>

        {/* Right subtle arrow */}
        <div className="w-8 h-8 rounded-xl bg-transparent flex items-center justify-center text-zinc-500 group-hover:text-[#D4AF37] group-hover:translate-x-0.5 transition-all shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </motion.button>
  );
};
