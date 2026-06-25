import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { TradeCorridor } from "../../services/dataEngine";

interface NetworkProps {
  corridorsData: TradeCorridor[];
  activeMode: string;
  sharedRotationY: React.MutableRefObject<number>;
}

interface ComputedRoute {
  fromCity: string;
  toCity: string;
  type: string;
  curve: THREE.QuadraticBezierCurve3;
}

// 3D Cartesian coordinates projection helper
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);

  return new THREE.Vector3(x, y, z);
}

export const Network: React.FC<NetworkProps> = ({
  corridorsData,
  activeMode: _activeMode,
  sharedRotationY,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // 1. Process trade corridors, projecting Bezier curves dynamically in 3D
  const routes = useMemo<ComputedRoute[]>(() => {
    const radius = 2.0;
    
    return corridorsData.map((c) => {
      const p1 = latLonToVector3(c.latFrom, c.lonFrom, radius);
      const p2 = latLonToVector3(c.latTo, c.lonTo, radius);
      
      const distance = p1.distanceTo(p2);
      const arcHeight = 0.12 + distance * 0.16;

      const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const normal = midPoint.clone().normalize();
      const controlPoint = midPoint.add(normal.multiplyScalar(arcHeight));

      const curve = new THREE.QuadraticBezierCurve3(p1, controlPoint, p2);
      return {
        fromCity: c.from,
        toCity: c.to,
        type: c.type,
        curve
      };
    });
  }, [corridorsData]);

  // 2. Generate packet pulse states along paths
  const packetPoints = useMemo(() => {
    return routes.map((route, i) => {
      const count = 1 + (i % 2);
      const items = [];
      for (let k = 0; k < count; k++) {
        items.push({
          offset: k / count,
          speed: 0.08 + (i % 2) * 0.03, // Slower wind speed for professional look
          color: route.type === "energy" ? "#ebd09b" : "#ffffff"
        });
      }
      return items;
    });
  }, [routes]);

  const packetMeshesRef = useRef<THREE.Mesh[]>([]);

  // 3. Update loops to sync rotation and position data particles
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.rotation.y = sharedRotationY.current;
    }

    let index = 0;
    routes.forEach((route, routeIdx) => {
      const packets = packetPoints[routeIdx] || [];
      packets.forEach((packet) => {
        const mesh = packetMeshesRef.current[index];
        if (mesh) {
          const progress = (time * packet.speed + packet.offset) % 1.0;
          const point = route.curve.getPointAt(progress);
          mesh.position.copy(point);
        }
        index++;
      });
    });
  });

  if (routes.length === 0) return null;

  // Gather flat packet definitions
  const flatPacketsList: { color: string; routeIdx: number }[] = [];
  packetPoints.forEach((pts, idx) => {
    pts.forEach(pt => {
      flatPacketsList.push({ color: pt.color, routeIdx: idx });
    });
  });

  return (
    <group ref={groupRef}>
      {/* A. Render Route curves */}
      {routes.map((route, idx) => {
        const points = route.curve.getPoints(50);
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);

        const strokeColor = route.type === "energy" 
          ? "rgba(207, 168, 100, 0.22)" 
          : "rgba(255, 255, 255, 0.12)";

        const lineMat = new THREE.LineBasicMaterial({
          color: strokeColor,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
        });
        const lineMesh = new THREE.Line(lineGeom, lineMat);

        return (
          <primitive key={`route-${idx}`} object={lineMesh} />
        );
      })}

      {/* B. Render flowing packets */}
      {flatPacketsList.map((pkt, idx) => (
        <mesh
          key={`pkt-${idx}`}
          ref={(el) => {
            if (el) packetMeshesRef.current[idx] = el;
          }}
        >
          <sphereGeometry args={[0.011, 8, 8]} />
          <meshBasicMaterial
            color={pkt.color}
            transparent={true}
            opacity={0.65}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

export default Network;
