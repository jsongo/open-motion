# OpenMotion

<p align="center">
  <img src="assets/open-motion.jpg" width="120" height="120" alt="OpenMotion Logo" />
</p>

<p align="center">
  <strong>The open-source programmatic video engine for React developers.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-packages">Packages</a>
</p>

---

OpenMotion is a high-performance, open-source alternative to Remotion. It allows you to create frame-perfect videos using familiar React components, hooks, and your favorite CSS libraries.

### 🎬 Showcases

| Feature Showcase | Media Showcase |
| :---: | :---: |
| ![Feature Showcase](assets/feature-showcase.gif) | ![Media Showcase](assets/media-showcase.gif) |
| Brand, Dashboard, Easing | Video, Audio |

## ✨ Features

- ⚛️ **React-First**: Use the full power of the React ecosystem.
- ⏱️ **Frame-Perfect Determinism**: Advanced time-hijacking ensures every frame is identical.
- 🚀 **Parallel Rendering**: Scale your rendering speed by utilizing all CPU cores.
- 🎵 **Multi-track Audio Mixing**: Support for multiple `<Audio />` with independent volume.
- 📈 **Animation Components**: Built-in library for Loop, Transitions, Easing, and more.
- 📦 **External Integrations**: Native support for **Three.js** and **Lottie** animations.
- 💬 **Caption System**: Automated subtitle rendering with SRT support and TikTok-style animations.
- 📊 **Media Analysis**: Dynamic metadata extraction for video/audio (duration, dimensions).
- 📹 **Offthread Video**: High-performance video decoding moved to background processes.
- 📊 **Dynamic Metadata**: Calculate video dimensions, duration, and other properties dynamically based on input props.
- 🎬 **GIF & Video Output**: Render to both MP4 video and GIF formats with automatic format detection.
### 4. 渲染视频 (正式出片)

推荐使用项目自带的 `render` 脚本进行渲染，它会自动完成 **构建 -> 启动静态服务 -> 渲染 -> 自动清理** 的全套流程，确保渲染过程极其稳健，不会因开发服务器缓冲区问题而卡死。

```bash
# 执行一键渲染 (默认输出 ./out.mp4，开启 4 线程并行)
npm run render

# 修改输出文件名或指定合成 ID (通过 -- 透传参数)
npm run render -- -o my-video.mp4 -c main
```

## 💡 最佳实践

### 稳健渲染方案
生产环境建议始终优先使用 `npm run render`。该命令内部使用了静态服务模式，彻底告别渲染卡死。

### 参数透传技巧
你可以通过 `npm run render -- [更多参数]` 覆盖脚本中的默认值：
- **修改并发数**: `npm run render -- -j 8`
- **指定 Chromium 路径**: `npm run render -- --chromium-path "/path/to/chrome"`

### 资源存放
所有本地图片/视频资源请放在 `public/` 目录下，在代码中通过 `/filename` 路径引用。

## 🎬 输出格式支持
- **.mp4**: 标准视频，包含音频。
- **.webm**: 支持透明背景的高质量视频。
- **.gif**: 动态图片，不含音频。
- **.webp**: 现代动图格式，体积更小，质量更好。

## 🛡️ 特色功能
- 🛡️ **Pre-Flight Checks**: 内置浏览器安装检查与环境验证。
- 🌍 **Custom Chromium Path**: 支持通过 `--chromium-path` 参数自定义浏览器路径。
- 🚀 **Turbo Render**: 一键自动化构建与全自动渲染链条。

## 📚 API Reference

Calculate video properties dynamically:

```tsx
<Composition
  id="dynamic-video"
  component={VideoComponent}
  width={1280}
  height={720}
  fps={30}
  durationInFrames={300}
  calculateMetadata={async (props) => {
    const meta = await getVideoMetadata(props.src);
    return {
      width: meta.width,
      height: meta.height,
      durationInFrames: Math.ceil(meta.durationInSeconds * 30)
    };
  }}
/>
```

## 📦 Packages

| Package | Description |
| :--- | :--- |
| [`@open-motion/core`](./packages/core) | React primitives (`Composition`, `Sequence`, `Loop`), hooks, and media utils (`getVideoMetadata`, `parseSrt`). |
| [`@open-motion/components`](./packages/components) | High-level components (`Transition`, `ThreeCanvas`, `Lottie`, `Captions`, `TikTokCaption`). |
| [`@open-motion/renderer`](./packages/renderer) | Playwright-based capture engine. |
| [`@open-motion/cli`](./packages/cli) | Command-line interface. |

## 🛠 Installation

```bash
npm install @open-motion/core @open-motion/components
```

## 🚀 Quick Start

### Installation

```bash
# Install CLI tools globally
pnpm install -g @open-motion/cli @open-motion/renderer

# Install Playwright browsers (required for rendering)
npx playwright install chromium
```

### Create & Run Your First Project

```bash
# Create a new project
open-motion init fun-video
cd fun-video && pnpm install

# Start development server
# Run this in one terminal - it will show the port (e.g. 5173)
pnpm run dev
```

