import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Users,
  Shield,
  Search,
  LogIn,
  LogOut,
  CheckCircle2,
  Database,
  Radio,
  Lock,
  ArrowRight,
  Layers,
  Clock,
  UserPlus,
  UserCheck,
  Send,
  Trash2,
  AlertCircle,
  Sparkles,
  Inbox,
  UserX,
  Volume2,
  VolumeX,
  Bell,
  X,
  Plus,
  Compass,
  Play,
} from "lucide-react";
import { useFirebaseAuth } from "../../contexts/FirebaseAuthContext";
import {
  RealChatUser,
  FriendRequest,
  DirectConversation,
  GrowthCircle,
  listenToRealUsers,
  listenToFriendships,
  listenToFriendRequests,
  listenToConversations,
  listenToUserCircles,
  sendFriendRequest,
  acceptFriendRequest,
  declineOrCancelFriendRequest,
  unfriendUser,
  getOrCreateDirectConversation,
  joinCircle,
  declineCircleInvitation,
} from "../../lib/firebase";
import { UserProfile, MoveItem } from "../../types";
import { HelpButton } from "../Help/HelpButton";
import { UserProfileModal } from "./UserProfileModal";
import { DirectChatRoom } from "./DirectChatRoom";
import { CreateCircleModal } from "./CreateCircleModal";
import { GrowthCircleRoom } from "./GrowthCircleRoom";
import {
  isSoundEnabled,
  setSoundEnabled,
  playIncomingMessageSound,
} from "../../lib/soundChime";

interface ChatScreenProps {
  userProfile: UserProfile | null;
  moves?: MoveItem[];
  onOpenHelpGuide?: () => void;
}

