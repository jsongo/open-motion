# @open-motion/core

Core React primitives, hooks, and player for **OpenMotion** — the open-source programmatic video engine.

## ✨ Features

- ⚛️ **React Components**: Use `Composition`, `Sequence`, `Video`, and more to build your video.
- 🎣 **Powerful Hooks**: Access `useCurrentFrame`, `useVideoConfig`, and `getInputProps` anywhere.
- ⏱️ **Animation Utilities**: High-performance `spring` animations and multi-segment `interpolate` functions.
- 🎞️ **Interactive Player**: Real-time preview and scrubbing during development.

## 🚀 Installation

```bash
pnpm add @open-motion/core
# or
npm install @open-motion/core
```

## 📖 Usage

```tsx
import { Composition, Sequence, spring, useCurrentFrame, useVideoConfig } from "@open-motion/core";

const MyVideo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps });

  return (
    <div style={{ flex: 1, backgroundColor: "white", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <h1 style={{ transform: `scale(${scale})` }}>Hello OpenMotion</h1>
    </div>
  );
};
```

Learn more at the [main OpenMotion repository](https://github.com/jsongo/open-motion).
