import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  getInputProps,
  interpolate,
  spring,
  Sequence,
  Video
} from '@open-motion/core';
import { Rocket, Star, Heart, Cloud, Sun } from 'lucide-react';
import { FloatingIcon } from '../components/FloatingIcon';
import { AsyncImage } from '../components/AsyncImage';

export const DemoVideo = () => {
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

      {/* Scene 3: Video & Async Assets */}
      <Sequence from={120} durationInFrames={90}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>Video & Async Assets</div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <AsyncImage src="https://picsum.photos/400/225" />
            <div style={{
              width: '400px',
              height: '225px',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              backgroundColor: '#000'
            }}>
              <Video
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                style={{ width: '100%', height: '100%' }}
                startFrom={1000} // Start from frame 1000 of the source video
              />
            </div>
          </div>
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