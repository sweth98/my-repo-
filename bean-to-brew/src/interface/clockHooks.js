import { useSyncExternalStore } from 'react';
import { subscribe, getSnapshot, clock } from '../animation/clockStore';
export const useClock = () => { useSyncExternalStore(subscribe, getSnapshot); return clock; };
