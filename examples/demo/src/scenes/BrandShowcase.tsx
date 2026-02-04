import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Easing
} from '@open-motion/core';

export const BrandShowcase = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const logoScale = spring({
    frame: frame,
    fps,
    config: { stiffness: 100, damping: 10 }
  });

  const titleOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const titleTranslateY = interpolate(frame, [20, 50], [20, 0], {
    easing: Easing.out,
    extrapolateLeft: 'clamp'
  });

  return (
    <div style={{
      backgroundColor: 'white',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        width: 150,
        height: 150,
        backgroundColor: '#3b82f6',
        borderRadius: '30%',
        transform: `scale(${logoScale}) rotate(${frame * 2}deg)`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 20px 50px rgba(59, 130, 246, 0.3)'
      }}>
        <div style={{ width: 60, height: 60, backgroundColor: 'white', borderRadius: '50%' }} />
      </div>

      <div style={{
        marginTop: 40,
        opacity: titleOpacity,
        transform: `translateY(${titleTranslateY}px)`,
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: 64, fontWeight: 900, letterSpacing: '-0.05em', color: '#1e293b' }}>
          Open<span style={{ color: '#3b82f6' }}>Motion</span>
        </h1>
        <p style={{ margin: '10px 0 0', fontSize: 24, color: '#64748b', fontWeight: 500 }}>
          High-Performance Programmatic Video
        </p>
      </div>
    </div>
  );
};
