import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, MoveItem } from "./types";
import { OnboardingFlow } from "./components/Onboarding/OnboardingFlow";
import { HomeScreen } from "./components/Home/HomeScreen";
import { MovesScreen } from "./components/Moves/MovesScreen";
import { CategoriesScreen } from "./components/Categories/CategoriesScreen";
import { FutureScreen } from "./components/Future/FutureScreen";
import { NavigatorScreen } from "./components/Navigator/NavigatorScreen";
import { ProfileScreen } from "./components/Profile/ProfileScreen";
import { FunZoneScreen } from "./components/FunZone/FunZoneScreen";
import { CreateMoveModal } from "./components/Moves/CreateMoveModal";
import { CreatorStoryModal } from "./components/CreatorStoryModal";
import { ActiveReminderModal } from "./components/Moves/ActiveReminderModal";
import { DeepWorkSanctuary } from "./components/Focus/DeepWorkSanctuary";
import { CresciveLogo } from "./components/CresciveLogo";
import { PWAInstallPrompt } from "./components/PWA/PWAInstallPrompt";
import { OfflineBanner } from "./components/PWA/OfflineBanner";
import {
  playCresciveChime,
  triggerVibration,
  sendBrowserNotification,
  getStoredReminderSettings,
} from "./utils/reminderEngine";
import { initActiveTimeTracker } from "./utils/activeTimeTracker";
import {
  Sparkles,
  CheckSquare,
  Compass,
  Layers,
  Brain,
  User,
  Plus,
  BookOpen,
  Smartphone,
  Maximize2,
  PartyPopper
} from "lucide-react";

