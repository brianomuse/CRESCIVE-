import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  startGameMusic,
  stopGameMusic,
  isMusicEnabled,
  setMusicEnabled,
  isSfxEnabled,
  setSfxEnabled,
  playCollectXpSound,
  playLevelCompleteSound,
  playWinSound,
  playLoseSound,
} from "../../utils/gameAudio";
import { awardGameXp, getStoredGameStats } from "../../utils/gamesStorage";
import { GamePauseModal } from "./GamePauseModal";
import { GameVictoryModal } from "./GameVictoryModal";
import { GameOverModal } from "./GameOverModal";
import {
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Zap,
  Sparkles,
  Trophy,
} from "lucide-react";

interface FocusChallenge3DProps {
  onExit: () => void;
}

const LANES = [-2.4, -0.8, 0.8, 2.4]; // 4 concentration channels

export const FocusChallenge3D: React.FC<FocusChallenge3DProps> = ({ onExit }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);

  const [progressPercent, setProgressPercent] = useState(0);
  const [focusScore, setFocusScore] = useState(0);
  const [focusHealth, setFocusHealth] = useState(3); // 3 focus nodes
  const [xpEarnedTotal, setXpEarnedTotal] = useState(0);
  const [musicOn, setMusicOn] = useState(isMusicEnabled());
  const [sfxOn, setSfxOn] = useState(isSfxEnabled());
  const [perfectRun, setPerfectRun] = useState(true);

  const initialStats = getStoredGameStats();
  const [bestScore, setBestScore] = useState(initialStats.focusBestScore);
  const [isPersonalBest, setIsPersonalBest] = useState(false);

  const gameState = useRef({
    currentLane: 1,
    targetX: -0.8,
    speed: 22,
    courseLength: 180,
    distanceTraveled: 0,
    obstacles: [] as THREE.Mesh[],
    focusTokens: [] as THREE.Mesh[],
    health: 3,
    isDead: false,
    active: true,
  });

  useEffect(() => {
    startGameMusic();
    const startResult = awardGameXp(2, "Focus Challenge Started", "focus", { isStart: true });
    if (startResult.xpAwarded > 0) {
      setXpEarnedTotal(startResult.xpAwarded);
    }

    return () => {
      stopGameMusic();
    };
  }, []);

  // Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060814, 0.025);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 140);
    camera.position.set(0, 3.2, 5.5);
    camera.lookAt(0, 1.2, -10);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x060814, 1);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00e5ff, 2.5);
    dirLight.position.set(4, 10, 6);
    scene.add(dirLight);

    // Cyber Tunnel Floor
    const trackWidth = 7.5;
    const trackLength = 220;
    const floorGeo = new THREE.PlaneGeometry(trackWidth, trackLength, 12, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x050818,
      roughness: 0.2,
      metalness: 0.9,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -trackLength / 2 + 10;
    scene.add(floor);

    // Lane dividing glowing wires
    LANES.forEach((laneX) => {
      const wireGeo = new THREE.BoxGeometry(0.04, 0.02, trackLength);
      const wireMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      wire.position.set(laneX, 0.02, -trackLength / 2 + 10);
      scene.add(wire);
    });

    // Player Avatar: Dynamic Focus Crystal
    const playerGroup = new THREE.Group();
    const crystalGeo = new THREE.OctahedronGeometry(0.5, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x0088cc,
      emissiveIntensity: 0.7,
      metalness: 0.9,
      roughness: 0.1,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    playerGroup.add(crystal);

    // Orbiting halo
    const haloGeo = new THREE.TorusGeometry(0.75, 0.03, 8, 32);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2.5;
    playerGroup.add(halo);

    playerGroup.position.set(LANES[gameState.current.currentLane], 0.6, 0);
    scene.add(playerGroup);

    // Rotating Gates / Laser Obstacles
    const obstacles: THREE.Mesh[] = [];
    const obsGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.2, 8);
    const obsMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xff0055,
      emissiveIntensity: 0.8,
      metalness: 0.5,
    });

    // Tokens
    const focusTokens: THREE.Mesh[] = [];
    const tokGeo = new THREE.DodecahedronGeometry(0.35, 0);
    const tokMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      emissive: 0xffd700,
      emissiveIntensity: 0.9,
      metalness: 0.9,
    });

    for (let i = 0; i < 10; i++) {
      const obs = new THREE.Mesh(obsGeo, obsMat);
      obs.rotation.z = Math.PI / 2;
      obs.position.set(0, -50, 0);
      scene.add(obs);
      obstacles.push(obs);
    }

    for (let i = 0; i < 12; i++) {
      const tok = new THREE.Mesh(tokGeo, tokMat);
      tok.position.set(0, -50, 0);
      scene.add(tok);
      focusTokens.push(tok);
    }

    gameState.current.obstacles = obstacles;
    gameState.current.focusTokens = focusTokens;

    // Finish Gate
    const finishGeo = new THREE.TorusGeometry(3.5, 0.3, 16, 32);
    const finishMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      emissive: 0xffd700,
      emissiveIntensity: 0.9,
    });
    const finishGate = new THREE.Mesh(finishGeo, finishMat);
    finishGate.position.set(0, 2.5, -gameState.current.courseLength);
    scene.add(finishGate);

    let nextSpawnZ = -25;
    const spawnWave = (atZ: number) => {
      const randomLane = Math.floor(Math.random() * LANES.length);
      const freeLanes = LANES.map((_, i) => i).filter((i) => i !== randomLane);

      // Obstacle in random lane
      const inactiveObs = obstacles.find((o) => o.position.y < 0);
      if (inactiveObs) {
        inactiveObs.position.set(LANES[randomLane], 0.7, atZ);
      }

      // Bonus focus prism in one of the safe lanes
      const tokenLane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
      const inactiveTok = focusTokens.find((t) => t.position.y < 0);
      if (inactiveTok) {
        inactiveTok.position.set(LANES[tokenLane], 0.6, atZ + 4);
      }
    };

    // Pre-spawn
    for (let z = -25; z >= -150; z -= 20) {
      spawnWave(z);
      nextSpawnZ = z - 20;
    }

    // Loop
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      if (isPaused || gameState.current.isDead || !gameState.current.active) return;

      const delta = Math.min(clock.getDelta(), 0.05);
      const step = gameState.current.speed * delta;

      gameState.current.distanceTraveled += step;
      const pct = Math.min(
        100,
        Math.floor((gameState.current.distanceTraveled / gameState.current.courseLength) * 100)
      );
      setProgressPercent(pct);
      setFocusScore(Math.floor(gameState.current.distanceTraveled * 10));

      // Player Position Lerp
      const targetX = LANES[gameState.current.currentLane];
      playerGroup.position.x += (targetX - playerGroup.position.x) * (delta * 16);

      crystal.rotation.y += delta * 3;
      crystal.rotation.x += delta * 2;
      halo.rotation.z += delta * 4;

      // Finish Gate Check
      finishGate.position.z += step;
      finishGate.rotation.z += delta * 1.5;

      if (finishGate.position.z >= playerGroup.position.z - 1) {
        // Course Finished Successfully!
        handleCourseComplete();
        return;
      }

      // Move Obstacles
      obstacles.forEach((obs) => {
        if (obs.position.y > 0) {
          obs.position.z += step;
          obs.rotation.y += delta * 2;

          // Collision
          const dx = Math.abs(obs.position.x - playerGroup.position.x);
          const dz = Math.abs(obs.position.z - playerGroup.position.z);
          if (dx < 0.9 && dz < 0.8) {
            // Hit obstacle
            obs.position.set(0, -50, 0);
            handleTakeHit();
          }

          if (obs.position.z > 8) {
            obs.position.set(0, -50, 0);
          }
        }
      });

      // Move Tokens
      focusTokens.forEach((tok) => {
        if (tok.position.y > 0) {
          tok.position.z += step;
          tok.rotation.y += delta * 3;

          const dx = Math.abs(tok.position.x - playerGroup.position.x);
          const dz = Math.abs(tok.position.z - playerGroup.position.z);
          if (dx < 0.8 && dz < 0.8) {
            tok.position.set(0, -50, 0);
            playCollectXpSound(false);
            const tokXp = awardGameXp(1, "Focus Crystal Collected", "focus");
            setXpEarnedTotal((prev) => prev + tokXp.xpAwarded);
          }

          if (tok.position.z > 8) {
            tok.position.set(0, -50, 0);
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const moveLeft = () => {
    if (gameState.current.currentLane > 0) {
      gameState.current.currentLane--;
    }
  };

  const moveRight = () => {
    if (gameState.current.currentLane < LANES.length - 1) {
      gameState.current.currentLane++;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") moveLeft();
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") moveRight();
      else if (e.key === "Escape" || e.key === "p") setIsPaused((p) => !p);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleTakeHit = () => {
    playLoseSound();
    setPerfectRun(false);
    gameState.current.health--;
    setFocusHealth(gameState.current.health);

    if (gameState.current.health <= 0) {
      // Game Over
      gameState.current.isDead = true;
      stopGameMusic();

      const finalScore = Math.floor(gameState.current.distanceTraveled * 10);
      const res = awardGameXp(5, "Focus Attempt Finished", "focus", {
        focusScore: finalScore,
        focusPerfect: false,
      });

      setXpEarnedTotal((prev) => prev + res.xpAwarded);
      setIsPersonalBest(res.isPersonalBest);
      setIsGameOver(true);
    }
  };

  const handleCourseComplete = () => {
    gameState.current.active = false;
    stopGameMusic();
    playLevelCompleteSound();
    playWinSound();

    const isFlawless = perfectRun && gameState.current.health === 3;
    const completionReward = isFlawless ? 50 : 30;
    const finalScore = Math.floor(gameState.current.distanceTraveled * 10);

    const res = awardGameXp(
      completionReward,
      isFlawless ? "Flawless Focus Run" : "Focus Course Complete",
      "focus",
      {
        isCompletion: true,
        focusScore: finalScore,
        focusPerfect: isFlawless,
      }
    );

    setXpEarnedTotal((prev) => prev + res.xpAwarded);
    setIsPersonalBest(res.isPersonalBest);
    setIsVictory(true);
  };

  const handleRestart = () => {
    gameState.current.currentLane = 1;
    gameState.current.distanceTraveled = 0;
    gameState.current.health = 3;
    gameState.current.isDead = false;
    gameState.current.active = true;

    // Reset obstacles
    gameState.current.obstacles.forEach((o) => o.position.set(0, -50, 0));
    gameState.current.focusTokens.forEach((t) => t.position.set(0, -50, 0));

    setProgressPercent(0);
    setFocusScore(0);
    setFocusHealth(3);
    setPerfectRun(true);
    setIsPaused(false);
    setIsGameOver(false);
    setIsVictory(false);
    setIsPersonalBest(false);

    if (musicOn) startGameMusic();
  };

  return (
    <div className="relative w-full h-[85vh] max-h-[750px] bg-[#060814] rounded-3xl overflow-hidden select-none border border-[#00e5ff]/30 shadow-2xl">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2">
          {/* Progress bar */}
          <div className="px-3 py-1.5 rounded-2xl bg-black/65 backdrop-blur-md border border-white/10 text-white flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#00e5ff]">FOCUS:</span>
            <span className="text-sm font-bold font-mono">{progressPercent}%</span>
          </div>

          {/* Health Orbs */}
          <div className="px-3 py-1.5 rounded-2xl bg-black/65 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
            {[1, 2, 3].map((h) => (
              <div
                key={h}
                className={`w-3 h-3 rounded-full transition-all ${
                  h <= focusHealth
                    ? "bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]"
                    : "bg-white/10 border border-white/20"
                }`}
              />
            ))}
          </div>

          {perfectRun && (
            <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-bold hidden sm:flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>FLAWLESS +50 XP</span>
            </div>
          )}
        </div>

        {/* Audio & Pause Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => {
              const next = !musicOn;
              setMusicOn(next);
              setMusicEnabled(next);
            }}
            className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-zinc-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            {musicOn ? <Volume2 className="w-4 h-4 text-[#00e5ff]" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          <button
            onClick={() => setIsPaused(true)}
            className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-zinc-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Onscreen Touch Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-auto z-20">
        <button
          onClick={moveLeft}
          className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-black/75 active:bg-[#00e5ff]/30 border border-white/20 active:border-[#00e5ff] text-white flex items-center justify-center backdrop-blur-md shadow-lg active:scale-95 transition-all cursor-pointer"
          aria-label="Channel Left"
        >
          <ChevronLeft className="w-10 h-10 text-[#00e5ff]" />
        </button>

        <button
          onClick={moveRight}
          className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-black/75 active:bg-[#00e5ff]/30 border border-white/20 active:border-[#00e5ff] text-white flex items-center justify-center backdrop-blur-md shadow-lg active:scale-95 transition-all cursor-pointer"
          aria-label="Channel Right"
        >
          <ChevronRight className="w-10 h-10 text-[#00e5ff]" />
        </button>
      </div>

      {/* Pause Modal */}
      <GamePauseModal
        isOpen={isPaused}
        isMusicOn={musicOn}
        isSfxOn={sfxOn}
        onResume={() => setIsPaused(false)}
        onRestart={handleRestart}
        onExit={onExit}
        onToggleMusic={() => {
          const next = !musicOn;
          setMusicOn(next);
          setMusicEnabled(next);
        }}
        onToggleSfx={() => {
          const next = !sfxOn;
          setSfxOn(next);
          setSfxEnabled(next);
        }}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOver}
        score={focusScore}
        xpEarned={xpEarnedTotal}
        bestScore={bestScore}
        isNewPersonalBest={isPersonalBest}
        scoreUnit="pts"
        onPlayAgain={handleRestart}
        onExit={onExit}
      />

      {/* Victory Modal */}
      <GameVictoryModal
        isOpen={isVictory}
        title={perfectRun ? "FLAWLESS FOCUS!" : "COURSE CONQUERED!"}
        subtitle={perfectRun ? "Zero hits. Sovereign mental concentration." : "Course finished successfully."}
        statsLabel="Course Progress"
        statsValue="100% Completed"
        xpEarned={perfectRun ? 50 : 30}
        onPlayAgain={handleRestart}
        onExit={onExit}
      />
    </div>
  );
};
