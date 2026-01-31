import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext } from 'react';
const VideoConfigContext = createContext(null);
const FrameContext = createContext(0);
const AbsoluteFrameContext = createContext(0);
const InputPropsContext = createContext({});
export const CompositionProvider = ({ config, frame, inputProps = {}, children }) => {
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            window.__OPEN_MOTION_READY__ = true;
        }
    }, []);
    const [currentFrame, setCurrentFrame] = React.useState(frame);
    React.useEffect(() => {
        setCurrentFrame(frame);
    }, [frame]);
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const handler = (e) => {
                if (typeof e.detail?.frame === 'number') {
                    setCurrentFrame(e.detail.frame);
                }
            };
            window.addEventListener('open-motion-frame-update', handler);
            return () => window.removeEventListener('open-motion-frame-update', handler);
        }
    }, []);
    return (_jsx(VideoConfigContext.Provider, { value: config, children: _jsx(InputPropsContext.Provider, { value: inputProps, children: _jsx(AbsoluteFrameContext.Provider, { value: currentFrame, children: _jsx(FrameContext.Provider, { value: currentFrame, children: _jsx("div", { style: {
                            width: config.width,
                            height: config.height,
                            backgroundColor: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            overflow: 'hidden',
                        }, children: children }, currentFrame) }) }) }) }));
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
export const getInputProps = () => {
    return useContext(InputPropsContext);
};
const compositions = new Map();
export const registerComposition = (props) => {
    compositions.set(props.id, props);
    if (typeof window !== 'undefined') {
        window.__OPEN_MOTION_COMPOSITIONS__ = Array.from(compositions.values());
    }
};
export const getCompositions = () => Array.from(compositions.values());
export const getCompositionById = (id) => compositions.get(id);
/**
 * Composition Component (Remotion compatible)
 */
export const Composition = (props) => {
    registerComposition(props);
    return null;
};
// --- Rendering Synchronization ---
let delayRenderCounter = 0;
/**
 * delayRender: Signal that an async resource is being loaded.
 */
export const delayRender = (label) => {
    const handle = delayRenderCounter++;
    if (typeof window !== 'undefined') {
        window.__OPEN_MOTION_DELAY_RENDER_COUNT__ = (window.__OPEN_MOTION_DELAY_RENDER_COUNT__ || 0) + 1;
    }
    return handle;
};
/**
 * continueRender: Signal that an async resource has finished loading.
 */
export const continueRender = (handle) => {
    if (typeof window !== 'undefined') {
        window.__OPEN_MOTION_DELAY_RENDER_COUNT__ = Math.max(0, (window.__OPEN_MOTION_DELAY_RENDER_COUNT__ || 0) - 1);
    }
};
/**
 * interpolate function: maps a value from one range to another.
 * Compatible with Remotion's interpolate.
 */
export const interpolate = (input, inputRange, outputRange, options) => {
    const [minInput, maxInput] = inputRange;
    const [minOutput, maxOutput] = outputRange;
    let result = minOutput + ((input - minInput) / (maxInput - minInput)) * (maxOutput - minOutput);
    if (options?.extrapolateLeft === 'clamp' && input < minInput)
        return minOutput;
    if (options?.extrapolateRight === 'clamp' && input > maxInput)
        return maxOutput;
    return result;
};
/**
 * Time Hijacking Bridge Script
 */
export const getTimeHijackScript = (frame, fps) => {
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
export const Sequence = ({ from, durationInFrames, children }) => {
    const currentFrame = useCurrentFrame();
    const relativeFrame = currentFrame - from;
    const isVisible = relativeFrame >= 0 && (durationInFrames === undefined || relativeFrame < durationInFrames);
    if (!isVisible)
        return null;
    return (_jsx(FrameContext.Provider, { value: relativeFrame, children: children }));
};
/**
 * Spring animation logic
 */
export const spring = ({ frame, fps, config = { stiffness: 100, damping: 10, mass: 1 }, }) => {
    const { stiffness = 100, damping = 10, mass = 1 } = config;
    const t = frame / fps;
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));
    const omega0 = Math.sqrt(stiffness / mass);
    if (zeta < 1) {
        const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
        const envelope = Math.exp(-zeta * omega0 * t);
        return 1 - envelope * (Math.cos(omegaD * t) + (zeta * omega0 / omegaD) * Math.sin(omegaD * t));
    }
    else {
        return 1 - Math.exp(-omega0 * t) * (1 + omega0 * t);
    }
};
/**
 * Audio Component
 */
export const Audio = (props) => {
    if (typeof window !== 'undefined') {
        window.__OPEN_MOTION_AUDIO_ASSETS__ = window.__OPEN_MOTION_AUDIO_ASSETS__ || [];
        if (!window.__OPEN_MOTION_AUDIO_ASSETS__.find((a) => a.src === props.src)) {
            window.__OPEN_MOTION_AUDIO_ASSETS__.push(props);
        }
    }
    return null;
};
export * from './Player';
