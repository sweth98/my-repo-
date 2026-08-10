import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MODULES } from "../data.js";
import { ACCENT, ACCENT_WARM } from "./AIOrb.jsx";

// Elliptical ring - wider than tall, which sits better on landscape screens.
export const RING = MODULES.map((_, i) => {
  const a = (i / MODULES.length) * Math.PI * 2 - Math.PI / 2;
  return [Math.cos(a) * 3.6, Math.sin(a) * 1.95, Math.sin(a * 2) * 0.7];
});

/**
 * The 3D half: five small nodes orbiting the core.
 *
 * These meshes are purely visual - the whole canvas is pointer-events:none.
 * Interaction lives on the DOM labels below, which are real buttons, so the
 * site stays keyboard accessible and no raycasting runs per frame.
 */
export default function SkillNodes({
  labelRefs,
  hovered,
  activeIndex,
  visible,
  simplified,
}) {
  const meshes = useRef([]);
  const { camera, size } = useThree();
  const projected = useMemo(() => new THREE.Vector3(), []);

  // Per-node 0..1 "settle" factor. A node eases to a standstill while it is
  // hovered or open, so the button underneath stops moving and is comfortable
  // to click. Drifting click targets look elegant and feel awful.
  const settle = useRef(RING.map(() => 0));

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;

    for (let i = 0; i < RING.length; i++) {
      const mesh = meshes.current[i];
      if (!mesh) continue;

      const emphasis = (hovered === i ? 1 : 0) + (activeIndex === i ? 1 : 0);

      settle.current[i] = THREE.MathUtils.lerp(
        settle.current[i],
        emphasis > 0 ? 1 : 0,
        Math.min(d * 5, 1),
      );
      const drift = 0.16 * (1 - settle.current[i]);

      const [x, y, z] = RING[i];
      // Each node drifts on its own phase so the ring never looks mechanical.
      mesh.position.set(
        x,
        y + Math.sin(t * 0.6 + i * 1.3) * drift,
        z + Math.cos(t * 0.45 + i) * drift,
      );
      mesh.rotation.x += d * 0.25;
      mesh.rotation.y += d * 0.35;
      const target = (visible ? 1 : 0.45) * (1 + emphasis * 0.35);
      mesh.scale.setScalar(
        THREE.MathUtils.lerp(mesh.scale.x, target, Math.min(d * 6, 1)),
      );
      mesh.material.opacity = THREE.MathUtils.lerp(
        mesh.material.opacity,
        visible ? 0.55 + emphasis * 0.35 : 0.12,
        Math.min(d * 6, 1),
      );

      // Drive the DOM label straight from the projected position. Writing
      // transforms directly avoids a React re-render every single frame.
      const el = labelRefs.current[i];
      if (!el || simplified) continue;
      // World position, not local - the whole rig slides sideways between the
      // hero, the stage and the open-panel layout.
      mesh.getWorldPosition(projected).project(camera);

      // Clamp into the viewport. The rig slides sideways and the ring is wide,
      // so on narrow or short windows a projected label would otherwise end up
      // partly off-screen and unreachable.
      const halfW = el.offsetWidth / 2 + 12;
      const halfH = el.offsetHeight / 2 + 12;
      const px = THREE.MathUtils.clamp(
        (projected.x * 0.5 + 0.5) * size.width,
        halfW,
        size.width - halfW,
      );
      const py = THREE.MathUtils.clamp(
        (-projected.y * 0.5 + 0.5) * size.height,
        halfH,
        size.height - halfH,
      );
      el.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%)`;
    }
  });

  return (
    <group>
      {RING.map((pos, i) => (
        <mesh key={i} ref={(el) => (meshes.current[i] = el)} position={pos}>
          <octahedronGeometry args={[0.17, 0]} />
          <meshBasicMaterial
            color={i === activeIndex ? ACCENT_WARM : ACCENT}
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// The matching DOM buttons live in NodeLabels.jsx, kept in a separate file so
// that App can import them without pulling three into the entry chunk.
