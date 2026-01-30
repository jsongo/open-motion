export declare const runRender: (options: {
    url: string;
    out: string;
    compositionId?: string;
    width?: number;
    height?: number;
    fps?: number;
    duration?: number;
    props?: string;
    concurrency?: number;
}) => Promise<void>;
export declare const main: () => void;
