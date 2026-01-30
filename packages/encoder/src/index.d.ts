export interface EncodeOptions {
    framesDir: string;
    fps: number;
    outputFile: string;
    audioFile?: string;
}
export declare const encodeVideo: ({ framesDir, fps, outputFile, audioFile }: EncodeOptions) => Promise<unknown>;
