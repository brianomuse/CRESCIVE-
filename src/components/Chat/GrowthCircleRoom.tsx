import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  Target,
  Clock,
  Sparkles,
  Flame,
  CheckCircle2,
  Circle,
  Plus,
  Play,
  Pause,
  Download,
  Archive,
  ArchiveRestore,
  Trash2,
  LogOut,
  UserPlus,
  UserX,
  ShieldCheck,
  Check,
  AlertCircle,
  Send,
  Heart,
  Award,
} from "lucide-react";
import {
  GrowthCircle,
  CircleSharedItem,
  SanctuarySession,
  RealChatUser,
  listenToCircleSharedItems,
  listenToSanctuarySessions,
  shareItemWithCircle,
  updateSharedItemStatus,
  toggleCheerSharedItem,
  deleteSharedItem,
  startSanctuarySession,
  joinSanctuarySession,
  leaveSanctuarySession,
  completeSanctuarySession,
  inviteFriendToCircle,
  archiveCircle,
  leaveCircle,
  removeMemberFromCircle,
  deleteCircle,
  exportCircleData,
} from "../../lib/firebase";
import { useFirebaseAuth } from "../../contexts/FirebaseAuthContext";
import { UserProfile, MoveItem } from "../../types";
import { playIncomingMessageSound } from "../../lib/soundChime";

interface GrowthCircleRoomProps {
  circle: GrowthCircle;
  currentUserProfile: UserProfile | null;
  moves?: MoveItem[];
  friends: RealChatUser[];
  onBack: () => void;
  onCircleUpdated?: () => void;
}

