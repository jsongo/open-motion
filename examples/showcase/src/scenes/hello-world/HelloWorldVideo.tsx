import React, { useEffect, useState, useRef } from 'react';
import {
  CompositionProvider,
  useCurrentFrame,
  useAbsoluteFrame,
  useVideoConfig,
  getInputProps,
  interpolate,
  spring,
  Sequence,
  Player,
  delayRender,
  continueRender,
  Composition
} from '@open-motion/core';

// A simple Lottie component using lottie-web from CDN
const Lottie: React.FC<{ url: string }> = ({ url }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<any>(null);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  useEffect(() => {
    const handle = delayRender('Loading Lottie animation');

    // Load lottie-web dynamically if not present
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
    script.onload = () => {
      if (containerRef.current) {
        animationRef.current = (window as any).lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: false,
          autoplay: false,
          path: url,
        });

        animationRef.current.addEventListener('DOMLoaded', () => {
          continueRender(handle);
        });
      }
    };
    if (document.head) {
      document.head.appendChild(script);
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
      }
    };
  }, [url]);

  useEffect(() => {
    if (animationRef.current) {
      // Manually set frame to ensure synchronization
      // lottie-web uses frames, so we can go directly
      animationRef.current.goToAndStop(frame, true);
    }
  }, [frame]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

const HelloWorldVideo = () => {
  const frame = useCurrentFrame();
  const absoluteFrame = useAbsoluteFrame();
  const { width, height, fps } = useVideoConfig();
  const { title = 'OpenMotion' } = getInputProps<{ title?: string }>();

  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  const scale = spring({
    frame: frame - 10,
    fps,
    config: { stiffness: 100 }
  });

  return (
    <div style={{
      backgroundColor: 'white',
      width,
      height,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: 80,
      fontWeight: 'bold',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ opacity, transform: `scale(${scale})` }}>
        Hello <span style={{ color: '#00aaff' }}>{title}</span>
      </div>

      <div style={{ position: 'absolute', top: 50, right: 50, width: 300, height: 300 }}>
        <Lottie url="https://assets10.lottiefiles.com/packages/lf20_m6cuL6.json" />
      </div>

      <Sequence from={40} durationInFrames={30}>
        <div style={{ position: 'absolute', bottom: 100, fontSize: 40, textAlign: 'center' }}>
          <div>Current Frame: {frame}</div>
          <div style={{ fontSize: 20, color: '#888' }}>Absolute Frame: {absoluteFrame}</div>
        </div>
      </Sequence>
    </div>
  );
};

export const App = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handle = delayRender('Mock initial loading');
    setTimeout(() => {
      setIsReady(true);
      continueRender(handle);
    }, 1000);
  }, []);

  // Check if we are in rendering mode (provided by renderer)
  const isRendering = typeof (window as any).__OPEN_MOTION_FRAME__ === 'number';

  if (!isReady && !isRendering) {
    return <div>Loading resources...</div>;
  }

  const config = {
    width: 1280,
    height: 720,
    fps: 30,
    durationInFrames: 90
  };

  if (isRendering) {
    const compositionId = (window as any).__OPEN_MOTION_COMPOSITION_ID__ || 'hello-world';
    const inputProps = (window as any).__OPEN_MOTION_INPUT_PROPS__ || {};
    // In a real implementation, we would look up the config by ID
    // For this example, we just use the default
    return (
      <CompositionProvider config={config} frame={(window as any).__OPEN_MOTION_FRAME__} inputProps={inputProps}>
        <HelloWorldVideo />
      </CompositionProvider>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>OpenMotion Player Preview</h1>
      <Player
        component={HelloWorldVideo}
        config={config}
        inputProps={{ title: 'Claude Preview' }}
        loop
      />

      {/* Register compositions for the CLI/Renderer to find */}
      <div style={{ display: 'none' }}>
        <Composition
          id="hello-world"
          component={HelloWorldVideo}
          width={1280}
          height={720}
          fps={30}
          durationInFrames={90}
        />
      </div>
    </div>
  );
};
