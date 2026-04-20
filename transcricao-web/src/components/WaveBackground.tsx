"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SEGMENTS_X = 128;
const SEGMENTS_Y = 48;
const WIDTH = 16;
const HEIGHT = 6;

// Brand gradient colors
const COLOR_GREEN = new THREE.Color("#00e676");
const COLOR_CYAN = new THREE.Color("#00bcd4");
const COLOR_BLUE = new THREE.Color("#2196f3");

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getGradientColor(t: number): THREE.Color {
  if (t < 0.5) {
    return COLOR_GREEN.clone().lerp(COLOR_CYAN, t * 2);
  }
  return COLOR_CYAN.clone().lerp(COLOR_BLUE, (t - 0.5) * 2);
}

function WaveMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(WIDTH, HEIGHT, SEGMENTS_X, SEGMENTS_Y);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colorArray = new Float32Array(pos.count * 3);

    // Initial colors based on X position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const t = (x + WIDTH / 2) / WIDTH; // 0..1 across width
      const color = getGradientColor(t);
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    geo.setAttribute("color", new THREE.Float32BufferAttribute(colorArray, 3));

    return { geometry: geo };
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime();
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const col = geometry.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const t = (x + WIDTH / 2) / WIDTH;

      // Multiple wave layers for organic feel
      const wave1 = Math.sin(x * 0.8 + time * 0.6) * 0.3;
      const wave2 = Math.sin(x * 1.5 - time * 0.4 + y * 0.5) * 0.15;
      const wave3 = Math.sin(x * 0.3 + time * 0.2) * 0.5;
      const wave4 = Math.cos(y * 1.2 + time * 0.3 + x * 0.4) * 0.12;

      // Audio-like pulsing in the center
      const centerDist = Math.abs(y) / (HEIGHT / 2);
      const audioPulse =
        Math.sin(x * 3 + time * 2) * 0.08 * (1 - centerDist) +
        Math.sin(x * 5 - time * 3) * 0.04 * (1 - centerDist * centerDist);

      const z = (wave1 + wave2 + wave3 + wave4 + audioPulse) * 0.7;
      pos.setZ(i, z);

      // Animate colors with subtle shifts
      const colorShift = Math.sin(time * 0.15 + t * Math.PI) * 0.08;
      const color = getGradientColor(Math.max(0, Math.min(1, t + colorShift)));

      // Brightness based on height (peaks glow brighter)
      const brightness = lerp(0.4, 1.0, Math.abs(z) / 0.8);
      col.setXYZ(
        i,
        color.r * brightness,
        color.g * brightness,
        color.b * brightness
      );
    }

    pos.needsUpdate = true;
    col.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI * 0.38, 0, 0]}
      position={[0, -0.5, 0]}
    >
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.12}
        wireframe
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Second layer — solid semi-transparent surface for depth
function WaveSurface() {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(WIDTH, HEIGHT, SEGMENTS_X / 2, SEGMENTS_Y / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colorArray = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const t = (x + WIDTH / 2) / WIDTH;
      const color = getGradientColor(t);
      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    geo.setAttribute("color", new THREE.Float32BufferAttribute(colorArray, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const pos = geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);

      const wave1 = Math.sin(x * 0.8 + time * 0.6) * 0.3;
      const wave2 = Math.sin(x * 1.5 - time * 0.4 + y * 0.5) * 0.15;
      const wave3 = Math.sin(x * 0.3 + time * 0.2) * 0.5;
      const wave4 = Math.cos(y * 1.2 + time * 0.3 + x * 0.4) * 0.12;

      const centerDist = Math.abs(y) / (HEIGHT / 2);
      const audioPulse =
        Math.sin(x * 3 + time * 2) * 0.08 * (1 - centerDist) +
        Math.sin(x * 5 - time * 3) * 0.04 * (1 - centerDist * centerDist);

      const z = (wave1 + wave2 + wave3 + wave4 + audioPulse) * 0.7;
      pos.setZ(i, z);
    }

    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI * 0.38, 0, 0]}
      position={[0, -0.5, -0.1]}
    >
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.04}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <WaveSurface />
      <WaveMesh />
    </>
  );
}

export default function WaveBackground() {
  return (
    <div className="absolute inset-0 -z-20 overflow-hidden">
      <Canvas
        camera={{ position: [0, 2, 5], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>

      {/* Fade edges so the wave blends with the dark bg */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#030303] to-transparent" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#030303] to-transparent" />
        {/* Left fade */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#030303] to-transparent" />
        {/* Right fade */}
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#030303] to-transparent" />
      </div>
    </div>
  );
}
