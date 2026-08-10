import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const ACCENT = "#5ea8d9";
export const ACCENT_WARM = "#d9a441";

/** Points scattered in a thin shell, so the core reads as a cloud not a ball. */
function useShellPositions(count) {
  return useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Even distribution over a sphere, then jittered outward.
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const radius = 1.9 + Math.random() * 1.15;
      arr[i * 3] = r * Math.cos(theta) * radius;
      arr[i * 3 + 1] = u * radius;
      arr[i * 3 + 2] = r * Math.sin(theta) * radius;
    }
    return arr;
  }, [count]);
}

export default function AIOrb({ energy, burstKey, simplified }) {
  const group = useRef();
  const shellA = useRef();
  const shellB = useRef();
  const cloud = useRef();
  const core = useRef();

  // Smoothed 0..1 activation, and a decaying impulse fired on each selection.
  const level = useRef(0);
  const burst = useRef(0);
  const lastBurst = useRef(burstKey);

  const positions = useShellPositions(simplified ? 700 : 2000);

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05); // clamp after a background tab
    const t = state.clock.elapsedTime;

    if (burstKey !== lastBurst.current) {
      lastBurst.current = burstKey;
      burst.current = 1;
    }
    burst.current *= 1 - Math.min(d * 2.4, 1);
    level.current += (energy - level.current) * Math.min(d * 2.2, 1);

    const l = level.current;
    const b = burst.current;

    group.current.rotation.y += d * (0.05 + l * 0.12);

    shellA.current.rotation.x = t * 0.07;
    shellA.current.rotation.z = -t * 0.05;
    shellB.current.rotation.y = -t * 0.09;
    shellB.current.rotation.x = t * 0.03;

    // Breathing core, punched outward briefly on selection.
    const pulse = 1 + Math.sin(t * 1.1) * 0.03 + l * 0.1 + b * 0.22;
    core.current.scale.setScalar(pulse);
    shellA.current.scale.setScalar(1 + l * 0.06 + b * 0.12);

    cloud.current.rotation.y = t * 0.03;
    cloud.current.scale.setScalar(1 + l * 0.05 + b * 0.16);
    cloud.current.material.opacity = 0.38 + l * 0.22 + b * 0.2;
  });

  return (
    <group ref={group}>
      {/* The core is four concentric additive spheres rather than one solid
          one. Stacked falloff fakes a volumetric glow convincingly, and costs
          four tiny draw calls instead of a bloom pass or a custom shader.
          A single opaque sphere reads as a flat disc. */}
      <group ref={core}>
        {/* Additive, not opaque: a solid white sphere punches a hard-edged
            disc out of the glow instead of blooming into it. */}
        <mesh>
          <sphereGeometry args={[0.2, 24, 24]} />
          <meshBasicMaterial
            color="#eaf6ff"
            transparent
            opacity={0.9}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {[
          [0.34, 0.42],
          [0.5, 0.24],
          [0.72, 0.13],
          [1, 0.07],
          [1.3, 0.04],
        ].map(([r, opacity]) => (
          <mesh key={r}>
            <sphereGeometry args={[r, 24, 24]} />
            <meshBasicMaterial
              color={ACCENT}
              transparent
              opacity={opacity}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      {/* Two counter-rotating wireframes give the core structure. */}
      <mesh ref={shellA}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial
          color={ACCENT}
          wireframe
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={shellB}>
        <icosahedronGeometry args={[1.85, 0]} />
        <meshBasicMaterial
          color={ACCENT_WARM}
          wireframe
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <points ref={cloud}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={simplified ? 0.028 : 0.022}
          color={ACCENT}
          transparent
          opacity={0.4}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
