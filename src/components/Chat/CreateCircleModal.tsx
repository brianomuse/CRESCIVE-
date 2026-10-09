import React, { useState } from "react";
import {
  X,
  Users,
  Compass,
  Check,
  Plus,
  ShieldCheck,
  Sparkles,
  Layers,
} from "lucide-react";
import { RealChatUser, createGrowthCircle } from "../../lib/firebase";
import { UserProfile } from "../../types";

interface CreateCircleModalProps {
  onClose: () => void;
  onCircleCreated: (circleId: string) => void;
  friends: RealChatUser[];
  currentUserProfile: UserProfile | null;
}

const FOCUS_AREAS = [
  "All Disciplines",
  "Focus & Craft Excellence",
  "Physical Health & Vitality",
  "Mindset & Mental Clarity",
  "Creative Expression & Building",
  "Daily Habits & Consistency",
];

export const CreateCircleModal: React.FC<CreateCircleModalProps> = ({
  onClose,
  onCircleCreated,
  friends,
  currentUserProfile,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [focusArea, setFocusArea] = useState(FOCUS_AREAS[0]);
  const [selectedFriendUids, setSelectedFriendUids] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFriend = (uid: string) => {
    setSelectedFriendUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Circle name is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const invitedFriends = friends.filter((f) =>
        selectedFriendUids.includes(f.uid)
      );

      const circleId = await createGrowthCircle(
        trimmedName,
        description,
        focusArea,
        invitedFriends,
        currentUserProfile
      );

      onCircleCreated(circleId);
      onClose();
    } catch (err: any) {
      console.error("Create circle error:", err);
      setError(err?.message || "Failed to create Growth Circle.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#161632] via-[#101026] to-[#0A0A18] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-[#f5f5f0] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#f5f5f0]/60 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            <span>Quarter 4 • Private Growth Circle</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#f5f5f0]">
            Create a Growth Circle
          </h3>
          <p className="text-xs text-[#f5f5f0]/60 leading-relaxed">
            Form a private sanctuary for shared accountability around Moves and synchronized deep work sessions.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Circle Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              Circle Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Builders & Deep Work"
              maxLength={80}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#D4AF37]/60 text-xs sm:text-sm text-[#f5f5f0] focus:outline-none"
            />
          </div>

          {/* Circle Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#f5f5f0]/70">
              Purpose & Intention
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are members holding each other accountable for?"
              rows={2}
              maxLength={240}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-[#D4AF37]/60 text-xs sm:text-sm text-[#f5f5f0] focus:outline-none resize-none"
            />
          </div>

          {/* Focus Area */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#f5f5f0]/70">
              Focus Discipline
            </label>
            <select
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#14142B] border border-white/10 focus:border-[#D4AF37]/60 text-xs sm:text-sm text-[#f5f5f0] focus:outline-none"
            >
              {FOCUS_AREAS.map((area) => (
                <option key={area} value={area} className="bg-[#14142B] text-white">
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Invite Real Friends */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                Invite Confirmed Friends ({selectedFriendUids.length} selected)
              </label>
              <span className="text-[10px] text-[#f5f5f0]/40">
                Real friends only
              </span>
            </div>

            {friends.length === 0 ? (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-[#f5f5f0]/50 text-center">
                No friends added yet. You can create the circle now and invite friends later!
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {friends.map((friend) => {
                  const isSelected = selectedFriendUids.includes(friend.uid);
                  return (
                    <div
                      key={friend.uid}
                      onClick={() => toggleFriend(friend.uid)}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#D4AF37]"
                          : "bg-white/5 border-white/10 text-[#f5f5f0]/80 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {friend.photoURL ? (
                          <img
                            src={friend.photoURL}
                            alt={friend.displayName}
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-[#202040] flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                            {friend.displayName.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-semibold truncate">
                          {friend.displayName}
                        </span>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                          isSelected
                            ? "bg-[#D4AF37] border-[#D4AF37] text-black"
                            : "border-white/20"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              Private Circle: Only invited and confirmed members will have access. Personal reflections and private data remain strictly protected.
            </span>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#f5f5f0]/70 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#E5C158] hover:to-[#C9971C] text-black font-bold text-xs tracking-wide shadow-[0_4px_15px_rgba(212,175,55,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Circle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
