import React from 'react';
export interface VideoConfig {
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
}
export declare const CompositionProvider: React.FC<{
    config: VideoConfig;
    frame: number;
    inputProps?: any;
    children: React.ReactNode;
}>;
export declare const useVideoConfig: () => VideoConfig;
export declare const useCurrentFrame: () => number;
export declare const useAbsoluteFrame: () => number;
export declare const getInputProps: <T extends any>() => T;
export interface CompositionProps extends VideoConfig {
    id: string;
    component: React.ComponentType<any>;
}
export declare const registerComposition: (props: CompositionProps) => void;
export declare const getCompositions: () => CompositionProps[];
export declare const getCompositionById: (id: string) => CompositionProps | undefined;
/**
 * Composition Component (Remotion compatible)
 */
export declare const Composition: React.FC<CompositionProps>;
/**
 * delayRender: Signal that an async resource is being loaded.
 */
export declare const delayRender: (label?: string) => number;
/**
 * continueRender: Signal that an async resource has finished loading.
 */
export declare const continueRender: (handle: number) => void;
/**
 * interpolate function: maps a value from one range to another.
 * Compatible with Remotion's interpolate.
 */
export declare const interpolate: (input: number, inputRange: [number, number], outputRange: [number, number], options?: {
    extrapolateLeft?: "extrapolate" | "clamp";
    extrapolateRight?: "extrapolate" | "clamp";
}) => number;
/**
 * Time Hijacking Bridge Script
 */
export declare const getTimeHijackScript: (frame: number, fps: number) => string;
/**
 * Sequence Component
 */
export declare const Sequence: React.FC<{
    from: number;
    durationInFrames?: number;
    children: React.ReactNode;
}>;
/**
 * Spring animation logic
 */
export declare const spring: ({ frame, fps, config, }: {
    frame: number;
    fps: number;
    config?: {
        stiffness?: number;
        damping?: number;
        mass?: number;
    };
}) => number;
/**
 * Audio Component
 */
export declare const Audio: React.FC<{
    src: string;
    startFrom?: number;
    volume?: number;
}>;
export * from './Player';
