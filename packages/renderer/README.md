# @open-motion/renderer

The Playwright-based rendering engine for **OpenMotion**.

This package is responsible for:
- Launching headless browser instances (via Playwright).
- Synchronizing with the React lifecycle using `delayRender`/`continueRender`.
- Capturing frame-perfect screenshots of your video compositions.
- Managing parallel rendering workers.

## 🛠 Installation

```bash
pnpm add @open-motion/renderer
```

## 📖 Usage

This package is typically used internally by the `@open-motion/cli`.

Learn more at the [main OpenMotion repository](https://github.com/jsongo/open-motion).
