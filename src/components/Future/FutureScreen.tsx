import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, MoveItem, ScenarioResult } from "../../types";
import {
  Compass,
  Sparkles,
  Lightbulb,
  ArrowRight,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  BrainCircuit,
  Bookmark
} from "lucide-react";

interface FutureScreenProps {
  userProfile: UserProfile;
  moves: MoveItem[];
  onOpenCreateMove: () => void;
}

export const FutureScreen: React.FC<FutureScreenProps> = ({
  userProfile,
  moves,
  onOpenCreateMove,
}) => {
  const [scenarioInput, setScenarioInput] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [simulations, setSimulations] = useState<ScenarioResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const completedMoves = moves.filter((m) => m.completed);
  const hasRealActivity = completedMoves.length > 0;

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenarioInput.trim() || simulating) return;

    setSimulating(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: scenarioInput.trim(),
          userProfile,
        }),
      });

      if (!res.ok) {
        throw new Error("Simulation endpoint error");
      }

      const data = await res.json();
      const newResult: ScenarioResult = {
        id: Date.now().toString(),
        scenario: scenarioInput.trim(),
        analysis: data.analysis,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setSimulations((prev) => [newResult, ...prev]);
      setScenarioInput("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Simulation service offline or key unconfigured. Displaying local grounded projection.");
      const fallbackResult: ScenarioResult = {
        id: Date.now().toString(),
        scenario: scenarioInput.trim(),
        analysis: `### Trajectory Simulation for: "${scenarioInput.trim()}"\n\n` +
          `**1. Knowledge & Skills**: Requires focused fundamentals and deliberate repetition in ${userProfile.chapter.join(", ")}.\n\n` +
          `**2. Time Investment**: Recommended 45–60 minutes 4 times per week to build compounding momentum without burnout.\n\n` +
          `**3. Trajectory Upside**: Significant progress in 90 days if paired with consistent execution.\n\n` +
          `**4. Key Friction**: ${userProfile.constraints.join(", ") || "Daily distractions"}. Protect your focus windows.\n\n` +
          `**5. The Immediate First Move**: Define your first 30-minute study or build session as a Move in CRESCIVE today.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setSimulations((prev) => [fallbackResult, ...prev]);
      setScenarioInput("");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div>
        <span className="text-[10px] font-mono tracking-widest uppercase text-[#D4AF37] font-semibold">
          TELEOLOGY & TRAJECTORY
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
          Your Future & Trajectory
        </h1>
        <p className="text-xs text-zinc-400 font-light mt-0.5">
          Your future is a trajectory, not a destination. Decisions reshape the curve.
        </p>
      </div>

      {/* SECTION 1: YOUR TRAJECTORY */}
      <section className="crescive-glass-card rounded-3xl p-6 sm:p-7 border border-amber-300/25 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-lg font-bold font-display text-white tracking-wide">
              YOUR TRAJECTORY
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-amber-200">
            MODEL v1.0
          </span>
        </div>

        {!hasRealActivity ? (
          /* Honest Empty State for Trajectory */
          <div className="py-8 px-4 rounded-2xl bg-black/40 border border-white/5 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
              <Compass className="w-5 h-5 text-zinc-500" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              Your trajectory hasn&apos;t been defined yet.
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-5 leading-relaxed">
              As you choose a direction and begin taking meaningful action, CRESCIVE will begin mapping your path.
            </p>
            <button
              onClick={onOpenCreateMove}
              className="py-2.5 px-5 rounded-xl gold-gradient-bg text-zinc-950 font-bold text-xs shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:brightness-110 transition-all cursor-pointer"
            >
              + Define your first Move
            </button>
          </div>
        ) : (
          /* Living Trajectory Visualization */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#D4AF37] font-bold">STARTING POINT</span>
                <span className="text-zinc-300">{userProfile.age} yrs · {userProfile.chapter.join(" / ")}</span>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="text-sky-400 font-bold">REAL ACTIONS COMPLETED</span>
                <span className="text-emerald-400 font-semibold">{completedMoves.length} Moves logged</span>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div className="flex items-center justify-between">
                <span className="text-purple-400 font-bold">BECOMING DIRECTION</span>
                <span className="text-amber-200 truncate max-w-[220px] italic font-sans text-xs">
                  &quot;{userProfile.becoming}&quot;
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-950/20 to-transparent border border-amber-300/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-200 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Compound Trajectory Vector</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                By investing <span className="text-white font-semibold">{userProfile.availableTime}</span> consistently into{" "}
                <span className="text-white font-semibold">{userProfile.matters.slice(0, 3).join(", ")}</span>, you reduce friction from{" "}
                <span className="text-rose-300">{userProfile.constraints.slice(0, 2).join(" & ") || "initial inertia"}</span> and compound toward your 5-year vision.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: WHAT IF? SCENARIO SIMULATOR */}
      <section className="crescive-glass-card rounded-3xl p-6 sm:p-7 border border-purple-400/25 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold font-display text-white tracking-wide">
              WHAT IF? · SCENARIO SIMULATOR
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-400/30 text-purple-300">
            SIMULATION ENGINE
          </span>
        </div>

        <p className="text-xs text-zinc-300 font-light leading-relaxed">
          Before you make a major pivot or time commitment, simulate the trajectory ripple across skills, time trade-offs, and realistic constraints.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSimulate} className="relative">
          <textarea
            rows={3}
            value={scenarioInput}
            onChange={(e) => setScenarioInput(e.target.value)}
            placeholder="e.g. What if I commit 1 hour every evening to mastering Full-Stack Development and building real projects?"
            className="w-full bg-black/40 border border-white/15 focus:border-purple-400/60 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed"
          />

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">
              Grounded in your real profile & constraints
            </span>

            <button
              type="submit"
              disabled={!scenarioInput.trim() || simulating}
              className={`py-2 px-5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                scenarioInput.trim() && !simulating
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:brightness-110"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
              }`}
            >
              {simulating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Simulating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Simulation</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Simulation Output List */}
        {simulations.length === 0 ? (
          <div className="py-8 px-4 rounded-2xl bg-black/30 border border-white/5 text-center text-xs text-zinc-500">
            Nothing to simulate yet. Give CRESCIVE a goal, decision, or direction and we&apos;ll help you explore the possibilities.
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {simulations.map((sim) => (
              <motion.div
                key={sim.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-white/[0.03] border border-purple-400/20 text-xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-bold text-purple-200">
                    Scenario: &ldquo;{sim.scenario}&rdquo;
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {sim.timestamp}
                  </span>
                </div>

                <div className="text-zinc-300 leading-relaxed whitespace-pre-line">
                  {sim.analysis}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
