import React from 'react';
import { createGreenBean } from './GreenCoffeeBean';
import { useAsset } from './useAsset';

/** Dark chocolate, slightly oily bean with a dark groove (roast = 1). Same geometry, different material state. */
export function createRoastedBean(opts = {}) {
  const b = createGreenBean({ seed: 5, ...opts });
  b.update({ roast: 1, crack: 1 });
  const base = b.update;
  b.update = (s = {}) => base({ roast: 1, crack: 1, ...s });
  return b;
}

export default function RoastedCoffeeBean({ apiRef, ...props }) {
  const a = useAsset(createRoastedBean);
  if (apiRef) apiRef.current = a;
  return <primitive object={a.object} {...props} />;
}
