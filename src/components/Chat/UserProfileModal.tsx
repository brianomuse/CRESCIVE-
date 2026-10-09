import React, { useState } from "react";
import {
  X,
  UserCheck,
  UserPlus,
  MessageSquare,
  Clock,
  Radio,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { RealChatUser } from "../../lib/firebase";

interface UserProfileModalProps {
  member: RealChatUser | null;
  onClose: () => void;
  isMe: boolean;
  isFriend: boolean;
  hasSentRequest: boolean;
  hasReceivedRequest: boolean;
  onAddFriend: (member: RealChatUser) => void;
  onCancelRequest?: (member: RealChatUser) => void;
  onAcceptRequest?: (member: RealChatUser) => void;
  onDeclineRequest?: (member: RealChatUser) => void;
  onUnfriend?: (member: RealChatUser) => void;
  onOpenChat: (member: RealChatUser) => void;
  actionLoading?: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  member,
  onClose,
  isMe,
  isFriend,
  hasSentRequest,
  hasReceivedRequest,
  onAddFriend,
  onCancelRequest,
  onAcceptRequest,
  onDeclineRequest,
  onUnfriend,
  onOpenChat,
  actionLoading = false,
}) => {
  const [copiedUid, setCopiedUid] = useState(false);
  const [confirmUnfriend, setConfirmUnfriend] = useState(false);

  if (!member) return null;

  const handleCopyUid = () => {
    navigator.clipboard.writeText(member.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const formattedDate = member.createdAt
    ? new Date(member.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Active Member";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#161632] via-[#101026] to-[#0A0A18] p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-[#f5f5f0] space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#f5f5f0]/60 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Member Header */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="relative">
            {member.photoURL ? (
              <img
                src={member.photoURL}
                alt={member.displayName}
                className="w-24 h-24 rounded-3xl object-cover border-2 border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.25)]"
              />
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#23234A] to-[#121226] border-2 border-[#D4AF37]/60 flex items-center justify-center text-[#D4AF37] text-3xl font-extrabold shadow-lg">
                {member.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-[#101026] ${
                member.online
                  ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                  : "bg-zinc-500"
              }`}
              title={member.online ? "Online Now" : "Offline"}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-xl font-extrabold tracking-tight text-[#f5f5f0]">
                {member.displayName}
              </h3>
              {isMe && (
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-bold">
                  You
                </span>
              )}
            </div>

            <p className="text-xs text-[#D4AF37] font-mono">
              @{member.username || member.displayName.toLowerCase().replace(/\s+/g, "_")}
            </p>

            {member.preferredName && member.preferredName !== member.displayName && (
              <p className="text-xs text-[#f5f5f0]/70 font-medium">
                "{member.preferredName}"
              </p>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-[#f5f5f0]/50 pt-0.5">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]/70" />
              <span>Member since {formattedDate}</span>
              <span>•</span>
              <span
                className={`font-medium ${
                  member.online ? "text-emerald-400" : "text-[#f5f5f0]/40"
                }`}
              >
                {member.online ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Becoming Aspiration */}
        <div className="p-4 rounded-2xl bg-black/40 border border-[#D4AF37]/20 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]/80 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-[#D4AF37]" />
            What I am Becoming
          </span>
          <p className="text-xs sm:text-sm text-[#f5f5f0]/90 leading-relaxed italic">
            "{member.becoming || "Striving for continuous growth and progress."}"
          </p>
        </div>

        {/* Authoritative UID */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-[#f5f5f0]/40 font-mono">
              CRESCIVE Member UID
            </span>
            <span className="font-mono text-[11px] text-[#f5f5f0]/80">
              {member.uid.slice(0, 14)}...{member.uid.slice(-6)}
            </span>
          </div>
          <button
            onClick={handleCopyUid}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 text-[11px] text-[#D4AF37] transition-colors cursor-pointer"
          >
            {copiedUid ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Actions Section */}
        <div className="space-y-2 pt-1">
          {isMe ? (
            <div className="text-center py-2 text-xs text-[#f5f5f0]/50 italic">
              This is your public CRESCIVE profile visible to other members.
            </div>
          ) : isFriend ? (
            <div className="space-y-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenChat(member);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(212,175,55,0.3)] transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Open Direct Conversation
              </button>

              {confirmUnfriend ? (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                  <p className="text-xs text-rose-300 text-center">
                    Remove {member.displayName} from your friends?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmUnfriend(false)}
                      className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-[#f5f5f0] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onUnfriend?.(member);
                        setConfirmUnfriend(false);
                      }}
                      disabled={actionLoading}
                      className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white cursor-pointer"
                    >
                      Confirm Unfriend
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmUnfriend(true)}
                  className="w-full py-2 rounded-xl text-xs text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Unfriend Member
                </button>
              )}
            </div>
          ) : hasReceivedRequest ? (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs text-[#D4AF37] text-center font-medium">
                {member.displayName} sent you a friend request!
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onAcceptRequest?.(member)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <UserCheck className="w-4 h-4" />
                  Accept Request
                </button>
                <button
                  onClick={() => onDeclineRequest?.(member)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#f5f5f0]/70 cursor-pointer"
                >
                  Decline
                </button>
              </div>
            </div>
          ) : hasSentRequest ? (
            <div className="space-y-2">
              <div className="py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 text-center flex items-center justify-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Friend request pending
              </div>
              <button
                onClick={() => onCancelRequest?.(member)}
                disabled={actionLoading}
                className="w-full py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 cursor-pointer"
              >
                Cancel Request
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddFriend(member)}
              disabled={actionLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(212,175,55,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {actionLoading ? "Sending Request..." : "Add Friend"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
