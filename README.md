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
  <a href="#-packages">Packages</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

---

OpenMotion is a high-performance, open-source alternative to Remotion. It allows you to create frame-perfect videos using familiar React components, hooks, and your favorite CSS libraries.

### 🎬 Showcases

| Feature Showcase | Media Showcase | Integrations & 3D |
| :---: | :---: | :---: |
| ![Feature Showcase](assets/feature-showcase.gif) | ![Media Showcase](assets/media-showcase.gif) | ![Integrations Showcase](assets/integrations-showcase.gif) |
| Brand, Dashboard, Easing | Video, Audio | Three.js, Lottie, Captions |

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

### 1. Create a Composition

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

### 2. Render to Video

```bash
# Start your dev server
npm run dev

# Render via CLI
npx open-motion render -u http://localhost:5173 -o output.mp4
```

## 📖 New Features API

### Animation & Transitions
- `<Loop durationInFrames={30}>`: Create looping time contexts for sub-animations.
- `<Transition type="wipe" direction="right">`: Smooth enter/exit transitions.
- `Easing`: Complete library of easing functions (e.g., `Easing.inOutExpo`).

### 3D & Lottie Integration
- `<ThreeCanvas />`: Seamlessly render Three.js scenes synced with video frames.
- `<Lottie url="..." />`: Declarative Lottie animations with frame-accurate control.

### Captions & Media
- `parseSrt(srtContent)`: Utility to convert SRT files to subtitle arrays.
- `<Captions />`: Flexible subtitle renderer.
- `getVideoMetadata(url)`: Asynchronously fetch video dimensions and duration.
- `getAudioDuration(url)`: Asynchronously fetch audio duration.
- `<TikTokCaption />`: A pre-styled component for TikTok-like animated captions.

## 📜 License

MIT © [jsongo](https://github.com/jsongo)
