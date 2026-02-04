import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Audio, Easing } from '@open-motion/core';

export const AudioShowcase = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Simple progress helper
  const isActive = (start: number, end: number) => frame >= start && frame < end;

  return (
    <div style={{
      backgroundColor: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      width: '100%',
      height: '100%',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        width: '120%',
        height: '120%',
        background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 70%)',
        zIndex: 0
      }} />

      {/* Audio assets registration */}
      <Audio src="/test-audio.mp3" volume={0.5} />
      {frame >= 60 && <Audio src="/test-audio.mp3" startFrom={100} startFrame={60} volume={0.8} />}

      <div style={{ textAlign: 'center', marginBottom: 80, zIndex: 1 }}>
        <h2 style={{
          fontSize: 48,
          fontWeight: 900,
          margin: 0,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #60a5fa, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Multi-track Audio Mixing
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 20, marginTop: 15, fontWeight: 400 }}>
          Sample-accurate synchronization with independent volume control
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 15, height: 160, zIndex: 1 }}>
        {[...Array(12)].map((_, i) => {
          // Dynamic height animation
          const seed = (i * 137) % 100;
          const barHeight = interpolate(
            frame,
            [0 + i * 2, 10 + i * 2, 25 + i * 2, 40 + i * 2],
            [20 + seed / 5, 80 + seed / 4, 30 + seed / 5, 20 + seed / 5],
            { easing: Easing.inOut, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <div
              key={i}
              style={{
                width: 28,
                height: `${barHeight}%`,
                background: 'linear-gradient(to top, #3b82f6, #60a5fa)',
                borderRadius: '14px 14px 6px 6px',
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
                opacity: 0.3 + (barHeight / 100) * 0.7
              }}
            />
          );
        })}
      </div>

      <div style={{ marginTop: 80, display: 'flex', gap: 50, zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            boxShadow: '0 0 10px #3b82f6'
          }} />
          <span style={{ fontSize: 18, color: '#94a3b8', fontWeight: 500 }}>Ambient BGM</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          transition: 'opacity 0.3s ease',
          opacity: frame >= 60 ? 1 : 0.2
        }}>
          <div style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: '#a855f7',
            boxShadow: frame >= 60 ? '0 0 10px #a855f7' : 'none'
          }} />
          <span style={{ fontSize: 18, color: '#94a3b8', fontWeight: 500 }}>Action SFX</span>
        </div>
      </div>
    </div>
  );
};
