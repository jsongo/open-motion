import React from 'react';

export interface AudioProps {
  src: string;
  startFrom?: number;
  startFrame?: number;
  volume?: number;
}

export const Audio: React.FC<AudioProps> = (props) => {
  const startFrame = props.startFrame ?? 0;

  if (typeof window !== 'undefined') {
    (window as any).__OPEN_MOTION_AUDIO_ASSETS__ = (window as any).__OPEN_MOTION_AUDIO_ASSETS__ || [];
    const exists = (window as any).__OPEN_MOTION_AUDIO_ASSETS__.find(
      (a: any) =>
        a.src === props.src &&
        (a.startFrom || 0) === (props.startFrom || 0) &&
        (a.volume || 1) === (props.volume || 1) &&
        a.startFrame === startFrame
    );
    if (!exists) {
      console.log('[Audio] Registering asset:', props.src, 'startFrame:', startFrame, 'volume:', props.volume);
      (window as any).__OPEN_MOTION_AUDIO_ASSETS__.push({
        ...props,
        startFrame,
      });
    }
  }
  return null;
};
