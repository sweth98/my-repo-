import React from 'react';
import {AbsoluteFill, Audio, Composition, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {ease} from './kit/anim';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/baloo-2/700.css';
import '@fontsource/baloo-2/800.css';
import {TIMING, sceneById} from './data';
import {SceneCtx} from './kit/core';
import {Background, Captions, Chrome, Wipes, musicVolume} from './kit/overlay';
import {Hook} from './scenes/Hook';
import {Law1} from './scenes/Law1';
import {Law2} from './scenes/Law2';
import {Law3} from './scenes/Law3';
import {Recap} from './scenes/Recap';

const SCENES: Record<string, React.FC> = {hook: Hook, law1: Law1, law2: Law2, law3: Law3, recap: Recap};

const Video: React.FC = () => {
  const f = useCurrentFrame();
  return (
  <AbsoluteFill style={{background: '#0B1437'}}>
    <Background />
    {TIMING.scenes.map((s) => {
      const Comp = SCENES[s.id];
      return (
        <Sequence key={s.id} from={s.start} durationInFrames={s.end - s.start} layout="none">
          <SceneCtx.Provider value={{start: s.start, id: s.id}}>
            <AbsoluteFill><Comp /></AbsoluteFill>
          </SceneCtx.Provider>
        </Sequence>
      );
    })}
    <Chrome />
    <Captions />
    <Wipes />
    <Audio src={staticFile('audio/music.mp3')} volume={musicVolume} />
    {TIMING.voice &&
      Object.entries(TIMING.lines).map(([id, l]) => (
        <Sequence key={id} from={l.start + 4} layout="none"><Audio src={staticFile(`voice/${id}.mp3`)} volume={1} /></Sequence>
      ))}
    <AbsoluteFill style={{background: '#0B1437', opacity: ease(f, TIMING.total - 26, TIMING.total - 2, 0, 1), pointerEvents: 'none'}} />
  </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <Composition id="NewtonsLaws" component={Video} durationInFrames={TIMING.total} fps={TIMING.fps} width={1920} height={1080} />
);
