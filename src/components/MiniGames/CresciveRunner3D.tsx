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
  playJumpSound,
  playLaneSwitchSound,
  playLoseSound,
} from "../../utils/gameAudio";
import {
  getStoredGameStats,
  awardGameXp,
} from "../../utils/gamesStorage";
import { GamePauseModal } from "./GamePauseModal";
import { GameOverModal } from "./GameOverModal";
import {
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Sparkles,
} from "lucide-react";

interface CresciveRunner3DProps {
  onExit: () => void;
}

const LANES = [-2.2, 0, 2.2]; // Left, Center, Right lanes in 3D world units

export const CresciveRunner3D: React.FC<CresciveRunner3DProps> = ({ onExit }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // UI States
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [xpEarnedInRun, setXpEarnedInRun] = useState(0);
  const [tokensCollected, setTokensCollected] = useState(0);
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false);
  const [musicOn, setMusicOn] = useState(isMusicEnabled());
  const [sfxOn, setSfxOn] = useState(isSfxEnabled());
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Stats
  const initialStats = getStoredGameStats();
  const [bestDistance, setBestDistance] = useState(initialStats.runnerBestDistance);

  // Mutable Game Loop State
  const gameState = useRef({
    currentLane: 1, // 0 = Left, 1 = Center, 2 = Right
    targetX: 0,
    playerY: 0.6,
    isJumping: false,
    jumpVelocity: 0,
    gravity: -28,
    speed: 18,
    distanceTraveled: 0,
    tokensCount: 0,
    obstacles: [] as THREE.Mesh[],
    tokens: [] as THREE.Mesh[],
    scenery: [] as THREE.Mesh[],
    isDead: false,
    active: true,
  });

  // Start music and award start XP (+2 XP, capped at 5 per day)
  useEffect(() => {
    startGameMusic();
    const startResult = awardGameXp(2, "Game Started", "runner", { isStart: true });
    if (startResult.xpAwarded > 0) {
      setXpEarnedInRun(startResult.xpAwarded);
    }

    return () => {
      stopGameMusic();
    };
  }, []);

  // Three.js Scene Setup & Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.02);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 150);
    camera.position.set(0, 3.8, 6.2);
    camera.lookAt(0, 1.2, -8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x050510, 1);
    container.appendChild(renderer.domElement);

    // Ambient and Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xd4af37, 2.2);
    dirLight.position.set(5, 12, 8);
    scene.add(dirLight);

    const backNeon = new THREE.PointLight(0x00e5ff, 3, 25);
    backNeon.position.set(0, 4, -10);
    scene.add(backNeon);

    // 1. Futuristic Cyber Highway Grid Floor
    const trackWidth = 8;
    const trackLength = 160;
    const trackGeo = new THREE.PlaneGeometry(trackWidth, trackLength, 12, 40);
    const trackMat = new THREE.MeshStandardMaterial({
      color: 0x070b19,
      roughness: 0.3,
      metalness: 0.85,
    });
    const track = new THREE.Mesh(trackGeo, trackMat);
    track.rotation.x = -Math.PI / 2;
    track.position.z = -trackLength / 2 + 10;
    scene.add(track);

    // Neon Track Border Rails
    const railGeo = new THREE.BoxGeometry(0.18, 0.4, trackLength);
    const railMat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-trackWidth / 2, 0.2, -trackLength / 2 + 10);
    scene.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(trackWidth / 2, 0.2, -trackLength / 2 + 10);
    scene.add(rightRail);

    // Lane dividing dashed neon strips
    for (let laneIdx of [-1.1, 1.1]) {
      const lineGeo = new THREE.BoxGeometry(0.08, 0.05, trackLength);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true });
      const laneLine = new THREE.Mesh(lineGeo, lineMat);
      laneLine.position.set(laneIdx, 0.03, -trackLength / 2 + 10);
      scene.add(laneLine);
    }

    // 2. Player Avatar (Glowing Golden Cyber Core + Orbiting Energy Shields)
    const playerGroup = new THREE.Group();
    const playerCoreGeo = new THREE.IcosahedronGeometry(0.55, 2);
    const playerCoreMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      emissive: 0xb8860b,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.1,
    });
    const playerCore = new THREE.Mesh(playerCoreGeo, playerCoreMat);
    playerGroup.add(playerCore);

    // Orbit Ring
    const playerRingGeo = new THREE.TorusGeometry(0.85, 0.035, 8, 32);
    const playerRingMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const playerRing = new THREE.Mesh(playerRingGeo, playerRingMat);
    playerRing.rotation.x = Math.PI / 3;
    playerGroup.add(playerRing);

    playerGroup.position.set(0, 0.6, 0);
    scene.add(playerGroup);

    // 3. Futuristic Horizon Monoliths (Distant cyber pillars)
    const sceneryList: THREE.Mesh[] = [];
    const pillarGeo = new THREE.BoxGeometry(2.5, 30, 2.5);
    for (let i = 0; i < 16; i++) {
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x0c0f24,
        roughness: 0.4,
        metalness: 0.9,
        wireframe: i % 3 === 0,
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      const side = i % 2 === 0 ? -1 : 1;
      pillar.position.set(
        side * (7.5 + Math.random() * 8),
        10,
        -15 - i * 9
      );
      scene.add(pillar);
      sceneryList.push(pillar);
    }
    gameState.current.scenery = sceneryList;

    // 4. Object Pools for Obstacles & Tokens
    const obstacles: THREE.Mesh[] = [];
    const tokens: THREE.Mesh[] = [];

    const obstacleGeo = new THREE.BoxGeometry(1.6, 1.2, 0.8);
    const obstacleMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0x990033,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.7,
    });

    const tokenGeo = new THREE.OctahedronGeometry(0.4, 0);
    const tokenMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xd4af37,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
    });

    // Spawn initial pool
    for (let i = 0; i < 8; i++) {
      const obs = new THREE.Mesh(obstacleGeo, obstacleMat);
      obs.position.set(0, -50, 0);
      scene.add(obs);
      obstacles.push(obs);
    }

    for (let i = 0; i < 12; i++) {
      const tok = new THREE.Mesh(tokenGeo, tokenMat);
      tok.position.set(0, -50, 0);
      scene.add(tok);
      tokens.push(tok);
    }

    gameState.current.obstacles = obstacles;
    gameState.current.tokens = tokens;

    let spawnTimer = 0;
    let clock = new THREE.Clock();
    let reqId: number;

    // Next spawn distance
    let nextSpawnZ = -30;

    const spawnWave = (atZ: number) => {
      // Pick random lanes
      const availableLanes = [0, 1, 2];
      const obstacleLane = availableLanes.splice(
        Math.floor(Math.random() * availableLanes.length),
        1
      )[0];

      // Spawn obstacle
      const inactiveObs = obstacles.find((o) => o.position.y < 0);
      if (inactiveObs) {
        inactiveObs.position.set(LANES[obstacleLane], 0.6, atZ);
      }

      // Spawn token in one of the other lanes
      const tokenLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
      const inactiveTok = tokens.find((t) => t.position.y < 0);
      if (inactiveTok) {
        inactiveTok.position.set(LANES[tokenLane], 0.7, atZ + (Math.random() * 6 - 3));
      }
    };

    // Pre-seed first few waves
    for (let z = -25; z >= -80; z -= 16) {
      spawnWave(z);
      nextSpawnZ = z - 16;
    }

    // MAIN ANIMATION LOOP
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      if (isPaused || gameState.current.isDead || !gameState.current.active) {
        return;
      }

      const delta = Math.min(clock.getDelta(), 0.05);

      // Gradually increase speed as distance builds up
      const currentSpeed = gameState.current.speed + gameState.current.distanceTraveled * 0.015;
      const moveStep = currentSpeed * delta;

      gameState.current.distanceTraveled += moveStep;
      const currentDistInt = Math.floor(gameState.current.distanceTraveled);
      setDistance(currentDistInt);
      setScore(currentDistInt * 2 + gameState.current.tokensCount * 25);
      setSpeedMultiplier(parseFloat((currentSpeed / 18).toFixed(1)));

      // Handle Lane horizontal lerping
      const targetLaneX = LANES[gameState.current.currentLane];
      gameState.current.targetX = targetLaneX;
      playerGroup.position.x += (targetLaneX - playerGroup.position.x) * (delta * 16);

      // Handle Jumping physics
      if (gameState.current.isJumping) {
        gameState.current.jumpVelocity += gameState.current.gravity * delta;
        gameState.current.playerY += gameState.current.jumpVelocity * delta;

        if (gameState.current.playerY <= 0.6) {
          gameState.current.playerY = 0.6;
          gameState.current.isJumping = false;
          gameState.current.jumpVelocity = 0;
        }
      }
      playerGroup.position.y = gameState.current.playerY;

      // Player rotation animation
      playerRing.rotation.y += delta * 4;
      playerCore.rotation.x += delta * 2;
      playerCore.rotation.y += delta * 3;

      // Move Scenery
      sceneryList.forEach((pillar) => {
        pillar.position.z += moveStep;
        if (pillar.position.z > 15) {
          pillar.position.z -= 144;
        }
      });

      // Move and check Obstacles
      obstacles.forEach((obs) => {
        if (obs.position.y > 0) {
          obs.position.z += moveStep;

          // Collision Detection with Player
          const dx = Math.abs(obs.position.x - playerGroup.position.x);
          const dz = Math.abs(obs.position.z - playerGroup.position.z);
          const dy = Math.abs(obs.position.y - playerGroup.position.y);

          // Hit box
          if (dx < 1.0 && dz < 0.9 && dy < 0.85) {
            // Collision Triggered!
            handleCrash();
          }

          // Recycle
          if (obs.position.z > 8) {
            obs.position.set(0, -50, 0);
          }
        }
      });

      // Move and check Tokens
      tokens.forEach((tok) => {
        if (tok.position.y > 0) {
          tok.position.z += moveStep;
          tok.rotation.y += delta * 3;
          tok.rotation.x += delta * 2;

          // Token collection check
          const dx = Math.abs(tok.position.x - playerGroup.position.x);
          const dz = Math.abs(tok.position.z - playerGroup.position.z);
          const dy = Math.abs(tok.position.y - playerGroup.position.y);

          if (dx < 0.9 && dz < 0.9 && dy < 1.2) {
            // Collected!
            tok.position.set(0, -50, 0);
            gameState.current.tokensCount++;
            setTokensCollected(gameState.current.tokensCount);
            playCollectXpSound(false);

            // Award immediate +1 XP per token collected
            const xpRes = awardGameXp(1, "XP Token Collected", "runner");
            setXpEarnedInRun((prev) => prev + xpRes.xpAwarded);
          }

          // Recycle
          if (tok.position.z > 8) {
            tok.position.set(0, -50, 0);
          }
        }
      });

      // Spawn next waves dynamically
      if (nextSpawnZ > -100) {
        spawnWave(nextSpawnZ);
        nextSpawnZ -= 16 + Math.random() * 8;
      } else {
        nextSpawnZ += moveStep;
      }

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

  // Controls Handlers
  const moveLeft = () => {
    if (gameState.current.isDead || isPaused) return;
    if (gameState.current.currentLane > 0) {
      gameState.current.currentLane--;
      playLaneSwitchSound();
    }
  };

  const moveRight = () => {
    if (gameState.current.isDead || isPaused) return;
    if (gameState.current.currentLane < LANES.length - 1) {
      gameState.current.currentLane++;
      playLaneSwitchSound();
    }
  };

  const jump = () => {
    if (gameState.current.isDead || isPaused) return;
    if (!gameState.current.isJumping) {
      gameState.current.isJumping = true;
      gameState.current.jumpVelocity = 11.5;
      playJumpSound();
    }
  };

  // Keyboard navigation for desktop testing & accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        moveLeft();
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        moveRight();
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        jump();
      } else if (e.key === "Escape" || e.key === "p") {
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Touch & Swipe Handlers
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 25) {
      if (absX > absY) {
        if (dx > 0) moveRight();
        else moveLeft();
      } else {
        if (dy < 0) jump();
      }
    }
    touchStartRef.current = null;
  };

  const handleCrash = () => {
    if (gameState.current.isDead) return;
    gameState.current.isDead = true;
    playLoseSound();
    stopGameMusic();

    const finalDistance = Math.floor(gameState.current.distanceTraveled);
    const finalScore = finalDistance * 2 + gameState.current.tokensCount * 25;

    // Calculate completion XP reward
    let bonusXp = 5; // Base run completion XP
    if (finalDistance >= 250) bonusXp += 15;
    if (finalDistance >= 600) bonusXp += 25;
    if (finalDistance >= 1000) bonusXp += 40;

    const result = awardGameXp(bonusXp, "Runner Distance Completed", "runner", {
      isCompletion: true,
      runnerDistance: finalDistance,
      runnerScore: finalScore,
    });

    setXpEarnedInRun((prev) => prev + result.xpAwarded);
    setIsNewPersonalBest(result.isPersonalBest);
    setIsGameOver(true);
  };

  const handleRestart = () => {
    gameState.current.currentLane = 1;
    gameState.current.playerY = 0.6;
    gameState.current.isJumping = false;
    gameState.current.jumpVelocity = 0;
    gameState.current.speed = 18;
    gameState.current.distanceTraveled = 0;
    gameState.current.tokensCount = 0;
    gameState.current.isDead = false;

    // Reset positions
    gameState.current.obstacles.forEach((o) => o.position.set(0, -50, 0));
    gameState.current.tokens.forEach((t) => t.position.set(0, -50, 0));

    setScore(0);
    setDistance(0);
    setTokensCollected(0);
    setIsPaused(false);
    setIsGameOver(false);
    setIsNewPersonalBest(false);

    if (musicOn) {
      startGameMusic();
    }
  };

  return (
    <div
      className="relative w-full h-[85vh] max-h-[750px] bg-[#050510] rounded-3xl overflow-hidden select-none border border-[#D4AF37]/30 shadow-2xl"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top HUD Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2">
          {/* Distance & Score */}
          <div className="px-3 py-1.5 rounded-2xl bg-black/65 backdrop-blur-md border border-white/10 text-white flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#D4AF37]">DIST:</span>
            <span className="text-sm font-bold font-mono">{distance}m</span>
          </div>

          <div className="px-3 py-1.5 rounded-2xl bg-black/65 backdrop-blur-md border border-amber-300/30 text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-xs font-bold font-mono">+{tokensCollected} XP</span>
          </div>

          <div className="px-2 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-400 hidden sm:block">
            {speedMultiplier}x SPD
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => {
              const next = !musicOn;
              setMusicOn(next);
              setMusicEnabled(next);
            }}
            className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-zinc-300 flex items-center justify-center cursor-pointer transition-colors"
            title="Toggle Music"
          >
            {musicOn ? <Volume2 className="w-4 h-4 text-[#D4AF37]" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          <button
            onClick={() => setIsPaused(true)}
            className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-zinc-300 flex items-center justify-center cursor-pointer transition-colors"
            title="Pause Game"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Onscreen Mobile Touch Controls Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 pointer-events-auto z-20">
        {/* Left & Right Lane Shift Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={moveLeft}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/70 active:bg-[#D4AF37]/30 border border-white/20 active:border-[#D4AF37] text-white flex items-center justify-center backdrop-blur-md shadow-lg active:scale-95 transition-all cursor-pointer"
            aria-label="Move Left"
          >
            <ChevronLeft className="w-8 h-8 text-[#D4AF37]" />
          </button>

          <button
            onClick={moveRight}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/70 active:bg-[#D4AF37]/30 border border-white/20 active:border-[#D4AF37] text-white flex items-center justify-center backdrop-blur-md shadow-lg active:scale-95 transition-all cursor-pointer"
            aria-label="Move Right"
          >
            <ChevronRight className="w-8 h-8 text-[#D4AF37]" />
          </button>
        </div>

        {/* Jump Button */}
        <button
          onClick={jump}
          className="w-16 h-16 sm:w-20 sm:h-16 rounded-2xl gold-gradient-bg text-black active:scale-95 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.4)] backdrop-blur-md font-bold text-xs transition-all cursor-pointer"
          aria-label="Jump"
        >
          <ArrowUp className="w-6 h-6 stroke-[3]" />
          <span className="text-[10px] font-mono tracking-widest mt-[-2px]">JUMP</span>
        </button>
      </div>

      {/* Pause Menu Modal */}
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

      {/* Game Over Screen */}
      <GameOverModal
        isOpen={isGameOver}
        score={distance}
        xpEarned={xpEarnedInRun}
        bestScore={bestDistance}
        isNewPersonalBest={isNewPersonalBest}
        scoreUnit="m"
        onPlayAgain={handleRestart}
        onExit={onExit}
      />
    </div>
  );
};
