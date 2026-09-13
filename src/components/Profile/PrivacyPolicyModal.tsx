import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  X,
  Lock,
  Download,
  Trash2,
  CheckCircle2,
  FileText,
  Smartphone,
  EyeOff,
  Sparkles,
  Info,
} from "lucide-react";
import { UserProfile, MoveItem } from "../../types";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile | null;
  moves?: MoveItem[];
  onResetAllData?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  moves = [],
  onResetAllData,
}) => {
  const [activeTab, setActiveTab] = useState<"privacy" | "permissions" | "terms" | "data">("privacy");
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExportData = () => {
    try {
      const exportObject = {
        app: "CRESCIVE",
        version: "1.0",
        exportDate: new Date().toISOString(),
        userProfile: userProfile || {},
        moves: moves || [],
        storageKeys: {
          profile: localStorage.getItem("crescive_user_profile_v1"),
          moves: localStorage.getItem("crescive_user_moves_v1"),
          reminderSettings: localStorage.getItem("crescive_reminder_settings_v1"),
          focusStats: localStorage.getItem("crescive_focus_stats_v1"),
          dailyState: localStorage.getItem("crescive_daily_state_v1"),
        },
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `crescive-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-[#101025] border border-[#D4AF37]/40 rounded-3xl p-5 sm:p-7 text-[#f5f5f0] shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(212,175,55,0.2)] my-auto max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#050510] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Shield className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-semibold block">
                LEGAL & TRANSPARENCY
              </span>
              <h2 className="text-lg font-bold font-serif-cresive text-white">
                Privacy, Permissions & Terms
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 pt-3 pb-2 border-b border-white/5 shrink-0 overflow-x-auto">
          {[
            { id: "privacy", label: "Privacy Policy", icon: Lock },
            { id: "permissions", label: "Permissions", icon: Smartphone },
            { id: "terms", label: "Terms of Use", icon: FileText },
            { id: "data", label: "Data Sovereignty", icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs text-zinc-300 leading-relaxed">
          {activeTab === "privacy" && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-[#050510] border border-white/10 flex items-start gap-3">
                <EyeOff className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-xs mb-0.5">
                    Local-First Architecture & Zero Ad Tracking
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    CRESCIVE is built with an offline-first foundation. Your personal goals, Moves, reflections, focus records, and identity settings are stored privately in your browser&apos;s local storage on your device.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white font-serif-cresive">
                  1. Information We Do NOT Collect
                </h4>
                <p>
                  We do not sell, rent, or monetize your personal data. We do not integrate third-party advertising tracking networks, behavioral data brokers, or marketing cookies.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white font-serif-cresive">
                  2. AI Assistant (NAVIGATOR & Simulator)
                </h4>
                <p>
                  When you converse with NAVIGATOR or run scenario simulations in the Future tab, queries are transmitted securely via server-side encrypted proxy to generate helpful responses. Conversations are processed ephemerally and are not saved to any commercial advertising database.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white font-serif-cresive">
                  3. Community & Global Leaderboard
                </h4>
                <p>
                  Participation in the Global Leaderboard is completely optional. If you choose to join, only your chosen public display name and XP score are shared. You can opt out or remain anonymous at any time.
                </p>
              </div>
            </div>
          )}

          {activeTab === "permissions" && (
            <div className="space-y-3.5">
              <p className="text-xs text-zinc-300">
                CRESCIVE requires minimal device permissions to function as a seamless personal operating system:
              </p>

              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-[#050510] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">🔔 Push Notifications (Optional)</span>
                    <span className="text-[10px] font-mono text-[#D4AF37]">User Triggered</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Used strictly to alert you when a scheduled Move is due or when a deep work timer completes. We never send unsolicited marketing notifications.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#050510] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">🎵 Audio / Sound Synthesis</span>
                    <span className="text-[10px] font-mono text-[#D4AF37]">Web Audio API</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Generates serene harmonic chimes for focus completion and gentle reminder tones. Can be disabled anytime in System Preferences.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#050510] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">📳 Haptic Vibration Feedback</span>
                    <span className="text-[10px] font-mono text-[#D4AF37]">Vibration API</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Provides subtle tactile feedback on mobile devices when checking off Moves or receiving alarms.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-[#050510] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">🖼️ Local Image Selection</span>
                    <span className="text-[10px] font-mono text-[#D4AF37]">Client-Side Only</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Used only when you manually choose an avatar image or upload a diagram for NAVIGATOR to analyze. Images are compressed locally on device.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white font-serif-cresive">
                CRESCIVE Terms of Service & Guiding Principles
              </h4>
              <p>
                CRESCIVE is an interactive personal development system created by Brian Omuse (Malaba, Kenya) designed to support intentional action, habit compounding, and personal exploration.
              </p>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-300">
                  <Info className="w-3.5 h-3.5" />
                  Educational & Motivational Disclaimer
                </span>
                <p>
                  CRESCIVE is an aid for focus, personal growth, and daily execution. The tools, simulations, and AI feedback do not constitute licensed medical, psychiatric, legal, or financial counsel.
                </p>
              </div>

              <p>
                By using CRESCIVE, you agree to engage with the system respectfully and responsibly. You retain 100% intellectual ownership of all personal goals, notes, reflections, and strategies you draft inside the application.
              </p>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white font-serif-cresive mb-1">
                  Data Sovereignty & Portability
                </h4>
                <p className="text-zinc-400 text-xs">
                  Your data belongs solely to you. You can export a full copy of your CRESCIVE state or permanently wipe your local device storage at any time.
                </p>
              </div>

              {/* Export Action Card */}
              <div className="p-4 rounded-2xl bg-[#050510] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-white text-xs block">
                    Export Backup (JSON)
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Download all Moves, profile attributes, and progress history.
                  </span>
                </div>

                <button
                  onClick={handleExportData}
                  className="px-4 py-2 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap self-start sm:self-center"
                >
                  {downloadSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Exported!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Data</span>
                    </>
                  )}
                </button>
              </div>

              {/* Erase Action Card */}
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-rose-200 text-xs block">
                    Permanent Data Wipe
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Deletes all local storage records on this device.
                  </span>
                </div>

                {!confirmClearOpen ? (
                  <button
                    onClick={() => setConfirmClearOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap self-start sm:self-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Data</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmClearOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onResetAllData?.();
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition-all cursor-pointer"
                    >
                      Confirm Erase
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between shrink-0 text-zinc-400 text-[11px]">
          <span>CRESCIVE v1.0 · Built by Brian Omuse</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
