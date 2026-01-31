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

OpenMotion is a high-performance, open-source alternative to Remotion. It allows you to create frame-perfect videos using familiar React components, hooks, and your favorite CSS libraries. Whether you're building automated marketing videos, personalized content, or dynamic data visualizations, OpenMotion provides the core engine to turn your React code into high-quality MP4s.

<p align="center">
  <video src="assets/demo-showcase.mp4" width="100%" controls autoplay loop muted></video>
</p>

## ✨ Features

- ⚛️ **React-First**: Use the full power of the React ecosystem, including state, effects, and third-party libraries.
- ⏱️ **Frame-Perfect Determinism**: Advanced time-hijacking of `Date`, `performance.now`, and `requestAnimationFrame` ensures every frame is rendered exactly as intended.
- 🚀 **Parallel Rendering**: Multi-process rendering support out of the box. Scale your rendering speed by utilizing all CPU cores.
- 📦 **Asset Synchronization**: Robust `delayRender` and `continueRender` API to handle fonts, images, and Lottie animations seamlessly.
- 🎛️ **Dynamic Input Props**: Drive your videos with external data. Pass JSON props via CLI to generate infinite variations of a single template.
- 🎞️ **Interactive Player**: A built-in React component for real-time preview, scrubbing, and debugging.

## 📦 Packages

The OpenMotion ecosystem is modular:

| Package                                        | Description                                                      |
| :--------------------------------------------- | :--------------------------------------------------------------- |
| [`@open-motion/core`](./packages/core)         | Core React primitives, hooks, and player components.             |
| [`@open-motion/renderer`](./packages/renderer) | Playwright-based engine for capturing frame sequences.           |
| [`@open-motion/cli`](./packages/cli)           | Command-line interface for managing and rendering projects.      |
| [`@open-motion/encoder`](./packages/encoder)   | FFmpeg wrapper for high-quality video encoding and audio mixing. |

## 🚀 Quick Start

### 1. Initialize a new project

```bash
npx @open-motion/cli init my-video
cd my-video
pnpm install
```

### 2. Define your composition

```tsx
import {
  Composition,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "@open-motion/core";

const MyVideo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps });

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1 style={{ transform: `scale(${scale})` }}>Hello OpenMotion</h1>
    </div>
  );
};

export const Root = () => (
  <Composition
    id="HelloWorld"
    component={MyVideo}
    durationInFrames={90}
    fps={30}
    width={1920}
    height={1080}
  />
);
```

### 3. Preview locally

```bash
pnpm dev
```

### 4. Render to MP4

```bash
npx open-motion render \
  --url http://localhost:5173 \
  --out ./output.mp4 \
  --composition HelloWorld \
  --props '{"title": "Custom Data"}' \
  --concurrency 4
```

## 📂 Examples

Explore our examples to see OpenMotion in action:

- [`hello-world`](./examples/hello-world): Minimal setup with basic animations and Lottie support.
- [`demo`](./examples/demo): Full-featured demo showcasing physical springs, sequences, async assets (remote images), and dynamic props.


## 🛠 Installation

```bash
# Clone the repository
git clone https://github.com/youruser/open-motion.git

# Install dependencies
pnpm install

# Install Playwright browsers
npx playwright install chromium
```

## 🗺 Roadmap

- [x] Multi-process parallel rendering.
- [x] Dynamic Input Props injection.
- [x] Async asset synchronization (`delayRender`).
- [ ] Comprehensive Audio API (Volume levels, crossfades).
- [ ] Dedicated Studio Dashboard (Visual timeline, asset browser).
- [ ] Distributed Rendering (AWS Lambda / Serverless support).

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more details.

## 📜 License

MIT © [jsongo](https://github.com/jsongo)
