import { CompositionProvider, Composition } from '@open-motion/core';
import { ShowcaseVideo } from './scenes/ShowcaseVideo';
import { MediaShowcase } from './scenes/MediaShowcase';
import { CenteringShowcase } from './scenes/CenteringShowcase';

export const App = () => {
  const isRendering = typeof (window as any).__OPEN_MOTION_FRAME__ === 'number';
  const compositionId = (window as any).__OPEN_MOTION_COMPOSITION_ID__;
  const frame = (window as any).__OPEN_MOTION_FRAME__ || 0;

  const featureConfig = { width: 1280, height: 720, fps: 30, durationInFrames: 360 };
  const mediaConfig = { width: 1280, height: 720, fps: 30, durationInFrames: 240 };
  const centeringConfig = { width: 1280, height: 720, fps: 30, durationInFrames: 60 };

  if (isRendering) {
    let Component = ShowcaseVideo;
    let activeConfig = featureConfig;

    if (compositionId === 'media-showcase') {
      Component = MediaShowcase;
      activeConfig = mediaConfig;
    } else if (compositionId === 'centering-test') {
      Component = CenteringShowcase;
      activeConfig = centeringConfig;
    }

    return (
      <CompositionProvider config={activeConfig} frame={frame}>
        <Component />
      </CompositionProvider>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#f0f2f5' }}>
      <CompositionProvider config={centeringConfig} frame={frame}>
        <CenteringShowcase />
        <div style={{ display: 'none' }}>
          <Composition id="feature-showcase" component={ShowcaseVideo} {...featureConfig} />
          <Composition id="media-showcase" component={MediaShowcase} {...mediaConfig} />
          <Composition id="centering-test" component={CenteringShowcase} {...centeringConfig} />
        </div>
      </CompositionProvider>
    </div>
  );
};
