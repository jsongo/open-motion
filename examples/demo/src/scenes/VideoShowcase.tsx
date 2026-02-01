import React from 'react';
import { OffthreadVideo, useCurrentFrame, interpolate } from '@open-motion/core';

export const VideoShowcase = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1]);
  const scale = interpolate(frame, [0, 150], [1, 1.1]);

  return (
    <div style={{
      flex: 1,
      backgroundColor: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px',
      color: 'white',
      width: '100%',
      height: '100%',
      fontFamily: 'system-ui, sans-serif',
      overflow: 'hidden'
    }}>
      <div style={{ marginBottom: 30, opacity: titleOpacity }}>
        <h2 style={{ margin: 0, fontSize: 32, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Off-thread Cinematic Video
        </h2>
        <p style={{ color: '#64748b' }}>Enhanced performance: decoding moved from browser to background process</p>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center', transform: `scale(${scale})` }}>
        {[
          { label: 'MASTER (1.0x)', rate: 1, start: 2000, end: undefined, color: '#3b82f6' },
          { label: 'SLOW MOTION (0.5x)', rate: 0.5, start: 2000, end: undefined, color: '#8b5cf6' },
          { label: 'FAST FORWARD (2.0x)', rate: 2, start: 2000, end: undefined, color: '#f59e0b' },
          { label: 'CLIPPED ACTION', rate: 1, start: 2000, end: 60, color: '#ef4444' },
        ].map((item, i) => (
          <div key={i} style={{ width: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: item.color }}>{item.label}</span>
              <span style={{ fontSize: 10, color: '#444' }}>TYPE: OFF-THREAD DECODING</span>
            </div>
            <div style={{
              width: '100%',
              height: '250px',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#000',
              border: `1px solid ${item.color}44`,
              boxShadow: `0 10px 30px ${item.color}22`
            }}>
              <OffthreadVideo
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                startFrom={item.start}
                playbackRate={item.rate}
                endAt={item.end}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ flex: 1, height: 2, backgroundColor: '#333' }}>
          <div style={{ width: `${(frame / 150) * 100}%`, height: '100%', backgroundColor: '#3b82f6' }} />
        </div>
        <span style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>SEC: {(frame / 30).toFixed(2)}s</span>
      </div>
    </div>
  );
};
