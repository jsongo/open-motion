import React from 'react';
import { VideoConfig } from './index';
export interface PlayerProps {
    component: React.ComponentType<any>;
    config: VideoConfig;
    inputProps?: any;
    controls?: boolean;
    autoPlay?: boolean;
    loop?: boolean;
}
export declare const Player: React.FC<PlayerProps>;
