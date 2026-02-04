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

| Feature Showcase | Media Showcase |
| :---: | :---: |
| ![Feature Showcase](assets/feature-showcase.gif) | ![Media Showcase](assets/media-showcase.gif) |

## ✨ Features

- ⚛️ **React-First**: Use the full power of the React ecosystem.
- ⏱️ **Frame-Perfect Determinism**: Advanced time-hijacking ensures every frame is identical.
- 🚀 **Parallel Rendering**: Scale your rendering speed by utilizing all CPU cores.
- 🎵 **Multi-track Audio Mixing**: Support for multiple `<Audio />` with independent volume.
- 📈 **Animation Components**: Built-in library for Typewriter, Breathing Buttons, and Progress Bars.
- 📹 **Offthread Video**: High-performance video decoding moved to background processes.

## 📦 Packages

| Package | Description |
| :--- | :--- |
| [`@open-motion/core`](./packages/core) | React primitives and hooks. |
| [`@open-motion/components`](./packages/components) | High-level animation components. |
| [`@open-motion/renderer`](./packages/renderer) | Playwright-based capture engine. |
| [`@open-motion/cli`](./packages/cli) | Command-line interface. |

## 🛠 Installation

```bash
npm install -g @open-motion/cli
```

## 🚀 Quick Start

```bash
# Render the demo example
npx open-motion render -u http://localhost:5173 -o output.mp4

# Render the hello-world example
npx open-motion render -u http://localhost:5174 -o hello.mp4
```

## 📜 License

MIT © [jsongo](https://github.com/jsongo)
