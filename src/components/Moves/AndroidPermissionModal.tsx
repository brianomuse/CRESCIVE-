import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, ShieldCheck, Smartphone, X } from "lucide-react";

interface AndroidPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAllow: () => void;
}

export const AndroidPermissionModal: React.FC<AndroidPermissionModalProps> = ({
  isOpen,
  onClose,
  onAllow,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-sm bg-[#101025] border border-[#D4AF37]/40 rounded-3xl p-6 text-[#f5f5f0] shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.2)] text-center backdrop-blur-xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-[#D4AF37]/20 to-[#FFF1C5]/10 border border-[#D4AF37]/40 flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.25)]">
            <Bell className="w-7 h-7 text-[#D4AF37]" />
          </div>

          <span className="text-[10px] font-mono tracking-widest uppercase text-[#D4AF37] font-semibold">
            SMART NOTIFICATIONS
          </span>
          <h3 className="text-xl font-serif-cresive font-light text-white mt-1">
            Stay on track
          </h3>
          <p className="text-xs text-zinc-300 font-light mt-2 leading-relaxed">
            CRESCIVE can remind you when it’s time to make your Move.
          </p>

          <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-left text-[11px] text-zinc-400 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
              <span>Only alerts you for Moves you intentionally scheduled. No spam or vanity pings.</span>
            </div>
            <div className="flex items-start gap-2">
              <Smartphone className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <span>Compatible with Android Alarms & Reminders. You can adjust or silence these anytime in Settings.</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={onAllow}
              className="w-full py-3 px-5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Allow Reminders
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-medium transition-all cursor-pointer"
            >
              Not Now
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
