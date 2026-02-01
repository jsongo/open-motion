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
 * Easing functions
 */
export type EasingFunction = (t: number) => number;

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t * t * (3 - 2 * t),
  in: (t: number) => t * t,
  out: (t: number) => t * (2 - t),
  inOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  bezier: (_x1: number, y1: number, _x2: number, y2: number) => {
    // Simple cubic bezier approximation (y-only for now)
    return (t: number) => {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const ttt = tt * t;
      // P0=0, P3=1
      return 3 * uu * t * y1 + 3 * u * tt * y2 + ttt;
    };
  },
  step: (t: number) => (t < 0.5 ? 0 : 1),
};

/**
 * interpolate function: maps a value from one range to another.
 * Compatible with Remotion's interpolate.
 */
export const interpolate = (
  input: number,
  inputRange: number[],
  outputRange: number[],
  options?: {
    extrapolateLeft?: 'extrapolate' | 'clamp';
    extrapolateRight?: 'extrapolate' | 'clamp';
    easing?: EasingFunction;
  }
) => {
  if (inputRange.length < 2) return outputRange[0];

  // Simple linear interpolation between multiple segments
  for (let i = 0; i < inputRange.length - 1; i++) {
    const minInput = inputRange[i];
    const maxInput = inputRange[i + 1];
    const minOutput = outputRange[i];
    const maxOutput = outputRange[i + 1];

    if (input >= minInput && input <= maxInput) {
      let progress = (input - minInput) / (maxInput - minInput);
      if (options?.easing) {
        progress = options.easing(progress);
      }
      return minOutput + progress * (maxOutput - minOutput);
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
    let progress = (input - firstInput) / (nextInput - firstInput);
    if (options?.easing) {
      progress = options.easing(progress);
    }
    return firstOutput + progress * (nextOutput - firstOutput);
  }

  if (input > lastInput) {
    if (options?.extrapolateRight === 'clamp') return lastOutput;
    // Extrapolate using last segment
    const prevInput = inputRange[inputRange.length - 2];
    const prevOutput = outputRange[outputRange.length - 2];
    let progress = (input - lastInput) / (lastInput - prevInput);
    if (options?.easing) {
      progress = options.easing(progress);
    }
    return lastOutput + progress * (lastOutput - prevOutput);
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
  const startFrame = useAbsoluteFrame();
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
      (window as any).__OPEN_MOTION_AUDIO_ASSETS__.push({
        ...props,
        startFrame,
      });
    }
  }
  return null;
};

/**
 * Video Component
 * Supports frame-accurate seeking and synchronization with the engine.
 */
export const Video: React.FC<{
  src: string;
  startFrom?: number;
  endAt?: number;
  playbackRate?: number;
  muted?: boolean;
  volume?: number;
  style?: React.CSSProperties;
}> = ({ src, startFrom = 0, endAt, playbackRate = 1, muted = true, volume = 1, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const isVisible = endAt === undefined || frame < endAt;

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVisible) return;

    const targetTime = (frame * playbackRate + startFrom) / fps;

    // Only seek if the difference is significant to avoid jitter
    if (Math.abs(video.currentTime - targetTime) > 0.001) {
      video.currentTime = targetTime;
    }
  }, [frame, fps, startFrom, playbackRate, isVisible]);

  if (!isVisible) return null;

  return (
    <video
      ref={videoRef}
      src={src}
      muted={muted}
      playsInline
      style={{
        display: 'block',
        objectFit: 'cover',
        ...style,
      }}
      onLoadedMetadata={(e) => {
        const video = e.currentTarget;
        video.volume = volume;
        // Ensure it's paused so we can control it via currentTime
        video.pause();
      }}
    />
  );
};

export * from './Player';
