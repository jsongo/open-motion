import React, { useState, useEffect } from 'react';
import {
  CompositionProvider,
  useCurrentFrame,
  useVideoConfig,
  Player,
  Loop,
  Easing,
  interpolate,
  Composition,
  getVideoMetadata,
  getAudioDuration,
  delayRender,
  continueRender,
  parseSrt
} from '@open-motion/core';
import { Transition, ThreeCanvas, Lottie, Captions, TikTokCaption } from '@open-motion/components';
import * as THREE from 'three';

const SRT_CONTENT = `
1
00:00:00,000 --> 00:00:02,000
Welcome to OpenMotion

2
00:00:02,000 --> 00:00:04,000
Create videos with React
`;

export const IntegrationsShowcase = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const [videoMeta, setVideoMeta] = useState<{ duration: number } | null>(null);
  const subtitles = parseSrt(SRT_CONTENT);

  useEffect(() => {
    const handle = delayRender('Loading demo assets');
    getVideoMetadata('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4')
      .then(meta => {
        setVideoMeta({ duration: meta.durationInSeconds });
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, []);

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
      overflow: 'hidden',
      position: 'relative'
    }}>
      <Transition type="slide" direction="top" style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 60, margin: 0 }}>Integrations & Subtitles</h1>
      </Transition>

      <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: 20 }}>TikTok Style Captions</h3>
          <div style={{
            width: 500,
            height: 300,
            backgroundColor: '#1e293b',
            borderRadius: 20,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
            position: 'relative'
          }}>
            <Captions
              subtitles={subtitles}
              renderCaption={(text) => <TikTokCaption text={text} active={true} />}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: 20 }}>Three.js Background</h3>
          <ThreeCanvas
            width={300}
            height={300}
            init={(scene, camera) => {
              const geometry = new THREE.TorusKnotGeometry(0.8, 0.3, 100, 16);
              const material = new THREE.MeshStandardMaterial({ color: 0xee00ff });
              const mesh = new THREE.Mesh(geometry, material);
              mesh.name = 'knot';
              scene.add(mesh);
              scene.add(new THREE.PointLight(0xffffff, 1).set(2, 2, 5));
              camera.position.z = 3;
            }}
            renderScene={(scene, _camera, frame) => {
              const mesh = scene.getObjectByName('knot');
              if (mesh) mesh.rotation.y = frame * 0.02;
            }}
            style={{ borderRadius: 20, backgroundColor: '#1e293b' }}
          />
        </div>
      </div>

      <div style={{ marginTop: 40, display: 'flex', gap: 20, alignItems: 'center' }}>
        <Loop durationInFrames={40}>
          <div style={{ padding: '10px 20px', backgroundColor: '#3b82f6', borderRadius: 10, fontWeight: 'bold' }}>
            Looping UI Component
          </div>
        </Loop>
        <p style={{ margin: 0, color: '#888' }}>
          Video Meta: {videoMeta ? `${videoMeta.duration.toFixed(1)}s` : 'loading...'}
        </p>
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