export const GrowthCircleRoom: React.FC<GrowthCircleRoomProps> = ({
  circle,
  currentUserProfile,
  moves = [],
  friends,
  onBack,
  onCircleUpdated,
}) => {
  const { currentUser } = useFirebaseAuth();

  // Internal tab: "accountability" | "sanctuary" | "members"
  const [activeTab, setActiveTab] = useState<
    "accountability" | "sanctuary" | "members"
  >("accountability");

  // Real-time data from Firestore
  const [sharedItems, setSharedItems] = useState<CircleSharedItem[]>([]);
  const [sanctuarySessions, setSanctuarySessions] = useState<
    SanctuarySession[]
  >([]);

  // Modals & form states
  const [showShareModal, setShowShareModal] = useState(false);
  const [showStartSanctuaryModal, setShowStartSanctuaryModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    confirmText: string;
    danger?: boolean;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // New shared commitment form
  const [shareType, setShareType] = useState<"move" | "goal">("move");
  const [selectedMoveId, setSelectedMoveId] = useState<string>("");
  const [customTitle, setCustomTitle] = useState("");
  const [customDomain, setCustomDomain] = useState("Focus & Craft");
  const [customDuration, setCustomDuration] = useState("45 min");

  // New sanctuary session form
  const [sanctuaryIntention, setSanctuaryIntention] = useState("Deep Focus Sprint");
  const [sanctuaryDuration, setSanctuaryDuration] = useState(25);

  // Timer tick state for active sanctuary
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const isCreator = currentUser?.uid === circle.creatorId;

  // Real-time listeners
  useEffect(() => {
    if (!circle.id) return;
    const unsubItems = listenToCircleSharedItems(circle.id, (items) => {
      setSharedItems(items);
    });
    const unsubSessions = listenToSanctuarySessions(circle.id, (sessions) => {
      setSanctuarySessions(sessions);
    });

    return () => {
      unsubItems();
      unsubSessions();
    };
  }, [circle.id]);

  // Clock tick for live countdown timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showFeedback = (text: string) => {
    setNotice(text);
    setTimeout(() => setNotice(null), 3500);
  };

  // Find active sanctuary session
  const activeSanctuary = sanctuarySessions.find((s) => s.status === "active");
  const isUserInActiveSanctuary =
    activeSanctuary &&
    currentUser &&
    activeSanctuary.activeParticipantIds.includes(currentUser.uid);

  // Remaining time in active sanctuary
  let remainingSeconds = 0;
  if (activeSanctuary) {
    const endMs = new Date(activeSanctuary.endsAt).getTime();
    remainingSeconds = Math.max(0, Math.floor((endMs - currentTime) / 1000));
  }

  // Handle Share Commitment
  const handleConfirmShareItem = async (e: React.FormEvent) => {
    e.preventDefault();
    let titleToShare = customTitle.trim();
    let domainToShare = customDomain;
    let commitmentToShare = customDuration;

    if (shareType === "move" && selectedMoveId) {
      const foundMove = moves.find((m) => m.id === selectedMoveId);
      if (foundMove) {
        titleToShare = foundMove.title;
        domainToShare = foundMove.domain || "General Growth";
        commitmentToShare = foundMove.timeCommitment || "Daily Move";
      }
    }

    if (!titleToShare) return;

    setActionLoading(true);
    try {
      await shareItemWithCircle(
        circle.id,
        {
          type: shareType,
          title: titleToShare,
          domain: domainToShare,
          timeCommitment: commitmentToShare,
        },
        currentUserProfile
      );
      setShowShareModal(false);
      setCustomTitle("");
      setSelectedMoveId("");
      showFeedback("Commitment shared with the circle!");
    } catch (err: any) {
      console.error("Error sharing item:", err);
      showFeedback(err?.message || "Failed to share commitment.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Start Sanctuary Session
  const handleStartSanctuary = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await startSanctuarySession(
        circle.id,
        sanctuaryIntention,
        sanctuaryDuration,
        currentUserProfile
      );
      setShowStartSanctuaryModal(false);
      playIncomingMessageSound();
      showFeedback("Deep Work Sanctuary session started!");
    } catch (err: any) {
      console.error("Error starting sanctuary:", err);
      showFeedback(err?.message || "Failed to start session.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Export Data
  const handleExport = () => {
    exportCircleData(circle, sharedItems, sanctuarySessions);
    showFeedback("Circle collaboration data exported safely!");
  };

  // Handle Archive / Restore
  const handleToggleArchive = async () => {
    try {
      const willArchive = circle.status !== "archived";
      await archiveCircle(circle.id, willArchive);
      showFeedback(willArchive ? "Circle archived." : "Circle restored.");
      onCircleUpdated?.();
    } catch (err: any) {
      showFeedback("Failed to update circle state.");
    }
  };

  // Handle Leave Circle with in-app confirmation
  const handleLeaveCircle = () => {
    setConfirmModal({
      title: "Leave Growth Circle",
      description: `Are you sure you want to leave "${circle.name}"? Your access to this circle, shared commitments, and deep work sanctuary will be immediately removed.`,
      confirmText: "Leave Circle",
      danger: true,
      onConfirm: async () => {
        await leaveCircle(circle.id);
        onBack();
      },
    });
  };

  // Handle Delete Circle (Creator only) with in-app confirmation
  const handleDeleteCircle = () => {
    setConfirmModal({
      title: "Permanently Delete Circle",
      description: `Are you sure you want to permanently delete "${circle.name}"? All shared accountability items and sanctuary sessions will be deleted. This cannot be undone.`,
      confirmText: "Delete Circle",
      danger: true,
      onConfirm: async () => {
        await deleteCircle(circle.id);
        onBack();
      },
    });
  };

  // Handle Remove Member (Creator only) with in-app confirmation
  const handleRemoveMember = (memberUid: string, memberName: string) => {
    setConfirmModal({
      title: "Remove Member",
      description: `Are you sure you want to remove ${memberName} from "${circle.name}"? Their access will be immediately revoked by security rules.`,
      confirmText: "Remove Member",
      danger: true,
      onConfirm: async () => {
        await removeMemberFromCircle(circle.id, memberUid);
        showFeedback(`Removed ${memberName} from circle.`);
        onCircleUpdated?.();
      },
    });
  };

  // Eligible friends to invite
  const eligibleFriendsToInvite = friends.filter(
    (f) => !circle.memberIds.includes(f.uid)
  );

  return (
    <div className="space-y-6 text-[#f5f5f0]">
      {/* Circle Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/35 bg-gradient-to-br from-[#14142D] via-[#0E0E20] to-[#0A0A16] p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="p-1.5 -ml-1 rounded-xl bg-white/5 hover:bg-white/10 text-[#f5f5f0]/70 hover:text-white transition-colors cursor-pointer"
                title="Back to all circles"
              >
                <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-bold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                <span>{circle.focusArea}</span>
              </div>
              {circle.status === "archived" && (
                <span className="px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-300 text-[10px] uppercase font-bold">
                  Archived
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#f5f5f0] truncate">
              {circle.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#f5f5f0]/70 max-w-xl line-clamp-2">
              {circle.description}
            </p>
          </div>

          {/* Quick Actions Dropdown / Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0">
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/40 text-xs text-[#D4AF37] font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>

            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#f5f5f0]/80 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Export authorized circle collaboration data"
            >
              <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Export</span>
            </button>

            {isCreator && (
              <>
                <button
                  onClick={handleToggleArchive}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#f5f5f0]/70 transition-colors cursor-pointer flex items-center gap-1.5"
                  title={circle.status === "archived" ? "Restore Circle" : "Archive Circle"}
                >
                  {circle.status === "archived" ? (
                    <ArchiveRestore className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Archive className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="hidden sm:inline">
                    {circle.status === "archived" ? "Restore" : "Archive"}
                  </span>
                </button>

                <button
                  onClick={handleDeleteCircle}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs text-rose-300 transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Permanently Delete Circle"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </>
            )}

            {!isCreator && (
              <button
                onClick={handleLeaveCircle}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs text-rose-300 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Notice */}
      {notice && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-2 animate-fade-in">
          <span>{notice}</span>
          <button
            onClick={() => setNotice(null)}
            className="text-[10px] uppercase font-bold opacity-75 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Circle Sub-Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("accountability")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "accountability"
              ? "bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]"
              : "text-[#f5f5f0]/60 hover:text-[#f5f5f0] hover:bg-white/5"
          }`}
        >
          <Target className="w-4 h-4" />
          Shared Accountability
          <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
            {sharedItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("sanctuary")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "sanctuary"
              ? "bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]"
              : "text-[#f5f5f0]/60 hover:text-[#f5f5f0] hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Deep Work Sanctuary
          {activeSanctuary && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "members"
              ? "bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]"
              : "text-[#f5f5f0]/60 hover:text-[#f5f5f0] hover:bg-white/5"
          }`}
        >
          <Users className="w-4 h-4" />
          Circle Members
          <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
            {circle.memberIds.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Shared Accountability */}
      {activeTab === "accountability" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#f5f5f0]">
                Shared Commitments
              </h3>
              <p className="text-xs text-[#f5f5f0]/50">
                Moves and Goals explicitly shared by members for mutual accountability.
              </p>
            </div>

            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Share a Move or Goal</span>
            </button>
          </div>

          {sharedItems.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-3xl border border-dashed border-white/10 bg-black/20 text-center space-y-3">
              <Target className="w-10 h-10 text-[#D4AF37]/40 mx-auto" />
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="font-bold text-sm text-[#f5f5f0]">
                  No shared commitments yet
                </h4>
                <p className="text-xs text-[#f5f5f0]/50 leading-relaxed">
                  Personal moves and goals remain completely private by default. Click above to intentionally share a commitment with your circle members!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {sharedItems.map((item) => {
                const isOwner = item.ownerId === currentUser?.uid;
                const isCompleted = item.status === "completed";
                const hasCheered =
                  currentUser && item.cheers?.includes(currentUser.uid);

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isCompleted
                        ? "border-emerald-500/40 bg-[#12221A]/70"
                        : "border-white/10 bg-[#121226]/80 hover:border-[#D4AF37]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.ownerAvatar ? (
                          <img
                            src={item.ownerAvatar}
                            alt={item.ownerName}
                            className="w-8 h-8 rounded-xl object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-[#202040] flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                            {item.ownerName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-[#f5f5f0] block truncate">
                            {item.ownerName}
                            {isOwner && " (You)"}
                          </span>
                          <span className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-wider">
                            {item.domain}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                          isCompleted
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {isCompleted ? "Completed ✓" : "In Progress"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-[#f5f5f0] leading-snug">
                        {item.title}
                      </h4>
                      {item.timeCommitment && (
                        <p className="text-[11px] text-[#f5f5f0]/50 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#D4AF37]/60" />
                          <span>{item.timeCommitment}</span>
                        </p>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-[#f5f5f0]/50 font-mono">
                        <span>Progress</span>
                        <span>{item.progressPercent || (isCompleted ? 100 : 0)}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCompleted
                              ? "bg-emerald-400"
                              : "bg-gradient-to-r from-[#D4AF37] to-[#B8860B]"
                          }`}
                          style={{
                            width: `${item.progressPercent || (isCompleted ? 100 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      {/* Cheer button */}
                      <button
                        onClick={() => toggleCheerSharedItem(circle.id, item.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                          hasCheered
                            ? "bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37]"
                            : "bg-white/5 border border-white/10 text-[#f5f5f0]/60 hover:text-white"
                        }`}
                        title="Cheer your peer on their progress!"
                      >
                        <Flame className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{item.cheers?.length || 0}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {isOwner && !isCompleted && (
                          <div className="flex items-center gap-1.5">
                            <div className="hidden sm:flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
                              {[25, 50, 75].map((pct) => (
                                <button
                                  key={pct}
                                  onClick={() =>
                                    updateSharedItemStatus(
                                      circle.id,
                                      item.id,
                                      "in_progress",
                                      pct
                                    )
                                  }
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                                    item.progressPercent === pct
                                      ? "bg-[#D4AF37] text-black font-bold"
                                      : "text-[#f5f5f0]/60 hover:text-white"
                                  }`}
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() =>
                                updateSharedItemStatus(
                                  circle.id,
                                  item.id,
                                  "completed",
                                  100
                                )
                              }
                              className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Done</span>
                            </button>
                          </div>
                        )}

                        {(isOwner || isCreator) && (
                          <button
                            onClick={() => deleteSharedItem(circle.id, item.id)}
                            className="p-1.5 rounded-lg text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remove commitment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Deep Work Sanctuary (Synchronized Group Focus) */}
      {activeTab === "sanctuary" && (
        <div className="space-y-6">
          {/* Active Session Hero */}
          {activeSanctuary ? (
            <div className="p-6 sm:p-8 rounded-3xl border-2 border-[#D4AF37] bg-gradient-to-b from-[#1E1A38] via-[#121226] to-[#0A0A18] shadow-[0_0_40px_rgba(212,175,55,0.2)] text-center space-y-6 animate-fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Deep Work Sanctuary Active</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-[#f5f5f0]">
                  "{activeSanctuary.intention}"
                </h3>
                <p className="text-xs text-[#f5f5f0]/60">
                  Hosted by {activeSanctuary.hostName} • {activeSanctuary.durationMinutes} min Sprint
                </p>
              </div>

              {/* Synchronized Countdown Clock */}
              <div className="py-4">
                <div className="inline-block px-8 py-5 rounded-3xl bg-black/60 border border-[#D4AF37]/30 shadow-inner">
                  <span className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-[#D4AF37] drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">
                    {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:
                    {String(remainingSeconds % 60).padStart(2, "0")}
                  </span>
                  <p className="text-[11px] text-[#f5f5f0]/40 font-mono mt-1">
                    SYNCHRONIZED FLOW CLOCK
                  </p>
                </div>
              </div>

              {/* Active Participants in Sanctuary */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-bold text-[#f5f5f0]/60 tracking-wider">
                  {activeSanctuary.activeParticipantIds.length} Members in Deep Focus
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {activeSanctuary.activeParticipantIds.map((uid) => {
                    const name =
                      activeSanctuary.participantNames?.[uid] ||
                      (circle.memberDetails?.[uid]?.displayName ?? "Member");
                    return (
                      <span
                        key={uid}
                        className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-[#f5f5f0] flex items-center gap-1.5"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        {name}
                        {uid === currentUser?.uid && " (You)"}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Sanctuary Actions */}
              <div className="flex items-center justify-center gap-3 pt-2">
                {isUserInActiveSanctuary ? (
                  <button
                    onClick={() =>
                      leaveSanctuarySession(circle.id, activeSanctuary.id)
                    }
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-[#f5f5f0] transition-colors cursor-pointer"
                  >
                    Step Out of Sanctuary
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      joinSanctuarySession(
                        circle.id,
                        activeSanctuary.id,
                        currentUserProfile
                      )
                    }
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold text-xs tracking-wide shadow-lg transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Join Deep Work Sanctuary</span>
                  </button>
                )}

                {(currentUser?.uid === activeSanctuary.hostId || isCreator) && (
                  <button
                    onClick={() =>
                      completeSanctuarySession(circle.id, activeSanctuary.id)
                    }
                    className="px-4 py-2.5 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold transition-colors cursor-pointer"
                  >
                    Complete Sanctuary
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-12 rounded-3xl border border-dashed border-white/10 bg-black/20 text-center space-y-4">
              <Sparkles className="w-12 h-12 text-[#D4AF37]/50 mx-auto" />
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="font-bold text-sm sm:text-base text-[#f5f5f0]">
                  Deep Work Sanctuary Ready
                </h4>
                <p className="text-xs text-[#f5f5f0]/50 leading-relaxed">
                  Start a synchronized focus sprint. Circle members can join in real-time, synchronize timers, and hold space for distraction-free deep work.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowStartSanctuaryModal(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-xs tracking-wide shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Start Group Focus Sanctuary</span>
                </button>
              </div>
            </div>
          )}

          {/* Past Sanctuary History */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs uppercase font-bold tracking-wider text-[#f5f5f0]/70">
              Completed Sanctuary Sprints ({sanctuarySessions.filter((s) => s.status === "completed").length})
            </h4>

            {sanctuarySessions.filter((s) => s.status === "completed").length === 0 ? (
              <p className="text-xs text-[#f5f5f0]/40 italic">
                No past sessions recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {sanctuarySessions
                  .filter((s) => s.status === "completed")
                  .map((session) => (
                    <div
                      key={session.id}
                      className="p-3.5 rounded-2xl border border-white/5 bg-[#121226]/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="font-bold text-[#f5f5f0]">
                            {session.intention}
                          </span>
                          <span className="text-[11px] text-[#f5f5f0]/50 block">
                            {session.durationMinutes} min sprint • Hosted by {session.hostName}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-[#D4AF37]">
                        {session.activeParticipantIds.length} focused together
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Circle Members */}
      {activeTab === "members" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#f5f5f0]">
                Circle Members ({circle.memberIds.length})
              </h3>
              <p className="text-xs text-[#f5f5f0]/50">
                Verified CRESCIVE members in this private Growth Circle.
              </p>
            </div>

            <button
              onClick={() => setShowInviteModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-[#D4AF37]/20 border border-white/10 hover:border-[#D4AF37]/40 text-xs text-[#D4AF37] font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Friends</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {circle.memberIds.map((uid) => {
              const detail = circle.memberDetails?.[uid];
              const isCircleCreator = uid === circle.creatorId;

              return (
                <div
                  key={uid}
                  className="p-4 rounded-2xl border border-white/10 bg-[#121226]/80 flex items-center gap-3.5"
                >
                  {detail?.photoURL ? (
                    <img
                      src={detail.photoURL}
                      alt={detail.displayName}
                      className="w-11 h-11 rounded-xl object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-[#202040] flex items-center justify-center font-bold text-[#D4AF37]">
                      {detail?.displayName?.charAt(0) || "M"}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-[#f5f5f0] truncate">
                        {detail?.displayName || "Member"}
                      </h4>
                      {isCircleCreator && (
                        <span className="px-1.5 py-0.2 rounded-md bg-[#D4AF37]/20 text-[#D4AF37] text-[9px] font-bold">
                          Creator
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#f5f5f0]/60 line-clamp-1 italic">
                      "{detail?.becoming || "Continuous self-growth"}"
                    </p>
                  </div>

                  {isCreator && uid !== circle.creatorId && (
                    <button
                      onClick={() => handleRemoveMember(uid, detail?.displayName || "Member")}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                      title="Remove member from circle"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px] font-semibold">Remove</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Share a Move or Goal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#161632] via-[#101026] to-[#0A0A18] p-5 sm:p-7 shadow-2xl text-[#f5f5f0] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#f5f5f0]">
                Share a Commitment with {circle.name}
              </h3>
              <p className="text-xs text-[#f5f5f0]/60">
                Choose an existing move from your CRESCIVE Moves or type a custom goal.
              </p>
            </div>

            <form onSubmit={handleConfirmShareItem} className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShareType("move")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    shareType === "move"
                      ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                      : "bg-white/5 border-white/10 text-[#f5f5f0]/70"
                  }`}
                >
                  Pick from CRESCIVE Moves
                </button>
                <button
                  type="button"
                  onClick={() => setShareType("goal")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    shareType === "goal"
                      ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                      : "bg-white/5 border-white/10 text-[#f5f5f0]/70"
                  }`}
                >
                  Custom Goal
                </button>
              </div>

              {shareType === "move" && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                    Select Move to Share
                  </label>
                  {moves.length === 0 ? (
                    <p className="text-xs text-[#f5f5f0]/50 italic">
                      No moves created yet in your CRESCIVE Moves tab. You can type a custom title below!
                    </p>
                  ) : (
                    <select
                      value={selectedMoveId}
                      onChange={(e) => {
                        setSelectedMoveId(e.target.value);
                        const m = moves.find((item) => item.id === e.target.value);
                        if (m) {
                          setCustomTitle(m.title);
                          setCustomDomain(m.domain);
                          setCustomDuration(m.timeCommitment);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#14142B] border border-white/10 text-xs sm:text-sm text-white focus:outline-none"
                    >
                      <option value="">-- Choose a Move --</option>
                      {moves.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} ({m.domain})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  Commitment Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Finish Chapter 4 & practice questions"
                  maxLength={160}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#f5f5f0]/70">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#f5f5f0]/70">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-xs text-[#f5f5f0]/70 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !customTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Sharing..." : "Share with Circle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Start Sanctuary Session */}
      {showStartSanctuaryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowStartSanctuaryModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#161632] via-[#101026] to-[#0A0A18] p-5 sm:p-7 shadow-2xl text-[#f5f5f0] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#f5f5f0]">
                Start Deep Work Sanctuary
              </h3>
              <p className="text-xs text-[#f5f5f0]/60">
                Begin a synchronized focus sprint for circle members.
              </p>
            </div>

            <form onSubmit={handleStartSanctuary} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  Focus Sprint Intention
                </label>
                <input
                  type="text"
                  value={sanctuaryIntention}
                  onChange={(e) => setSanctuaryIntention(e.target.value)}
                  placeholder="e.g. Deep Reading & Reflection"
                  maxLength={100}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                  Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[25, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSanctuaryDuration(mins)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        sanctuaryDuration === mins
                          ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                          : "bg-white/5 border-white/10 text-[#f5f5f0]/70"
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStartSanctuaryModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-xs text-[#f5f5f0]/70 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer"
                >
                  {actionLoading ? "Starting..." : "Begin Sanctuary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invite Confirmed Friends */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#161632] via-[#101026] to-[#0A0A18] p-5 sm:p-7 shadow-2xl text-[#f5f5f0] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#f5f5f0]">
                Invite Confirmed Friends
              </h3>
              <p className="text-xs text-[#f5f5f0]/60">
                Only real friends from your CRESCIVE network can be invited to private circles.
              </p>
            </div>

            {eligibleFriendsToInvite.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-[#f5f5f0]/50">
                All your confirmed friends are already members or invited!
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {eligibleFriendsToInvite.map((friend) => (
                  <div
                    key={friend.uid}
                    className="p-3 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {friend.photoURL ? (
                        <img
                          src={friend.photoURL}
                          alt={friend.displayName}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[#202040] flex items-center justify-center font-bold text-[#D4AF37] text-xs">
                          {friend.displayName.charAt(0)}
                        </div>
                      )}
                      <span className="text-xs font-semibold text-[#f5f5f0] truncate">
                        {friend.displayName}
                      </span>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          await inviteFriendToCircle(circle.id, friend);
                          showFeedback(`Invited ${friend.displayName}!`);
                          setShowInviteModal(false);
                        } catch (err: any) {
                          showFeedback(err?.message || "Failed to invite.");
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold cursor-pointer"
                    >
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-xs text-[#f5f5f0]/70 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#161632] via-[#101026] to-[#0A0A18] p-5 sm:p-7 shadow-2xl text-[#f5f5f0] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#f5f5f0]">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-[#f5f5f0]/70 leading-relaxed">
                {confirmModal.description}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#f5f5f0]/70 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={async () => {
                  setActionLoading(true);
                  try {
                    await confirmModal.onConfirm();
                    setConfirmModal(null);
                  } catch (err: any) {
                    showFeedback(err?.message || "Operation failed.");
                  } finally {
                    setActionLoading(false);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  confirmModal.danger
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20"
                    : "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black shadow-md"
                }`}
              >
                {actionLoading ? "Processing..." : confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
