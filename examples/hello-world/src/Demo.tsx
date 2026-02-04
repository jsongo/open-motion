import React from 'react';
import {
  CompositionProvider,
  useCurrentFrame,
  useVideoConfig,
  Player,
  Loop,
  Easing,
  interpolate,
  Composition
} from '@open-motion/core';
import { Transition } from '@open-motion/components';

const DemoVideo = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const easeProgress = interpolate(frame, [0, 100], [0, 1], {
    easing: Easing.inOutExpo
  });

  return (
    <div style={{
      backgroundColor: '#0f172a',
      width,
      height,
      color: 'white',
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      <Transition type="slide" direction="top" style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 60 }}>Animation & Transitions</h1>
      </Transition>

      <div style={{ display: 'flex', gap: 40 }}>
        <div style={{ textAlign: 'center' }}>
          <h3>Loop Component</h3>
          <div style={{
            width: 200,
            height: 200,
            backgroundColor: '#3b82f6',
            borderRadius: 20,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Loop durationInFrames={30}>
              <LoopIndicator />
            </Loop>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h3>Easing (Expo)</h3>
          <div style={{
            width: 200,
            height: 200,
            backgroundColor: '#1e293b',
            borderRadius: 20,
            position: 'relative'
          }}>
             <div style={{
               position: 'absolute',
               left: 20 + easeProgress * 140,
               top: 90,
               width: 20,
               height: 20,
               backgroundColor: '#10b981',
               borderRadius: '50%'
             }} />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h3>Wipe Transition</h3>
          <Transition type="wipe" direction="right" style={{
            width: 200,
            height: 200,
            backgroundColor: '#f59e0b',
            borderRadius: 20,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 40
          }}>
            ✨
          </Transition>
        </div>
      </div>
    </div>
  );
};

const LoopIndicator = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 15, 30], [0.5, 1.2, 0.5]);
  return (
    <div style={{
      fontSize: 40,
      transform: `scale(${scale})`
    }}>
      🔄
    </div>
  );
};

export const App = () => {
  const config = {
    width: 1280,
    height: 720,
    fps: 30,
    durationInFrames: 120
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>OpenMotion Animation Demo</h1>
      <Player
        component={DemoVideo}
        config={config}
        loop
      />
      <div style={{ display: 'none' }}>
        <Composition
          id="animation-demo"
          component={DemoVideo}
          {...config}
        />
      </div>
    </div>
  );
};
