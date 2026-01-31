import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from '@open-motion/core';

export const Dashboard = () => {
  const frame = useCurrentFrame();

  // Multi-segment interpolation for a "loading" progress bar
  const progress = interpolate(
    frame,
    [0, 30, 60, 90],
    [0, 30, 35, 100], // Slower in the middle, then speeds up
    { extrapolateRight: 'clamp' }
  );

  // Animated count
  const count = interpolate(frame, [0, 90], [0, 4520], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      flex: 1,
      backgroundColor: '#0f172a',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      fontFamily: 'monospace'
    }}>
      <div style={{ fontSize: 24, marginBottom: 40, color: '#94a3b8' }}>SYSTEM PERFORMANCE</div>

      <div style={{ display: 'flex', gap: 40, marginBottom: 60 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#64748b' }}>REQUESTS</div>
          <div style={{ fontSize: 48, fontWeight: 'bold', color: '#38bdf8' }}>
            {Math.floor(count).toLocaleString()}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#64748b' }}>UPTIME</div>
          <div style={{ fontSize: 48, fontWeight: 'bold', color: '#4ade80' }}>
            99.9%
          </div>
        </div>
      </div>

      <div style={{ width: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12 }}>
          <span>PROCESSING DATA...</span>
          <span>{Math.floor(progress)}%</span>
        </div>
        <div style={{
          width: '100%',
          height: 10,
          backgroundColor: '#1e293b',
          borderRadius: 5,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#38bdf8',
            boxShadow: '0 0 10px #38bdf8'
          }} />
        </div>
      </div>

      <div style={{ marginTop: 60, display: 'flex', gap: 10 }}>
        {[...Array(10)].map((_, i) => {
          const barHeight = interpolate(
            frame - i * 2,
            [0, 20, 40],
            [10, 40, 10],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          return (
            <div key={i} style={{
              width: 20,
              height: barHeight,
              backgroundColor: '#38bdf8',
              opacity: progress > i * 10 ? 1 : 0.2
            }} />
          );
        })}
      </div>
    </div>
  );
};