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
  continueRender
} from '@open-motion/core';
import { Transition, ThreeCanvas, Lottie } from '@open-motion/components';
import * as THREE from 'three';

const DemoVideo = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const [videoMeta, setVideoMeta] = useState<{ duration: number } | null>(null);

  useEffect(() => {
    const handle = delayRender('Loading demo assets');
    getVideoMetadata('https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4')
      .then(meta => {
        setVideoMeta({ duration: meta.durationInSeconds });
        continueRender(handle);
      });
  }, []);

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
        <h1 style={{ fontSize: 60 }}>Integrations & Media Info</h1>
      </Transition>

      <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h3>Three.js (3D Cube)</h3>
          <ThreeCanvas
            width={300}
            height={300}
            init={(scene, camera) => {
              const geometry = new THREE.BoxGeometry(1, 1, 1);
              const material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
              const cube = new THREE.Mesh(geometry, material);
              cube.name = 'cube';
              scene.add(cube);

              const light = new THREE.DirectionalLight(0xffffff, 1);
              light.position.set(2, 2, 5);
              scene.add(light);
              scene.add(new THREE.AmbientLight(0xffffff, 0.5));

              camera.position.z = 3;
            }}
            renderScene={(scene, _camera, frame) => {
              const cube = scene.getObjectByName('cube');
              if (cube) {
                cube.rotation.x = frame * 0.05;
                cube.rotation.y = frame * 0.05;
              }
            }}
            style={{ borderRadius: 20, backgroundColor: '#1e293b' }}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h3>Media Metadata</h3>
          <div style={{
            width: 300,
            height: 300,
            backgroundColor: '#1e293b',
            borderRadius: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 20,
            padding: 20
          }}>
            <p>Video Duration:</p>
            <p style={{ color: '#10b981', fontSize: 40, fontWeight: 'bold' }}>
              {videoMeta ? `${videoMeta.duration.toFixed(2)}s` : 'Loading...'}
            </p>
            <p style={{ fontSize: 14, color: '#888', marginTop: 20 }}>
              Captured using <code>getVideoMetadata()</code>
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40, display: 'flex', gap: 20 }}>
        <Loop durationInFrames={40}>
          <div style={{ padding: '10px 20px', backgroundColor: '#3b82f6', borderRadius: 10 }}>
            Looping UI
          </div>
        </Loop>
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
