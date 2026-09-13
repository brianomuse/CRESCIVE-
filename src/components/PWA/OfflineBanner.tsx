import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { WifiOff } from "lucide-react";

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto px-4 py-2 rounded-full bg-[#050510]/95 border border-amber-500/40 text-amber-200 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center justify-center gap-2.5 text-xs font-mono select-none pointer-events-none"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <div className="flex flex-wrap items-center gap-1.5 text-center sm:text-left">
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              You&apos;re offline
            </span>
            <span className="text-zinc-400 text-[10px] hidden sm:inline">·</span>
            <span className="text-zinc-300 text-[11px]">
              CRESCIVE is using available offline resources.
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
