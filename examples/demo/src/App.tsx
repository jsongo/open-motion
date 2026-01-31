import React from 'react';
import {
  CompositionProvider,
  Composition,
  Player
} from '@open-motion/core';

// Scenes
import { DemoVideo } from './scenes/DemoVideo';
import { MovingBox } from './scenes/MovingBox';
import { Dashboard } from './scenes/Dashboard';
import { AudioShowcase } from './scenes/AudioShowcase';
import { EasingShowcase } from './scenes/EasingShowcase';
import { VideoShowcase } from './scenes/VideoShowcase';

export const App = () => {
  const configs = {
    main: { width: 1280, height: 720, fps: 30, durationInFrames: 300 },
    interpolation: { width: 1280, height: 720, fps: 30, durationInFrames: 90 },
    dashboard: { width: 1280, height: 720, fps: 30, durationInFrames: 120 },
    audio: { width: 1280, height: 720, fps: 30, durationInFrames: 300 },
    easing: { width: 1280, height: 720, fps: 30, durationInFrames: 120 },
    video: { width: 1280, height: 720, fps: 30, durationInFrames: 150 },
  };

  const isRendering = typeof (window as any).__OPEN_MOTION_FRAME__ === 'number';

  if (isRendering) {
    const compositionId = (window as any).__OPEN_MOTION_COMPOSITION_ID__;
    const inputProps = (window as any).__OPEN_MOTION_INPUT_PROPS__ || {};

    let Component = DemoVideo;
    let config = configs.main;

    switch (compositionId) {
      case 'interpolation': Component = MovingBox; config = configs.interpolation; break;
      case 'dashboard': Component = Dashboard; config = configs.dashboard; break;
      case 'audio': Component = AudioShowcase; config = configs.audio; break;
      case 'easing': Component = EasingShowcase; config = configs.easing; break;
      case 'video': Component = VideoShowcase; config = configs.video; break;
    }

    return (
      <CompositionProvider
        config={config}
        frame={(window as any).__OPEN_MOTION_FRAME__}
        inputProps={inputProps}
      >
        <Component />
      </CompositionProvider>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ marginBottom: 40, borderBottom: '1px solid #e2e8f0', paddingBottom: 20 }}>
        <h1 style={{ margin: 0, color: '#0f172a' }}>OpenMotion Professional Showcase</h1>
        <p style={{ color: '#64748b' }}>A high-performance programmatic video engine built with React</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(600px, 1fr))', gap: '40px' }}>
        <section style={sectionStyle}>
          <h3>🎬 Main Demo Video</h3>
          <Player
            component={DemoVideo}
            config={configs.main}
            inputProps={{ title: 'OpenMotion 1.0', backgroundColor: '#f0f9ff' }}
            autoPlay
            loop
          />
        </section>

        <section style={sectionStyle}>
          <h3>📈 Data Dashboard</h3>
          <Player
            component={Dashboard}
            config={configs.dashboard}
            autoPlay
            loop
          />
        </section>

        <section style={sectionStyle}>
          <h3>🎵 Multi-track Audio</h3>
          <Player
            component={AudioShowcase}
            config={configs.audio}
            autoPlay
            loop
          />
        </section>

        <section style={sectionStyle}>
          <h3>✨ Professional Easing</h3>
          <Player
            component={EasingShowcase}
            config={configs.easing}
            autoPlay
            loop
          />
        </section>

        <section style={sectionStyle}>
          <h3>📹 Advanced Video Features</h3>
          <Player
            component={VideoShowcase}
            config={configs.video}
            autoPlay
            loop
          />
        </section>

        <section style={sectionStyle}>
          <h3>📦 Interpolation & Physics</h3>
          <Player
            component={MovingBox}
            config={configs.interpolation}
            autoPlay
            loop
          />
        </section>
      </div>

      {/* Registration for CLI Rendering */}
      <div style={{ display: 'none' }}>
        <Composition id="main" component={DemoVideo} {...configs.main} />
        <Composition id="interpolation" component={MovingBox} {...configs.interpolation} />
        <Composition id="dashboard" component={Dashboard} {...configs.dashboard} />
        <Composition id="audio" component={AudioShowcase} {...configs.audio} />
        <Composition id="easing" component={EasingShowcase} {...configs.easing} />
        <Composition id="video" component={VideoShowcase} {...configs.video} />
      </div>
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