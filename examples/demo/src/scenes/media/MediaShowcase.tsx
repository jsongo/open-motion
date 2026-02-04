import React from 'react';
import { Series } from '@open-motion/components';
import { Sequence } from '@open-motion/core';
import { VideoShowcase } from './VideoShowcase';
import { AudioShowcase } from './AudioShowcase';

export const MediaShowcase = () => {
  return (
    <div style={{ flex: 1, backgroundColor: 'white', width: '100%', height: '100%' }}>
      <Series>
        {/* 1. 离线视频处理 (120帧) */}
        <Sequence durationInFrames={120}>
          <div style={{ width: '100%', height: '100%' }}>
             <VideoShowcase />
          </div>
        </Sequence>
        {/* 2. 音频展示 (120帧) */}
        <Sequence durationInFrames={120}>
          <div style={{ width: '100%', height: '100%' }}>
             <AudioShowcase />
          </div>
        </Sequence>
      </Series>
    </div>
  );
};
