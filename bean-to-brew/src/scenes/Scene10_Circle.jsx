import React from 'react';
import { useSceneGroup } from '../animation/director';
import { useAsset } from '../components/useAsset';
import { createRoastedBean } from '../components/RoastedCoffeeBean';
import { easeOutBack, remap } from '../animation/util';

/**
 * 55–58: a single roasted bean appears beside the cup and the camera travels to it (camera in Scene09).
 * 58–60: the circular cut opens on the plantation (the Scene01 set is re-staged) – see Scene01_Origin.
 */
export default function Scene10_Circle() {
  const bean = useAsset(createRoastedBean, { res: 'hi' });
  const ref = useSceneGroup([55, 58], (t) => {
    const k = easeOutBack(remap(t, 55.25, 56.1));
    bean.object.position.set(7.7, 0.3, 3.3);
    bean.object.scale.setScalar(0.62 * Math.max(0.0001, k));
    bean.object.rotation.set(-1.5708, 0.0, 0.5 + (t - 55) * 0.05);
    bean.update({});
  });
  return (
    <group ref={ref}>
      <primitive object={bean.object} />
    </group>
  );
}
