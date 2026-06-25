import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COUNTRIES_BOUNDARIES } from "../../utils/countryBorders";

interface BordersRendererProps {
  selectedCountryId: string | null;
  hoveredCountryId: string | null;
  sharedRotationY: React.MutableRefObject<number>;
  activeMode: string;
}

// Spherical coordinate mapper
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);

  return new THREE.Vector3(x, y, z);
}

export const BordersRenderer: React.FC<BordersRendererProps> = ({
  selectedCountryId,
  hoveredCountryId,
  sharedRotationY,
  activeMode,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Pre-project the boundaries and pre-instantiate line meshes to prevent garbage collection spikes
  const projectedBorders = useMemo(() => {
    const radius = 2.006; // Slightly above sphere to avoid Z-fighting
    return COUNTRIES_BOUNDARIES.map(country => {
      const points = country.boundary.map(pt => latLonToVector3(pt[1], pt[0], radius));
      // Close the loop
      points.push(points[0].clone());
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry);
      const glowLine = new THREE.Line(geometry);
      glowLine.scale.set(1.002, 1.002, 1.002);

      return {
        id: country.id,
        line,
        glowLine
      };
    });
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      // Rotate borders in sync with the Earth mesh
      groupRef.current.rotation.y = sharedRotationY.current;
    }
  });

  // Hide borders during comparison or split modes if they clutter
  if (activeMode === "split" || activeMode === "compare") return null;

  return (
    <group ref={groupRef}>
      {projectedBorders.map(pb => {
        const isSelected = selectedCountryId === pb.id;
        const isHovered = hoveredCountryId === pb.id;

        let lineColor = "rgba(255, 255, 255, 0.15)";
        let opacity = 0.25;

        if (isSelected) {
          lineColor = "#ebd09b"; // Soft gold glow
          opacity = 0.95;
        } else if (isHovered) {
          lineColor = "#ffffff"; // White highlight
          opacity = 0.75;
        }

        return (
          <group key={pb.id}>
            {/* Primary line segment */}
            <primitive object={pb.line}>
              <lineBasicMaterial 
                color={lineColor}
                transparent
                opacity={opacity}
                depthWrite={false}
              />
            </primitive>

            {/* Glowing duplicate pass for hovered or selected (Bloom enhancer) */}
            {(isHovered || isSelected) && (
              <primitive object={pb.glowLine}>
                <lineBasicMaterial 
                  color={lineColor}
                  transparent
                  opacity={opacity * 0.45}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </primitive>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default BordersRenderer;
