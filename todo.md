# TODO: 增强功能开发

## 第一阶段：动画与转场 (Animation & Transitions)
- [ ] 实现 `<Loop />` 组件 (packages/core)
    - [ ] 编写 `<Loop />` 单元测试
- [ ] 实现基础转场组件 (packages/components)
    - [ ] `Fade` 转场
    - [ ] `Slide` 转场
    - [ ] `Wipe` 转场
    - [ ] 编写转场组件测试
- [ ] 扩展缓动函数库 (Easing)
    - [ ] 增加常用缓动预设 (bezier, expo, etc.)
- [ ] 创建动画与转场 Demo 页面

## 第二阶段：扩展集成 (Integrations)
- [ ] Three.js 集成组件
- [ ] Lottie 动画支持
- [ ] 创建集成 Demo 页面

## 第三阶段：媒体分析工具 (Media Analysis)
- [ ] `getVideoMetadata` (时长、尺寸)
- [ ] `getAudioDuration`
- [ ] `extractFrames` (基础实现)

## 第四阶段：字幕系统 (Captions)
- [ ] SRT 解析器
- [ ] `<Captions />` 渲染组件 (支持 TikTok 风格)
- [ ] 单词级高亮功能
- [ ] 字幕样式定制

## 验收与清理
- [ ] 运行所有测试
- [ ] 更新 CLAUDE.md
- [ ] 删除临时调试日志
