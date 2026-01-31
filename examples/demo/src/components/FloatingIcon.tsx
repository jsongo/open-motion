import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from '@open-motion/core';

export const FloatingIcon: React.FC<{ Icon: any; color: string; delay: number }> = ({ Icon, color, delay }) => {
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