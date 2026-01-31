# @open-motion/cli

The Command Line Interface for **OpenMotion** — the open-source programmatic video engine.

## 🚀 Features

- 🏗️ **Quick Init**: Scaffold new OpenMotion projects instantly.
- 🎥 **High-Speed Rendering**: Capture and encode videos directly from your React code.
- 🚀 **Parallel Execution**: Leverage multi-core CPUs for faster frame capturing.
- 🎛️ **Dynamic Props**: Inject external data into your videos via JSON.

## 🛠 Installation

```bash
npm install -g @open-motion/cli
# or use via npx
npx @open-motion/cli --help
```

## 📖 Usage

### Initialize a project
```bash
open-motion init my-video
```

### Render a video
```bash
open-motion render --url http://localhost:5173 --out out.mp4 --concurrency 4
```

Learn more at the [main OpenMotion repository](https://github.com/jsongo/open-motion).
