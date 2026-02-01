import React from 'react';
import {
  CompositionProvider,
  Composition,
  Player,
  registerComposition
} from '@open-motion/core';

// Scenes
import { DemoVideo } from './scenes/DemoVideo';
import { MovingBox } from './scenes/MovingBox';
import { Dashboard } from './scenes/Dashboard';
import { AudioShowcase } from './scenes/AudioShowcase';
import { EasingShowcase } from './scenes/EasingShowcase';
import { VideoShowcase } from './scenes/VideoShowcase';
import { BrandShowcase } from './scenes/BrandShowcase';

const configs = {
  main: { width: 1280, height: 720, fps: 30, durationInFrames: 300 },
  interpolation: { width: 1280, height: 720, fps: 30, durationInFrames: 90 },
  dashboard: { width: 1280, height: 720, fps: 30, durationInFrames: 120 },
  audio: { width: 1280, height: 720, fps: 30, durationInFrames: 300 },
  easing: { width: 1280, height: 720, fps: 30, durationInFrames: 120 },
  video: { width: 1280, height: 720, fps: 30, durationInFrames: 150 },
  brand: { width: 1280, height: 720, fps: 30, durationInFrames: 450 },
};

const sceneMapping: Record<string, { component: React.ComponentType<any>, config: any }> = {
  'main': { component: DemoVideo, config: configs.main },
  'interpolation': { component: MovingBox, config: configs.interpolation },
  'dashboard': { component: Dashboard, config: configs.dashboard },
  'audio': { component: AudioShowcase, config: configs.audio },
  'easing': { component: EasingShowcase, config: configs.easing },
  'video': { component: VideoShowcase, config: configs.video },
  'brand': { component: BrandShowcase, config: configs.brand },
};

if (typeof window !== 'undefined') {
  Object.entries(sceneMapping).forEach(([id, scene]) => {
    registerComposition({ id, component: scene.component, ...scene.config });
  });
}

export const App = () => {
  const isRendering = typeof (window as any).__OPEN_MOTION_FRAME__ === 'number';
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const urlSceneId = urlParams.get('scene');
  const compositionId = urlSceneId || (window as any).__OPEN_MOTION_COMPOSITION_ID__ || 'main';

  const scene = sceneMapping[compositionId] || sceneMapping.main;
  const frame = (window as any).__OPEN_MOTION_FRAME__ || 0;
  const inputProps = (window as any).__OPEN_MOTION_INPUT_PROPS__ || {};

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{ display: 'none' }}>
        {Object.entries(sceneMapping).map(([id, s]) => (
          <Composition key={id} id={id} component={s.component} {...s.config} />
        ))}
      </div>

      {isRendering || urlSceneId ? (
        <CompositionProvider
          key={compositionId}
          config={scene.config}
          frame={frame}
          inputProps={inputProps}
        >
          <scene.component />
        </CompositionProvider>
      ) : (
        <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
          <header style={{ marginBottom: 40, borderBottom: '1px solid #e2e8f0', paddingBottom: 20 }}>
            <h1 style={{ margin: 0, color: '#0f172a' }}>OpenMotion Professional Showcase</h1>
            <p style={{ color: '#64748b' }}>A high-performance programmatic video engine built with React</p>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(600px, 1fr))', gap: '40px' }}>
            {Object.entries(sceneMapping).map(([id, s]) => (
              <section key={id} style={sectionStyle}>
                <h3>🎬 {id.toUpperCase()} Showcase</h3>
                <div style={{ marginBottom: 10 }}>
                   <a href={`?scene=${id}`} target="_blank" style={{ fontSize: 12, color: '#3b82f6' }}>Open in isolation</a>
                </div>
                <Player
                  component={s.component}
                  config={s.config}
                  autoPlay
                  loop
                />
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const sectionStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '24px',
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  border: '1px solid #e2e8f0'
};
