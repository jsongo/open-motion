# @open-motion/cli

The Command Line Interface for **OpenMotion** — the open-source programmatic video engine.

## 🚀 Features

- 🏗️ **Quick Init**: Scaffold new OpenMotion projects instantly.
- 🤖 **AI Generation**: Generate scenes and code from text descriptions.
- ✍️ **AI Editing**: Refine your TSX components using natural language.
- 🎥 **High-Speed Rendering**: Capture and encode videos directly from your React code.
- 🚀 **Parallel Execution**: Leverage multi-core CPUs for faster frame capturing.
- 🎛️ **Dynamic Props**: Inject external data into your videos via JSON.

## 🛠 Installation

```bash
npm install -g @open-motion/cli
# or use via npx
npx @open-motion/cli --help
```

### Windows: Setting up pnpm global link

If you're building from source and using `pnpm link --global` on Windows, you may need to set up the global bin directory first:

```powershell
$env:PNPM_HOME = "C:\Users\<YourUser>\AppData\Local\pnpm"
$env:PATH += ";$env:PNPM_HOME"
cd packages/cli
pnpm link --global
```

Alternatively, run `pnpm setup` and restart your terminal to apply the environment variables automatically.

## 📖 Usage

### Initialize a project
```bash
open-motion init my-video
```

### Configure LLM (Optional for AI features)
```bash
# Configure via environment variables (project-local .env supported)
# .env
OPEN_MOTION_PROVIDER=openai
OPEN_MOTION_MODEL=gpt-4o
OPENAI_API_KEY=sk-...

# Verify what the CLI sees
open-motion config list
open-motion config get OPENAI_API_KEY
```

### Generate a video from description
```bash
# Uses .env in current directory by default
open-motion generate "Explain how React hooks work"

# Or specify a custom .env file
open-motion generate "Explain how React hooks work" --env .env.anthropic
```

### Edit a scene file
```bash
# Interactive mode
open-motion edit src/scenes/IntroScene.tsx

# One-shot mode
open-motion edit src/scenes/IntroScene.tsx -m "Make the text color blue" --yes

# Use a custom .env file
open-motion edit src/scenes/IntroScene.tsx -m "Make the text color blue" --env .env.anthropic --yes
```

### Render a video
```bash
open-motion render --url http://localhost:5173 --out out.mp4 --concurrency 4
```

### Render with background music (BGM)
```bash
open-motion render --url http://localhost:5173 --out out.mp4 --bgm ./music/bgm.mp3 --bgm-volume 0.5
```

Learn more at the [main OpenMotion repository](https://github.com/jsongo/open-motion).
