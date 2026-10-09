import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Send,
  User,
  Clock,
  Sparkles,
  AlertCircle,
  Check,
  CheckCheck,
  Smile,
  Volume2,
  VolumeX,
  Target,
  Flame,
  Award,
} from "lucide-react";
import {
  RealChatUser,
  ChatMessageItem,
  DirectConversation,
  GrowthMilestoneShare,
  listenToMessages,
  listenToConversation,
  sendMessage,
  setTypingStatus,
  markConversationAsRead,
  toggleMessageReaction,
  sendGrowthMilestone,
} from "../../lib/firebase";
import { useFirebaseAuth } from "../../contexts/FirebaseAuthContext";
import { UserProfile } from "../../types";
import {
  isSoundEnabled,
  setSoundEnabled as persistSoundEnabled,
  playIncomingMessageSound,
} from "../../lib/soundChime";
import { MilestoneShareModal } from "./MilestoneShareModal";

interface DirectChatRoomProps {
  conversationId: string;
  targetUser: RealChatUser;
  currentUserProfile: UserProfile | null;
  onBack: () => void;
  onOpenProfile: (user: RealChatUser) => void;
}

const COMMON_REACTIONS = ["🌱", "🔥", "💪", "👏", "❤️", "💡"];

export const DirectChatRoom: React.FC<DirectChatRoomProps> = ({
  conversationId,
  targetUser,
  currentUserProfile,
  onBack,
  onOpenProfile,
}) => {
  const { currentUser } = useFirebaseAuth();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [conversationDoc, setConversationDoc] =
    useState<DirectConversation | null>(null);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Sound chime preference state
  const [soundActive, setSoundActive] = useState(isSoundEnabled());

  // Milestone share modal state
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  // Active reaction picker popover for a message ID
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastKnownMessagesCountRef = useRef(0);

  // Auto-scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  // 1. Listen to messages in this conversation
  useEffect(() => {
    if (!conversationId) return;

    setLoadingMessages(true);
    const unsubscribe = listenToMessages(
      conversationId,
      (newMessages) => {
        setMessages(newMessages);
        setLoadingMessages(false);

        // Check for new incoming messages from friend to play sound chime
        if (
          newMessages.length > lastKnownMessagesCountRef.current &&
          lastKnownMessagesCountRef.current > 0
        ) {
          const latest = newMessages[newMessages.length - 1];
          if (latest && latest.senderId === targetUser.uid) {
            playIncomingMessageSound();
          }
        }
        lastKnownMessagesCountRef.current = newMessages.length;

        // Auto mark received unread messages as read
        if (currentUser) {
          const unreadFromFriend = newMessages
            .filter((m) => m.senderId === targetUser.uid && !m.read)
            .map((m) => m.id);

          const latestMsgId =
            newMessages.length > 0
              ? newMessages[newMessages.length - 1].id
              : undefined;

          if (unreadFromFriend.length > 0 || latestMsgId) {
            markConversationAsRead(
              conversationId,
              latestMsgId,
              unreadFromFriend
            );
          }
        }
      },
      (error) => {
        console.error("Failed to load messages:", error);
        setSendError("Failed to synchronize messages with Firestore.");
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [conversationId, targetUser.uid, currentUser]);

  // 2. Listen to conversation doc (for typing indicators & read status)
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = listenToConversation(
      conversationId,
      (convo) => {
        setConversationDoc(convo);
      },
      (err) => {
        console.warn("Could not listen to conversation doc:", err);
      }
    );

    return () => unsubscribe();
  }, [conversationId]);

  // Scroll to bottom on initial message load or new message
  useEffect(() => {
    if (!loadingMessages) {
      scrollToBottom(true);
    }
  }, [messages.length, loadingMessages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cleanup typing status when leaving the chat
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setTypingStatus(conversationId, false);
    };
  }, [conversationId]);

  // Handle typing input changes with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Notify typing status
    setTypingStatus(conversationId, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(conversationId, false);
    }, 3000);
  };

  const handleInputBlur = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTypingStatus(conversationId, false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setSendError(null);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTypingStatus(conversationId, false);

    try {
      await sendMessage(conversationId, text, currentUserProfile);
      setInputText("");
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err: any) {
      console.error("Send message error:", err);
      setSendError(err?.message || "Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleShareMilestone = async (milestone: GrowthMilestoneShare) => {
    try {
      setSendError(null);
      await sendGrowthMilestone(conversationId, milestone, currentUserProfile);
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err: any) {
      console.error("Failed to share milestone:", err);
      setSendError(err?.message || "Failed to share milestone.");
    }
  };

  const handleReactionClick = async (messageId: string, emoji: string) => {
    try {
      setActiveReactionMsgId(null);
      await toggleMessageReaction(conversationId, messageId, emoji);
    } catch (err: any) {
      console.error("Failed to toggle reaction:", err);
      setSendError("Could not update reaction.");
    }
  };

  const toggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    persistSoundEnabled(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format message timestamps
  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Check if target user is currently typing
  const targetTypingData = conversationDoc?.typing?.[targetUser.uid];
  const isTargetTyping = Boolean(
    targetTypingData?.isTyping &&
      targetTypingData?.lastTypedAt &&
      Date.now() - new Date(targetTypingData.lastTypedAt).getTime() < 6000
  );

  // Check read receipt status for a message sent by current user
  const isMessageReadByFriend = (msg: ChatMessageItem): boolean => {
    if (msg.read) return true;
    const friendReadStatus = conversationDoc?.readStatus?.[targetUser.uid];
    if (friendReadStatus?.lastReadAt) {
      return (
        new Date(friendReadStatus.lastReadAt).getTime() >=
        new Date(msg.createdAt).getTime()
      );
    }
    return false;
  };

  return (
    <div className="flex flex-col h-[75vh] max-h-[750px] min-h-[500px] rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#121226]/95 via-[#0E0E1E]/95 to-[#080812]/95 backdrop-blur-xl shadow-2xl overflow-hidden text-[#f5f5f0]">
      {/* Chat Room Header */}
      <div className="shrink-0 px-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#161630]/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 -ml-1 rounded-xl bg-white/5 hover:bg-white/10 text-[#f5f5f0]/70 hover:text-white transition-colors cursor-pointer"
            title="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5 text-[#D4AF37]" />
          </button>

          {/* Target User Info */}
          <div
            onClick={() => onOpenProfile(targetUser)}
            className="flex items-center gap-3 cursor-pointer group min-w-0"
            title="View member profile"
          >
            <div className="relative shrink-0">
              {targetUser.photoURL ? (
                <img
                  src={targetUser.photoURL}
                  alt={targetUser.displayName}
                  className="w-10 h-10 rounded-xl object-cover border border-[#D4AF37]/40 group-hover:border-[#D4AF37] transition-colors"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#202040] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                  {targetUser.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#161630] ${
                  targetUser.online
                    ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                    : "bg-zinc-500"
                }`}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base text-[#f5f5f0] group-hover:text-[#D4AF37] transition-colors truncate">
                  {targetUser.displayName}
                </h3>
              </div>
              <p className="text-[11px] text-[#f5f5f0]/50 truncate max-w-[180px] sm:max-w-xs">
                {isTargetTyping ? (
                  <span className="text-[#D4AF37] font-semibold animate-pulse">
                    Typing...
                  </span>
                ) : targetUser.online ? (
                  <span className="text-emerald-400 font-medium">Online Now</span>
                ) : (
                  <span>Active Member</span>
                )}
                {targetUser.becoming ? ` • ${targetUser.becoming}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Sound Chime Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              soundActive
                ? "bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#D4AF37]"
                : "bg-white/5 border-white/10 text-[#f5f5f0]/40 hover:text-[#f5f5f0]"
            }`}
            title={soundActive ? "Notification sound: Enabled" : "Notification sound: Muted"}
          >
            {soundActive ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* View Profile Button */}
          <button
            onClick={() => onOpenProfile(targetUser)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#D4AF37] font-medium transition-colors cursor-pointer hidden sm:flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {loadingMessages ? (
          <div className="h-full flex items-center justify-center text-xs text-[#f5f5f0]/40">
            <span className="animate-pulse">Loading direct conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="font-bold text-sm text-[#f5f5f0]">
                Connected with {targetUser.displayName}
              </h4>
              <p className="text-xs text-[#f5f5f0]/60 leading-relaxed">
                This is the beginning of your direct conversation. Share your moves, goals, or check in on each other's progress.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.uid;
            const isRead = isMe && isMessageReadByFriend(msg);
            const hasReactions =
              msg.reactions && Object.keys(msg.reactions).length > 0;

            return (
              <div
                key={msg.id}
                className={`relative group flex items-end gap-2.5 ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                {!isMe && (
                  <div className="shrink-0 mb-1">
                    {msg.senderAvatar ? (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="w-7 h-7 rounded-lg object-cover border border-[#D4AF37]/30"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-[#202040] border border-white/10 flex items-center justify-center text-[#D4AF37] text-xs font-bold">
                        {msg.senderName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                )}

                <div className="relative max-w-[85%] sm:max-w-[75%] space-y-1">
                  {/* Floating Reaction Bar Button */}
                  <button
                    onClick={() =>
                      setActiveReactionMsgId(
                        activeReactionMsgId === msg.id ? null : msg.id
                      )
                    }
                    className={`absolute -top-3.5 ${
                      isMe ? "-left-6" : "-right-6"
                    } opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-[#1A1A38] border border-white/20 text-[#f5f5f0]/70 hover:text-[#D4AF37] shadow-lg cursor-pointer z-10`}
                    title="Add reaction"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>

                  {/* Reaction Selector Popover */}
                  {activeReactionMsgId === msg.id && (
                    <div
                      className={`absolute -top-10 ${
                        isMe ? "right-0" : "left-0"
                      } z-20 flex items-center gap-1.5 p-1.5 rounded-full bg-[#181836] border border-[#D4AF37]/50 shadow-2xl animate-fade-in`}
                    >
                      {COMMON_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReactionClick(msg.id, emoji)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/15 text-sm transition-transform hover:scale-125 cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-2.5 shadow-md space-y-1.5 ${
                      isMe
                        ? "bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-medium rounded-br-none"
                        : "bg-[#181834]/95 border border-white/10 text-[#f5f5f0] rounded-bl-none"
                    }`}
                  >
                    {/* Growth Milestone Card if present */}
                    {msg.milestone && (
                      <div
                        className={`p-3 rounded-xl border mb-2 space-y-1.5 ${
                          isMe
                            ? "bg-black/20 border-black/30 text-black"
                            : "bg-[#0E0E22]/80 border-[#D4AF37]/40 text-[#f5f5f0]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <span className="text-base">
                              {msg.milestone.icon || "🌱"}
                            </span>
                            <span
                              className={
                                isMe ? "text-black font-extrabold" : "text-[#D4AF37]"
                              }
                            >
                              {msg.milestone.category || "Growth Milestone"}
                            </span>
                          </span>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md ${
                              isMe ? "bg-black/20 text-black" : "bg-[#D4AF37]/20 text-[#D4AF37]"
                            }`}
                          >
                            Milestone
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold leading-tight">
                          {msg.milestone.title}
                        </p>
                        {msg.milestone.subtitle && (
                          <p
                            className={`text-[11px] ${
                              isMe ? "text-black/75" : "text-[#f5f5f0]/60"
                            }`}
                          >
                            {msg.milestone.subtitle}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Message Body Text */}
                    {(!msg.milestone || (msg.text && !msg.text.startsWith("Shared a Growth Milestone"))) && (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {msg.text}
                      </p>
                    )}

                    {/* Timestamp & Read Receipt Indicator */}
                    <div
                      className={`flex items-center justify-end gap-1 text-[10px] ${
                        isMe ? "text-black/70 font-semibold" : "text-[#f5f5f0]/40"
                      }`}
                    >
                      <span>{formatMessageTime(msg.createdAt)}</span>
                      {isMe && (
                        <span title={isRead ? "Read by recipient" : "Delivered"}>
                          {isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-black font-extrabold" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reaction Pills Below Bubble */}
                  {hasReactions && (
                    <div
                      className={`flex flex-wrap gap-1 pt-0.5 ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      {Object.entries(msg.reactions!).map(([emoji, uids]) => {
                        if (!uids || uids.length === 0) return null;
                        const userReacted =
                          currentUser && uids.includes(currentUser.uid);

                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReactionClick(msg.id, emoji)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-transform hover:scale-105 cursor-pointer ${
                              userReacted
                                ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                                : "bg-black/50 border-white/10 text-[#f5f5f0]/70"
                            }`}
                            title={`${uids.length} reaction${
                              uids.length > 1 ? "s" : ""
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="font-mono text-[10px]">
                              {uids.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Real-time typing bubble */}
        {isTargetTyping && (
          <div className="flex items-center gap-2 pt-1 animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-[#202040] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-xs font-bold shrink-0">
              {targetUser.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-[#181834] border border-[#D4AF37]/30 flex items-center gap-1.5 shadow-md">
              <span className="text-[11px] text-[#D4AF37] font-medium">
                {targetUser.displayName} is typing
              </span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error alert if any */}
      {sendError && (
        <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{sendError}</span>
        </div>
      )}

      {/* Chat Message Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="shrink-0 p-3 sm:p-4 border-t border-white/10 bg-[#14142B]/90 flex items-center gap-2 sm:gap-3"
      >
        {/* Growth Milestone Share Button */}
        <button
          type="button"
          onClick={() => setShowMilestoneModal(true)}
          className="p-2.5 sm:px-3 rounded-2xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          title="Share Growth Milestone"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-semibold hidden md:inline">
            Milestone
          </span>
        </button>

        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${targetUser.displayName}...`}
          maxLength={2000}
          disabled={isSending}
          className="flex-1 px-4 py-3 rounded-2xl bg-black/40 border border-white/10 focus:border-[#D4AF37]/50 focus:outline-none text-xs sm:text-sm text-[#f5f5f0] placeholder-[#f5f5f0]/30 transition-all disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(212,175,55,0.3)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Send message"
        >
          <Send className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">Send</span>
        </button>
      </form>

      {/* Growth Milestone Share Modal */}
      {showMilestoneModal && (
        <MilestoneShareModal
          onClose={() => setShowMilestoneModal(false)}
          onShare={handleShareMilestone}
          userProfile={currentUserProfile}
          targetUserName={targetUser.displayName}
        />
      )}
    </div>
  );
};
