import { CompositionProvider, Composition } from '@open-motion/core';
import { ShowcaseVideo } from './scenes/media/ShowcaseVideo';
import { MediaShowcase } from './scenes/media/MediaShowcase';
import { CenteringShowcase } from './scenes/layout/CenteringShowcase';
import { IntegrationsShowcase } from './scenes/integrations/IntegrationsShowcase';
import { HelloWorldVideo } from './scenes/hello-world';

export const App = () => {
  const isRendering = typeof (window as any).__OPEN_MOTION_FRAME__ === 'number';
  const compositionId = (window as any).__OPEN_MOTION_COMPOSITION_ID__;
  const frame = (window as any).__OPEN_MOTION_FRAME__ || 0;

  const featureConfig = { width: 1280, height: 720, fps: 30, durationInFrames: 360 };
  const mediaConfig = { width: 1280, height: 720, fps: 30, durationInFrames: 240 };
  const centeringConfig = { width: 1280, height: 720, fps: 30, durationInFrames: 60 };
  const integrationsConfig = { width: 1280, height: 720, fps: 30, durationInFrames: 120 };
  const helloWorldConfig = { width: 1280, height: 720, fps: 30, durationInFrames: 90 };

  if (isRendering) {
    let Component = HelloWorldVideo;
    let activeConfig = helloWorldConfig;

    if (compositionId === 'feature-showcase') {
      Component = ShowcaseVideo;
      activeConfig = featureConfig;
    } else if (compositionId === 'media-showcase') {
      Component = MediaShowcase;
      activeConfig = mediaConfig;
    } else if (compositionId === 'centering-test') {
      Component = CenteringShowcase;
      activeConfig = centeringConfig;
    } else if (compositionId === 'integrations-showcase') {
      Component = IntegrationsShowcase;
      activeConfig = integrationsConfig;
    }

    return (
      <CompositionProvider config={activeConfig} frame={frame}>
        <Component />
      </CompositionProvider>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#f0f2f5' }}>
      <CompositionProvider config={helloWorldConfig} frame={frame}>
        <HelloWorldVideo />
        <div style={{ display: 'none' }}>
          <Composition id="hello-world" component={HelloWorldVideo} {...helloWorldConfig} />
          <Composition id="feature-showcase" component={ShowcaseVideo} {...featureConfig} />
          <Composition id="media-showcase" component={MediaShowcase} {...mediaConfig} />
          <Composition id="centering-test" component={CenteringShowcase} {...centeringConfig} />
          <Composition id="integrations-showcase" component={IntegrationsShowcase} {...integrationsConfig} />
        </div>
      </CompositionProvider>
    </div>
  );
};
