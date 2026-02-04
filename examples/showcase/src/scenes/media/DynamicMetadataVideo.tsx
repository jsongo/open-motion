import React from 'react';
import {
  CompositionProvider,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Composition,
  delayRender,
  continueRender,
  getVideoMetadata
} from '@open-motion/core';
import { Video } from '@open-motion/core';

export const DynamicMetadataVideo = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const progress = interpolate(frame, [0, 60], [0, 1], {
    extrapolateRight: 'clamp'
  });

  return (
    <div style={{
      width,
      height,
      backgroundColor: '#0f172a',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'sans-serif',
      position: 'relative'
    }}>
      <h1 style={{
        fontSize: 60,
        margin: 0,
        opacity: progress,
        transform: `translateY(${interpolate(frame, [0, 60], [50, 0])}px)`,
        textAlign: 'center'
      }}>
        Dynamic Metadata Demo
      </h1>
      <p style={{
        fontSize: 24,
        marginTop: 20,
        opacity: progress,
        color: '#94a3b8',
        textAlign: 'center'
      }}>
        Video dimensions loaded dynamically
      </p>
    </div>
  );
};

export const App = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>OpenMotion Dynamic Metadata Demo</h1>
      <p>This demo shows dynamic metadata calculation based on input props.</p>
      <div style={{ display: 'none' }}>
        <Composition
          id="dynamic-metadata-demo"
          component={DynamicMetadataVideo}
          calculateMetadata={async (props: any) => {
            const handle = delayRender('Loading video metadata');
            try {
              if (props.videoUrl) {
                const meta = await getVideoMetadata(props.videoUrl);
                continueRender(handle);
                return {
                  width: meta.width,
                  height: meta.height,
                  durationInFrames: Math.ceil(meta.durationInSeconds * 30)
                };
              }
            } catch (error) {
              console.error('Failed to load metadata:', error);
              continueRender(handle);
            }
            return {
              width: 1280,
              height: 720,
              durationInFrames: 90
            };
          }}
        />
      </div>
    </div>
  );
};
