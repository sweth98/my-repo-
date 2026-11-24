import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

/** Create a procedural asset once and dispose of everything it owns on unmount. */
export function useAsset(factory, ...args) {
  const asset = useMemo(() => factory(...args), []); // eslint-disable-line
  useEffect(() => () => asset.dispose && asset.dispose(), [asset]);
  return asset;
}

/** Collects GPU resources so factories can dispose of them deterministically. */
export class Disposer {
  constructor() { this.items = []; }
  add(x) { this.items.push(x); return x; }
  dispose() {
    this.items.forEach((x) => x && x.dispose && x.dispose());
    this.items.length = 0;
  }
}

export const shadowed = (obj, cast = true, receive = true) => {
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = receive; } });
  return obj;
};
export { THREE };
