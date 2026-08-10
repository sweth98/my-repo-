import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import AIOrb from "./AIOrb.jsx";
import SkillNodes from "./SkillNodes.jsx";

/** Eases the camera toward the pointer for a shallow parallax. */
function CameraRig({ pointer, simplified }) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    const amount = simplified ? 0.25 : 0.75;
    camera.position.x += (pointer.current.x * amount - camera.position.x) * d * 1.6;
    camera.position.y += (pointer.current.y * amount - camera.position.y) * d * 1.6;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/**
 * Slides the whole rig horizontally between three compositions:
 *   hero       - offset right, leaving the headline clear space
 *   stage      - centred, ringed by the five modules
 *   panel open - nudged left so the info panel never covers a module label
 *
 * Moving the composition rather than just fading things in is what makes
 * selecting a module feel like the interface is responding.
 */
function StageRig({ targetX, scale, children }) {
  const group = useRef();

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    group.current.position.x +=
      (targetX - group.current.position.x) * Math.min(d * 2.2, 1);
  });

  return (
    <group ref={group} scale={scale}>
      {children}
    </group>
  );
}

export default function Scene3D({
  labelRefs,
  hovered,
  activeIndex,
  stageVisible,
  simplified,
}) {
  const pointer = useRef({ x: 0, y: 0 });

  // A single passive listener on the window. The canvas itself is
  // pointer-events:none, so nothing here competes with the page's own controls.
  useEffect(() => {
    if (simplified) return;
    const onMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [simplified]);

  // On narrow screens the layout is a static grid, so the rig stays centred.
  const targetX = simplified
    ? 0
    : !stageVisible
      ? 2.6
      : activeIndex >= 0
        ? -1.7
        : 0;

  return (
    <div className="scene">
      <div className="scene-glow" aria-hidden="true" />
      <Canvas
        camera={{ position: [0, 0, 9], fov: 45 }}
        // Capping DPR is the single biggest performance lever on retina screens.
        dpr={[1, simplified ? 1.25 : 1.75]}
        gl={{ antialias: !simplified, powerPreference: "high-performance" }}
      >
        <CameraRig pointer={pointer} simplified={simplified} />
        {/* A narrow viewport has a much smaller horizontal field of view, so
            the same rig fills the screen. Scaling it down keeps the orb an
            accent behind the content rather than swamping it. */}
        <StageRig targetX={targetX} scale={simplified ? 0.55 : 1}>
          <AIOrb
            energy={activeIndex >= 0 ? 1 : 0}
            burstKey={activeIndex}
            simplified={simplified}
          />
          <SkillNodes
            labelRefs={labelRefs}
            hovered={hovered}
            activeIndex={activeIndex}
            visible={stageVisible}
            simplified={simplified}
          />
        </StageRig>
      </Canvas>
    </div>
  );
}
