import React, { createContext, useContext } from 'react';

export interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}

const VideoConfigContext = createContext<VideoConfig | null>(null);
const FrameContext = createContext<number>(0);
const AbsoluteFrameContext = createContext<number>(0);
const InputPropsContext = createContext<any>({});

export const CompositionProvider: React.FC<{
  config: VideoConfig;
  frame: number;
  inputProps?: any;
  children: React.ReactNode;
}> = ({ config, frame, inputProps = {}, children }) => {
  const [currentFrame, setCurrentFrame] = React.useState(frame);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__OPEN_MOTION_READY__ = true;
    }
  }, [currentFrame]);

  React.useEffect(() => {
    setCurrentFrame(frame);
  }, [frame]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const handler = (e: any) => {
        if (typeof e.detail?.frame === 'number') {
          setCurrentFrame(e.detail.frame);
        }
      };
      window.addEventListener('open-motion-frame-update', handler);
      return () => window.removeEventListener('open-motion-frame-update', handler);
    }
  }, []);

  return (
    <VideoConfigContext.Provider value={config}>
      <InputPropsContext.Provider value={inputProps}>
        <AbsoluteFrameContext.Provider value={currentFrame}>
          <FrameContext.Provider value={currentFrame}>
            <div
              key={currentFrame}
              style={{
                width: config.width,
                height: config.height,
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {children}
            </div>
          </FrameContext.Provider>
        </AbsoluteFrameContext.Provider>
      </InputPropsContext.Provider>
    </VideoConfigContext.Provider>
  );
};

export const useVideoConfig = () => {
  const context = useContext(VideoConfigContext);
  if (!context) {
    return { width: 1920, height: 1080, fps: 30, durationInFrames: 100 };
  }
  return context;
};

export const useCurrentFrame = () => {
  return useContext(FrameContext);
};

export const useAbsoluteFrame = () => {
  return useContext(AbsoluteFrameContext);
};

export const getInputProps = <T extends any>(): T => {
  return useContext(InputPropsContext);
};

// --- Composition Registry ---

export interface CompositionProps extends VideoConfig {
  id: string;
  component: React.ComponentType<any>;
}

const compositions: Map<string, CompositionProps> = new Map();

export const registerComposition = (props: CompositionProps) => {
  compositions.set(props.id, props);
  if (typeof window !== 'undefined') {
    (window as any).__OPEN_MOTION_COMPOSITIONS__ = Array.from(compositions.values());
  }
};

export const getCompositions = () => Array.from(compositions.values());
export const getCompositionById = (id: string) => compositions.get(id);

/**
 * Composition Component (Remotion compatible)
 */
export const Composition: React.FC<CompositionProps> = (props) => {
  registerComposition(props);
  return null;
};

// --- Rendering Synchronization ---

let delayRenderCounter = 0;

/**
 * delayRender: Signal that an async resource is being loaded.
 */
export const delayRender = (label?: string) => {
  const handle = delayRenderCounter++;
  if (typeof window !== 'undefined') {
    (window as any).__OPEN_MOTION_DELAY_RENDER_COUNT__ = ((window as any).__OPEN_MOTION_DELAY_RENDER_COUNT__ || 0) + 1;
    console.debug(`[OpenMotion] delayRender: ${label || handle}, count: ${(window as any).__OPEN_MOTION_DELAY_RENDER_COUNT__}`);
  }
  return handle;
};

/**
 * continueRender: Signal that an async resource has finished loading.
 */
export const continueRender = (handle: number) => {
  if (typeof window !== 'undefined') {
    (window as any).__OPEN_MOTION_DELAY_RENDER_COUNT__ = Math.max(0, ((window as any).__OPEN_MOTION_DELAY_RENDER_COUNT__ || 0) - 1);
    console.debug(`[OpenMotion] continueRender: ${handle}, count: ${(window as any).__OPEN_MOTION_DELAY_RENDER_COUNT__}`);
  }
};

/**
 * interpolate function: maps a value from one range to another.
 * Compatible with Remotion's interpolate.
 */
export const interpolate = (
  input: number,
  inputRange: number[],
  outputRange: number[],
  options?: { extrapolateLeft?: 'extrapolate' | 'clamp'; extrapolateRight?: 'extrapolate' | 'clamp' }
) => {
  if (inputRange.length < 2) return outputRange[0];

  // Simple linear interpolation between multiple segments
  for (let i = 0; i < inputRange.length - 1; i++) {
    const minInput = inputRange[i];
    const maxInput = inputRange[i + 1];
    const minOutput = outputRange[i];
    const maxOutput = outputRange[i + 1];

    if (input >= minInput && input <= maxInput) {
      return minOutput + ((input - minInput) / (maxInput - minInput)) * (maxOutput - minOutput);
    }
  }

  const firstInput = inputRange[0];
  const lastInput = inputRange[inputRange.length - 1];
  const firstOutput = outputRange[0];
  const lastOutput = outputRange[outputRange.length - 1];

  if (input < firstInput) {
    if (options?.extrapolateLeft === 'clamp') return firstOutput;
    // Extrapolate using first segment
    const nextInput = inputRange[1];
    const nextOutput = outputRange[1];
    return firstOutput + ((input - firstInput) / (nextInput - firstInput)) * (nextOutput - firstOutput);
  }

  if (input > lastInput) {
    if (options?.extrapolateRight === 'clamp') return lastOutput;
    // Extrapolate using last segment
    const prevInput = inputRange[inputRange.length - 2];
    const prevOutput = outputRange[outputRange.length - 2];
    return lastOutput + ((input - lastInput) / (lastInput - prevInput)) * (lastOutput - prevOutput);
  }

  return firstOutput;
};

/**
 * Time Hijacking Bridge Script
 */
export const getTimeHijackScript = (frame: number, fps: number) => {
  const timeMs = (frame / fps) * 1000;
  return `
    (function() {
      const timeMs = ${timeMs};
      const frame = ${frame};

      const OriginalDate = window.Date;
      function MockDate() {
        return new OriginalDate(timeMs);
      }
      MockDate.now = () => timeMs;
      MockDate.parse = OriginalDate.parse;
      MockDate.UTC = OriginalDate.UTC;
      MockDate.prototype = OriginalDate.prototype;
      window.Date = MockDate;

      if (window.performance) {
        window.performance.now = () => timeMs;
      }

      window.requestAnimationFrame = (callback) => {
        return setTimeout(() => callback(timeMs), 0);
      };
      window.cancelAnimationFrame = (id) => clearTimeout(id);
    })();
  `;
};

/**
 * Sequence Component
 */
export const Sequence: React.FC<{
  from: number;
  durationInFrames?: number;
  children: React.ReactNode;
}> = ({ from, durationInFrames, children }) => {
  const currentFrame = useCurrentFrame();
  const relativeFrame = currentFrame - from;
  const isVisible = relativeFrame >= 0 && (durationInFrames === undefined || relativeFrame < durationInFrames);

  if (!isVisible) return null;

  return (
    <FrameContext.Provider value={relativeFrame}>
      {children}
    </FrameContext.Provider>
  );
};

/**
 * Spring animation logic
 */
export const spring = ({
  frame,
  fps,
  config = { stiffness: 100, damping: 10, mass: 1 },
}: {
  frame: number;
  fps: number;
  config?: { stiffness?: number; damping?: number; mass?: number };
}) => {
  const { stiffness = 100, damping = 10, mass = 1 } = config;

  const t = frame / fps;
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const omega0 = Math.sqrt(stiffness / mass);

  if (zeta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * omega0 * t);
    return 1 - envelope * (Math.cos(omegaD * t) + (zeta * omega0 / omegaD) * Math.sin(omegaD * t));
  } else {
    return 1 - Math.exp(-omega0 * t) * (1 + omega0 * t);
  }
};

/**
 * Audio Component
 */
export const Audio: React.FC<{
  src: string;
  startFrom?: number;
  volume?: number;
}> = (props) => {
  if (typeof window !== 'undefined') {
    (window as any).__OPEN_MOTION_AUDIO_ASSETS__ = (window as any).__OPEN_MOTION_AUDIO_ASSETS__ || [];
    if (!(window as any).__OPEN_MOTION_AUDIO_ASSETS__.find((a: any) => a.src === props.src)) {
      (window as any).__OPEN_MOTION_AUDIO_ASSETS__.push(props);
    }
  }
  return null;
};

export * from './Player';