**Note**: Keep this terminal open. If port 5173 is in use, Vite will automatically try 5174, 5175, etc. Check the output for the actual port number.

### Render Your Video

In another terminal, render your project using the port from above:

```bash
# Render to MP4 (14 seconds at 30fps)
open-motion render -u http://localhost:5173 -o out.mp4 --duration 420

# Render to GIF (14 seconds at 30fps)
open-motion render -u http://localhost:5173 -o out.gif --duration 420

# Render to WebP (better quality than GIF)
open-motion render -u http://localhost:5173 -o out.webp --duration 420

# Render to WebM (transparent video support)
open-motion render -u http://localhost:5173 -o out.webm --duration 420
```

**Duration explained**: `--duration 420` means 420 frames. At 30fps, that's 420 ÷ 30 = **14 seconds** of video.

### Create a Composition

```tsx
import { Composition, useCurrentFrame, interpolate } from "@open-motion/core";
import { Transition, TikTokCaption } from "@open-motion/components";

const MyScene = () => {
  const frame = useCurrentFrame();
  return (
    <Transition type="fade">
      <div style={{ flex: 1, backgroundColor: 'black', color: 'white' }}>
        <TikTokCaption text="Hello OpenMotion" active={true} />
      </div>
    </Transition>
  );
};
```

**Note about ports**: If port 5173 is already in use, Vite will automatically try 5174, 5175, etc. Check the dev server output for the actual port number (e.g., "Local: http://localhost:5177/").

## 📚 API Reference

Complete reference for all OpenMotion features and components.

### Core Hooks

**`useCurrentFrame()`**
Get the current frame number in your animation.

```tsx
const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 30], [0, 1]);
```

**`useVideoConfig()`**
Access video configuration (width, height, fps, durationInFrames).

```tsx
const { width, height, fps } = useVideoConfig();
```

### Animation & Transitions

**`<Loop durationInFrames={30}>`**
Create looping time contexts for sub-animations.

```tsx
<Loop durationInFrames={60}>
  <SpinningLogo />
</Loop>
```

**`<Transition type="wipe" direction="right">`**
Smooth enter/exit transitions. Types: `fade`, `wipe`, `slide`, `zoom`.

```tsx
<Transition type="wipe" direction="right">
  <Title text="Hello World" />
</Transition>
```

**`Easing.inOutExpo`**
Complete library of easing functions:
- `Easing.linear`, `Easing.easeIn`, `Easing.easeOut`, `Easing.easeInOut`
- `Easing.inOutCubic`, `Easing.outBack`, `Easing.inExpo`, and more

```tsx
const value = interpolate(frame, [0, 30], [0, 100], {
  easing: Easing.outCubic,
});
```

### 3D & Lottie Integration

**`<ThreeCanvas />`**
Render Three.js scenes synced with video frames. See `packages/components` for details.

**`<Lottie url="..." />`**
Declarative Lottie animations with frame-accurate control.

```tsx
<Lottie url="/animations/logo.json" />
```

### Media & Captions

**`<Audio src="..." volume={0.8} />`**
Multi-track audio support with independent volume and timing.

```tsx
<Audio src="/music.mp3" volume={0.5} startFrom={30} startFrame={60} />
```

**`parseSrt(srtContent)`**
Convert SRT subtitle files to arrays.

```tsx
const subtitles = parseSrt(await fetch('/subtitles.srt').then(r => r.text()));
```

**`<Captions subtitles={subtitles} />`**
Flexible subtitle renderer with styling options.

```tsx
<Captions subtitles={subtitles} color="white" fontSize={24} />
```

**`<TikTokCaption />`**
Pre-styled component for TikTok-like animated captions.

**`getVideoMetadata(url)`**
Fetch video dimensions and duration.

```tsx
const { width, height, durationInSeconds } = await getVideoMetadata('/video.mp4');
```

**`<OffthreadVideo src="..." />`**
High-performance video decoding in background processes.

### Output & Export Options

**CLI Commands**

```bash
# Basic rendering
open-motion render -u http://localhost:5173 -o video.mp4

# With custom settings
open-motion render -u http://localhost:5173 -o video.mp4 \
  --duration 420 \
  --width 1920 \
  --height 1080 \
  --fps 30

# Render to GIF
open-motion render -u http://localhost:5173 -o animation.gif \
  --duration 420 \
  --public-dir ./public
```

**File Formats**
- **MP4**: Full video with audio support (H.264)
- **WebM**: Web-optimized video with transparency support (VP9)
- **GIF**: Lightweight animations (no audio)
- **WebP**: High-quality animated images (better than GIF, no audio)

**Quality Parameters**
- `--width`: Output width in pixels
- `--height`: Output height in pixels
- `--fps`: Frames per second (default: 30)
- `--duration`: Total frames (e.g., 420 = 14 seconds at 30fps)
- `--format`: Explicit format (mp4, webm, gif, webp, auto)

## 📜 License

MIT © [jsongo](https://github.com/jsongo)
