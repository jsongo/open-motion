import React from 'react';
import { useCurrentFrame, interpolate, Easing } from '@open-motion/core';

export const EasingShowcase = () => {
  const frame = useCurrentFrame();

  const easings = [
    { name: 'linear', fn: Easing.linear, color: '#ef4444' },
    { name: 'ease', fn: Easing.ease, color: '#f59e0b' },
    { name: 'in', fn: Easing.in, color: '#10b981' },
    { name: 'out', fn: Easing.out, color: '#3b82f6' },
    { name: 'inOut', fn: Easing.inOut, color: '#8b5cf6' },
  ];

  return (
    <div style={{
      flex: 1,
      backgroundColor: '#111',
      padding: '50px',
      color: 'white',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ marginBottom: 40 }}>Easing Curves Showcase</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
        {easings.map((e) => {
          const x = interpolate(frame % 90, [0, 60], [0, 800], {
            extrapolateRight: 'clamp',
            easing: e.fn
          });
          return (
            <div key={e.name} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 100, fontSize: 18, fontWeight: 'bold' }}>{e.name}</div>
              <div style={{
                width: '900px',
                height: 50,
                backgroundColor: '#222',
                position: 'relative',
                borderRadius: 25,
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  left: x,
                  width: 50,
                  height: 50,
                  backgroundColor: e.color,
                  borderRadius: '50%',
                  boxShadow: `0 0 20px ${e.color}`
                }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 'auto', color: '#666' }}>
        Frame: {Math.floor(frame)} (repeats every 90 frames)
      </div>
    </div>
  );
};