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
import { Transition, ThreeCanvas, Lottie } from '@open-motion/components';
import * as THREE from 'three';

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
        <h1 style={{ fontSize: 60 }}>Integrations & 3D</h1>
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
          <h3>Lottie Animation</h3>
          <div style={{ width: 300, height: 300, backgroundColor: '#1e293b', borderRadius: 20 }}>
            <Lottie url="https://assets10.lottiefiles.com/packages/lf20_m6cuL6.json" />
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
