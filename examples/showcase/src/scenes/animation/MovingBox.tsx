import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from '@open-motion/core';

export const MovingBox = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20, 70, 90], [0, 1, 1, 0]);
  const x = interpolate(frame, [0, 90], [0, width - 150]);
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