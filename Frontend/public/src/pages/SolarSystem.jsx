// src/components/SolarSystem.jsx
import React, { useRef, useMemo, Suspense, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import "./SolarSystem.css";

/* --------- small seeded RNG for deterministic textures --------- */
function makeRng(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  let state = h >>> 0;
  return () => {
    // xorshift32-ish
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) / 4294967295);
  };
}

/* ---------- procedural noise (simple fractal noise) ---------- */
function fbmNoise(rng, x, y, oct = 4) {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < oct; i++) {
    // simple pseudo-random based on x,y and freq
    const n = Math.sin(x * 12.9898 * freq + y * 78.233 * freq) * 43758.5453;
    const r = (n - Math.floor(n));
    value += r * amp;
    amp *= 0.5;
    freq *= 2;
  }
  return value;
}

/* ---------- helper: generate canvas texture for planet ---------- */
function generatePlanetTexture(name, size = 1024) {
  const rng = makeRng(name);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  // base color per planet name (approximate)
  const baseColors = {
    Mercury: "#9a9a9a",
    Venus: "#d8b57a",
    Earth: "#2a5cff",
    Mars: "#c74a2b",
    Jupiter: "#cfa57a",
    Saturn: "#ddc79b",
    Uranus: "#9fe0e6",
    Neptune: "#2f66d6",
  };
  const base = baseColors[name] || "#777777";

  // fill base
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // add bands / continents depending on planet
  if (name === "Jupiter" || name === "Saturn") {
    // draw horizontal bands
    const bands = 10 + Math.floor(rng() * 6);
    for (let i = 0; i < bands; i++) {
      const y = (i / bands) * size;
      const h = size / bands * (0.7 + rng() * 0.6);
      // band color slightly varied
      const variation = (rng() * 30) - 15;
      ctx.fillStyle = shadeColorHex(base, variation + (i % 2 ? 12 : -8));
      ctx.globalAlpha = 0.95 - rng() * 0.15;
      ctx.fillRect(0, y, size, h);
    }
    ctx.globalAlpha = 1;
    // add a big storm spot
    const spotX = size * (0.3 + rng() * 0.4);
    const spotY = size * (0.3 + rng() * 0.4);
    const spotR = size * (0.06 + rng() * 0.12);
    const g = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, spotR);
    g.addColorStop(0, "rgba(200,120,80,0.95)");
    g.addColorStop(1, "rgba(200,120,80,0)");
    ctx.fillStyle = g;
    ctx.fillRect(spotX - spotR, spotY - spotR, spotR * 2, spotR * 2);
  } else if (name === "Earth") {
    // oceans + continents + clouds
    // deeper blue base already applied -> draw greenish continents
    const continentCount = 5 + Math.floor(rng() * 4);
    ctx.globalAlpha = 1;
    for (let i = 0; i < continentCount; i++) {
      const cx = size * rng();
      const cy = size * rng();
      const r = size * (0.08 + rng() * 0.12);
      drawBlob(ctx, cx, cy, r, rng, "#2f8f3a");
    }
    // deserts (sandy) patches
    if (rng() > 0.6) {
      const cx = size * rng();
      const cy = size * rng();
      drawBlob(ctx, cx, cy, size * (0.06 + rng() * 0.08), rng, "#cfae6b");
    }
    // semi-transparent cloud layer
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 60; i++) {
      const cx = size * rng();
      const cy = size * rng();
      const rx = size * (0.01 + rng() * 0.06);
      const ry = rx * (0.6 + rng() * 1.6);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, rng() * Math.PI, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (name === "Mars") {
    // rocky surface with darker patches
    for (let i = 0; i < 80; i++) {
      const x = size * rng();
      const y = size * rng();
      const r = size * (0.01 + rng() * 0.04);
      const color = shadeColorHex(base, (rng() * 40) - 20);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // add subtle lighter areas
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.globalAlpha = 1;
  } else {
    // general small noise / spots for other rocky/icy planets
    for (let i = 0; i < 100; i++) {
      const x = size * rng();
      const y = size * rng();
      const r = size * (0.002 + rng() * 0.01);
      const color = shadeColorHex(base, (rng() * 30) - 15);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // add subtle global noise for realism
  const noiseAlpha = 0.06;
  const img = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = (fbmNoise(rng, x / size, y / size) - 0.5) * 255 * noiseAlpha;
      img.data[i] = clamp(img.data[i] + n, 0, 255);
      img.data[i + 1] = clamp(img.data[i + 1] + n, 0, 255);
      img.data[i + 2] = clamp(img.data[i + 2] + n, 0, 255);
    }
  }
  ctx.putImageData(img, 0, 0);

  return new THREE.CanvasTexture(canvas);
}

/* ---------- small drawing helpers ---------- */
function drawBlob(ctx, x, y, radius, rng, color) {
  ctx.beginPath();
  const steps = 12 + Math.floor(rng() * 12);
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = radius * (0.7 + rng() * 0.7);
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r * (0.6 + rng() * 0.9);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function shadeColorHex(hex, percent) {
  // hex -> RGB -> shift brightness
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;
  r = clamp(Math.round(r), 0, 255);
  g = clamp(Math.round(g), 0, 255);
  b = clamp(Math.round(b), 0, 255);
  return `rgb(${r},${g},${b})`;
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

/* ------------------ Sun (circular corona sprite + vibrance) ------------------ */
function Sun({ size = 6, intensity = 3.2 }) {
  const coreRef = useRef();
  const surfaceRef = useRef();
  const coronaRef = useRef();

  // small canvas texture for corona sprite
  const coronaTexture = useMemo(() => {
    const s = 512;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,250,220,1)");
    g.addColorStop(0.25, "rgba(255,230,150,0.95)");
    g.addColorStop(0.5, "rgba(255,185,80,0.45)");
    g.addColorStop(1, "rgba(255,150,40,0.0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 1.1) * 0.02 + Math.sin(t * 0.13) * 0.01;
    if (coreRef.current) coreRef.current.scale.setScalar(pulse);
    if (surfaceRef.current) surfaceRef.current.rotation.y += 0.002;
    if (coronaRef.current) coronaRef.current.rotation.z += 0.0006;
  });

  return (
    <group>
      <pointLight intensity={intensity} distance={400} decay={2} color={0xffe6b2} />
      <mesh ref={coreRef}>
        <sphereGeometry args={[size, 64, 64]} />
        <meshBasicMaterial color={0xfff3c9} />
      </mesh>
      <mesh ref={surfaceRef}>
        <sphereGeometry args={[size * 1.02, 64, 64]} />
        <meshStandardMaterial emissive={new THREE.Color(0xffcc66)} roughness={0.38} transparent opacity={0.98} />
      </mesh>
      <mesh ref={coronaRef}>
        <sphereGeometry args={[size * 1.6, 32, 32]} />
        <meshBasicMaterial color={0xffcc66} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <sprite scale={[size * 6, size * 6, 1]}>
        <spriteMaterial map={coronaTexture} transparent opacity={0.62} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      <Sparkles count={80} scale={[size * 2.4, size * 2.4, size * 2.4]} size={0.35} speed={0.35} noise={0.9} />
    </group>
  );
}

/* ------------------ Planet component (uses generated texture) ------------------ */
/* ------------------ Planet component (drop-in replacement) ------------------ */
function Planet({ name, radius, distance, color, orbitSpeed, rotationSpeed, onClick, hoveredPlanet, setHoveredPlanet }) {
  const groupRef = useRef();
  const meshRef = useRef();

  // stable initial phase so each planet keeps its starting offset
  const initPhase = useRef(Math.random() * Math.PI * 2);

  // local accumulators (seconds) — these advance only when NOT hovered
  const orbitElapsed = useRef(0); // used for orbital angle
  const rotElapsed = useRef(0); // used for self-rotation angle

  // generate texture only once per planet
  const texture = useMemo(() => generatePlanetTexture(name, 1024), [name]);

  useFrame((state, delta) => {
    // delta is frame time in seconds
    // advance accumulators only when nothing is hovered (global pause)
    if (!hoveredPlanet) {
      // orbitSpeed previously multiplied straight on elapsed time (angle = t * orbitSpeed)
      // so advance by delta * orbitSpeed to keep same behavior but using local time
      orbitElapsed.current += delta * orbitSpeed;

      // previous per-frame rotation used a small multiplier (rotationSpeed * 0.004)
      // replicate that by advancing rotElapsed using the same scale
      rotElapsed.current += delta * rotationSpeed * 0.004;
    }

    // compute angle from local elapsed (no jumps when resumed)
    const angle = initPhase.current + orbitElapsed.current;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    if (groupRef.current) groupRef.current.position.set(x, 0, z);
    if (meshRef.current) meshRef.current.rotation.y = rotElapsed.current;
  });

  return (
    <>
      {/* Orbit ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[distance - 0.03, distance + 0.03, 256]} />
        <meshBasicMaterial color="#6ea0ff" transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>

      <group ref={groupRef}>
        <mesh
          ref={meshRef}
          onClick={() => onClick(name)}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredPlanet(name);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHoveredPlanet(null);
          }}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[radius, 64, 64]} />
          <meshPhysicalMaterial
            map={texture}
            color={color}
            metalness={0}
            roughness={0.45}
            clearcoat={0.08}
            clearcoatRoughness={0.18}
            reflectivity={0.2}
          />
        </mesh>

        {/* removed on-planet Html label per request */}
      </group>
    </>
  );
}


/* ------------------ Main Scene ------------------ */
export default function SolarSystem() {
  const navigate = useNavigate();
  // hoveredPlanet state controls both pausing and the info card
  const [hoveredPlanet, setHoveredPlanet] = useState(null);

  const handlePlanetClick = (name) => {
    if (name === "Earth") navigate("/earth");
  };

  // small lookup for planet summaries + Unsplash links (change links if you prefer other images)
  const planetInfo = {
  Mercury: {
    summary: "Mercury is the smallest planet and closest to the Sun. It has a rocky surface with many impact craters.",
    img: "/images/Mercuruy.jpg",
  },
  Venus: {
    summary: "Venus is a rocky planet with a thick toxic atmosphere and surface temperatures hot enough to melt lead.",
    img: "/images/venus.jpg",
  },
  Earth: {
    summary: "Earth — our home — has abundant liquid water, a protective atmosphere, and diverse life.",
    img: "/images/Earth.jpg",
  },
  Mars: {
    summary: "Mars is a cold desert world with the largest volcano and canyon in the solar system.",
    img: "/images/Mars.avif",
  },
  Jupiter: {
    summary: "Jupiter is the largest planet — a gas giant with swirling storms and many moons.",
    img: "/images/jupiter.jpg",
  },
  Saturn: {
    summary: "Saturn is famous for its extensive ring system and many icy moons.",
    img: "/images/saturn.png",
  },
  Uranus: {
    summary: "Uranus is an ice giant with a tilted axis — it spins on its side.",
    img: "/images/Uranus.jpg",
  },
  Neptune: {
    summary: "Neptune is a distant ice giant with supersonic winds and a vivid blue color.",
    img: "/images/Neptune.webp",
  },
};

  // inject a small CSS snippet to avoid editing the separate css file — keeps change minimal
  useEffect(() => {
    const css = `
      .planet-info-card {
        position: absolute;
        right: 20px;
        top: 20px;
        width: 300px;
        backdrop-filter: blur(6px);
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12);
        color: #e8f0ff;
        padding: 12px;
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.6);
        z-index: 10;
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }
      .planet-info-card img{
        width: 96px;
        height: 72px;
        object-fit: cover;
        border-radius: 6px;
        flex-shrink: 0;
        border: 1px solid rgba(255,255,255,0.06);
      }
      .planet-info-card .meta{
        font-size: 13px;
        line-height: 1.3;
      }
      .planet-info-card .meta h3{ margin: 0 0 6px 0; }
    `;
    const style = document.createElement("style");
    style.id = "solar-system-hover-styles";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById("solar-system-hover-styles");
      if (el) el.remove();
    };
  }, []);

  // ---------- BACKGROUND AUDIO: autoplay from public/audio/bgsound.mp3 (unchanged) ----------
  useEffect(() => {
    const audio = new Audio("/audio/bgsound.mp3");
    audio.loop = true;
    audio.volume = 0.45;
    const tryPlay = () => audio.play().catch(() => {});
    tryPlay();
    const resumeOnInteraction = () => {
      tryPlay();
      window.removeEventListener("pointerdown", resumeOnInteraction);
      window.removeEventListener("keydown", resumeOnInteraction);
    };
    window.addEventListener("pointerdown", resumeOnInteraction, { once: true });
    window.addEventListener("keydown", resumeOnInteraction, { once: true });
    return () => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {}
      window.removeEventListener("pointerdown", resumeOnInteraction);
      window.removeEventListener("keydown", resumeOnInteraction);
    };
  }, []);

  return (
    <div className="solar-page">
      <Canvas shadows gl={{ antialias: true }} camera={{ position: [0, 40, 140], fov: 45 }} className="solar-canvas">
        <color attach="background" args={["#000010"]} />
        <ambientLight intensity={0.12} />

        <Suspense fallback={null}>
          <Sun size={6.5} intensity={3.6} />
          <Stars radius={450} depth={140} count={30000} factor={6} saturation={0} fade />

          {/* Planets (textures generated procedurally) */}
          <Planet name="Mercury" radius={0.8} distance={10} color="#9e9e9e" orbitSpeed={0.5} rotationSpeed={0.5} onClick={handlePlanetClick} hoveredPlanet={hoveredPlanet} setHoveredPlanet={setHoveredPlanet} />
          <Planet name="Venus" radius={1.2} distance={14} color="#e6c07b" orbitSpeed={0.35} rotationSpeed={0.3} onClick={handlePlanetClick} hoveredPlanet={hoveredPlanet} setHoveredPlanet={setHoveredPlanet} />
          <Planet name="Earth" radius={1.5} distance={20} color="#2a5cff" orbitSpeed={0.3} rotationSpeed={0.6} onClick={handlePlanetClick} hoveredPlanet={hoveredPlanet} setHoveredPlanet={setHoveredPlanet} />
          <Planet name="Mars" radius={1.2} distance={26} color="#c1440e" orbitSpeed={0.26} rotationSpeed={0.4} onClick={handlePlanetClick} hoveredPlanet={hoveredPlanet} setHoveredPlanet={setHoveredPlanet} />
          <Planet name="Jupiter" radius={3.3} distance={38} color="#caa37a" orbitSpeed={0.12} rotationSpeed={0.3} onClick={handlePlanetClick} hoveredPlanet={hoveredPlanet} setHoveredPlanet={setHoveredPlanet} />
          <Planet name="Saturn" radius={2.8} distance={48} color="#d6c49a" orbitSpeed={0.1} rotationSpeed={0.3} onClick={handlePlanetClick} hoveredPlanet={hoveredPlanet} setHoveredPlanet={setHoveredPlanet} />
          <Planet name="Uranus" radius={2.0} distance={60} color="#9fe0e6" orbitSpeed={0.08} rotationSpeed={0.25} onClick={handlePlanetClick} hoveredPlanet={hoveredPlanet} setHoveredPlanet={setHoveredPlanet} />
          <Planet name="Neptune" radius={2.0} distance={70} color="#3b6bd6" orbitSpeed={0.06} rotationSpeed={0.25} onClick={handlePlanetClick} hoveredPlanet={hoveredPlanet} setHoveredPlanet={setHoveredPlanet} />

          <EffectComposer>
            <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.05} kernelSize={3} />
            <Vignette eskil={false} offset={0.2} darkness={0.35} />
          </EffectComposer>
        </Suspense>

        <OrbitControls enableZoom enableRotate enablePan maxPolarAngle={Math.PI / 2} minPolarAngle={0} />
      </Canvas>

      {hoveredPlanet && planetInfo[hoveredPlanet] && (
        <div className="planet-info-card" role="dialog" aria-label={`${hoveredPlanet} info`}>
          <img src={planetInfo[hoveredPlanet].img} alt={`${hoveredPlanet}`} />
          <div className="meta">
            <h3>{hoveredPlanet}</h3>
            <p>{planetInfo[hoveredPlanet].summary}</p>
            <p style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}></p>
          </div>
        </div>
      )}

      <div className="ui-top-left">
        <div className="ui-title">The Solar System </div>
        <div className="ui-sub">Click on Earth to explore in detail</div>
        <div className="ui-sub">Zoom and enjoyy</div>
      </div>
    </div>
  );
}
