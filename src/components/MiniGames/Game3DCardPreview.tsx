import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { MiniGameId } from "../../types";

interface Game3DCardPreviewProps {
  gameId: MiniGameId;
  glowColor?: string;
}

export const Game3DCardPreview: React.FC<Game3DCardPreviewProps> = ({
  gameId,
  glowColor = "#D4AF37",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 130;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.z = 4.5;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Ambient & Point lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(new THREE.Color(glowColor), 3, 10);
    pointLight.position.set(2, 3, 2);
    scene.add(pointLight);

    const backLight = new THREE.PointLight(0x00e5ff, 2, 8);
    backLight.position.set(-2, -2, -1);
    scene.add(backLight);

    // Group for game-specific meshes
    const group = new THREE.Group();
    scene.add(group);

    if (gameId === "runner") {
      // 3D Cyber Runner Sphere with energetic orbit rings
      const coreGeo = new THREE.IcosahedronGeometry(0.9, 2);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.2,
        metalness: 0.9,
        wireframe: false,
        emissive: 0xb8860b,
        emissiveIntensity: 0.35,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      // Orbiting ring 1
      const ringGeo1 = new THREE.TorusGeometry(1.35, 0.04, 8, 32);
      const ringMat1 = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        wireframe: true,
      });
      const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
      ring1.rotation.x = Math.PI / 3;
      group.add(ring1);

      // Orbiting ring 2
      const ringGeo2 = new THREE.TorusGeometry(1.55, 0.03, 8, 32);
      const ringMat2 = new THREE.MeshBasicMaterial({
        color: 0xd4af37,
        wireframe: true,
      });
      const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
      ring2.rotation.y = Math.PI / 4;
      group.add(ring2);
    } else if (gameId === "maze") {
      // 3D Labyrinth Monolith / Geometric Crystal Cube
      const boxGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0x7f00ff,
        roughness: 0.3,
        metalness: 0.8,
        wireframe: true,
        emissive: 0x7f00ff,
        emissiveIntensity: 0.3,
      });
      const box = new THREE.Mesh(boxGeo, boxMat);
      group.add(box);

      // Inner glowing core
      const innerGeo = new THREE.OctahedronGeometry(0.7, 0);
      const innerMat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        roughness: 0.1,
        metalness: 0.9,
        emissive: 0x00e5ff,
        emissiveIntensity: 0.6,
      });
      const inner = new THREE.Mesh(innerGeo, innerMat);
      group.add(inner);
    } else {
      // 3D Focus Pulsing Torus Knot / Gyro Horizon
      const knotGeo = new THREE.TorusKnotGeometry(0.8, 0.22, 64, 8, 2, 3);
      const knotMat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        roughness: 0.2,
        metalness: 0.8,
        emissive: 0x0088cc,
        emissiveIntensity: 0.4,
      });
      const knot = new THREE.Mesh(knotGeo, knotMat);
      group.add(knot);
    }

    let reqId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      group.rotation.y += delta * 0.7;
      group.rotation.x = Math.sin(elapsed * 0.8) * 0.2;
      group.position.y = Math.sin(elapsed * 1.5) * 0.08;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
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
  }, [gameId, glowColor]);

  return (
    <div
      ref={mountRef}
      className="w-full h-32 sm:h-36 relative overflow-hidden flex items-center justify-center pointer-events-none"
    />
  );
};