const STORAGE_KEY_PROFILE = "crescive_user_profile_v1";
const STORAGE_KEY_MOVES = "crescive_user_moves_v1";

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [moves, setMoves] = useState<MoveItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MOVES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentTab, setCurrentTab] = useState<
    "home" | "moves" | "fun" | "categories" | "future" | "navigator" | "profile"
  >("home");

  const [isCreateMoveOpen, setIsCreateMoveOpen] = useState(false);
  const [createModalMode, setCreateModalMode] = useState<"create" | "ideas">("create");
  const [defaultMoveDomain, setDefaultMoveDomain] = useState<string | undefined>(undefined);
  const [isCreatorStoryOpen, setIsCreatorStoryOpen] = useState(false);
  const [isMobileFrameActive, setIsMobileFrameActive] = useState(false);

  // Active Reminder Alarm State
  const [activeReminderMove, setActiveReminderMove] = useState<MoveItem | null>(null);

  // Deep Work Sanctuary (Focus / Flow Mode) State
  const [isFocusSanctuaryOpen, setIsFocusSanctuaryOpen] = useState(false);
  const [activeFocusMove, setActiveFocusMove] = useState<MoveItem | null>(null);
  const [activeFocusDuration, setActiveFocusDuration] = useState<number | undefined>(undefined);

  // Initialize active time tracking
  useEffect(() => {
    const cleanup = initActiveTimeTracker();
    return cleanup;
  }, []);

  // Sync to local storage
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(userProfile));
    }
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MOVES, JSON.stringify(moves));
  }, [moves]);

  // Real-time Reminder Monitor
  useEffect(() => {
    const checkDueReminders = () => {
      const settings = getStoredReminderSettings();
      if (!settings.remindersEnabled) return;

      const now = Date.now();
      for (const move of moves) {
        if (!move.completed && move.reminderEnabled && move.reminderDateTime) {
          const alertTime =
            new Date(move.reminderDateTime).getTime() -
            (settings.defaultTimingMinutes || 0) * 60 * 1000;

          // If alert is due within a reasonable current window and not active yet
          if (alertTime <= now && now - alertTime < 24 * 60 * 60 * 1000) {
            if (!activeReminderMove || activeReminderMove.id !== move.id) {
              if (settings.soundEnabled) playCresciveChime();
              if (settings.vibrationEnabled) triggerVibration();
              sendBrowserNotification(move);
              setActiveReminderMove(move);
              break;
            }
          }
        }
      }
    };

    const interval = setInterval(checkDueReminders, 6000);
    checkDueReminders();
    return () => clearInterval(interval);
  }, [moves, activeReminderMove]);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentTab("home");
  };

  const handleOpenCreateMove = (mode: "create" | "ideas" = "create") => {
    setCreateModalMode(mode);
    setDefaultMoveDomain(undefined);
    setIsCreateMoveOpen(true);
  };

  const handleAddMove = (moveData: Omit<MoveItem, "id" | "createdAt">) => {
    const newMove: MoveItem = {
      ...moveData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setMoves((prev) => [newMove, ...prev]);
  };

  const handleToggleMove = (id: string) => {
    setMoves((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              completed: !m.completed,
              completedAt: !m.completed ? new Date().toISOString() : undefined,
            }
          : m
      )
    );
  };

  const handleDeleteMove = (id: string) => {
    setMoves((prev) => prev.filter((m) => m.id !== id));
  };

  const handleUpdatePreferredName = (newName: string) => {
    if (!userProfile) return;
    setUserProfile({
      ...userProfile,
      preferredName: newName,
    });
  };

  const handleUpdateAvatar = (avatarUrl?: string) => {
    if (!userProfile) return;
    setUserProfile({
      ...userProfile,
      avatarUrl,
    });
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY_PROFILE);
    localStorage.removeItem(STORAGE_KEY_MOVES);
    setUserProfile(null);
    setMoves([]);
    setCurrentTab("home");
  };

  const openCreateMoveWithDomain = (domainTitle: string) => {
    setDefaultMoveDomain(domainTitle);
    setCreateModalMode("create");
    setIsCreateMoveOpen(true);
  };

  // Active Reminder Actions
  const handleStartMoveFromReminder = (moveId: string) => {
    handleToggleMove(moveId);
    setActiveReminderMove(null);
    playCresciveChime();
  };

  const handleSnoozeReminder = (moveId: string, minutes: number) => {
    setMoves((prev) =>
      prev.map((m) => {
        if (m.id !== moveId) return m;
        const nextDate = new Date(Date.now() + minutes * 60 * 1000);
        return {
          ...m,
          snoozeCount: (m.snoozeCount || 0) + 1,
          reminderDateTime: nextDate.toISOString().slice(0, 19),
        };
      })
    );
    setActiveReminderMove(null);
  };

  const handleDismissReminder = (moveId: string) => {
    setMoves((prev) =>
      prev.map((m) => {
        if (m.id !== moveId) return m;
        return { ...m, reminderEnabled: false };
      })
    );
    setActiveReminderMove(null);
  };

  const handleChangeScheduledTime = (moveId: string, newDate: string, newTime: string) => {
    setMoves((prev) =>
      prev.map((m) => {
        if (m.id !== moveId) return m;
        return {
          ...m,
          scheduledDate: newDate,
          scheduledTime: newTime,
          reminderDateTime: `${newDate}T${newTime}:00`,
          snoozeCount: 0,
          reminderEnabled: true,
        };
      })
    );
    setActiveReminderMove(null);
  };

  const handleStopReminder = (moveId: string) => {
    setMoves((prev) =>
      prev.map((m) => {
        if (m.id !== moveId) return m;
        return { ...m, reminderEnabled: false, snoozeCount: 0 };
      })
    );
    setActiveReminderMove(null);
  };

  const handleStartFocusSession = (move: MoveItem | null, customDuration?: number) => {
    setActiveFocusMove(move);
    setActiveFocusDuration(customDuration);
    setIsFocusSanctuaryOpen(true);
  };

  const handleMoveCompletedInSanctuary = (moveId: string) => {
    setMoves((prev) =>
      prev.map((m) =>
        m.id === moveId
          ? {
              ...m,
              completed: true,
              completedAt: new Date().toISOString(),
            }
          : m
      )
    );
  };

  // If user has not completed onboarding, render the 10-step cinematic journey
  if (!userProfile || !userProfile.onboardingCompleted) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  const preferredName = userProfile.preferredName || "Traveler";

  return (
    <div className="min-h-screen bg-[#050510] text-[#f5f5f0] relative overflow-x-hidden flex flex-col items-center">
      {/* Background ambient lighting matching Elegant Dark */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.1)_0%,transparent_70%)] animate-aurora" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,rgba(127,0,255,0.14)_0%,transparent_70%)] animate-aurora" style={{ animationDelay: "-8s" }} />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-[radial-gradient(circle,rgba(0,191,255,0.05)_0%,transparent_70%)] animate-aurora" style={{ animationDelay: "-14s" }} />
      </div>

      {/* Outer Shell Wrapper (with option to view in smartphone phone aspect or responsive fluid layout) */}
      <div
        className={`relative z-10 w-full flex flex-col min-h-screen transition-all duration-300 ${
          isMobileFrameActive
            ? "max-w-md my-4 rounded-[40px] border-2 border-[#D4AF37]/35 shadow-[0_0_60px_rgba(212,175,55,0.2)] bg-[#070716] overflow-hidden"
            : "max-w-2xl px-4 sm:px-6"
        }`}
      >
        {/* Top Header with Elegant Dark typography and golden accents */}
        <header className="pt-5 pb-3 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#050510]/85 backdrop-blur-lg z-30">
          <div
            onClick={() => setCurrentTab("home")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <CresciveLogo className="w-8 h-8" />
            <div>
              <div className="font-serif-cresive tracking-[0.3em] text-sm font-light text-[#D4AF37] uppercase group-hover:text-amber-200 transition-colors">
                CRESCIVE
              </div>
              <div className="text-[9px] tracking-[0.35em] text-[#f5f5f0]/60 uppercase font-light">
                {preferredName} · IN PROGRESS
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Creator Brian Story Button at the top for easy visibility and access */}
            <button
              id="header-creator-story-btn"
              onClick={() => setIsCreatorStoryOpen(true)}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-[#101025] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-semibold shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              title="Read Creator Brian Omuse's Story (Age 14)"
            >
              <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-[#D4AF37]/70 bg-[#050510]">
                <img
                  src="/creator_brian.jpg"
                  alt="Brian"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
              </div>
              <span className="font-serif-cresive tracking-wide">Brian&apos;s Story</span>
            </button>

            {/* Toggle mobile view frame */}
            <button
              onClick={() => setIsMobileFrameActive(!isMobileFrameActive)}
              className="p-2 rounded-xl bg-[#101025] hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={isMobileFrameActive ? "Switch to fluid view" : "Switch to mobile phone frame view"}
            >
              {isMobileFrameActive ? (
                <Maximize2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              ) : (
                <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
              )}
            </button>

            {/* Quick Move Trigger */}
            <button
              id="header-quick-add-move"
              onClick={() => handleOpenCreateMove("create")}
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-[#B8860B] text-black flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Create a Move"
            >
              <Plus className="w-4 h-4 text-black stroke-[3]" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 pt-4 safe-pb-nav">
          <AnimatePresence mode="wait">
            {currentTab === "home" && (
              <motion.div
                key="tab-home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <HomeScreen
                  userProfile={userProfile}
                  moves={moves}
                  onOpenCreateMove={handleOpenCreateMove}
                  onToggleMove={handleToggleMove}
                  onNavigateTab={(tab) => setCurrentTab(tab)}
                  onOpenCreatorStory={() => setIsCreatorStoryOpen(true)}
                  onStartFocusSession={handleStartFocusSession}
                />
              </motion.div>
            )}

            {currentTab === "moves" && (
              <motion.div
                key="tab-moves"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MovesScreen
                  moves={moves}
                  onOpenCreateMove={handleOpenCreateMove}
                  onToggleMove={handleToggleMove}
                  onDeleteMove={handleDeleteMove}
                  onStartFocusSession={handleStartFocusSession}
                />
              </motion.div>
            )}

            {currentTab === "fun" && (
              <motion.div
                key="tab-fun"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FunZoneScreen
                  onOpenCreateMove={() => handleOpenCreateMove("create")}
                />
              </motion.div>
            )}

            {currentTab === "categories" && (
              <motion.div
                key="tab-categories"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CategoriesScreen
                  moves={moves}
                  onOpenCreateMoveForDomain={openCreateMoveWithDomain}
                  userProfile={userProfile}
                  onStartFocusSession={handleStartFocusSession}
                />
              </motion.div>
            )}

            {currentTab === "future" && (
              <motion.div
                key="tab-future"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FutureScreen
                  userProfile={userProfile}
                  moves={moves}
                  onOpenCreateMove={() => handleOpenCreateMove("create")}
                />
              </motion.div>
            )}

            {currentTab === "navigator" && (
              <motion.div
                key="tab-navigator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <NavigatorScreen
                  userProfile={userProfile}
                  moves={moves}
                />
              </motion.div>
            )}

            {currentTab === "profile" && (
              <motion.div
                key="tab-profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ProfileScreen
                  userProfile={userProfile}
                  moves={moves}
                  onUpdatePreferredName={handleUpdatePreferredName}
                  onUpdateAvatar={handleUpdateAvatar}
                  onResetOnboarding={handleResetOnboarding}
                  onOpenCreatorStory={() => setIsCreatorStoryOpen(true)}
                  onOpenCreateMove={() => handleOpenCreateMove("create")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Floating Mobile Bottom Navigation Bar / Category Board */}
        <nav
          id="category-navigation-board"
          className={`fixed safe-bottom-nav left-1/2 -translate-x-1/2 z-40 w-[calc(100%-12px)] sm:w-[94%] ${
            isMobileFrameActive ? "max-w-[420px]" : "max-w-2xl"
          } bg-[#101025]/90 border border-[#D4AF37]/30 rounded-2xl sm:rounded-3xl py-2 px-1 sm:p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-all duration-200`}
        >
          <div className="grid grid-cols-7 items-center w-full">
            {[
              { id: "home", label: "Home", icon: Sparkles },
              { id: "moves", label: "Moves", icon: CheckSquare },
              { id: "fun", label: "Fun", icon: PartyPopper },
              { id: "categories", label: "15 Map", icon: Layers },
              { id: "future", label: "Future", icon: Compass },
              { id: "navigator", label: "Navigator", icon: Brain },
              { id: "profile", label: "Profile", icon: User },
            ].map((tab) => {
              const isActive = currentTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`relative w-full py-1.5 sm:py-2.5 px-0.5 sm:px-1.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    isActive ? "text-[#D4AF37]" : "text-[#f5f5f0]/50 hover:text-[#f5f5f0]"
                  }`}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isActive ? "text-[#D4AF37] stroke-[2.5]" : ""}`} />
                  <span className="text-[9px] min-[360px]:text-[9.5px] min-[400px]:text-[10px] sm:text-[11px] font-semibold tracking-tight min-[400px]:tracking-normal sm:tracking-wider text-center truncate max-w-full leading-tight">
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-glow"
                      className="absolute -bottom-1 w-5 sm:w-6 h-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] shadow-[0_0_10px_rgba(212,175,55,0.6)]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Create Move Modal (With Create My Own & Explore Move Ideas) */}
      <CreateMoveModal
        isOpen={isCreateMoveOpen}
        initialMode={createModalMode}
        userProfile={userProfile}
        onClose={() => {
          setIsCreateMoveOpen(false);
          setDefaultMoveDomain(undefined);
        }}
        onAddMove={handleAddMove}
        defaultDomain={defaultMoveDomain}
      />

      {/* Creator Story Modal (Brian Omuse) */}
      <CreatorStoryModal
        isOpen={isCreatorStoryOpen}
        onClose={() => setIsCreatorStoryOpen(false)}
      />

      {/* Active Reminder Alarm Modal */}
      <ActiveReminderModal
        isOpen={Boolean(activeReminderMove)}
        move={activeReminderMove}
        onStartMove={handleStartMoveFromReminder}
        onSnooze={handleSnoozeReminder}
        onDismiss={handleDismissReminder}
        onChangeScheduledTime={handleChangeScheduledTime}
        onStopReminder={handleStopReminder}
        onStartInFocusSanctuary={handleStartFocusSession}
      />

      {/* CRESCIVE IMMERSIVE DEEP WORK SANCTUARY — FOCUS / FLOW MODE */}
      <DeepWorkSanctuary
        isOpen={isFocusSanctuaryOpen}
        move={activeFocusMove}
        customDurationMinutes={activeFocusDuration}
        onClose={() => {
          setIsFocusSanctuaryOpen(false);
          setActiveFocusMove(null);
          setActiveFocusDuration(undefined);
        }}
        onMoveCompleted={handleMoveCompletedInSanctuary}
      />

      {/* Offline Status Indicator */}
      <OfflineBanner />

      {/* Smart PWA Installation Prompt */}
      <PWAInstallPrompt
        isFocusSessionActive={isFocusSanctuaryOpen}
      />
    </div>
  );
}
