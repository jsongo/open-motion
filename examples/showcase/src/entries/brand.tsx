import React from 'react';
import ReactDOM from 'react-dom/client';
import { CompositionProvider } from '@open-motion/core';
import { BrandShowcase } from '../scenes/BrandShowcase';

const config = { width: 1280, height: 720, fps: 30, durationInFrames: 450 };

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CompositionProvider
      config={config}
      frame={(window as any).__OPEN_MOTION_FRAME__ || 0}
    >
      <BrandShowcase />
    </CompositionProvider>
  </React.StrictMode>
);
