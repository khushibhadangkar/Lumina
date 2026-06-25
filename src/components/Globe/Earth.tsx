import React, { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  createBaseEarthTexture,
  createCityLightsTexture,
  createCloudsTexture,
  createEarthRoughnessTexture,
  createEarthBumpTexture,
} from "../../utils/textureGenerator";

interface EarthProps {
  activeMode: string;
  timelineVal: number;
  sharedRotationY: React.MutableRefObject<number>;
}

// Rayleigh scattering atmospheric limb glow shader
const AtmosphereShader = {
  uniforms: {
    sunDirection: { value: new THREE.Vector3(10, 5, 5).normalize() },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 sunDirection;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewDir);

      // Edge glow factor (denser near limbs)
      float intensity = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.5);

      // Light alignment (atmospheric glow scatters on the sunlit hemisphere)
      float lightAlign = smoothstep(-0.3, 0.2, dot(normal, sunDirection));

      // Rayleigh blue scattering color
      vec3 glowColor = vec3(0.42, 0.68, 1.0);

      gl_FragColor = vec4(glowColor, intensity * lightAlign * 0.65);
    }
  `
};

export const Earth: React.FC<EarthProps> = ({
  activeMode,
  timelineVal: _timelineVal,
  sharedRotationY,
}) => {
  const northGroupRef = useRef<THREE.Group>(null);
  const southGroupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Group>(null);
  
  const northCloudsRef = useRef<THREE.Mesh>(null);
  const southCloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  const [loadedTextures, setLoadedTextures] = useState<Record<string, THREE.Texture> | null>(null);

  // Asynchronously load NASA Blue Marble maps on mount
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const urls = {
      day: "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
      bump: "https://unpkg.com/three-globe/example/img/earth-topology.png",
      roughness: "https://unpkg.com/three-globe/example/img/earth-water.png",
      clouds: "https://unpkg.com/three-globe/example/img/earth-clouds.png"
    };

    const loaded: Record<string, THREE.Texture> = {};
    let count = 0;
    const total = Object.keys(urls).length;

    Object.entries(urls).forEach(([key, url]) => {
      loader.load(
        url,
        (texture) => {
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          loaded[key] = texture;
          count++;
          if (count === total) {
            setLoadedTextures(loaded);
          }
        },
        undefined,
        () => {
          // Fall back gracefully on errors
          count++;
          if (count === total) {
            setLoadedTextures(loaded);
          }
        }
      );
    });
  }, []);

  // Merge loaded textures with high-quality procedural fallbacks
  const textures = useMemo(() => {
    const dayFallback = new THREE.CanvasTexture(createBaseEarthTexture());
    const night = new THREE.CanvasTexture(createCityLightsTexture());
    const cloudsFallback = new THREE.CanvasTexture(createCloudsTexture());
    const roughnessFallback = new THREE.CanvasTexture(createEarthRoughnessTexture());
    const bumpFallback = new THREE.CanvasTexture(createEarthBumpTexture());
    
    // Config filters
    [dayFallback, night, cloudsFallback, roughnessFallback, bumpFallback].forEach(tex => {
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
    });

    return {
      day: loadedTextures?.day || dayFallback,
      night: night,
      clouds: loadedTextures?.clouds || cloudsFallback,
      roughness: loadedTextures?.roughness || roughnessFallback,
      bump: loadedTextures?.bump || bumpFallback,
    };
  }, [loadedTextures]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const splitActive = activeMode === "split";
    
    const targetSplit = splitActive ? 1.25 : 0;
    
    // Northern hemisphere animations
    if (northGroupRef.current) {
      northGroupRef.current.position.y = THREE.MathUtils.lerp(
        northGroupRef.current.position.y,
        targetSplit,
        0.05
      );
      northGroupRef.current.rotation.y = sharedRotationY.current;
    }

    // Southern hemisphere animations
    if (southGroupRef.current) {
      southGroupRef.current.position.y = THREE.MathUtils.lerp(
        southGroupRef.current.position.y,
        -targetSplit,
        0.05
      );
      southGroupRef.current.rotation.y = sharedRotationY.current;
    }

    // Animate cloud layers independently
    if (northCloudsRef.current) {
      northCloudsRef.current.rotation.y = time * 0.012;
    }
    if (southCloudsRef.current) {
      southCloudsRef.current.rotation.y = time * 0.012;
    }

    // Polish Titanium / Mechanical split core
    if (coreRef.current) {
      const coreScale = splitActive ? 1.0 : 0.001;
      coreRef.current.scale.lerp(new THREE.Vector3(coreScale, coreScale, coreScale), 0.05);
      coreRef.current.rotation.y = -time * 0.05;
    }

    // Fade out atmosphere in split mode
    if (atmosphereRef.current) {
      const targetAtmosphereScale = splitActive ? 0.01 : 1.0;
      atmosphereRef.current.scale.lerp(
        new THREE.Vector3(targetAtmosphereScale, targetAtmosphereScale, targetAtmosphereScale),
        0.05
      );
    }
  });

  return (
    <group>
      {/* 1. NORTHERN HEMISPHERE */}
      <group ref={northGroupRef}>
        {/* Terrain Surface */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[2.0, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            map={textures.day}
            roughnessMap={textures.roughness}
            roughness={1.0}
            bumpMap={textures.bump}
            bumpScale={0.035} // slightly enhanced bump for topological mountains
            emissiveMap={textures.night}
            emissive={new THREE.Color("#ffe0a0")}
            emissiveIntensity={1.5}
            metalness={0.15}
          />
        </mesh>
        {/* Clouds Sphere */}
        <mesh ref={northCloudsRef}>
          <sphereGeometry args={[2.015, 64, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            alphaMap={textures.clouds}
            transparent={true}
            color="#ffffff"
            roughness={0.9}
            metalness={0.0}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 2. SOUTHERN HEMISPHERE */}
      <group ref={southGroupRef}>
        {/* Terrain Surface */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[2.0, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial
            map={textures.day}
            roughnessMap={textures.roughness}
            roughness={1.0}
            bumpMap={textures.bump}
            bumpScale={0.035}
            emissiveMap={textures.night}
            emissive={new THREE.Color("#ffe0a0")}
            emissiveIntensity={1.5}
            metalness={0.15}
          />
        </mesh>
        {/* Clouds Sphere */}
        <mesh ref={southCloudsRef}>
          <sphereGeometry args={[2.015, 64, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial
            alphaMap={textures.clouds}
            transparent={true}
            color="#ffffff"
            roughness={0.9}
            metalness={0.0}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 3. SOLID METALLIC MECHANICAL/GLASS SPLIT CORE (Apple-style internal structure) */}
      <group ref={coreRef} scale={[0.001, 0.001, 0.001]}>
        {/* Polished structural cylinder */}
        <mesh>
          <cylinderGeometry args={[0.4, 0.4, 2.4, 32]} />
          <meshStandardMaterial
            color="#dddddd"
            roughness={0.15}
            metalness={0.9}
          />
        </mesh>
        
        {/* Golden interior accents */}
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.05, 32]} />
          <meshStandardMaterial
            color="#d4af37"
            roughness={0.1}
            metalness={0.95}
          />
        </mesh>
        <mesh position={[0, -1.1, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.05, 32]} />
          <meshStandardMaterial
            color="#d4af37"
            roughness={0.1}
            metalness={0.95}
          />
        </mesh>

        {/* Concentric titanium support braces */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.4, 0]}>
          <torusGeometry args={[0.7, 0.04, 16, 100]} />
          <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
          <torusGeometry args={[0.7, 0.04, 16, 100]} />
          <meshStandardMaterial color="#888888" roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* 4. RAYLEIGH SCATTERING ATMOSPHERE ENVELOPE (Fades in split mode) */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[2.025, 64, 32]} />
        <shaderMaterial
          vertexShader={AtmosphereShader.vertexShader}
          fragmentShader={AtmosphereShader.fragmentShader}
          uniforms={{
            sunDirection: { value: new THREE.Vector3(10, 5, 5).normalize() }
          }}
          transparent={true}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide} // Render back side for limb halo scattering
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export default Earth;
