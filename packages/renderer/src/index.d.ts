import { VideoConfig } from '@open-motion/core';
export interface RenderOptions {
    url: string;
    config: VideoConfig;
    outputDir: string;
    compositionId?: string;
    inputProps?: any;
    concurrency?: number;
}
export declare const getCompositions: (url: string) => Promise<any>;
export declare const renderFrames: ({ url, config, outputDir, compositionId, inputProps, concurrency }: RenderOptions) => Promise<{
    audioAssets: any[];
}>;
