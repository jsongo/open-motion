import React from 'react';
import { Series } from '@open-motion/components';
import { Sequence } from '@open-motion/core';

import { BrandShowcase } from '../layout/BrandShowcase';
import { Dashboard } from '../layout/Dashboard';
import { EasingShowcase } from '../animation/EasingShowcase';

export const ShowcaseVideo = () => {
  return (
    <div style={{ flex: 1, backgroundColor: 'white', width: '100%', height: '100%' }}>
      <Series>
        {/* 1. 品牌开场 (120帧) */}
        <Sequence durationInFrames={120}>
          <div style={{ width: '100%', height: '100%' }}>
             <BrandShowcase />
          </div>
        </Sequence>
        {/* 2. 数据仪表盘 (120帧) */}
        <Sequence durationInFrames={120}>
          <div style={{ width: '100%', height: '100%' }}>
             <Dashboard />
          </div>
        </Sequence>
        {/* 3. 动画曲线 (120帧) */}
        <Sequence durationInFrames={120}>
          <div style={{ width: '100%', height: '100%' }}>
             <EasingShowcase />
          </div>
        </Sequence>
      </Series>
    </div>
  );
};
