import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CompositionProvider, VideoConfig } from './index';

export interface PlayerProps {
  component: React.ComponentType<any>;
  config: VideoConfig;
  inputProps?: any;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
}

export const Player: React.FC<PlayerProps> = ({
  component: Component,
  config,
  inputProps = {},
  controls = true,
  autoPlay = false,
  loop = false,
}) => {
  const [frame, setFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>();

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== undefined) {
      const deltaTime = time - lastTimeRef.current;
      const frameStep = (deltaTime / 1000) * config.fps;

      setFrame((prevFrame) => {
        let nextFrame = prevFrame + frameStep;
        if (nextFrame >= config.durationInFrames) {
          if (loop) {
            nextFrame = 0;
          } else {
            nextFrame = config.durationInFrames - 1;
            setIsPlaying(false);
          }
        }
        return nextFrame;
      });
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [config.fps, config.durationInFrames, loop]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = undefined;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, animate]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrame(Number(e.target.value));
    setIsPlaying(false);
  };

  return (
    <div style={{ display: 'inline-block', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
      <div
        style={{
          width: config.width,
          height: config.height,
          position: 'relative',
          background: '#000',
          overflow: 'hidden'
        }}
      >
        <CompositionProvider config={config} frame={Math.floor(frame)} inputProps={inputProps}>
          <Component />
        </CompositionProvider>
      </div>

      {controls && (
        <div style={{ padding: '10px', background: '#f0f0f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={togglePlay}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <input
            type="range"
            min="0"
            max={config.durationInFrames - 1}
            step="1"
            value={Math.floor(frame)}
            onChange={handleSeek}
            style={{ flex: 1 }}
          />
          <div style={{ minWidth: '80px', fontSize: '12px', textAlign: 'right' }}>
            {Math.floor(frame)} / {config.durationInFrames}
          </div>
        </div>
      )}
    </div>
  );
};