interface InAppNotification {
  id: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  convoId: string;
  targetUser: RealChatUser;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  userProfile,
  moves = [],
  onOpenHelpGuide,
}) => {
  const {
    currentUser,
    authLoading,
    authError,
    dbConnected,
    signInWithGoogle,
    signOut,
  } = useFirebaseAuth();

  // Navigation states: "conversations" | "find_people" | "requests" | "friends" | "circles" | "roadmap"
  const [activeTab, setActiveTab] = useState<
    "conversations" | "find_people" | "requests" | "friends" | "circles" | "roadmap"
  >("conversations");

  // Real data states from Firestore
  const [registeredUsers, setRegisteredUsers] = useState<RealChatUser[]>([]);
  const [friendUids, setFriendUids] = useState<string[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [circles, setCircles] = useState<GrowthCircle[]>([]);

  // Sound chime preference
  const [soundActive, setSoundActive] = useState(isSoundEnabled());

  // In-app incoming message notification banner
  const [incomingBanner, setIncomingBanner] =
    useState<InAppNotification | null>(null);

  // Search & interaction states
  const [searchQuery, setSearchQuery] = useState("");
  const [circleFilter, setCircleFilter] = useState<"active" | "archived">(
    "active"
  );
  const [showCreateCircleModal, setShowCreateCircleModal] = useState(false);

  // Active view states
  const [selectedUserForProfile, setSelectedUserForProfile] =
    useState<RealChatUser | null>(null);
  const [activeConversation, setActiveConversation] = useState<{
    convoId: string;
    targetUser: RealChatUser;
  } | null>(null);
  const [activeCircle, setActiveCircle] = useState<GrowthCircle | null>(null);

  // Status banners & feedback
  const [actionNotice, setActionNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCopiedUid, setIsCopiedUid] = useState(false);

  // Track conversation lastMessageAt to trigger in-app notifications
  const lastKnownMessagesMapRef = useRef<{ [convoId: string]: string }>({});
  const initialLoadCompletedRef = useRef(false);

  // Show notice helper
  const showNotice = (text: string, type: "success" | "error" = "success") => {
    setActionNotice({ type, text });
    setTimeout(() => setActionNotice(null), 4000);
  };

  const toggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
  };

  // 1. Listen to real registered users
  useEffect(() => {
    if (!currentUser) {
      setRegisteredUsers([]);
      return;
    }
    const unsub = listenToRealUsers((users) => {
      setRegisteredUsers(users);
    });
    return () => unsub();
  }, [currentUser]);

  // 2. Listen to confirmed friendships
  useEffect(() => {
    if (!currentUser) {
      setFriendUids([]);
      return;
    }
    const unsub = listenToFriendships(currentUser.uid, (uids) => {
      setFriendUids(uids);
    });
    return () => unsub();
  }, [currentUser]);

  // 3. Listen to incoming & outgoing friend requests
  useEffect(() => {
    if (!currentUser) {
      setIncomingRequests([]);
      setOutgoingRequests([]);
      return;
    }
    const unsub = listenToFriendRequests(
      currentUser.uid,
      (incoming, outgoing) => {
        setIncomingRequests(incoming);
        setOutgoingRequests(outgoing);
      }
    );
    return () => unsub();
  }, [currentUser]);

  // 4. Listen to direct conversations and handle in-app notifications
  useEffect(() => {
    if (!currentUser) {
      setConversations([]);
      return;
    }

    const unsub = listenToConversations(currentUser.uid, (convos) => {
      if (initialLoadCompletedRef.current) {
        for (const convo of convos) {
          const prevTime = lastKnownMessagesMapRef.current[convo.id];
          const newTime = convo.lastMessageAt;

          if (
            newTime &&
            prevTime &&
            new Date(newTime).getTime() > new Date(prevTime).getTime() &&
            convo.lastSenderId &&
            convo.lastSenderId !== currentUser.uid &&
            (!activeConversation || activeConversation.convoId !== convo.id)
          ) {
            const otherUid = convo.participantIds.find(
              (id) => id !== currentUser.uid
            );
            const senderUser = otherUid
              ? registeredUsers.find((u) => u.uid === otherUid)
              : undefined;

            const syntheticUser: RealChatUser = senderUser || {
              uid: otherUid || "",
              displayName: convo.lastSenderName || "Friend",
              preferredName: convo.lastSenderName || "Friend",
              email: "",
              photoURL: "",
              becoming: "",
              online: false,
              lastSeen: "",
              createdAt: "",
              updatedAt: "",
            };

            setIncomingBanner({
              id: `${convo.id}_${newTime}`,
              senderName: convo.lastSenderName || "Friend",
              senderAvatar: senderUser?.photoURL,
              text: convo.lastMessageText || "New direct message received",
              convoId: convo.id,
              targetUser: syntheticUser,
            });

            playIncomingMessageSound();
            break;
          }
        }
      }

      const newMap: { [convoId: string]: string } = {};
      convos.forEach((c) => {
        if (c.lastMessageAt) {
          newMap[c.id] = c.lastMessageAt;
        }
      });
      lastKnownMessagesMapRef.current = newMap;
      initialLoadCompletedRef.current = true;

      setConversations(convos);
    });

    return () => unsub();
  }, [currentUser, activeConversation, registeredUsers]);

  // 5. Listen to Growth Circles (Quarter 4)
  useEffect(() => {
    if (!currentUser) {
      setCircles([]);
      return;
    }
    const unsub = listenToUserCircles(currentUser.uid, (userCircles) => {
      setCircles(userCircles);
      // Keep active circle fresh if currently viewing it
      if (activeCircle) {
        const fresh = userCircles.find((c) => c.id === activeCircle.id);
        if (fresh) setActiveCircle(fresh);
      }
    });
    return () => unsub();
  }, [currentUser, activeCircle?.id]);

  // 6. Deep link auto-navigation from push notifications (e.g. /?tab=chat&convo=...&sender=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const convoParam = params.get("convo");
    const senderParam = params.get("sender");

    if (convoParam && (registeredUsers.length > 0 || conversations.length > 0)) {
      const partnerUid =
        senderParam ||
        convoParam
          .replace(/^direct_/, "")
          .split("_")
          .find((id) => id !== currentUser?.uid);

      if (partnerUid) {
        const foundUser = registeredUsers.find((u) => u.uid === partnerUid);
        if (foundUser) {
          setActiveConversation({
            convoId: convoParam,
            targetUser: foundUser,
          });
        }
      }
    }
  }, [registeredUsers, conversations, currentUser]);

  // Lookup helper: find RealChatUser by UID
  const getUser = (uid: string): RealChatUser | undefined => {
    return registeredUsers.find((u) => u.uid === uid);
  };

  // Confirmed friends list
  const confirmedFriends = registeredUsers.filter((u) =>
    friendUids.includes(u.uid)
  );

  // Copy UID helper
  const copyUidToClipboard = () => {
    if (currentUser?.uid) {
      navigator.clipboard.writeText(currentUser.uid);
      setIsCopiedUid(true);
      setTimeout(() => setIsCopiedUid(false), 2000);
    }
  };

  // Friendship action handlers
  const handleSendFriendRequest = async (targetUser: RealChatUser) => {
    setActionLoading(true);
    try {
      const res = await sendFriendRequest(targetUser, userProfile);
      if (res.success) {
        showNotice(res.message, "success");
      } else {
        showNotice(res.message, "error");
      }
    } catch (err: any) {
      console.error("Error sending request:", err);
      showNotice(err?.message || "Failed to send friend request.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    setActionLoading(true);
    try {
      await acceptFriendRequest(request, userProfile);
      showNotice(`You and ${request.fromName} are now friends!`, "success");
    } catch (err: any) {
      console.error("Error accepting request:", err);
      showNotice(err?.message || "Failed to accept friend request.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineRequest = async (request: FriendRequest) => {
    setActionLoading(true);
    try {
      await declineOrCancelFriendRequest(request.id);
      showNotice("Friend request declined.", "success");
    } catch (err: any) {
      console.error("Error declining request:", err);
      showNotice(err?.message || "Failed to decline request.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async (request: FriendRequest) => {
    setActionLoading(true);
    try {
      await declineOrCancelFriendRequest(request.id);
      showNotice("Friend request canceled.", "success");
    } catch (err: any) {
      console.error("Error canceling request:", err);
      showNotice(err?.message || "Failed to cancel request.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfriend = async (targetUser: RealChatUser) => {
    setActionLoading(true);
    try {
      await unfriendUser(targetUser.uid);
      showNotice(`Removed ${targetUser.displayName} from friends.`, "success");
      if (activeConversation?.targetUser.uid === targetUser.uid) {
        setActiveConversation(null);
      }
    } catch (err: any) {
      console.error("Error unfriending:", err);
      showNotice(err?.message || "Failed to remove friend.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChatWithUser = async (targetUser: RealChatUser) => {
    setActionLoading(true);
    try {
      const convoId = await getOrCreateDirectConversation(
        targetUser,
        userProfile
      );
      setActiveConversation({
        convoId,
        targetUser,
      });
      setActiveTab("conversations");
      setIncomingBanner(null);
    } catch (err: any) {
      console.error("Error opening chat:", err);
      showNotice(err?.message || "Failed to open conversation.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Join invited circle
  const handleJoinCircle = async (circle: GrowthCircle) => {
    setActionLoading(true);
    try {
      await joinCircle(circle, userProfile);
      showNotice(`Joined ${circle.name}!`, "success");
    } catch (err: any) {
      showNotice(err?.message || "Failed to join circle.");
    } finally {
      setActionLoading(false);
    }
  };

  // Decline circle invitation
  const handleDeclineCircle = async (circleId: string) => {
    setActionLoading(true);
    try {
      await declineCircleInvitation(circleId);
      showNotice("Circle invitation declined.", "success");
    } catch (err: any) {
      showNotice(err?.message || "Failed to decline invitation.");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered members for Find People
  const filteredUsers = registeredUsers.filter((u) => {
    const q = searchQuery.toLowerCase().trim().replace(/^@/, "");
    if (!q) return true;
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.preferredName?.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      u.becoming?.toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q)
    );
  });

  // Calculate unread conversations count
  const unreadConversationsCount = currentUser
    ? conversations.filter((c) => {
        if (!c.lastMessageAt || c.lastSenderId === currentUser.uid) return false;
        const readAt = c.readStatus?.[currentUser.uid]?.lastReadAt;
        if (!readAt) return true;
        return new Date(c.lastMessageAt).getTime() > new Date(readAt).getTime();
      }).length
    : 0;

  // Invitations to circles for current user
  const circleInvitations = currentUser
    ? circles.filter(
        (c) =>
          c.invitedFriendIds?.includes(currentUser.uid) &&
          !c.memberIds.includes(currentUser.uid)
      )
    : [];

  const activeOrArchivedCircles = circles.filter((c) => {
    if (!currentUser || !c.memberIds.includes(currentUser.uid)) return false;
    return circleFilter === "archived"
      ? c.status === "archived"
      : c.status !== "archived";
  });

  // Effective display details
  const effectiveDisplayName =
    userProfile?.preferredName ||
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "CRESCIVE Member";

  const effectiveAvatar =
    userProfile?.avatarUrl || currentUser?.photoURL || "";

  // If currently inside an active direct conversation room
  if (currentUser && activeConversation) {
    return (
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pt-4 pb-32 space-y-4 text-[#f5f5f0]">
        <DirectChatRoom
          conversationId={activeConversation.convoId}
          targetUser={activeConversation.targetUser}
          currentUserProfile={userProfile}
          onBack={() => setActiveConversation(null)}
          onOpenProfile={(user) => setSelectedUserForProfile(user)}
        />

        {/* Modal for Member Profile */}
        {selectedUserForProfile && (
          <UserProfileModal
            member={selectedUserForProfile}
            onClose={() => setSelectedUserForProfile(null)}
            isMe={selectedUserForProfile.uid === currentUser.uid}
            isFriend={friendUids.includes(selectedUserForProfile.uid)}
            hasSentRequest={outgoingRequests.some(
              (r) => r.toUid === selectedUserForProfile.uid
            )}
            hasReceivedRequest={incomingRequests.some(
              (r) => r.fromUid === selectedUserForProfile.uid
            )}
            onAddFriend={handleSendFriendRequest}
            onCancelRequest={(member) => {
              const req = outgoingRequests.find((r) => r.toUid === member.uid);
              if (req) handleCancelRequest(req);
            }}
            onAcceptRequest={(member) => {
              const req = incomingRequests.find(
                (r) => r.fromUid === member.uid
              );
              if (req) handleAcceptRequest(req);
            }}
            onDeclineRequest={(member) => {
              const req = incomingRequests.find(
                (r) => r.fromUid === member.uid
              );
              if (req) handleDeclineRequest(req);
            }}
            onUnfriend={handleUnfriend}
            onOpenChat={(member) => {
              setSelectedUserForProfile(null);
              handleStartChatWithUser(member);
            }}
            actionLoading={actionLoading}
          />
        )}

        <div className="pt-2 flex justify-center">
          <HelpButton onClick={onOpenHelpGuide || (() => {})} />
        </div>
      </div>
    );
  }

  // If currently inside an active Growth Circle room
  if (currentUser && activeCircle) {
    return (
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pt-4 pb-32 space-y-4 text-[#f5f5f0]">
        <GrowthCircleRoom
          circle={activeCircle}
          currentUserProfile={userProfile}
          moves={moves}
          friends={confirmedFriends}
          onBack={() => setActiveCircle(null)}
          onCircleUpdated={() => {
            const fresh = circles.find((c) => c.id === activeCircle.id);
            if (fresh) setActiveCircle(fresh);
          }}
        />

        <div className="pt-2 flex justify-center">
          <HelpButton onClick={onOpenHelpGuide || (() => {})} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pt-4 pb-32 space-y-6 sm:space-y-8 text-[#f5f5f0]">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#121226]/90 via-[#0E0E1E]/90 to-[#080812]/95 p-5 sm:p-7 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-[#D4AF37]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-[#4A3B82]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#D4AF37]" />
              <span>Quarter 4 • Growth Circles & Deep Collaboration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#f5f5f0] flex items-center gap-2.5">
              <MessageSquare className="w-7 h-7 text-[#D4AF37]" />
              CRESCIVE CHAT & CIRCLES
            </h1>
            <p className="text-xs sm:text-sm text-[#f5f5f0]/70 max-w-xl leading-relaxed">
              Connect with real friends, form private Growth Circles, share accountability around Moves, and enter synchronized Deep Work Sanctuary focus sessions.
            </p>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-2">
            {/* Sound Chime Toggle */}
            <button
              onClick={toggleSound}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                soundActive
                  ? "bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]"
                  : "bg-black/40 border-white/10 text-[#f5f5f0]/40 hover:text-[#f5f5f0]"
              }`}
              title={soundActive ? "Sound Chime: Enabled" : "Sound Chime: Muted"}
            >
              {soundActive ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden sm:inline font-mono text-[11px]">Chime On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="hidden sm:inline font-mono text-[11px]">Muted</span>
                </>
              )}
            </button>

            {/* Database Connection Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-[#D4AF37]/20 text-xs text-[#f5f5f0]/80">
              <Database className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-mono text-[11px]">
                {dbConnected ? "Firestore Online" : "Firestore Sync Ready"}
              </span>
              <div
                className={`w-2 h-2 rounded-full ${
                  dbConnected
                    ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                    : "bg-amber-400"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating In-App Incoming Message Banner */}
      {incomingBanner && (
        <div className="p-4 rounded-2xl border border-[#D4AF37]/50 bg-gradient-to-r from-[#181836] via-[#12122A] to-[#181836] shadow-2xl flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              {incomingBanner.senderAvatar ? (
                <img
                  src={incomingBanner.senderAvatar}
                  alt={incomingBanner.senderName}
                  className="w-10 h-10 rounded-xl object-cover border border-[#D4AF37]/50"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#202040] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                  {incomingBanner.senderName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#D4AF37] flex items-center justify-center">
                <Bell className="w-2 h-2 text-black" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-[#f5f5f0] truncate">
                  {incomingBanner.senderName}
                </span>
                <span className="text-[10px] text-[#D4AF37] uppercase font-bold px-1.5 py-0.2 rounded-md bg-[#D4AF37]/15">
                  New Message
                </span>
              </div>
              <p className="text-xs text-[#f5f5f0]/70 truncate max-w-sm">
                {incomingBanner.text}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setActiveConversation({
                  convoId: incomingBanner.convoId,
                  targetUser: incomingBanner.targetUser,
                });
                setActiveTab("conversations");
                setIncomingBanner(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer transition-all"
            >
              <span>Reply</span>
            </button>
            <button
              onClick={() => setIncomingBanner(null)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#f5f5f0]/50 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Notice Toast */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 animate-fade-in ${
            actionNotice.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
              : "bg-rose-500/15 border-rose-500/40 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-[10px] uppercase font-bold opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Auth State Card */}
      {!currentUser ? (
        <div className="rounded-2xl sm:rounded-3xl border border-[#D4AF37]/30 bg-[#121226]/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl text-center space-y-5">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <Shield className="w-7 h-7" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#f5f5f0]">
              Sign In to Join CRESCIVE Chat & Circles
            </h2>
            <p className="text-xs sm:text-sm text-[#f5f5f0]/70 leading-relaxed">
              Sign in with your Google account to connect with real friends, create private Growth Circles, and share accountability. Your Firebase UID guarantees authentic identity.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs max-w-md mx-auto">
              {authError}
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={signInWithGoogle}
              disabled={authLoading}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(212,175,55,0.35)] transition-all cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {authLoading ? "Connecting..." : "Sign in with Google"}
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 text-[11px] text-[#f5f5f0]/50">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              Private Growth Circles
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              Shared Accountability
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              Deep Work Sanctuary
            </span>
          </div>
        </div>
      ) : (
        /* Authenticated Status Card */
        <div className="rounded-2xl sm:rounded-3xl border border-[#D4AF37]/30 bg-[#121226]/80 p-5 sm:p-6 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                {effectiveAvatar ? (
                  <img
                    src={effectiveAvatar}
                    alt={effectiveDisplayName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1F1F3D] to-[#121226] border-2 border-[#D4AF37]/60 flex items-center justify-center text-[#D4AF37] text-lg font-bold">
                    {effectiveDisplayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#121226] shadow-[0_0_6px_#10b981]" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base sm:text-lg text-[#f5f5f0]">
                    {effectiveDisplayName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-semibold">
                    You
                  </span>
                </div>
                <p className="text-xs text-[#f5f5f0]/60 truncate max-w-[240px] sm:max-w-md">
                  {userProfile?.becoming || "Striving for continuous growth"}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[11px] font-mono text-[#f5f5f0]/50 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                    UID: {currentUser.uid.slice(0, 8)}...
                    {currentUser.uid.slice(-6)}
                  </span>
                  <button
                    onClick={copyUidToClipboard}
                    className="text-[10px] text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    {isCopiedUid ? "Copied!" : "Copy UID"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
              <div className="text-right hidden sm:block">
                <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Synced with Firestore
                </div>
                <div className="text-[10px] text-[#f5f5f0]/40 font-mono">
                  {currentUser.email}
                </div>
              </div>
              <button
                onClick={signOut}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-xs text-[#f5f5f0]/70 hover:text-rose-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
        {/* Tab 1: Messages */}
        <button
          onClick={() => setActiveTab("conversations")}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "conversations"
              ? "bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]"
              : "text-[#f5f5f0]/60 hover:text-[#f5f5f0] hover:bg-white/5"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Messages</span>
          {unreadConversationsCount > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-[#D4AF37] text-black text-[10px] font-bold animate-pulse">
              {unreadConversationsCount} new
            </span>
          ) : conversations.length > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
              {conversations.length}
            </span>
          ) : null}
        </button>

        {/* Tab 2: Find People */}
        <button
          onClick={() => setActiveTab("find_people")}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "find_people"
              ? "bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]"
              : "text-[#f5f5f0]/60 hover:text-[#f5f5f0] hover:bg-white/5"
          }`}
        >
          <Search className="w-4 h-4 text-[#D4AF37]" />
          <span>Find People</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
            {registeredUsers.length}
          </span>
        </button>

        {/* Tab 3: Friend Requests Inbox */}
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "requests"
              ? "bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]"
              : "text-[#f5f5f0]/60 hover:text-[#f5f5f0] hover:bg-white/5"
          }`}
        >
          <UserPlus className="w-4 h-4 text-[#D4AF37]" />
          <span>Friend Requests</span>
          {incomingRequests.length > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-black text-[11px] font-extrabold animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.7)]">
              {incomingRequests.length}
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
              0
            </span>
          )}
        </button>

        {/* Tab 4: Friends */}
        <button
          onClick={() => setActiveTab("friends")}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "friends"
              ? "bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]"
              : "text-[#f5f5f0]/60 hover:text-[#f5f5f0] hover:bg-white/5"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Friends</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
            {friendUids.length}
          </span>
        </button>

        {/* Tab 5: Growth Circles (Quarter 4) */}
        <button
          onClick={() => setActiveTab("circles")}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "circles"
              ? "bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]"
              : "text-[#f5f5f0]/60 hover:text-[#f5f5f0] hover:bg-white/5"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Circles</span>
          {circleInvitations.length > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-[#D4AF37] text-black text-[10px] font-bold animate-pulse">
              {circleInvitations.length} invite
            </span>
          ) : circles.length > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
              {circles.filter((c) => c.memberIds.includes(currentUser?.uid || "")).length}
            </span>
          ) : null}
        </button>

        {/* Tab 6: Roadmap */}
        <button
          onClick={() => setActiveTab("roadmap")}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "roadmap"
              ? "bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]"
              : "text-[#f5f5f0]/60 hover:text-[#f5f5f0] hover:bg-white/5"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Roadmap</span>
        </button>
      </div>

      {/* Tab 1: Direct Messages */}
      {activeTab === "conversations" && (
        <div className="space-y-4">
          {/* Prominent Friend Requests Notification Banner in Direct Messages */}
          {currentUser && incomingRequests.length > 0 && (
            <div className="p-3.5 sm:p-4 rounded-2xl border border-[#D4AF37]/50 bg-gradient-to-r from-[#1E1B38] via-[#161630] to-[#121226] shadow-lg flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
                    <UserPlus className="w-5 h-5 animate-bounce" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D4AF37] text-black font-extrabold text-[10px] flex items-center justify-center">
                    {incomingRequests.length}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-[#f5f5f0] truncate">
                      {incomingRequests.length === 1
                        ? `${incomingRequests[0].fromName} sent you a friend request!`
                        : `You have ${incomingRequests.length} pending friend requests!`}
                    </span>
                    <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[9px] font-bold uppercase">
                      Action needed
                    </span>
                  </div>
                  <p className="text-[11px] text-[#f5f5f0]/60 truncate">
                    Accept or decline in your Friend Requests Inbox.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("requests")}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-xs shrink-0 cursor-pointer shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Review Inbox</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-black text-[10px] font-mono">
                  {incomingRequests.length}
                </span>
              </button>
            </div>
          )}

          {!currentUser ? (
            <div className="p-8 rounded-2xl border border-dashed border-white/10 bg-black/20 text-center space-y-2">
              <Lock className="w-8 h-8 text-[#D4AF37]/60 mx-auto" />
              <p className="text-sm font-medium text-[#f5f5f0]/80">
                Direct Messages are protected
              </p>
              <p className="text-xs text-[#f5f5f0]/50 max-w-sm mx-auto">
                Sign in above with your Google account to send and receive real-time direct messages with other members.
              </p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-2xl border border-dashed border-white/10 bg-black/20 text-center space-y-4">
              <Inbox className="w-12 h-12 text-[#D4AF37]/40 mx-auto" />
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="font-bold text-sm sm:text-base text-[#f5f5f0]">
                  No direct conversations yet
                </h4>
                <p className="text-xs text-[#f5f5f0]/50 leading-relaxed">
                  Connect with other CRESCIVE members by finding them and sending a friend request. Once connected, your direct messages will appear here.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab("find_people")}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  Find People to Connect
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 px-1 pb-1">
                <span className="text-xs font-semibold text-[#f5f5f0]/60 uppercase tracking-wider">
                  Direct Conversations ({conversations.length})
                </span>
                <button
                  onClick={() => setActiveTab("find_people")}
                  className="text-xs text-[#D4AF37] hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>+ Find People</span>
                </button>
              </div>
              {conversations.map((convo) => {
                const otherUid = convo.participantIds.find(
                  (uid) => uid !== currentUser.uid
                );
                const targetUser = otherUid ? getUser(otherUid) : undefined;
                const fallbackDetail =
                  otherUid && convo.participantDetails
                    ? convo.participantDetails[otherUid]
                    : undefined;

                const displayName =
                  targetUser?.displayName ||
                  fallbackDetail?.displayName ||
                  "CRESCIVE Member";
                const avatar =
                  targetUser?.photoURL || fallbackDetail?.photoURL || "";
                const isOnline = targetUser?.online || false;

                const otherTyping =
                  otherUid &&
                  convo.typing?.[otherUid]?.isTyping &&
                  convo.typing[otherUid].lastTypedAt &&
                  Date.now() -
                    new Date(convo.typing[otherUid].lastTypedAt).getTime() <
                    6000;

                const isUnread =
                  Boolean(convo.lastMessageAt) &&
                  convo.lastSenderId !== currentUser.uid &&
                  (!convo.readStatus?.[currentUser.uid]?.lastReadAt ||
                    new Date(convo.lastMessageAt!).getTime() >
                      new Date(
                        convo.readStatus[currentUser.uid].lastReadAt
                      ).getTime());

                return (
                  <div
                    key={convo.id}
                    onClick={() => {
                      if (targetUser) {
                        setActiveConversation({
                          convoId: convo.id,
                          targetUser,
                        });
                      } else if (otherUid) {
                        const syntheticUser: RealChatUser = {
                          uid: otherUid,
                          displayName,
                          preferredName: displayName,
                          email: "",
                          photoURL: avatar,
                          becoming: fallbackDetail?.becoming || "",
                          online: false,
                          lastSeen: convo.updatedAt || "",
                          createdAt: convo.createdAt || "",
                          updatedAt: convo.updatedAt || "",
                        };
                        setActiveConversation({
                          convoId: convo.id,
                          targetUser: syntheticUser,
                        });
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                      isUnread
                        ? "border-[#D4AF37]/60 bg-[#161634] shadow-[0_4px_20px_rgba(212,175,55,0.12)]"
                        : "border-white/10 hover:border-[#D4AF37]/40 bg-[#121226]/80 hover:bg-[#15152F]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={displayName}
                            className={`w-12 h-12 rounded-xl object-cover border transition-colors ${
                              isUnread
                                ? "border-[#D4AF37]"
                                : "border-[#D4AF37]/30 group-hover:border-[#D4AF37]"
                            }`}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#202040] border border-white/10 flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#121226] ${
                            isOnline
                              ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                              : "bg-zinc-500"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4
                              className={`text-xs sm:text-sm truncate ${
                                isUnread
                                  ? "font-extrabold text-[#f5f5f0]"
                                  : "font-bold text-[#f5f5f0]/90 group-hover:text-[#D4AF37]"
                              }`}
                            >
                              {displayName}
                            </h4>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
                            )}
                          </div>
                          {convo.lastMessageAt && (
                            <span className="text-[10px] text-[#f5f5f0]/40 shrink-0">
                              {new Date(convo.lastMessageAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-xs truncate ${
                            isUnread
                              ? "text-[#f5f5f0] font-medium"
                              : "text-[#f5f5f0]/60"
                          }`}
                        >
                          {otherTyping ? (
                            <span className="text-[#D4AF37] font-semibold animate-pulse">
                              typing...
                            </span>
                          ) : convo.lastMessageText ? (
                            <span>
                              {convo.lastSenderId === currentUser.uid
                                ? "You: "
                                : ""}
                              {convo.lastMessageText}
                            </span>
                          ) : (
                            <span className="italic text-[#f5f5f0]/40">
                              Connected! Tap to chat.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (targetUser) {
                          setActiveConversation({
                            convoId: convo.id,
                            targetUser,
                          });
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/5 group-hover:bg-[#D4AF37]/15 border border-white/10 group-hover:border-[#D4AF37]/40 text-xs text-[#f5f5f0]/70 group-hover:text-[#D4AF37] transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <Send className="w-3 h-3" />
                      <span className="hidden sm:inline">Open</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Growth Circles (Quarter 4) */}
      {activeTab === "circles" && (
        <div className="space-y-6">
          {!currentUser ? (
            <div className="p-8 rounded-2xl border border-dashed border-white/10 bg-black/20 text-center space-y-2">
              <Lock className="w-8 h-8 text-[#D4AF37]/60 mx-auto" />
              <p className="text-sm font-medium text-[#f5f5f0]/80">
                Growth Circles are protected
              </p>
              <p className="text-xs text-[#f5f5f0]/50 max-w-sm mx-auto">
                Sign in above with your Google account to create and participate in private Growth Circles with your real CRESCIVE friends.
              </p>
            </div>
          ) : (
            <>
              {/* Circle Invitations Banner */}
              {circleInvitations.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#D4AF37]" />
                    <h3 className="font-bold text-xs sm:text-sm text-[#f5f5f0] uppercase tracking-wider">
                      Circle Invitations ({circleInvitations.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {circleInvitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-4 rounded-2xl border border-[#D4AF37]/40 bg-[#161632] space-y-3 shadow-md"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-wider">
                            {inv.focusArea}
                          </span>
                          <h4 className="font-bold text-sm text-[#f5f5f0]">
                            {inv.name}
                          </h4>
                          <p className="text-xs text-[#f5f5f0]/70 line-clamp-2">
                            {inv.description}
                          </p>
                          <p className="text-[11px] text-[#f5f5f0]/50">
                            Created by {inv.creatorName} • {inv.memberIds.length} members
                          </p>
                        </div>

                        <div className="pt-1 border-t border-white/5 flex gap-2">
                          <button
                            onClick={() => handleJoinCircle(inv)}
                            disabled={actionLoading}
                            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <Users className="w-3.5 h-3.5" />
                            Accept & Join Circle
                          </button>
                          <button
                            onClick={() => handleDeclineCircle(inv.id)}
                            disabled={actionLoading}
                            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-rose-300 text-xs font-semibold cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Circles Header & Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCircleFilter("active")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      circleFilter === "active"
                        ? "bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37]"
                        : "bg-white/5 border border-white/10 text-[#f5f5f0]/60 hover:text-white"
                    }`}
                  >
                    Active Circles
                  </button>
                  <button
                    onClick={() => setCircleFilter("archived")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      circleFilter === "archived"
                        ? "bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37]"
                        : "bg-white/5 border border-white/10 text-[#f5f5f0]/60 hover:text-white"
                    }`}
                  >
                    Archived
                  </button>
                </div>

                <button
                  onClick={() => setShowCreateCircleModal(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Growth Circle</span>
                </button>
              </div>

              {/* Circles List */}
              {activeOrArchivedCircles.length === 0 ? (
                <div className="p-8 sm:p-12 rounded-3xl border border-dashed border-white/10 bg-black/20 text-center space-y-4">
                  <Users className="w-12 h-12 text-[#D4AF37]/40 mx-auto" />
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h4 className="font-bold text-sm sm:text-base text-[#f5f5f0]">
                      {circleFilter === "archived"
                        ? "No archived circles"
                        : "No Growth Circles yet"}
                    </h4>
                    <p className="text-xs text-[#f5f5f0]/50 leading-relaxed">
                      {circleFilter === "archived"
                        ? "Circles archived by their creators will appear here for historical reference."
                        : "Form a private Growth Circle with your CRESCIVE friends to share accountability around Moves and enter synchronized deep work focus sessions."}
                    </p>
                  </div>

                  {circleFilter === "active" && (
                    <div className="pt-2">
                      <button
                        onClick={() => setShowCreateCircleModal(true)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-xs tracking-wide shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create Your First Circle
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeOrArchivedCircles.map((circle) => {
                    const isCreator = circle.creatorId === currentUser.uid;

                    return (
                      <div
                        key={circle.id}
                        onClick={() => setActiveCircle(circle)}
                        className="p-5 rounded-2xl border border-white/10 hover:border-[#D4AF37]/50 bg-[#121226]/80 hover:bg-[#15152F] transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider">
                              {circle.focusArea}
                            </span>
                            {isCreator && (
                              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#f5f5f0]/60 text-[9px] font-mono">
                                Creator
                              </span>
                            )}
                          </div>

                          <h4 className="font-extrabold text-base text-[#f5f5f0] group-hover:text-[#D4AF37] transition-colors">
                            {circle.name}
                          </h4>
                          <p className="text-xs text-[#f5f5f0]/60 line-clamp-2">
                            {circle.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-[#f5f5f0]/60">
                            <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>{circle.memberIds.length} members</span>
                          </div>

                          <span className="px-3 py-1.5 rounded-xl bg-white/5 group-hover:bg-[#D4AF37]/20 border border-white/10 group-hover:border-[#D4AF37]/40 text-xs font-semibold text-[#f5f5f0]/80 group-hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                            <span>Open Circle</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 3: Friend Requests Inbox */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          {!currentUser ? (
            <div className="p-8 rounded-2xl border border-dashed border-white/10 bg-black/20 text-center space-y-2">
              <Lock className="w-8 h-8 text-[#D4AF37]/60 mx-auto" />
              <p className="text-sm font-medium text-[#f5f5f0]/80">
                Friend Requests Inbox is protected
              </p>
              <p className="text-xs text-[#f5f5f0]/50 max-w-sm mx-auto">
                Sign in above with your Google account to view and manage your incoming friend requests.
              </p>
            </div>
          ) : (
            <>
              {/* Inbox Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
                <div>
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#D4AF37]" />
                    <h2 className="text-xl sm:text-2xl font-black text-[#f5f5f0] tracking-tight uppercase">
                      Friend Requests
                    </h2>
                    {incomingRequests.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-black text-xs font-black shadow-[0_0_12px_rgba(212,175,55,0.6)]">
                        {incomingRequests.length}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-[#f5f5f0]/70 pt-0.5">
                    Review and accept connection requests from other real CRESCIVE members.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab("find_people")}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-[#D4AF37]/15 border border-white/10 hover:border-[#D4AF37]/40 text-xs text-[#f5f5f0]/80 hover:text-[#D4AF37] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find More Members</span>
                </button>
              </div>

              {/* Section: Incoming Friend Requests */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-[#D4AF37]" />
                    <h3 className="font-bold text-xs sm:text-sm text-[#f5f5f0] uppercase tracking-wider">
                      Pending Incoming Requests ({incomingRequests.length})
                    </h3>
                  </div>
                </div>

                {incomingRequests.length === 0 ? (
                  <div className="p-8 sm:p-10 rounded-2xl border border-dashed border-white/10 bg-black/20 text-center space-y-3">
                    <Inbox className="w-10 h-10 text-[#D4AF37]/40 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#f5f5f0]">
                        No pending friend requests
                      </p>
                      <p className="text-xs text-[#f5f5f0]/50 max-w-sm mx-auto">
                        When another real CRESCIVE member sends you a friend request, it will appear here for you to accept or decline.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab("find_people")}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-xs cursor-pointer shadow-md transition-all inline-flex items-center gap-1.5"
                      >
                        <Search className="w-3.5 h-3.5" />
                        Find People to Connect
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {incomingRequests.map((req) => {
                      const senderUser = getUser(req.fromUid);
                      const senderUsername =
                        senderUser?.username ||
                        req.fromName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

                      return (
                        <div
                          key={req.id}
                          className="p-4 sm:p-5 rounded-2xl border border-[#D4AF37]/40 bg-[#161630]/90 space-y-3 shadow-lg flex flex-col justify-between"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="relative shrink-0">
                              {req.fromAvatar ? (
                                <img
                                  src={req.fromAvatar}
                                  alt={req.fromName}
                                  className="w-12 h-12 rounded-2xl object-cover border border-[#D4AF37]/60 shadow-md"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-[#202040] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold text-base shadow-md">
                                  {req.fromName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div
                                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#161630] ${
                                  senderUser?.online
                                    ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                                    : "bg-zinc-500"
                                }`}
                              />
                            </div>

                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-sm text-[#f5f5f0] truncate">
                                  {req.fromName}
                                </h4>
                                <span className="text-[11px] font-mono text-[#D4AF37]/80">
                                  @{senderUsername}
                                </span>
                              </div>
                              <p className="text-xs text-[#f5f5f0]/70 line-clamp-2 italic leading-relaxed">
                                "{req.fromBecoming || "Striving for continuous self-growth"}"
                              </p>
                              <div className="text-[10px] text-[#f5f5f0]/40 pt-0.5">
                                Received {new Date(req.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                            <button
                              onClick={() => handleAcceptRequest(req)}
                              disabled={actionLoading}
                              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                            >
                              <UserCheck className="w-4 h-4" />
                              <span>Accept Request</span>
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(req)}
                              disabled={actionLoading}
                              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#f5f5f0]/60 hover:text-white transition-colors cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section: Outgoing Friend Requests */}
              {outgoingRequests.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-[#f5f5f0]/70">
                    <Clock className="w-4 h-4 text-[#D4AF37]" />
                    <h3 className="font-bold text-xs uppercase tracking-wider">
                      Requests Sent ({outgoingRequests.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {outgoingRequests.map((req) => {
                      const targetUser = getUser(req.toUid);
                      const targetUsername =
                        targetUser?.username ||
                        req.toName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

                      return (
                        <div
                          key={req.id}
                          className="p-3.5 rounded-2xl border border-white/10 bg-[#121226]/60 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {req.toAvatar ? (
                              <img
                                src={req.toAvatar}
                                alt={req.toName}
                                className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-[#202040] border border-white/10 flex items-center justify-center text-[#D4AF37] font-bold text-xs shrink-0">
                                {req.toName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5 truncate">
                                <h4 className="font-semibold text-xs text-[#f5f5f0] truncate">
                                  {req.toName}
                                </h4>
                                <span className="text-[10px] font-mono text-[#D4AF37]/70">
                                  @{targetUsername}
                                </span>
                              </div>
                              <span className="text-[10px] text-amber-300/80 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-400" />
                                Pending response...
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleCancelRequest(req)}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] transition-colors cursor-pointer shrink-0"
                          >
                            Cancel
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 4: Friends List */}
      {activeTab === "friends" && (
        <div className="space-y-6">
          {!currentUser ? (
            <div className="p-8 rounded-2xl border border-dashed border-white/10 bg-black/20 text-center space-y-2">
              <Lock className="w-8 h-8 text-[#D4AF37]/60 mx-auto" />
              <p className="text-sm font-medium text-[#f5f5f0]/80">
                Friends List is protected
              </p>
              <p className="text-xs text-[#f5f5f0]/50 max-w-sm mx-auto">
                Sign in above with your Google account to manage your friend connections.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="font-extrabold text-base sm:text-lg text-[#f5f5f0] uppercase tracking-wider">
                    Your Friends ({friendUids.length})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab("find_people")}
                  className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-xs text-[#D4AF37] font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>+ Find More Friends</span>
                </button>
              </div>

              {friendUids.length === 0 ? (
                <div className="p-8 sm:p-12 rounded-2xl border border-dashed border-white/10 bg-black/20 text-center space-y-3">
                  <Users className="w-10 h-10 text-[#D4AF37]/50 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#f5f5f0]">
                      No friends connected yet
                    </p>
                    <p className="text-xs text-[#f5f5f0]/50 max-w-sm mx-auto">
                      Search the real member directory and send friend requests to start connecting.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab("find_people")}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-xs cursor-pointer shadow-md transition-all inline-flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Find People to Connect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {friendUids.map((uid) => {
                    const friend = getUser(uid);
                    if (!friend) return null;

                    const friendUsername =
                      friend.username ||
                      friend.displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

                    return (
                      <div
                        key={friend.uid}
                        className="p-4 rounded-2xl border border-white/10 hover:border-[#D4AF37]/40 bg-[#121226]/80 flex flex-col justify-between gap-3 transition-all"
                      >
                        <div
                          onClick={() => setSelectedUserForProfile(friend)}
                          className="flex items-start gap-3 cursor-pointer group"
                        >
                          <div className="relative shrink-0">
                            {friend.photoURL ? (
                              <img
                                src={friend.photoURL}
                                alt={friend.displayName}
                                className="w-11 h-11 rounded-xl object-cover border border-[#D4AF37]/40"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-[#202040] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                                {friend.displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#121226] ${
                                friend.online
                                  ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                                  : "bg-zinc-500"
                              }`}
                            />
                          </div>

                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 truncate">
                              <h4 className="font-semibold text-xs sm:text-sm text-[#f5f5f0] group-hover:text-[#D4AF37] transition-colors truncate">
                                {friend.displayName}
                              </h4>
                              <span className="text-[10px] font-mono text-[#D4AF37]/70">
                                @{friendUsername}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#f5f5f0]/60 line-clamp-1 italic">
                              "{friend.becoming || "Striving for growth"}"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <button
                            onClick={() => handleStartChatWithUser(friend)}
                            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Message
                          </button>
                          <button
                            onClick={() => setSelectedUserForProfile(friend)}
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#f5f5f0]/70 hover:text-white transition-colors cursor-pointer"
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Find People (Member Directory & Real Search) */}
      {(activeTab === "find_people" || (activeTab as string) === "directory") && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-[#D4AF37]" />
                <h2 className="text-xl sm:text-2xl font-black text-[#f5f5f0] tracking-tight uppercase">
                  Find People
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono">
                  {registeredUsers.length} members
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#f5f5f0]/70 pt-0.5">
                Discover and connect with real CRESCIVE members. Search by display name or username to send friend requests.
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people by display name or @username..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#121226]/80 border border-white/10 focus:border-[#D4AF37]/60 focus:outline-none text-xs sm:text-sm text-[#f5f5f0] placeholder-[#f5f5f0]/40 transition-all backdrop-blur-md shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#f5f5f0]/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {!currentUser ? (
            <div className="p-8 rounded-2xl border border-dashed border-white/10 bg-black/20 text-center space-y-2">
              <Lock className="w-8 h-8 text-[#D4AF37]/60 mx-auto" />
              <p className="text-sm font-medium text-[#f5f5f0]/80">
                Directory is protected
              </p>
              <p className="text-xs text-[#f5f5f0]/50 max-w-sm mx-auto">
                Sign in above with your Google account to discover and connect with real registered CRESCIVE members.
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-2xl border border-dashed border-white/10 bg-black/20 text-center space-y-3">
              <Users className="w-10 h-10 text-[#D4AF37]/50 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#f5f5f0]">
                  {searchQuery
                    ? `No members found matching "${searchQuery}"`
                    : "No other members registered yet"}
                </p>
                <p className="text-xs text-[#f5f5f0]/50 max-w-md mx-auto">
                  {searchQuery
                    ? "Try adjusting your search query, or search by a different name or username."
                    : "As other real users sign in, they will automatically appear here with their live profiles."}
                </p>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#D4AF37] cursor-pointer"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {filteredUsers.map((member) => {
                const isMe = member.uid === currentUser.uid;
                const isFriend = friendUids.includes(member.uid);
                const hasSentRequest = outgoingRequests.some(
                  (r) => r.toUid === member.uid
                );
                const hasReceivedRequest = incomingRequests.some(
                  (r) => r.fromUid === member.uid
                );
                const memberUsername =
                  member.username ||
                  member.displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

                return (
                  <div
                    key={member.uid}
                    className={`relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                      isMe
                        ? "border-[#D4AF37]/50 bg-[#161630]/90 shadow-[0_4px_20px_rgba(212,175,55,0.1)]"
                        : "border-white/10 hover:border-[#D4AF37]/30 bg-[#121226]/80 hover:bg-[#14142B]/90"
                    }`}
                  >
                    <div
                      onClick={() => setSelectedUserForProfile(member)}
                      className="flex items-start gap-3 cursor-pointer group"
                    >
                      <div className="relative shrink-0">
                        {member.photoURL ? (
                          <img
                            src={member.photoURL}
                            alt={member.displayName}
                            className="w-11 h-11 rounded-xl object-cover border border-[#D4AF37]/40 group-hover:border-[#D4AF37] transition-colors"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-[#1C1C36] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                            {member.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#121226] ${
                            member.online
                              ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                              : "bg-zinc-500"
                          }`}
                        />
                      </div>

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-semibold text-xs sm:text-sm text-[#f5f5f0] group-hover:text-[#D4AF37] transition-colors truncate">
                            {member.displayName}
                          </h4>
                          <span className="text-[10px] font-mono text-[#D4AF37]/70">
                            @{memberUsername}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[9px] font-bold">
                              You
                            </span>
                          )}
                          {isFriend && (
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                              Friends ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#f5f5f0]/60 line-clamp-2 leading-snug">
                          {member.becoming ||
                            "Continuous self-growth & progress"}
                        </p>
                      </div>
                    </div>

                    {/* Action button on card with real relationship status */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-[#f5f5f0]/40">
                        {member.uid.slice(0, 6)}...{member.uid.slice(-4)}
                      </span>

                      {isMe ? (
                        <button
                          onClick={() => setSelectedUserForProfile(member)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-[#f5f5f0]/60 transition-colors cursor-pointer"
                        >
                          View Profile
                        </button>
                      ) : isFriend ? (
                        <button
                          onClick={() => handleStartChatWithUser(member)}
                          className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Chat
                        </button>
                      ) : hasReceivedRequest ? (
                        <button
                          onClick={() => {
                            const req = incomingRequests.find(
                              (r) => r.fromUid === member.uid
                            );
                            if (req) handleAcceptRequest(req);
                          }}
                          disabled={actionLoading}
                          className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3" />
                          Accept Request
                        </button>
                      ) : hasSentRequest ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Request Sent
                          </span>
                          <button
                            onClick={() => {
                              const req = outgoingRequests.find((r) => r.toUid === member.uid);
                              if (req) handleCancelRequest(req);
                            }}
                            className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(member)}
                          disabled={actionLoading}
                          className="px-3 py-1 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold text-[11px] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <UserPlus className="w-3 h-3" />
                          Add Friend
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Architecture & Roadmap (All 4 Quarters Complete) */}
      {activeTab === "roadmap" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quarter 1 */}
            <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-[#142320] to-[#0A1412] space-y-3 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black tracking-wider uppercase">
                  Q1 Complete
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="text-base font-bold text-[#f5f5f0]">
                Quarter 1: Architecture, Firebase & Real Users
              </h4>
              <ul className="text-xs text-[#f5f5f0]/70 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  Dedicated 8-tab balanced responsive navigation (Chat placed 2nd-to-last, Profile final).
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  Real Firebase Authentication & Cloud Firestore provisioning.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  Authoritative UID identity mapping with zero mock/fake data.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  Existing CRESCIVE profile as authoritative source of truth.
                </li>
              </ul>
            </div>

            {/* Quarter 2 */}
            <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-[#142320] to-[#0A1412] space-y-3 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black tracking-wider uppercase">
                  Q2 Complete
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="text-base font-bold text-[#f5f5f0]">
                Quarter 2: Friend Connections & Direct Messaging
              </h4>
              <ul className="text-xs text-[#f5f5f0]/70 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  Search real users → View profile → Add Friend → Friend Request.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  Accept/Decline flow, duplicate prevention, and unfriend support.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  1-to-1 Direct Conversation rooms with real Firestore message persistence.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  Live real-time messaging, timestamps, and mobile-friendly layout.
                </li>
              </ul>
            </div>

            {/* Quarter 3 */}
            <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-[#142320] to-[#0A1412] space-y-3 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black tracking-wider uppercase">
                  Q3 Complete
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="text-base font-bold text-[#f5f5f0]">
                Quarter 3: Real-Time Polish & Read Receipts
              </h4>
              <ul className="text-xs text-[#f5f5f0]/70 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  Live debounced typing indicators between participants.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  Accurate read-status tracking with double checkmark read receipts.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  In-app notifications for incoming messages with audio chime and mute option.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  Message reactions with real-time counters and participant authorization.
                </li>
              </ul>
            </div>

            {/* Quarter 4 (Complete) */}
            <div className="p-5 rounded-2xl border-2 border-[#D4AF37] bg-gradient-to-br from-[#181834] to-[#0F0F22] space-y-3 relative overflow-hidden shadow-[0_0_25px_rgba(212,175,55,0.15)]">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-black text-[10px] font-black tracking-wider uppercase">
                  Q4 Complete
                </span>
                <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <h4 className="text-base font-bold text-[#f5f5f0]">
                Quarter 4: Growth Circles & Deep Collaboration
              </h4>
              <ul className="text-xs text-[#f5f5f0]/80 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold">✓</span>
                  Private Growth Circles between real friends with invitation management.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold">✓</span>
                  Shared Accountability: intentionally share Moves/Goals, progress & cheers.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold">✓</span>
                  Deep Work Sanctuary: synchronized group focus sprints with live countdown.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold">✓</span>
                  Security rules, leave/remove controls, archiving, and privacy-safe data export.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Member Profile Modal */}
      {selectedUserForProfile && (
        <UserProfileModal
          member={selectedUserForProfile}
          onClose={() => setSelectedUserForProfile(null)}
          isMe={selectedUserForProfile.uid === currentUser?.uid}
          isFriend={friendUids.includes(selectedUserForProfile.uid)}
          hasSentRequest={outgoingRequests.some(
            (r) => r.toUid === selectedUserForProfile.uid
          )}
          hasReceivedRequest={incomingRequests.some(
            (r) => r.fromUid === selectedUserForProfile.uid
          )}
          onAddFriend={handleSendFriendRequest}
          onCancelRequest={(member) => {
            const req = outgoingRequests.find((r) => r.toUid === member.uid);
            if (req) handleCancelRequest(req);
          }}
          onAcceptRequest={(member) => {
            const req = incomingRequests.find((r) => r.fromUid === member.uid);
            if (req) handleAcceptRequest(req);
          }}
          onDeclineRequest={(member) => {
            const req = incomingRequests.find((r) => r.fromUid === member.uid);
            if (req) handleDeclineRequest(req);
          }}
          onUnfriend={handleUnfriend}
          onOpenChat={(member) => {
            setSelectedUserForProfile(null);
            handleStartChatWithUser(member);
          }}
          actionLoading={actionLoading}
        />
      )}

      {/* Modal: Create Growth Circle */}
      {showCreateCircleModal && (
        <CreateCircleModal
          onClose={() => setShowCreateCircleModal(false)}
          onCircleCreated={(circleId) => {
            showNotice("Growth Circle created successfully!");
            setActiveTab("circles");
          }}
          friends={confirmedFriends}
          currentUserProfile={userProfile}
        />
      )}

      {/* Help Button at the bottom of the section */}
      <div className="pt-4 flex justify-center">
        <HelpButton onClick={onOpenHelpGuide || (() => {})} />
      </div>
    </div>
  );
};
