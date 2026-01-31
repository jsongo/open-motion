import React from 'react';
import { Video, useCurrentFrame } from '@open-motion/core';

export const VideoShowcase = () => {
  const frame = useCurrentFrame();

  return (
    <div style={{
      flex: 1,
      backgroundColor: '#111',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px',
      color: 'white',
      width: '100%',
      height: '100%',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ marginBottom: 30 }}>Video Component Enhancements</h2>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ width: '450px' }}>
          <p style={{ marginBottom: 10, color: '#94a3b8' }}>Normal Speed (1.0x)</p>
          <div style={{ width: '100%', height: '250px', borderRadius: '15px', overflow: 'hidden', backgroundColor: '#000' }}>
            <Video
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              startFrom={2000}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        <div style={{ width: '450px' }}>
          <p style={{ marginBottom: 10, color: '#94a3b8' }}>Slow Motion (0.5x)</p>
          <div style={{ width: '100%', height: '250px', borderRadius: '15px', overflow: 'hidden', backgroundColor: '#000' }}>
            <Video
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              startFrom={2000}
              playbackRate={0.5}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        <div style={{ width: '450px' }}>
          <p style={{ marginBottom: 10, color: '#94a3b8' }}>Fast Forward (2.0x)</p>
          <div style={{ width: '100%', height: '250px', borderRadius: '15px', overflow: 'hidden', backgroundColor: '#000' }}>
            <Video
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              startFrom={2000}
              playbackRate={2.0}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>

        <div style={{ width: '450px' }}>
          <p style={{ marginBottom: 10, color: '#94a3b8' }}>Clipped (endAt: 60)</p>
          <div style={{ width: '100%', height: '250px', borderRadius: '15px', overflow: 'hidden', backgroundColor: '#000' }}>
            <Video
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
              startFrom={2000}
              endAt={60}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'auto', color: '#666' }}>
        Frame: {Math.floor(frame)}
      </div>
    </div>
  );
};