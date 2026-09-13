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
} from "../../utils/gameAudio";
import { awardGameXp, getStoredGameStats } from "../../utils/gamesStorage";
import { GamePauseModal } from "./GamePauseModal";
import { GameVictoryModal } from "./GameVictoryModal";
import {
  Pause,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Key,
  Compass,
  RotateCcw,
} from "lucide-react";

interface BrainMaze3DProps {
  onExit: () => void;
}

// 0: Path, 1: Wall, 2: Start, 3: Exit, 4: Key/Puzzle
const MAZE_LEVELS = [
  {
    level: 1,
    title: "Initiation Labyrinth",
    description: "Navigate the cyber labyrinth to locate the golden exit portal.",
    xpReward: 25,
    hasKey: false,
    width: 7,
    height: 7,
    grid: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 1, 0, 1],
      [1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 1, 3, 1],
      [1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    level: 2,
    title: "The Harmonic Gate",
    description: "Collect the glowing Golden Key to unseal the exit barrier.",
    xpReward: 35,
    hasKey: true,
    width: 9,
    height: 9,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 1, 0, 0, 0, 4, 1],
      [1, 1, 0, 1, 0, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 1],
      [1, 0, 1, 1, 0, 1, 0, 1, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    level: 3,
    title: "Quantum Nexus",
    description: "Complex neural pathways. Collect the key and reach the core.",
    xpReward: 45,
    hasKey: true,
    width: 11,
    height: 11,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 1, 0, 0, 0, 1, 4, 1],
      [1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
];

export const BrainMaze3D: React.FC<BrainMaze3DProps> = ({ onExit }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const currentLevel = MAZE_LEVELS[currentLevelIdx];

  const [isPaused, setIsPaused] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [hasKey, setHasKey] = useState(!currentLevel.hasKey);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [movesCount, setMovesCount] = useState(0);
  const [xpEarnedTotal, setXpEarnedTotal] = useState(0);
  const [musicOn, setMusicOn] = useState(isMusicEnabled());
  const [sfxOn, setSfxOn] = useState(isSfxEnabled());

  // Grid coordinates for player
  const playerPosRef = useRef({ x: 1, y: 1 });
  const targetWorldPosRef = useRef(new THREE.Vector3(0, 0.5, 0));
  const playerMeshRef = useRef<THREE.Group | null>(null);
  const keyMeshRef = useRef<THREE.Mesh | null>(null);
  const exitGateMeshRef = useRef<THREE.Mesh | null>(null);

  // Timer
  useEffect(() => {
    startGameMusic();
    const startResult = awardGameXp(2, "Maze Started", "maze", { isStart: true });
    if (startResult.xpAwarded > 0) {
      setXpEarnedTotal(startResult.xpAwarded);
    }

    const timer = setInterval(() => {
      if (!isPaused && !isVictory) {
        setSecondsElapsed((s) => s + 1);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      stopGameMusic();
    };
  }, [currentLevelIdx, isPaused, isVictory]);

  // Three.js Maze Renderer
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060814, 0.04);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 11, 8.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x060814, 1);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xd4af37, 2);
    dirLight.position.set(5, 15, 7);
    scene.add(dirLight);

    const grid = currentLevel.grid;
    const rows = grid.length;
    const cols = grid[0].length;
    const cellSize = 1.6;

    const offsetX = -((cols - 1) * cellSize) / 2;
    const offsetZ = -((rows - 1) * cellSize) / 2;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(cols * cellSize + 4, rows * cellSize + 4);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f26,
      roughness: 0.4,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Build Walls, Exit, Key, and find Start
    const wallGeo = new THREE.BoxGeometry(cellSize, 1.2, cellSize);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x221244,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x4a0e4e,
      emissiveIntensity: 0.25,
      wireframe: false,
    });

    let startCell = { x: 1, y: 1 };
    let exitCell = { x: 1, y: 1 };
    let keyCell: { x: number; y: number } | null = null;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = grid[r][c];
        const wx = offsetX + c * cellSize;
        const wz = offsetZ + r * cellSize;

        if (val === 1) {
          const wall = new THREE.Mesh(wallGeo, wallMat);
          wall.position.set(wx, 0.6, wz);
          scene.add(wall);
        } else if (val === 2) {
          startCell = { x: c, y: r };
        } else if (val === 3) {
          exitCell = { x: c, y: r };
        } else if (val === 4) {
          keyCell = { x: c, y: r };
        }
      }
    }

    playerPosRef.current = startCell;
    const initialWorldX = offsetX + startCell.x * cellSize;
    const initialWorldZ = offsetZ + startCell.y * cellSize;
    targetWorldPosRef.current.set(initialWorldX, 0.45, initialWorldZ);

    // Player Mesh (Luminous Orb + Ring)
    const playerGroup = new THREE.Group();
    const orbGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00aacc,
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.1,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    playerGroup.add(orb);

    const playerRingGeo = new THREE.TorusGeometry(0.55, 0.025, 8, 24);
    const playerRingMat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
    const pRing = new THREE.Mesh(playerRingGeo, playerRingMat);
    pRing.rotation.x = Math.PI / 3;
    playerGroup.add(pRing);

    playerGroup.position.copy(targetWorldPosRef.current);
    scene.add(playerGroup);
    playerMeshRef.current = playerGroup;

    // Exit Portal (Golden vortex column)
    const exitWx = offsetX + exitCell.x * cellSize;
    const exitWz = offsetZ + exitCell.y * cellSize;

    const exitGeo = new THREE.CylinderGeometry(0.45, 0.45, 1.4, 16);
    const exitMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      emissive: 0xb8860b,
      emissiveIntensity: 0.8,
      wireframe: true,
    });
    const exitMesh = new THREE.Mesh(exitGeo, exitMat);
    exitMesh.position.set(exitWx, 0.7, exitWz);
    scene.add(exitMesh);
    exitGateMeshRef.current = exitMesh;

    // Key Mesh (if level has key)
    if (keyCell) {
      const keyWx = offsetX + keyCell.x * cellSize;
      const keyWz = offsetZ + keyCell.y * cellSize;
      const kGeo = new THREE.OctahedronGeometry(0.35, 0);
      const kMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xd4af37,
        emissiveIntensity: 1,
      });
      const kMesh = new THREE.Mesh(kGeo, kMat);
      kMesh.position.set(keyWx, 0.5, keyWz);
      scene.add(kMesh);
      keyMeshRef.current = kMesh;
    }

    // Animation Loop
    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth move player mesh to target position
      playerGroup.position.lerp(targetWorldPosRef.current, delta * 14);
      orb.rotation.y += delta * 2;
      pRing.rotation.z += delta * 3;

      // Smoothly follow player with camera
      camera.position.x = playerGroup.position.x;
      camera.position.z = playerGroup.position.z + 5.5;
      camera.lookAt(playerGroup.position.x, 0.4, playerGroup.position.z - 0.5);

      // Rotate Exit and Key
      exitMesh.rotation.y += delta * 1.5;
      if (keyMeshRef.current && keyMeshRef.current.visible) {
        keyMeshRef.current.rotation.y += delta * 3;
        keyMeshRef.current.position.y = 0.5 + Math.sin(elapsed * 4) * 0.1;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
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
  }, [currentLevelIdx]);

  // Movement Logic
  const tryMove = (dx: number, dy: number) => {
    if (isPaused || isVictory) return;

    const grid = currentLevel.grid;
    const nextX = playerPosRef.current.x + dx;
    const nextY = playerPosRef.current.y + dy;

    // Check bounds & wall
    if (
      nextY < 0 ||
      nextY >= grid.length ||
      nextX < 0 ||
      nextX >= grid[0].length ||
      grid[nextY][nextX] === 1
    ) {
      return; // Blocked by wall
    }

    // Step allowed
    playerPosRef.current = { x: nextX, y: nextY };
    setMovesCount((m) => m + 1);

    const cellSize = 1.6;
    const offsetX = -((grid[0].length - 1) * cellSize) / 2;
    const offsetZ = -((grid.length - 1) * cellSize) / 2;

    targetWorldPosRef.current.set(
      offsetX + nextX * cellSize,
      0.45,
      offsetZ + nextY * cellSize
    );

    const cellValue = grid[nextY][nextX];

    // Check Key Pickup
    if (cellValue === 4 && !hasKey) {
      setHasKey(true);
      if (keyMeshRef.current) {
        keyMeshRef.current.visible = false;
      }
      playCollectXpSound(true);
      const keyXp = awardGameXp(10, "Maze Key Decrypted", "maze");
      setXpEarnedTotal((prev) => prev + keyXp.xpAwarded);
    }

    // Check Exit Portal
    if (cellValue === 3) {
      if (currentLevel.hasKey && !hasKey) {
        // Need key!
        return;
      }

      // Victory!
      handleVictory();
    }
  };

  const handleVictory = () => {
    setIsVictory(true);
    playLevelCompleteSound();
    playWinSound();

    const xpForLevel = currentLevel.xpReward;
    const result = awardGameXp(xpForLevel, `Maze Level ${currentLevel.level} Solved`, "maze", {
      isCompletion: true,
      mazeLevel: currentLevel.level,
      mazeTime: secondsElapsed,
    });

    setXpEarnedTotal((prev) => prev + result.xpAwarded);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") tryMove(0, -1);
      else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") tryMove(0, 1);
      else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") tryMove(-1, 0);
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") tryMove(1, 0);
      else if (e.key === "Escape" || e.key === "p") setIsPaused((p) => !p);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasKey, isPaused, isVictory]);

  const handleNextLevel = () => {
    if (currentLevelIdx < MAZE_LEVELS.length - 1) {
      setCurrentLevelIdx((prev) => prev + 1);
      setHasKey(!MAZE_LEVELS[currentLevelIdx + 1].hasKey);
      setMovesCount(0);
      setSecondsElapsed(0);
      setIsVictory(false);
      setIsPaused(false);
    } else {
      // Completed all levels!
      onExit();
    }
  };

  const handleRestartLevel = () => {
    setHasKey(!currentLevel.hasKey);
    setMovesCount(0);
    setSecondsElapsed(0);
    setIsVictory(false);
    setIsPaused(false);
    if (keyMeshRef.current) {
      keyMeshRef.current.visible = true;
    }
  };

  return (
    <div className="relative w-full h-[85vh] max-h-[750px] bg-[#060814] rounded-3xl overflow-hidden select-none border border-[#D4AF37]/30 shadow-2xl">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2">
          {/* Level Info */}
          <div className="px-3 py-1.5 rounded-2xl bg-black/65 backdrop-blur-md border border-white/10 text-white flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#D4AF37]">LVL {currentLevel.level}:</span>
            <span className="text-xs font-bold truncate max-w-[120px] sm:max-w-none">
              {currentLevel.title}
            </span>
          </div>

          {/* Time & Moves */}
          <div className="px-3 py-1.5 rounded-2xl bg-black/65 backdrop-blur-md border border-white/10 text-zinc-300 text-xs font-mono">
            ⏱ {secondsElapsed}s · {movesCount} steps
          </div>

          {/* Key indicator if level requires it */}
          {currentLevel.hasKey && (
            <div
              className={`px-2.5 py-1.5 rounded-2xl backdrop-blur-md border text-xs font-bold flex items-center gap-1 ${
                hasKey
                  ? "bg-amber-500/20 border-amber-400 text-amber-300"
                  : "bg-black/60 border-white/10 text-zinc-500"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{hasKey ? "Key Found" : "Find Key"}</span>
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
            {musicOn ? <Volume2 className="w-4 h-4 text-[#D4AF37]" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          <button
            onClick={() => setIsPaused(true)}
            className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-zinc-300 flex items-center justify-center cursor-pointer transition-colors"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Onscreen Virtual 4-Way D-Pad for Mobile */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-auto z-20">
        <button
          onClick={() => tryMove(0, -1)}
          className="w-14 h-14 rounded-2xl bg-black/75 active:bg-[#D4AF37]/35 border border-white/20 active:border-[#D4AF37] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
          aria-label="Up"
        >
          <ChevronUp className="w-8 h-8 text-[#D4AF37]" />
        </button>

        <div className="flex items-center gap-4">
          <button
            onClick={() => tryMove(-1, 0)}
            className="w-14 h-14 rounded-2xl bg-black/75 active:bg-[#D4AF37]/35 border border-white/20 active:border-[#D4AF37] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
            aria-label="Left"
          >
            <ChevronLeft className="w-8 h-8 text-[#D4AF37]" />
          </button>

          <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
          </div>

          <button
            onClick={() => tryMove(1, 0)}
            className="w-14 h-14 rounded-2xl bg-black/75 active:bg-[#D4AF37]/35 border border-white/20 active:border-[#D4AF37] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
            aria-label="Right"
          >
            <ChevronRight className="w-8 h-8 text-[#D4AF37]" />
          </button>
        </div>

        <button
          onClick={() => tryMove(0, 1)}
          className="w-14 h-14 rounded-2xl bg-black/75 active:bg-[#D4AF37]/35 border border-white/20 active:border-[#D4AF37] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
          aria-label="Down"
        >
          <ChevronDown className="w-8 h-8 text-[#D4AF37]" />
        </button>
      </div>

      {/* Pause Menu Modal */}
      <GamePauseModal
        isOpen={isPaused}
        isMusicOn={musicOn}
        isSfxOn={sfxOn}
        onResume={() => setIsPaused(false)}
        onRestart={handleRestartLevel}
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

      {/* Victory Modal */}
      <GameVictoryModal
        isOpen={isVictory}
        title="MAZE SOLVED!"
        subtitle={`Level ${currentLevel.level} completed with clarity.`}
        statsLabel="Time & Moves"
        statsValue={`${secondsElapsed}s · ${movesCount} steps`}
        xpEarned={currentLevel.xpReward}
        hasNextLevel={currentLevelIdx < MAZE_LEVELS.length - 1}
        onNextLevel={handleNextLevel}
        onPlayAgain={handleRestartLevel}
        onExit={onExit}
      />
    </div>
  );
};
