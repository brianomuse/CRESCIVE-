import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "motion/react";
import { LifeCategory, MoveItem, UserProfile } from "../../types";
import { CRESCIVE_CATEGORIES } from "../../data/categories";
import {
  CONSTELLATION_NODE_POSITIONS,
  CONSTELLATION_CONNECTIONS,
} from "./constellationData";
import { CategoryIcon } from "../CategoryIcon";
import {
  Sparkles,
  Plus,
  Play,
  RotateCcw,
  X,
  Compass,
  ArrowRight,
  Zap,
  CheckCircle2,
  Maximize2,
  HelpCircle,
} from "lucide-react";

interface CelestialConstellation3DProps {
  moves: MoveItem[];
  userProfile?: UserProfile | null;
  userLevel?: number;
  onOpenCreateMoveForDomain: (domainTitle: string) => void;
  onStartFocusSession?: (move: MoveItem | null, customDuration?: number) => void;
  selectedCategory: LifeCategory | null;
  onSelectCategory: (category: LifeCategory | null) => void;
}

/**
 * Procedural texture generator for celestial glow halos.
 * Cached to prevent recreating canvas elements.
 */
function createGlowTexture(colorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, colorHex);
    gradient.addColorStop(0.35, colorHex);
    gradient.addColorStop(0.7, colorHex.replace(")", ", 0.25)").replace("rgb", "rgba"));
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export const CelestialConstellation3D: React.FC<CelestialConstellation3DProps> = ({
  moves,
  userProfile,
  userLevel = 1,
  onOpenCreateMoveForDomain,
  onStartFocusSession,
  selectedCategory,
  onSelectCategory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Interaction instructions banner state
  const [showHint, setShowHint] = useState(true);

  // Scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const nodeMeshMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const raycasterRef = useRef(new THREE.Raycaster());

  // Orbit / interaction state refs
  const isPointerDownRef = useRef(false);
  const pointerStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerDeltaRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);

  // Camera spherical angles
  const rotYRef = useRef(0.3);
  const rotXRef = useRef(0.2);
  const targetRotYRef = useRef(0.3);
  const targetRotXRef = useRef(0.2);
  const distanceRef = useRef(32);
  const targetDistanceRef = useRef(32);
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAtRef = useRef(new THREE.Vector3(0, 0, 0));

  // Dynamic metrics per category
  const categoryMetrics = useMemo(() => {
    const map = new Map<string, { totalMoves: number; completedMoves: number }>();
    CRESCIVE_CATEGORIES.forEach((cat) => {
      const catMoves = moves.filter((m) => m.domain === cat.title);
      map.set(cat.id, {
        totalMoves: catMoves.length,
        completedMoves: catMoves.filter((m) => m.completed).length,
      });
    });
    return map;
  }, [moves]);

  // Handle camera focus to selected node
  useEffect(() => {
    if (selectedCategory) {
      const pos = CONSTELLATION_NODE_POSITIONS[selectedCategory.id];
      if (pos) {
        targetLookAtRef.current.set(pos[0] * 0.4, pos[1] * 0.4, pos[2] * 0.4);
        targetDistanceRef.current = 24; // Zoom gently in
      }
    } else {
      targetLookAtRef.current.set(0, 0, 0);
      targetDistanceRef.current = 32;
    }
  }, [selectedCategory]);

  // Main Three.js Initialization & Render Loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 520;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.015);
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(0, 8, 32);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer with capped pixel ratio for buttery 60 FPS
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x050510, 1);
    rendererRef.current = renderer;

    // 4. Subtle ambient lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const centerGlow = new THREE.PointLight(0xd4af37, 1.2, 50);
    centerGlow.position.set(0, 0, 0);
    scene.add(centerGlow);

    // 5. Starfield & Cosmic Dust (Single Batched Points Geometry)
    const particleCount = Math.min(450, 200 + userLevel * 25);
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const goldColor = new THREE.Color("#D4AF37");
    const cyanColor = new THREE.Color("#06B6D4");
    const whiteColor = new THREE.Color("#FFFFFF");

    for (let i = 0; i < particleCount; i++) {
      const radius = 15 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePos[i * 3 + 2] = radius * Math.cos(phi);

      const colorMix = Math.random();
      const chosenColor = colorMix > 0.6 ? goldColor : colorMix > 0.3 ? cyanColor : whiteColor;
      particleColors[i * 3] = chosenColor.r;
      particleColors[i * 3 + 1] = chosenColor.g;
      particleColors[i * 3 + 2] = chosenColor.b;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const starField = new THREE.Points(particleGeo, particleMat);
    scene.add(starField);

    // 6. Batched Luminous Connections (LineSegments with vertex colors)
    const connectionPositions: number[] = [];
    const connectionColors: number[] = [];

    CONSTELLATION_CONNECTIONS.forEach((conn) => {
      const sourcePos = CONSTELLATION_NODE_POSITIONS[conn.from];
      const targetPos = CONSTELLATION_NODE_POSITIONS[conn.to];
      const sourceCat = CRESCIVE_CATEGORIES.find((c) => c.id === conn.from);
      const targetCat = CRESCIVE_CATEGORIES.find((c) => c.id === conn.to);

      if (sourcePos && targetPos && sourceCat && targetCat) {
        connectionPositions.push(sourcePos[0], sourcePos[1], sourcePos[2]);
        connectionPositions.push(targetPos[0], targetPos[1], targetPos[2]);

        const c1 = new THREE.Color(sourceCat.color);
        const c2 = new THREE.Color(targetCat.color);

        connectionColors.push(c1.r, c1.g, c1.b);
        connectionColors.push(c2.r, c2.g, c2.b);
      }
    });

    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(connectionPositions, 3)
    );
    linesGeo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(connectionColors, 3)
    );

    const linesMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const connectionLines = new THREE.LineSegments(linesGeo, linesMat);
    scene.add(connectionLines);

    // 7. Celestial Nodes Setup (15 Life Dimensions)
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);
    nodeMeshMapRef.current.clear();

    const sharedSphereGeo = new THREE.SphereGeometry(0.85, 16, 16);
    const sharedRingGeo = new THREE.RingGeometry(1.2, 1.35, 32);

    CRESCIVE_CATEGORIES.forEach((cat) => {
      const pos = CONSTELLATION_NODE_POSITIONS[cat.id];
      if (!pos) return;

      const metrics = categoryMetrics.get(cat.id) || { totalMoves: 0, completedMoves: 0 };
      const hasProgress = metrics.completedMoves > 0;
      const hasMoves = metrics.totalMoves > 0;

      const catGroup = new THREE.Group();
      catGroup.position.set(pos[0], pos[1], pos[2]);
      catGroup.userData = { categoryId: cat.id, category: cat };

      // Core luminous sphere
      const sphereMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(cat.color),
      });
      const coreSphere = new THREE.Mesh(sharedSphereGeo, sphereMat);
      catGroup.add(coreSphere);

      // Procedural soft aura sprite
      const glowTex = createGlowTexture(cat.color);
      const spriteMat = new THREE.SpriteMaterial({
        map: glowTex,
        color: new THREE.Color(cat.color),
        transparent: true,
        opacity: hasProgress ? 0.85 : hasMoves ? 0.65 : 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const auraSprite = new THREE.Sprite(spriteMat);
      const auraScale = hasProgress ? 4.2 : hasMoves ? 3.5 : 2.8;
      auraSprite.scale.set(auraScale, auraScale, 1);
      catGroup.add(auraSprite);

      // Orbit ring for active nodes
      if (hasMoves) {
        const ringMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(cat.color),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
        });
        const ringMesh = new THREE.Mesh(sharedRingGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 3;
        catGroup.add(ringMesh);
      }

      nodeGroup.add(catGroup);
      nodeMeshMapRef.current.set(cat.id, catGroup);
    });

    // 8. Animation & Render Loop with Smart Frame Throttling
    let clock = new THREE.Clock();
    let isVisible = true;

    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (!isVisible) return; // Smart frame pausing when inactive

      const elapsedTime = clock.getElapsedTime();

      // Smooth camera interpolation (inertial damping)
      rotYRef.current += (targetRotYRef.current - rotYRef.current) * 0.08;
      rotXRef.current += (targetRotXRef.current - rotXRef.current) * 0.08;
      distanceRef.current += (targetDistanceRef.current - distanceRef.current) * 0.08;

      currentLookAtRef.current.lerp(targetLookAtRef.current, 0.06);

      const cx =
        distanceRef.current *
        Math.sin(rotYRef.current) *
        Math.cos(rotXRef.current);
      const cy = distanceRef.current * Math.sin(rotXRef.current);
      const cz =
        distanceRef.current *
        Math.cos(rotYRef.current) *
        Math.cos(rotXRef.current);

      camera.position.set(
        cx + currentLookAtRef.current.x,
        cy + currentLookAtRef.current.y,
        cz + currentLookAtRef.current.z
      );
      camera.lookAt(currentLookAtRef.current);

      // Subtle celestial rotation of background dust
      starField.rotation.y = elapsedTime * 0.015;
      starField.rotation.x = Math.sin(elapsedTime * 0.01) * 0.05;

      // Gentle breathing pulse for nodes
      nodeGroup.children.forEach((obj, idx) => {
        const pulse = 1 + Math.sin(elapsedTime * 1.5 + idx * 0.7) * 0.08;
        obj.scale.set(pulse, pulse, pulse);
      });

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const newW = entry.contentRect.width || 320;
        const newH = entry.contentRect.height || 520;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    });
    resizeObserver.observe(container);

    // 10. Memory Cleanup on Unmount
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      resizeObserver.disconnect();

      // Dispose Geometries
      particleGeo.dispose();
      linesGeo.dispose();
      sharedSphereGeo.dispose();
      sharedRingGeo.dispose();

      // Dispose Materials
      particleMat.dispose();
      linesMat.dispose();

      // Dispose Scene
      scene.clear();
      renderer.dispose();
      nodeMeshMapRef.current.clear();
    };
  }, [categoryMetrics, userLevel]);

  // Smooth Pointer Drag and Pinch Interactions
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = true;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
    pointerDeltaRef.current = { x: 0, y: 0 };
    touchDistanceRef.current = null;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;

    const dx = e.clientX - pointerStartPosRef.current.x;
    const dy = e.clientY - pointerStartPosRef.current.y;

    pointerDeltaRef.current = {
      x: pointerDeltaRef.current.x + Math.abs(dx),
      y: pointerDeltaRef.current.y + Math.abs(dy),
    };

    // Orbit sensitivity
    const sensitivity = 0.006;
    targetRotYRef.current -= dx * sensitivity;
    targetRotXRef.current += dy * sensitivity;

    // Pitch angle limits (prevents flipping)
    targetRotXRef.current = Math.max(
      -Math.PI / 2.3,
      Math.min(Math.PI / 2.3, targetRotXRef.current)
    );

    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const totalDragDistance =
      pointerDeltaRef.current.x + pointerDeltaRef.current.y;
    isPointerDownRef.current = false;

    // Only raycast on genuine tap / click (not after dragging)
    if (totalDragDistance < 8) {
      performRaycast(e.clientX, e.clientY);
    }
  };

  // Touch handlers for smooth pinch-to-zoom on mobile
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );

      if (touchDistanceRef.current !== null) {
        const delta = touchDistanceRef.current - dist;
        targetDistanceRef.current = Math.max(
          16,
          Math.min(48, targetDistanceRef.current + delta * 0.06)
        );
      }
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
  };

  // Wheel zoom for desktop
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomStep = e.deltaY * 0.025;
    targetDistanceRef.current = Math.max(
      16,
      Math.min(48, targetDistanceRef.current + zoomStep)
    );
  };

  // Optimized Raycasting: executed strictly on tap/click
  const performRaycast = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!canvas || !camera || !scene) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), camera);

    // Test intersections with node groups
    const interactables: THREE.Object3D[] = [];
    nodeMeshMapRef.current.forEach((group) => {
      interactables.push(...group.children);
    });

    const intersects = raycasterRef.current.intersectObjects(interactables, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      // Find parent group with categoryId
      let curr: THREE.Object3D | null = hit.object;
      while (curr && !curr.userData.categoryId && curr.parent) {
        curr = curr.parent;
      }
      if (curr && curr.userData.category) {
        onSelectCategory(curr.userData.category);
        setShowHint(false);
      }
    } else {
      // Tap outside clears selected node
      onSelectCategory(null);
    }
  };

  // Reset view to default constellation overview
  const handleResetView = () => {
    targetRotYRef.current = 0.3;
    targetRotXRef.current = 0.2;
    targetDistanceRef.current = 32;
    targetLookAtRef.current.set(0, 0, 0);
    onSelectCategory(null);
  };

  // Selected category info
  const selectedCatMoves = useMemo(() => {
    if (!selectedCategory) return [];
    return moves.filter((m) => m.domain === selectedCategory.title);
  }, [selectedCategory, moves]);

  const selectedCompletedMoves = useMemo(() => {
    return selectedCatMoves.filter((m) => m.completed);
  }, [selectedCatMoves]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[520px] sm:h-[600px] rounded-3xl overflow-hidden border border-amber-300/20 bg-[#050510] shadow-[0_20px_50px_rgba(0,0,0,0.85)] select-none"
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        id="crescive-3d-constellation-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Top Header HUD overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="py-1 px-3 rounded-full bg-[#050510]/85 border border-[#D4AF37]/40 backdrop-blur-md flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase font-bold">
              3D CELESTIAL MAP
            </span>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-400">
            15 Dimensions · Level {userLevel}
          </span>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleResetView}
            className="p-2 rounded-xl bg-[#050510]/80 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-md"
            title="Reset Constellation View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interaction Hint (Fades out once tapped or dismissed) */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-[#050510]/90 border border-white/15 backdrop-blur-md flex items-center gap-2 text-[11px] text-zinc-300 pointer-events-auto shadow-xl"
          >
            <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Drag to rotate · Pinch to zoom · Tap any star node to inspect</span>
            <button
              onClick={() => setShowHint(false)}
              className="text-zinc-500 hover:text-white p-0.5 ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dimension Node Legend Pill (Top-right on larger screens) */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-[#050510]/85 border border-white/10 backdrop-blur-md pointer-events-none text-[10px] font-mono text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
          <span>Mind & Craft</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span>Wealth & Systems</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
          <span>Vitality</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
          <span>Values & Legacy</span>
        </div>
      </div>

      {/* FLOATING DETAIL INSPECTOR: Appears when a dimension star node is selected */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 sm:w-96 z-30 p-5 rounded-3xl bg-[#090918]/95 border border-amber-300/35 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.9),0_0_30px_rgba(212,175,55,0.2)] text-white"
          >
            {/* Header with Close */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center border shadow-inner shrink-0"
                  style={{
                    backgroundColor: `${selectedCategory.color}20`,
                    borderColor: `${selectedCategory.color}50`,
                  }}
                >
                  <CategoryIcon name={selectedCategory.iconName} className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#D4AF37] uppercase font-semibold">
                      DIMENSION 0{selectedCategory.number}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {selectedCatMoves.length} Moves
                    </span>
                  </div>
                  <h3 className="text-lg font-bold font-display text-white tracking-wide leading-tight">
                    {selectedCategory.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => onSelectCategory(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Deselect Node"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-zinc-300 mt-3 font-light leading-relaxed">
              {selectedCategory.description}
            </p>

            {/* Sub-Domains Chips */}
            <div className="mt-3 flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pt-1">
              {selectedCategory.subcategories.slice(0, 5).map((sub) => (
                <span
                  key={sub}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300"
                >
                  {sub}
                </span>
              ))}
              {selectedCategory.subcategories.length > 5 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md text-zinc-500">
                  +{selectedCategory.subcategories.length - 5} more
                </span>
              )}
            </div>

            {/* Connected Moves Status */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-mono text-[11px]">
                {selectedCompletedMoves.length} of {selectedCatMoves.length} completed
              </span>

              {selectedCatMoves.length > 0 && selectedCatMoves.some((m) => !m.completed) && onStartFocusSession && (
                <button
                  onClick={() => {
                    const firstActiveMove = selectedCatMoves.find((m) => !m.completed) || null;
                    onStartFocusSession(firstActiveMove);
                  }}
                  className="py-1 px-2.5 rounded-full bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-[#D4AF37] font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap className="w-3 h-3 text-[#D4AF37]" />
                  <span>Deep Work</span>
                </button>
              )}
            </div>

            {/* Action Button: Add Move to this Dimension */}
            <div className="mt-3">
              <button
                id="btn-constellation-add-move"
                onClick={() => {
                  const domain = selectedCategory.title;
                  onSelectCategory(null);
                  onOpenCreateMoveForDomain(domain);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_5px_20px_rgba(212,175,55,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Initiate Move in {selectedCategory.title}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
