import {
  AbsoluteFill,
  Composition,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {};

const WIDTH = 1280;
const HEIGHT = 720;
const BALL_RADIUS = 26;
const GROUND_Y = HEIGHT - 120;
const START_Y = 100;
const GRAVITY = 2600; // px / s^2
const RESTITUTION = 0.82;
const LEFT_X = 140;
const RIGHT_X = WIDTH - 140;
const HORIZONTAL_SPEED = 300; // px / s
const TRAIL_LENGTH = 26;
const TRAIL_STEP = 0.014; // seconds between trail samples

// Closed-form bounce simulation: falls from START_Y, then bounces off
// GROUND_Y losing RESTITUTION of its velocity on each impact.
const getBallY = (t: number): number => {
  const dropHeight = GROUND_Y - START_Y;
  const fallDuration = Math.sqrt((2 * dropHeight) / GRAVITY);

  if (t <= fallDuration) {
    return START_Y + 0.5 * GRAVITY * t * t;
  }

  let remaining = t - fallDuration;
  let velocity = Math.sqrt(2 * GRAVITY * dropHeight) * RESTITUTION;

  for (let bounce = 0; bounce < 40; bounce++) {
    const bounceDuration = (2 * velocity) / GRAVITY;
    if (bounceDuration < 0.001) {
      // Residual bounces are imperceptible; the ball has settled.
      return GROUND_Y;
    }
    if (remaining <= bounceDuration) {
      return (
        GROUND_Y - (velocity * remaining - 0.5 * GRAVITY * remaining * remaining)
      );
    }
    remaining -= bounceDuration;
    velocity *= RESTITUTION;
  }

  return GROUND_Y;
};

// Ball drifts left-to-right and reflects off the side walls, like a
// steady horizontal sweep across the frame.
const getBallX = (t: number): number => {
  const range = RIGHT_X - LEFT_X;
  const distance = (t * HORIZONTAL_SPEED) % (2 * range);
  return LEFT_X + (distance <= range ? distance : 2 * range - distance);
};

const BouncingBall: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const trail = new Array(TRAIL_LENGTH).fill(0).map((_, index) => {
    const sampleT = Math.max(0, t - index * TRAIL_STEP);
    const hue = (sampleT * 140 + index * 10) % 360;
    const fade = 1 - index / TRAIL_LENGTH;
    return {
      x: getBallX(sampleT),
      y: getBallY(sampleT),
      hue,
      fade,
      index,
    };
  });

  const heroBallGroundDistance = Math.max(0, GROUND_Y - trail[0].y);
  const squash = Math.max(0.55, 1 - heroBallGroundDistance / 900);
  const shadowScale = Math.max(
    0.3,
    1 - heroBallGroundDistance / (GROUND_Y - START_Y),
  );

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #14182b 0%, #05060d 70%, #010103 100%)",
      }}
    >
      {/* floor shadow that shrinks as the ball rises */}
      <div
        style={{
          position: "absolute",
          left: trail[0].x - 46,
          top: GROUND_Y + BALL_RADIUS - 14,
          width: 92 * shadowScale,
          height: 20 * shadowScale,
          borderRadius: "50%",
          background: "rgba(0, 0, 0, 0.55)",
          filter: "blur(6px)",
          transform: `translateX(${46 - 46 * shadowScale}px)`,
        }}
      />

      {trail
        .slice()
        .reverse()
        .map(({ x, y, hue, fade, index }) => {
          const isHero = index === 0;
          const radius = isHero ? BALL_RADIUS : BALL_RADIUS * (0.55 + 0.35 * fade);
          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: x - radius,
                top: y - radius * (isHero ? squash : 1),
                width: radius * 2,
                height: radius * 2 * (isHero ? squash : 1),
                borderRadius: "50%",
                background: `hsl(${hue}, 95%, ${isHero ? 62 : 55}%)`,
                opacity: isHero ? 1 : fade * 0.75,
                boxShadow: isHero
                  ? `0 0 30px 6px hsla(${hue}, 95%, 60%, 0.65)`
                  : `0 0 14px 2px hsla(${hue}, 95%, 55%, ${fade * 0.4})`,
              }}
            />
          );
        })}
    </AbsoluteFill>
  );
};

export const MyComposition = () => {
  return (
    <Composition
      id="BouncingBall"
      component={BouncingBall}
      durationInFrames={150}
      fps={30}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
