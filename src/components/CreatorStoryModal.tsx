import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MapPin, School, Quote } from "lucide-react";

interface CreatorStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatorStoryModal: React.FC<CreatorStoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-lg bg-[#101025] border border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 text-[#f5f5f0] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_40px_rgba(212,175,55,0.15)] my-auto max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
            aria-label="Close story"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono tracking-widest uppercase">
              Origin & Vision
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-light font-serif-cresive text-white tracking-wide">
            About the Creator
          </h2>
          <p className="text-xs text-zinc-400 font-light mt-1 uppercase tracking-wider">
            The story and heartbeat behind CRESCIVE.
          </p>

          <div className="mt-6 space-y-6 text-sm text-zinc-300 leading-relaxed font-normal">
            {/* Permanent Official Creator Photograph Card (Read-Only) */}
            <div className="rounded-3xl overflow-hidden border border-[#D4AF37]/40 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.2)] bg-[#050510]">
              <div className="relative w-full overflow-hidden bg-black flex flex-col items-center justify-center">
                <img
                  src="/creator_brian.jpg"
                  alt="Brian Omuse - Creator of CRESCIVE"
                  className="w-full h-auto max-h-[520px] object-contain mx-auto"
                  referrerPolicy="no-referrer"
                  loading="eager"
                />
              </div>

              <div className="p-4 sm:p-5 bg-gradient-to-r from-[#D4AF37]/15 via-[#101025] to-[#7F00FF]/15 border-t border-[#D4AF37]/30 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-white tracking-wide font-serif-cresive">
                      Brian Omuse
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono uppercase font-semibold">
                      Creator &amp; Founder · Age 14
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-zinc-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> Malaba, Kenya
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <School className="w-3.5 h-3.5 text-sky-400" /> Malaba Township
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Crescive Exists */}
            <section className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                Why CRESCIVE Exists
              </h4>
              <p className="text-zinc-300 text-xs sm:text-sm">
                Brian Omuse is the creator and founder of CRESCIVE. A 14-year-old student, teenage creator, and digital innovator from Malaba, Kenya, studying at Malaba Township, Brian began CRESCIVE from a simple idea: people should be able to think more clearly about the future they are building and understand how today&apos;s decisions can shape tomorrow.
              </p>
              <p className="text-zinc-300 text-xs sm:text-sm">
                CRESCIVE was created to go beyond ordinary productivity apps. It is designed to help people understand where they are, where they want to go, what stands between them and that future, and what actions can move them forward.
              </p>
              <p className="text-amber-200/90 font-medium text-xs sm:text-sm">
                The goal is not to create a perfect life. The goal is to help people consciously build their own.
              </p>
            </section>

            {/* The Vision */}
            <section className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                The Vision
              </h4>
              <p className="text-zinc-300 text-xs sm:text-sm">
                CRESCIVE is built around one belief: <span className="text-white font-semibold">Your future is a trajectory, not a destination.</span>
              </p>
              <p className="text-zinc-300 text-xs sm:text-sm">
                Every decision, skill, habit, relationship, experience, and opportunity can influence the direction of that trajectory. CRESCIVE aims to make that journey visible, understandable, and actionable.
              </p>
            </section>

            {/* Creator's Note */}
            <section className="p-4 rounded-2xl bg-[#050510] border border-white/10 relative">
              <Quote className="w-6 h-6 text-[#D4AF37]/20 absolute top-3 right-3 pointer-events-none" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-2">
                The Creator&apos;s Note
              </h4>
              <p className="text-xs sm:text-sm text-zinc-300 italic leading-relaxed">
                &ldquo;CRESCIVE is more than an app to me. It represents an idea about what is possible when someone starts thinking seriously about the person they want to become.
                I created CRESCIVE because I believe the future should not simply happen to us. We should have a role in building it.
                I am still learning, still growing, and still building. And that is exactly what CRESCIVE represents.&rdquo;
              </p>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <span className="font-semibold text-white">— Brian Omuse</span>
                <span className="text-[#D4AF37] text-[11px]">Creator &amp; Founder of CRESCIVE</span>
              </div>
            </section>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-[#050510] border border-white/5">
                <span className="text-[10px] uppercase text-zinc-500 block">Name</span>
                <span className="font-semibold text-zinc-200">Brian Omuse</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050510] border border-white/5">
                <span className="text-[10px] uppercase text-zinc-500 block">Role</span>
                <span className="font-semibold text-zinc-200">Creator &amp; Founder</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050510] border border-white/5">
                <span className="text-[10px] uppercase text-zinc-500 block">Origin</span>
                <span className="font-semibold text-zinc-200">Malaba, Kenya</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050510] border border-white/5">
                <span className="text-[10px] uppercase text-zinc-500 block">School</span>
                <span className="font-semibold text-zinc-200">Malaba Township</span>
              </div>
              <div className="col-span-2 p-2.5 rounded-xl bg-[#050510] border border-white/5">
                <span className="text-[10px] uppercase text-zinc-500 block">Identity</span>
                <span className="font-semibold text-zinc-200">Teenage Creator • Digital Innovator • Future Builder</span>
              </div>
            </div>

            {/* Opportunities Welcome */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                  Opportunities Welcome
                </h4>
              </div>
              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                As CRESCIVE continues to grow, the Creator is open to opportunities that can support the development of this vision and future projects.
              </p>

              <div className="space-y-2 p-3.5 rounded-2xl bg-[#050510] border border-white/10">
                {[
                  "Sponsorship & Strategic Partnerships",
                  "Mentorship & Professional Guidance",
                  "Creative & Technology Collaborations",
                  "Networking & Industry Connections",
                  "Support for Innovation and Future Projects",
                ].map((opp) => (
                  <div key={opp} className="flex items-start gap-2.5 text-xs text-zinc-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                    <span>{opp}</span>
                  </div>
                ))}
              </div>

              <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                If you are an individual, organization, company, mentor, sponsor, or potential collaborator interested in supporting Brian’s journey and helping develop future ideas, you are welcome to get in touch.
              </p>
            </section>

            {/* Contact the Creator */}
            <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#121028] via-[#090918] to-[#050510] border border-[#D4AF37]/40 shadow-lg space-y-3">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-bold">
                  GET IN TOUCH
                </span>
                <h4 className="text-base font-bold text-white tracking-wide font-serif-cresive mt-0.5">
                  Contact the Creator
                </h4>
                <p className="text-xs text-zinc-300 mt-0.5 font-medium">
                  Brian Omuse
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                <a
                  href="tel:+254710796433"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2.5 text-zinc-200 hover:text-white transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                    <span className="text-[#D4AF37] text-xs font-mono font-bold">TEL</span>
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">Phone</span>
                    <span className="font-semibold text-white group-hover:text-[#F5D77F]">+254 710 796 433</span>
                  </div>
                </a>

                <a
                  href="mailto:brianomuse017@gmail.com"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2.5 text-zinc-200 hover:text-white transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                    <span className="text-[#D4AF37] text-xs font-mono font-bold">@</span>
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">Email</span>
                    <span className="font-semibold text-white group-hover:text-[#F5D77F] truncate block">brianomuse017@gmail.com</span>
                  </div>
                </a>
              </div>

              <p className="text-xs text-amber-200/90 italic pt-1 border-t border-white/10 leading-relaxed font-serif-cresive">
                &ldquo;Your support, guidance, collaboration, or connection can help turn ambitious ideas into meaningful projects.&rdquo;
              </p>
            </section>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={onClose}
              className="py-2.5 px-6 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:scale-105 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
