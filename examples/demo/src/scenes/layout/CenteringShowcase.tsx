import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from '@open-motion/core';

export const CenteringShowcase = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // 入场动画：缩放 + 透明度
  const spr = spring({
    frame,
    fps,
    config: {
      stiffness: 100,
      damping: 10,
    },
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000', // 黑色背景，方便观察边界
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* 辅助参考线：水平中线 */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '1px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        top: '50%',
        left: 0,
      }} />

      {/* 辅助参考线：垂直中线 */}
      <div style={{
        position: 'absolute',
        width: '1px',
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        left: '50%',
        top: 0,
      }} />

      <div
        style={{
          padding: '40px 80px',
          backgroundColor: '#3b82f6',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(59, 130, 246, 0.5)',
          transform: `scale(${spr})`,
          opacity: spr,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <h1 style={{
          color: 'white',
          fontSize: '64px',
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 900,
        }}>
          CENTERED
        </h1>
        <div style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: '24px',
          fontFamily: 'monospace',
        }}>
          {width} x {height} @ {Math.round(frame)}f
        </div>
      </div>
    </div>
  );
};
