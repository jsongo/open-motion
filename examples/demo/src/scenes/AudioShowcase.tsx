import React from 'react';
import { useCurrentFrame, Sequence, Audio, interpolate } from '@open-motion/core';

export const AudioShowcase = () => {
  const frame = useCurrentFrame();

  const bar1 = interpolate(frame % 10, [0, 5, 10], [20, 100, 20]);
  const bar2 = interpolate((frame + 3) % 12, [0, 6, 12], [30, 80, 30]);
  const bar3 = interpolate((frame + 6) % 8, [0, 4, 8], [40, 120, 40]);

  return (
    <div style={{
      flex: 1,
      backgroundColor: '#000',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      height: '100%',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ marginBottom: 40 }}>Multi-track Audio Mixing (v3-REAL-AUDIO)</h2>

      <div style={{ position: 'absolute', top: 20, right: 20, background: 'red', padding: '10px', color: 'white', fontWeight: 'bold' }}>
        VERSION: REAL_AUDIO_GEN_3
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150, marginBottom: 40 }}>
        {[bar1, bar2, bar3, bar2, bar1, bar3, bar2].map((h, i) => (
          <div key={i} style={{ width: 30, height: h, backgroundColor: '#38bdf8', borderRadius: 5 }} />
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ color: progress(frame, 0, 300) ? '#38bdf8' : '#666' }}>Track 1: Background Music (Always)</p>
        <p style={{ color: progress(frame, 60, 120) ? '#38bdf8' : '#666' }}>Track 2: Ambient Effect (From frame 60)</p>
        <p style={{ color: progress(frame, 150, 240) ? '#38bdf8' : '#666' }}>Track 3: Narrative Overlay (From frame 150)</p>
      </div>

      <Audio src="/test-audio.mp3" volume={0.3} />

      <Sequence from={60}>
        <Audio src="/test-audio.mp3" startFrom={100} volume={0.5} />
      </Sequence>

      <Sequence from={150}>
        <Audio src="/test-audio.mp3" startFrom={200} volume={0.7} />
      </Sequence>
    </div>
  );
};

const progress = (frame: number, start: number, duration: number) => {
  return frame >= start && frame < start + duration;
};