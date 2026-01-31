import React, { useEffect, useState } from 'react';
import {
  CompositionProvider,
  useCurrentFrame,
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
import { Rocket, Star, Heart, Cloud, Sun } from 'lucide-react';

// --- Components ---

const FloatingIcon: React.FC<{ Icon: any; color: string; delay: number }> = ({ Icon, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const y = interpolate(frame, [0, 60], [10, -10], { extrapolateRight: 'clamp' });
  const opacity = interpolate(frame - delay, [0, 20], [0, 1]);
  const scale = spring({
    frame: frame - delay,
    fps,
    config: { stiffness: 100 }
  });

  return (
    <div style={{
      opacity,
      transform: `translateY(${y}px) scale(${scale})`,
      color,
      margin: '0 20px'
    }}>
      <Icon size={64} />
    </div>
  );
};

const AsyncImage: React.FC<{ src: string }> = ({ src }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handle = delayRender(`Loading image: ${src}`);
    console.debug(`[OpenMotion] Starting load for image: ${src}`);
    const img = new Image();
    img.src = src;
    img.onload = () => {
      console.debug(`[OpenMotion] Successfully loaded image: ${src}`);
      setLoaded(true);
      continueRender(handle);
    };
    img.onerror = () => {
      console.error(`[OpenMotion] Failed to load image: ${src}`);
      setError(true);
      continueRender(handle);
    };
  }, [src]);

  if (error) {
    return (
      <div style={{
        width: '400px',
        height: '225px',
        backgroundColor: '#eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '20px',
        color: '#666'
      }}>
        Failed to load image
      </div>
    );
  }

  if (!loaded) {
    return (
      <div style={{
        width: '400px',
        height: '225px',
        backgroundColor: '#f5f5f5',
        borderRadius: '20px'
      }} />
    );
  }

  return (
    <img
      src={src}
      style={{
        width: '400px',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}
    />
  );
};

const MovingBox = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20, 70, 90], [0, 1, 1, 0]);
  const x = interpolate(frame, [0, 90], [0, width - 100]);
  const rotation = interpolate(frame, [30, 60], [0, 360], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [0, 20], [0.5, 1], { extrapolateLeft: 'clamp' });

  return (
    <div style={{
      flex: 1,
      backgroundColor: '#111',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        left: x,
        width: '150px',
        height: '150px',
        backgroundColor: '#00ff00',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'black',
        fontWeight: 'bold',
        opacity,
        transform: `rotate(${rotation}deg) scale(${scale})`,
        borderRadius: '20px',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)'
      }}>
        <div>{Math.floor(frame)}</div>
        <div style={{ fontSize: '12px' }}>Interpolated</div>
      </div>

      <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', fontSize: '20px' }}>
        Frame: {Math.floor(frame)}
      </div>
    </div>
  );
};

// --- Main Demo Video ---

const DemoVideo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  console.debug('OpenMotion: DemoVideo rendering at frame', frame);
  const {
    title = 'OpenMotion Demo',
    backgroundColor = '#ffffff'
  } = getInputProps<{ title?: string; backgroundColor?: string }>();

  return (
    <div style={{
      flex: 1,
      backgroundColor: backgroundColor,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, sans-serif',
      opacity: 1,
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Scene 1: Welcome */}
      <Sequence from={0} durationInFrames={60}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 1, position: 'relative', zIndex: 10 }}>
          <h1 style={{
            fontSize: 80,
            margin: 0,
            color: '#1a1a1a',
            opacity: 1,
            transform: `translateY(${interpolate(frame, [0, 30], [50, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px)`,
          }}>
            {title}
          </h1>
          <div style={{ display: 'flex', marginTop: 20 }}>
            <FloatingIcon Icon={Rocket} color="#3b82f6" delay={10} />
            <FloatingIcon Icon={Star} color="#eab308" delay={20} />
          </div>
        </div>
      </Sequence>

      {/* Scene 2: Physics & Icons */}
      <Sequence from={60} durationInFrames={60}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FloatingIcon Icon={Heart} color="#ef4444" delay={0} />
          <div style={{ fontSize: 40, fontWeight: 'bold' }}>Physics-based Springs</div>
          <FloatingIcon Icon={Cloud} color="#60a5fa" delay={15} />
        </div>
      </Sequence>

      {/* Scene 3: Async Assets */}
      <Sequence from={120} durationInFrames={90}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>Remote Assets (Async)</div>
          <AsyncImage src="https://picsum.photos/800/450" />
        </div>
      </Sequence>

      {/* Scene 4: Conclusion */}
      <Sequence from={210}>
        <div style={{ textAlign: 'center' }}>
          <Sun size={100} color="#f59e0b" style={{
            transform: `rotate(${frame * 2}deg) scale(${spring({ frame: frame - 210, fps })})`
          }} />
          <div style={{ fontSize: 60, marginTop: 20 }}>Built with OpenMotion</div>
        </div>
      </Sequence>

    </div>
  );
};

// --- App Wrapper ---

export const App = () => {
  const demoConfig = {
    width: 1280,
    height: 720,
    fps: 30,
    durationInFrames: 300
  };

  const interpolationConfig = {
    width: 1280,
    height: 720,
    fps: 30,
    durationInFrames: 90
  };

  const isRendering = typeof (window as any).__OPEN_MOTION_FRAME__ === 'number';

  if (isRendering) {
    const inputProps = (window as any).__OPEN_MOTION_INPUT_PROPS__ || {};
    // Default to DemoVideo if no specific composition is selected,
    // but in rendering mode the Player usually isn't used.
    // The CLI/Renderer will look for Composition definitions.
    return (
      <CompositionProvider config={demoConfig} frame={(window as any).__OPEN_MOTION_FRAME__} inputProps={inputProps}>
        <DemoVideo />
      </CompositionProvider>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>OpenMotion Demo & Tests</h1>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        <section>
          <h3>Main Demo Video</h3>
          <Player
            component={DemoVideo}
            config={demoConfig}
            inputProps={{ title: 'The Future of Video', backgroundColor: '#e0f2fe' }}
            loop
          />
        </section>

        <section>
          <h3>Interpolation Test</h3>
          <Player
            component={MovingBox}
            config={interpolationConfig}
            loop
          />
        </section>
      </div>

      <div style={{ display: 'none' }}>
        <Composition
          id="main"
          component={DemoVideo}
          {...demoConfig}
        />
        <Composition
          id="interpolation"
          component={MovingBox}
          {...interpolationConfig}
        />
      </div>
    </div>
  );
};
