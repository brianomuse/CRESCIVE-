import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { UserProfile, MoveItem } from "../../types";
import {
  Edit2,
  Check,
  RotateCcw,
  BookOpen,
  Camera,
  UploadCloud,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Bell,
  BellOff,
  Volume2,
  Vibrate,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Trophy,
  Flame,
  Award,
  TrendingUp,
  Target,
  Zap,
  Smartphone,
  Shield,
  FileText,
  Cloud,
  CloudOff,
  RefreshCw,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { useFirebaseAuth } from "../../contexts/FirebaseAuthContext";
import {
  subscribeSyncStatus,
  syncTrajectoryWithCloud,
} from "../../utils/trajectorySyncService";
import {
  isGoogleCalendarConnected,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
} from "../../utils/googleCalendarService";
import { isAndroidDevice } from "../../utils/androidAlarmService";
import { TrajectorySyncStatus } from "../../types";
import { PWAInstallButton } from "../PWA/PWAInstallButton";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal";
import { getStoredFocusStats } from "../../utils/focusStorage";
import { LeaderboardCard } from "../Leaderboard/LeaderboardCard";
import { GlobalLeaderboardModal } from "../Leaderboard/GlobalLeaderboardModal";
import { HelpButton } from "../Help/HelpButton";
import { NotificationSettingsSection } from "./NotificationSettingsSection";
import {
  fetchLeaderboardData,
  calculateUserStats,
  LeaderboardResponse,
} from "../../utils/leaderboardService";
import { CresciveLogo } from "../CresciveLogo";

interface ProfileScreenProps {
  userProfile: UserProfile;
  moves: MoveItem[];
  onUpdatePreferredName: (name: string) => void;
  onUpdateAvatar: (avatarUrl?: string) => void;
  onResetOnboarding: () => void;
  onOpenCreatorStory: () => void;
  onOpenCreateMove?: () => void;
  onOpenHelpGuide?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userProfile,
  moves,
  onUpdatePreferredName,
  onUpdateAvatar,
  onResetOnboarding,
  onOpenCreatorStory,
  onOpenCreateMove,
  onOpenHelpGuide,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.preferredName);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Leaderboard modal state and cache
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);

  // User verified stats across the app
  const userStats = calculateUserStats(userProfile, moves);

  useEffect(() => {
    let isMounted = true;
    fetchLeaderboardData("global", userProfile, moves).then((data) => {
      if (isMounted) {
        setLeaderboardData(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [userProfile, moves.length]);

  // Auth Context & Cloud Trajectory Sync State
  const { currentUser, signInWithGoogle } = useFirebaseAuth();
  const [syncStatus, setSyncStatus] = useState<TrajectorySyncStatus>("unauthenticated");
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Google Calendar Integration State
  const [isGcalConnected, setIsGcalConnected] = useState(isGoogleCalendarConnected());
  const [isConnectingGcal, setIsConnectingGcal] = useState(false);

  useEffect(() => {
    const unsub = subscribeSyncStatus((status) => {
      setSyncStatus(status);
    });
    return unsub;
  }, []);

  const handleSyncNow = async () => {
    if (!currentUser) {
      await signInWithGoogle();
      return;
    }
    setIsManualSyncing(true);
    try {
      await syncTrajectoryWithCloud(currentUser.uid);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleConnectGcal = async () => {
    setIsConnectingGcal(true);
    try {
      const res = await connectGoogleCalendar();
      if (res.success) {
        setIsGcalConnected(true);
      }
    } finally {
      setIsConnectingGcal(false);
    }
  };

  const handleDisconnectGcal = () => {
    disconnectGoogleCalendar();
    setIsGcalConnected(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = () => {
    if (nameInput.trim().length > 0) {
      onUpdatePreferredName(nameInput.trim());
      setIsEditingName(false);
    }
  };

  const processAndSetImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose a valid image file (PNG, JPG, WebP).");
      return;
    }

    setUploadError(null);
    setIsProcessingImage(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Resize down to max 400x400 to keep localStorage storage featherlight and instant
          const canvas = document.createElement("canvas");
          const maxDim = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            onUpdateAvatar(e.target?.result as string);
            setIsProcessingImage(false);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
          onUpdateAvatar(dataUrl);
          setIsProcessingImage(false);
        } catch {
          onUpdateAvatar(e.target?.result as string);
          setIsProcessingImage(false);
        }
      };

      img.onerror = () => {
        setUploadError("Failed to decode the image file.");
        setIsProcessingImage(false);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setUploadError("Could not read the uploaded file.");
      setIsProcessingImage(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndSetImage(e.target.files[0]);
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndSetImage(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAvatar = () => {
    onUpdateAvatar(undefined);
    setUploadError(null);
  };

  const completedCount = moves.filter((m) => m.completed).length;

  return (
    <div className="space-y-6 pb-24">
      {/* Hidden File Input for Profile Picture Upload */}
      <input
        ref={fileInputRef}
        type="file"
        id="profile-picture-file-input"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div>
        <span className="text-[10px] font-mono tracking-widest uppercase text-[#D4AF37] font-semibold">
          IDENTITY INITIALIZATION
        </span>
        <h1 className="text-2xl sm:text-3xl font-light font-serif-cresive text-white tracking-wide">
          Your Profile & Genesis
        </h1>
        <p className="text-xs text-zinc-400 font-light mt-0.5">
          The living foundation CRESCIVE uses to calculate your trajectory.
        </p>
      </div>

      {/* Identity Card featuring the Profile Picture Upload right where the user's name is */}
      <div className="bg-[#101025] rounded-3xl p-6 sm:p-7 border border-[#D4AF37]/30 shadow-[0_15px_40px_-15px_rgba(212,175,55,0.15)] relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full sm:w-auto">
            {/* Profile Picture Avatar Container with Drag-and-Drop + Click to Upload */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-[2px] transition-all duration-200 shrink-0 cursor-pointer group select-none ${
                isDragging
                  ? "scale-105 shadow-[0_0_35px_rgba(212,175,55,0.8)] ring-2 ring-[#D4AF37]"
                  : "shadow-[0_0_25px_rgba(212,175,55,0.3)] hover:shadow-[0_0_35px_rgba(212,175,55,0.5)]"
              } bg-gradient-to-tr from-[#D4AF37] via-[#FFF1C5] to-[#B8860B]`}
              title="Click or drop an image to set your profile picture"
            >
              <div className="w-full h-full rounded-[14px] bg-[#050510] overflow-hidden relative flex items-center justify-center">
                {isProcessingImage ? (
                  <div className="flex flex-col items-center justify-center p-2">
                    <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin mb-1" />
                    <span className="text-[9px] font-mono text-zinc-300">Processing...</span>
                  </div>
                ) : userProfile.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.preferredName}
                    className="w-full h-full object-cover rounded-[14px]"
                  />
                ) : (
                  <span className="font-serif-cresive font-light text-3xl sm:text-4xl text-[#D4AF37]">
                    {userProfile.preferredName.charAt(0).toUpperCase()}
                  </span>
                )}

                {/* Hover / Drag Overlay with Camera & prompt */}
                <div
                  className={`absolute inset-0 bg-black/75 rounded-[14px] flex flex-col items-center justify-center transition-opacity duration-200 ${
                    isDragging ? "opacity-100 bg-black/85" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <Camera className="w-5 h-5 text-[#D4AF37] mb-1" />
                  <span className="text-[10px] font-bold text-white tracking-wider uppercase text-center px-1">
                    {isDragging ? "Drop photo" : userProfile.avatarUrl ? "Change" : "Upload"}
                  </span>
                </div>
              </div>

              {/* Little gold camera indicator badge */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#101025] border border-[#D4AF37] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Camera className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
            </div>

            {/* User Name & Profile Picture Upload Controls */}
            <div className="space-y-1.5 flex-1">
              {/* Name Display / Editing */}
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="bg-[#050510] border border-[#D4AF37]/60 rounded-xl px-3 py-1.5 text-base font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold cursor-pointer hover:scale-105 transition-transform"
                    title="Save name"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-light font-serif-cresive text-white tracking-wide">
                    {userProfile.preferredName}
                  </h2>
                  <button
                    onClick={() => {
                      setNameInput(userProfile.preferredName);
                      setIsEditingName(true);
                    }}
                    className="p-1 text-zinc-400 hover:text-[#D4AF37] transition-colors cursor-pointer"
                    title="Edit Name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Dedicated Profile Picture Upload Bar right where the user's name is */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  id="btn-upload-profile-picture"
                  onClick={triggerFileInput}
                  className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold border border-[#D4AF37]/50 bg-[#D4AF37]/15 text-[#D4AF37] hover:bg-[#D4AF37]/25 hover:border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{userProfile.avatarUrl ? "Change Photo" : "Upload Profile Picture"}</span>
                </button>

                <button
                  type="button"
                  id="btn-use-crescive-pfp"
                  onClick={() => onUpdateAvatar("/crescive_logo.png")}
                  className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold border border-cyan-400/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 hover:border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all cursor-pointer"
                  title="Use the official CRESCIVE emblem as your profile picture"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Use CRESCIVE Emblem</span>
                </button>

                {userProfile.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-xs text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10 border border-white/10 hover:border-rose-400/30 transition-all cursor-pointer"
                    title="Remove custom photo and restore initial monogram"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Subtle format helper */}
              <p className="text-[10px] text-zinc-400 font-light flex items-center gap-1.5 pt-0.5">
                <ImageIcon className="w-3 h-3 text-[#D4AF37]/70 shrink-0" />
                <span>Drag & drop onto photo or click to choose PNG, JPG, or WebP</span>
              </p>

              {uploadError && (
                <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-400/25 px-2.5 py-1 rounded-lg">
                  {uploadError}
                </p>
              )}

              <p className="text-xs text-[#f5f5f0]/60 font-mono pt-1">
                {userProfile.age} years old · {userProfile.chapter.join(" & ") || "Explorer"}
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-[#050510] border border-[#D4AF37]/40 text-xs font-mono text-[#D4AF37] shadow-inner flex items-center gap-1.5">
              <span>Level {userStats.level}</span>
              <span className="text-zinc-500">·</span>
              <span className="font-semibold">{userStats.totalXp.toLocaleString()} XP</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-[#050510] border border-white/10 text-xs font-mono text-zinc-300 shadow-inner">
              {completedCount} Moves Completed
            </div>
          </div>
        </div>

        {/* Becoming Statement */}
        <div className="mt-6 pt-5 border-t border-white/5">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4AF37] block mb-1">
            BECOMING PROFILE
          </span>
          <p className="text-sm text-zinc-200 font-serif-cresive italic leading-relaxed">
            &ldquo;{userProfile.becoming}&rdquo;
          </p>
        </div>
      </div>

      {/* Prominently Placed Leaderboard Card */}
      <LeaderboardCard
        userRank={leaderboardData?.userRank ?? null}
        totalParticipants={leaderboardData?.totalParticipants ?? 0}
        totalXp={userStats.totalXp}
        level={userStats.level}
        xpToNextRank={leaderboardData?.xpToNextRank ?? 0}
        nextRankUsername={leaderboardData?.nextRankUsername}
        rankChangeNotification={leaderboardData?.rankChangeNotification}
        topPeers={leaderboardData?.entries}
        streakDays={userStats.streak}
        achievementsCount={userStats.achievementsCount}
        completedMovesCount={userStats.completedMovesCount}
        dailyChallengesCount={userStats.dailyChallengesCount}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
      />

      {/* Progress & Achievements Overview */}
      <div className="p-5 rounded-3xl bg-[#101025] border border-white/5 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] font-semibold">
            PROGRESS & MOMENTUM
          </span>
          <span className="text-xs font-mono text-zinc-400">
            Level {userStats.level} · {userStats.totalXp.toLocaleString()} Total XP
          </span>
        </div>

        {/* Level XP Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Progress to Level {userStats.level + 1}</span>
            <span className="text-[#D4AF37] font-semibold">
              {userStats.totalXp % 100} / 100 XP
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#050510] overflow-hidden p-[1px] border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] via-[#FFF1C5] to-[#B8860B] transition-all duration-500"
              style={{ width: `${Math.max(5, (userStats.totalXp % 100))}%` }}
            />
          </div>
        </div>

        {/* 3 Metric Pillars */}
        <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
          <div className="p-3 rounded-2xl bg-[#050510] border border-white/5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">Moves</span>
            <span className="text-lg font-mono font-bold text-white mt-0.5 block">
              {userStats.completedMovesCount}
            </span>
            <span className="text-[9px] text-zinc-500 block">Completed</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#050510] border border-white/5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">Challenges</span>
            <span className="text-lg font-mono font-bold text-[#D4AF37] mt-0.5 block">
              {userStats.dailyChallengesCount}
            </span>
            <span className="text-[9px] text-zinc-500 block">Solved</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#050510] border border-white/5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">Achievements</span>
            <span className="text-lg font-mono font-bold text-emerald-300 mt-0.5 block">
              {userStats.achievementsCount} 🏆
            </span>
            <span className="text-[9px] text-zinc-500 block">Unlocked</span>
          </div>
        </div>
      </div>

      {/* Deep Work Sanctuary Focus Record */}
      {(() => {
        const focusStats = getStoredFocusStats();
        return (
          <div className="p-5 rounded-3xl bg-[#101025] border border-[#D4AF37]/25 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                DEEP WORK SANCTUARY RECORD
              </span>
              <span className="text-[10px] font-mono text-[#06b6d4]">
                {focusStats.totalFocusMinutes} Total Minutes
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-[#050510] border border-white/5">
                <span className="text-[9px] font-mono uppercase text-zinc-400 block">Sessions</span>
                <span className="text-base font-mono font-bold text-white mt-0.5 block">
                  {focusStats.totalSessionsCompleted}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#050510] border border-white/5">
                <span className="text-[9px] font-mono uppercase text-zinc-400 block">Focus Time</span>
                <span className="text-base font-mono font-bold text-[#D4AF37] mt-0.5 block">
                  {focusStats.totalFocusMinutes}m
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#050510] border border-white/5">
                <span className="text-[9px] font-mono uppercase text-zinc-400 block">Flow Days</span>
                <span className="text-base font-mono font-bold text-[#06b6d4] mt-0.5 block">
                  {focusStats.distinctDays?.length || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#050510] border border-white/5">
                <span className="text-[9px] font-mono uppercase text-zinc-400 block">Longest</span>
                <span className="text-base font-mono font-bold text-amber-300 mt-0.5 block">
                  {focusStats.longestSessionMinutes}m
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Living Profile Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Constellation of Matters */}
        <div className="bg-[#101025] rounded-2xl p-5 border border-white/5 shadow-md">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4AF37] block mb-3">
            YOUR CONSTELLATION
          </span>
          <div className="flex flex-wrap gap-1.5">
            {userProfile.matters.map((m) => (
              <span
                key={m}
                className="py-1 px-2.5 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Realistic Constraints */}
        <div className="bg-[#101025] rounded-2xl p-5 border border-white/5 shadow-md">
          <span className="text-[10px] uppercase font-mono tracking-wider text-rose-300 block mb-3">
            REALITY CHECK (CONSTRAINTS)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {userProfile.constraints.length > 0 ? (
              userProfile.constraints.map((c) => (
                <span
                  key={c}
                  className="py-1 px-2.5 rounded-lg bg-rose-500/10 border border-rose-400/25 text-rose-200 text-xs font-semibold"
                >
                  {c}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-500 italic">None specified</span>
            )}
            {userProfile.customConstraint && (
              <span className="py-1 px-2.5 rounded-lg bg-rose-500/10 border border-rose-400/25 text-rose-200 text-xs font-semibold">
                {userProfile.customConstraint}
              </span>
            )}
          </div>
        </div>

        {/* 5-Year Vision */}
        <div className="bg-[#101025] rounded-2xl p-5 border border-white/5 shadow-md md:col-span-2">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4AF37] block mb-1.5">
            5-YEAR HORIZON
          </span>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {userProfile.fiveYearVision || "Direction set toward deliberate compounding and sovereign growth."}
          </p>
        </div>
      </div>

      {/* Cloud Trajectory Synchronization (Feature 1) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#101025] border border-[#D4AF37]/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#050510] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Cloud Trajectory Sync</span>
              {/* Subtle sync status */}
              {syncStatus === "synced" && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-1 font-semibold">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Synced
                </span>
              )}
              {syncStatus === "syncing" && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center gap-1 font-semibold">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  Syncing...
                </span>
              )}
              {syncStatus === "offline" && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-500/15 border border-zinc-500/30 text-zinc-400 flex items-center gap-1 font-semibold">
                  <CloudOff className="w-3 h-3" />
                  Offline
                </span>
              )}
              {syncStatus === "error" && (
                <button
                  onClick={handleSyncNow}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-1 font-semibold hover:bg-rose-500/25 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sync failed — Tap to retry
                </button>
              )}
              {syncStatus === "unauthenticated" && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-400">
                  Local Mode
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {currentUser
                ? `Secured to ${currentUser.email || currentUser.displayName}. Restored automatically across all your devices.`
                : "Sign in with Google to automatically backup and restore your trajectory across devices."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {currentUser ? (
            <button
              onClick={handleSyncNow}
              disabled={isManualSyncing || syncStatus === "syncing"}
              className="py-1.5 px-3.5 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? "animate-spin" : ""}`} />
              <span>{isManualSyncing ? "Syncing..." : "Sync Now"}</span>
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-md"
            >
              <span>Sign In to Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* Scheduling & Real Device Integrations (Feature 2) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#101025] border border-[#D4AF37]/30 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#050510] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-semibold block">
                SCHEDULING INTEGRATIONS
              </span>
              <h3 className="text-base font-bold text-white leading-snug">
                Google Calendar & Device Alarms
              </h3>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-400 font-light leading-relaxed">
          Connect your Moves to real external scheduling systems. CRESCIVE integrates directly with Google Calendar and the official Android Clock application.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Google Calendar Connection Card */}
          <div className="p-3.5 rounded-2xl bg-[#050510] border border-white/10 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-xs font-semibold text-white">Google Calendar</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                Status:{" "}
                <span className={isGcalConnected ? "text-emerald-400 font-semibold" : "text-zinc-400"}>
                  {isGcalConnected ? "Connected" : "Disconnected"}
                </span>
              </span>
            </div>

            {isGcalConnected ? (
              <button
                onClick={handleDisconnectGcal}
                className="py-1 px-3 rounded-xl border border-white/10 text-[11px] text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnectGcal}
                disabled={isConnectingGcal}
                className="py-1.5 px-3 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold hover:bg-[#D4AF37]/30 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                {isConnectingGcal ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>Connect</span>
                )}
              </button>
            )}
          </div>

          {/* Android Alarm Clock Capability Card */}
          <div className="p-3.5 rounded-2xl bg-[#050510] border border-white/10 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#06b6d4]" />
                <span className="text-xs font-semibold text-white">Android System Alarm</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                {isAndroidDevice() ? "Android System Clock Detected" : "Native Android Clock Integration"}
              </span>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400">
              {isAndroidDevice() ? "Available" : "Android Ready"}
            </span>
          </div>
        </div>
      </div>

      {/* Section 9: Notifications & Move Reminders Production Settings */}
      <NotificationSettingsSection availableMoves={moves} />

      {/* PWA & Offline Experience Option */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#101025] border border-white/10 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#050510] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-semibold block">
              OFFLINE & APP EXPERIENCE
            </span>
            <h3 className="text-sm font-bold text-white leading-snug">
              Install CRESCIVE
            </h3>
            <p className="text-xs text-zinc-400 font-light mt-0.5">
              Access CRESCIVE faster with full offline capabilities on your device.
            </p>
          </div>
        </div>
        <PWAInstallButton />
      </div>

      {/* About the Creator Spotlight */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#D4AF37]/10 via-[#101025] to-[#7F00FF]/10 border border-[#D4AF37]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.25)] shrink-0 bg-[#050510] flex items-center justify-center">
            <img
              src="/creator_brian.jpg"
              alt="Brian Omuse - Creator"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading="eager"
            />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#D4AF37] block mb-0.5">
              CREATOR &amp; FOUNDER
            </span>
            <h3 className="text-base font-light font-serif-cresive text-white">
              Brian Omuse · Malaba, Kenya
            </h3>
            <p className="text-xs text-zinc-300 mt-0.5 max-w-md">
              Created and founded in 2026 by Brian Omuse in Malaba, Kenya. Built with the conviction that your future is a trajectory, not a destination.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreatorStory}
          className="py-2 px-5 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
        >
          Brian&apos;s Story
        </button>
      </div>

      {/* Official CRESCIVE Brand & Version */}
      <div className="p-4 rounded-2xl bg-[#0a0a1a] border border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CresciveLogo className="w-12 h-12" roundedClassName="rounded-xl" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-cresive text-sm font-semibold tracking-widest text-[#D4AF37] uppercase">
                CRESCIVE
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D4AF37]/15 text-[#D4AF37] font-mono">
                2026
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-serif-cresive italic">
              &ldquo;The app of becoming.&rdquo; · A personal growth and self-development platform
            </p>
          </div>
        </div>
      </div>

      {/* Privacy, Permissions & Data Sovereignty Section */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#101025] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#050510] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
            <Shield className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Privacy, Permissions & Legal</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono">
                Local-First
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Zero third-party trackers, offline storage, backup export & permissions transparency.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            id="btn-open-privacy-policy"
            onClick={() => setIsPrivacyModalOpen(true)}
            className="py-2 px-4 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Disclosures & Export</span>
          </button>
        </div>
      </div>

      {/* Reset Onboarding Option */}
      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-zinc-300">
            Re-experience Onboarding
          </p>
          <p className="text-[11px] text-zinc-500">
            Revisit the 10-step Identity Initialization journey anytime.
          </p>
        </div>

        <button
          onClick={onResetOnboarding}
          className="py-2 px-3.5 rounded-full border border-white/10 bg-[#101025] hover:bg-white/5 text-xs text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Re-initialize</span>
        </button>
      </div>

      {/* HELP / HOW TO USE THE APP (At the very bottom of Profile section) */}
      {onOpenHelpGuide && (
        <div className="pt-4 border-t border-white/5 flex justify-center">
          <HelpButton onClick={onOpenHelpGuide} />
        </div>
      )}

      {/* Privacy Policy & Legal Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        userProfile={userProfile}
        moves={moves}
        onResetAllData={onResetOnboarding}
      />

      {/* Global Leaderboard Modal */}
      <GlobalLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        userProfile={userProfile}
        moves={moves}
        onOpenCreateMove={onOpenCreateMove}
      />
    </div>
  );
};
