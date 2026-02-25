# OpenMotion

<p align="center">
  <img src="assets/open-motion.jpg" width="120" height="120" alt="OpenMotion Logo" />
</p>

<p align="center">
  <strong>The open-source programmatic video engine for React developers.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-packages">Packages</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-cli-reference">CLI Reference</a> •
  <a href="#-api-reference">API Reference</a>
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
- 📊 **Dynamic Metadata**: Calculate video dimensions, duration, and other properties dynamically.
- 🎬 **GIF & Video Output**: Render to MP4, WebM, GIF, and WebP formats.

## 📦 Packages

| Package | Description |
| :--- | :--- |
| [`@open-motion/core`](./packages/core) | React primitives (`Composition`, `Sequence`, `Loop`), hooks, and media utils. |
| [`@open-motion/components`](./packages/components) | High-level components (`Transition`, `ThreeCanvas`, `Lottie`, `Captions`). |
| [`@open-motion/renderer`](./packages/renderer) | Playwright-based capture engine. |
| [`@open-motion/cli`](./packages/cli) | Command-line interface. |

## 🛠 Installation

```bash
npm install @open-motion/core @open-motion/components
```

## 🚀 Quick Start

### 1. Setup
Install CLI tools and required browsers:
```bash
pnpm install -g @open-motion/cli @open-motion/renderer
npx playwright install chromium
```

### 2. Create Project
```bash
open-motion init my-video
cd my-video && pnpm install
```

### 3. Develop & Render
Start the dev server in one terminal:
```bash
pnpm run dev
```
In another terminal, render your video using the server URL:
```bash
open-motion render -u http://localhost:5173 -o out.mp4
```

## 💻 CLI Reference

### `open-motion init <name>`
Initialize a new OpenMotion project with a pre-configured React template.

### `open-motion render`
Render a video from a running OpenMotion application.

| Option | Description |
| :--- | :--- |
| `-u, --url <url>` | **Required.** URL of the OpenMotion app (e.g., `http://localhost:5173`) |
| `-o, --out <path>` | **Required.** Output file path (e.g., `out.mp4`, `animation.gif`) |
| `-c, --composition <id>` | ID of the composition to render |
| `-p, --props <json>` | JSON string of props to pass to the composition |
| `-j, --concurrency <n>` | Number of parallel browser instances (default: 1) |
| `--format <format>` | Output format: `mp4`, `webm`, `gif`, `webp`, `auto` |
| `--width <number>` | Override output width |
| `--height <number>` | Override output height |
| `--fps <number>` | Override frames per second |
| `--duration <number>` | Override total frames to render |
| `--public-dir <path>` | Public directory for static assets (default: `./public`) |
| `--chromium-path <path>`| Path to custom Chromium executable |
| `--timeout <number>` | Timeout for browser operations in ms |

## 📚 API Reference

### Core Hooks & Configuration
**`useCurrentFrame()`**: Get the current frame number.
**`useVideoConfig()`**: Access width, height, fps, and duration.

### Components
- **`<Loop />`**: Create looping time contexts.
- **`<Transition />`**: Smooth enter/exit effects (`fade`, `wipe`, `slide`, `zoom`).
- **`<ThreeCanvas />`**: Render synced Three.js scenes.
- **`<Lottie />`**: Declarative Lottie animations.
- **`<Audio />`**: Multi-track audio with volume control.
- **`<Captions />`** / **`<TikTokCaption />`**: Subtitle rendering.
- **`<OffthreadVideo />`**: High-performance background video decoding.

### Utilities
- **`interpolate()`**: Map ranges with easing support.
- **`Easing`**: Complete library of easing functions.
- **`parseSrt()`**: Convert SRT files to data structures.
- **`getVideoMetadata()`**: Fetch dimensions and duration of video files.

## 💡 Best Practices

### Robust Rendering
For production, use the project's built-in `npm run render` script. It handles the full **build -> static server -> render -> cleanup** pipeline, eliminating buffer issues.

### Asset Storage
Place all local assets in `public/` and reference them via absolute paths (e.g., `/video.mp4`).

## 📜 License

MIT © [jsongo](https://github.com/jsongo)
