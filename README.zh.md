# OpenMotion

<p align="center">
  <img src="assets/open-motion.jpg" width="120" height="120" alt="OpenMotion Logo" />
</p>

<p align="center">
  <strong>专为 React 开发者打造的开源编程视频引擎。</strong>
</p>

<p align="center">
  <a href="#-features">特性</a> •
  <a href="#-packages">软件包</a> •
  <a href="#-installation">安装</a> •
  <a href="#-quick-start">快速开始</a> •
  <a href="#-cli-reference">CLI 参考</a> •
  <a href="#-api-reference">API 参考</a>
</p>

---

OpenMotion 是 Remotion 的高性能开源替代方案。它允许你使用熟悉的 React 组件、Hooks 和你喜欢的 CSS 库来创建帧准确（frame-perfect）的视频。

### 🎬 展示

| 功能展示 | 媒体展示 |
| :---: | :---: |
| ![Feature Showcase](assets/feature-showcase.gif) | ![Media Showcase](assets/media-showcase.gif) |
| 品牌、仪表盘、缓动 | 视频、音频 |

## ✨ 特性

- ⚛️ **React 优先**: 充分利用 React 生态系统的全部力量。
- 🤖 **AI 驱动生成**: 使用 LLM 从文本描述创建完整视频。
- ✍️ **AI 辅助编辑**: 使用自然语言编辑 TSX 场景。
- ⏱️ **帧准确的确定性**: 先进的时间劫持技术确保每一帧都完全一致。
- 🚀 **并行渲染**: 通过利用所有 CPU 核心来提升渲染速度。
- 🎵 **多轨音频混合**: 支持多个 `<Audio />` 且具有独立音量控制。
- 📈 **动画组件**: 内置循环（Loop）、过渡（Transitions）、缓动（Easing）等库。
- 📦 **外部集成**: 原生支持 **Three.js** 和 **Lottie** 动画。
- 💬 **字幕系统**: 自动化字幕渲染，支持 SRT 和 TikTok 风格动画。
- 📊 **媒体分析**: 动态提取视频/音频元数据（时长、尺寸）。
- 📹 **离线视频**: 高性能视频解码移至后台进程。
- 📊 **动态元数据**: 动态计算视频尺寸、时长等属性。
- 🎬 **GIF & 视频输出**: 渲染为 MP4、WebM、GIF 和 WebP 格式。

## 📦 软件包

| 软件包 | 描述 |
| :--- | :--- |
| [`@open-motion/core`](./packages/core) | React 基元 (`Composition`, `Sequence`, `Loop`), Hooks, 以及媒体工具。 |
| [`@open-motion/components`](./packages/components) | 高级组件 (`Transition`, `ThreeCanvas`, `Lottie`, `Captions`)。 |
| [`@open-motion/renderer`](./packages/renderer) | 基于 Playwright 的捕获引擎。 |
| [`@open-motion/cli`](./packages/cli) | 命令行界面。 |

## 🛠 安装

```bash
npm install @open-motion/core @open-motion/components
```

## 🔧 从源码构建

从源码构建需要 [Node.js](https://nodejs.org/) 和 [pnpm](https://pnpm.io/)。

```bash
git clone https://github.com/jsongo/open-motion.git
cd open-motion
pnpm install
pnpm build
```

### Windows: 设置 pnpm 全局链接

如果要在 Windows 上使用 `pnpm link --global`，可能需要先设置全局 bin 目录：

```powershell
$env:PNPM_HOME = "C:\Users\<YourUser>\AppData\Local\pnpm"
$env:PATH += ";$env:PNPM_HOME"
cd packages/cli
pnpm link --global
```

或者运行 `pnpm setup` 并重启终端以自动应用环境变量。

## 🚀 快速开始

### 1. 设置
安装 CLI 工具和必需的浏览器：
```bash
pnpm install -g @open-motion/cli @open-motion/renderer
npx playwright install chromium
```

如果在 Linux 无头环境中日文/中文/韩文显示为方块，通常是因为缺少系统字体。可以安装 CJK 字体（推荐）或在渲染时加载本地字体。

- 安装系统字体 (Ubuntu/Debian): `sudo apt-get update && sudo apt-get install -y fonts-noto-cjk`
- 或加载本地字体文件: `open-motion render ... --font "Noto Sans JP=./public/fonts/NotoSansJP-Regular.woff2"`

### 2. 创建项目
```bash
mkdir -p my_videos && cd my_videos
open-motion init my-video1
cd ../..  # 返回 monorepo 根目录
pnpm install
```

### 3. 开发与渲染

在一个终端中启动开发服务器：

```bash
cd my_videos/my-video1
pnpm run dev
```

或

```bash
pnpm --filter my-video1 dev
```

在另一个终端中，使用服务器 URL 渲染视频：
```bash
open-motion render -u http://localhost:5173 -o out.mp4 --composition my-video1
```

## 💻 CLI 参考

### `open-motion init <name>`
使用预配置的 React 模板初始化一个新的 OpenMotion 项目。

### `open-motion generate <description>`
使用 LLM 从文本描述自动生成视频场景和代码。

| 选项 | 描述 |
| :--- | :--- |
| `--env <path>` | .env 文件路径 (默认: 当前目录下的 .env) |
| `--scenes <number>` | 要生成的场景数量 |
| `--fps <number>` | 每秒帧数 (默认: 30) |
| `--width <number>` | 视频宽度 (默认: 1280) |
| `--height <number>` | 视频高度 (默认: 720) |

### `open-motion edit <file>`
使用自然语言指令编辑 TSX 场景文件。

| 选项 | 描述 |
| :--- | :--- |
| `--env <path>` | .env 文件路径 (默认: 当前目录下的 .env) |
| `-m, --message <msg>` | 编辑指令 |
| `-y, --yes` | 自动应用更改 (一次性模式) |

### `open-motion config`
管理 LLM 提供商设置（API 密钥、模型）。

- `open-motion config list`
- `open-motion config get <VAR>`

LLM 设置从环境变量读取（可以放在项目本地的 `.env` 文件中）：

```bash
# .env
OPEN_MOTION_PROVIDER=openai
OPEN_MOTION_MODEL=gpt-5.1
OPENAI_API_KEY=sk-...
```

### `open-motion render`
从正在运行的 OpenMotion 应用程序渲染视频。

| 选项 | 描述 |
| :--- | :--- |
| `-u, --url <url>` | **必需。** OpenMotion 应用的 URL (例如 `http://localhost:5173`) |
| `-o, --out <path>` | **必需。** 输出文件路径 (例如 `out.mp4`, `animation.gif`) |
| `-c, --composition <id>` | 要渲染的合成 ID |
| `-p, --props <json>` | 传递给合成的 props JSON 字符串 |
| `-j, --concurrency <n>` | 并行浏览器实例数量 (默认: 1) |
| `--format <format>` | 输出格式: `mp4`, `webm`, `gif`, `webp`, `auto` |
| `--width <number>` | 覆盖输出宽度 |
| `--height <number>` | 覆盖输出高度 |
| `--fps <number>` | 覆盖每秒帧数 |
| `--duration <number>` | 覆盖要渲染的总帧数 |
| `--public-dir <path>` | 静态资源的公共目录 (默认: `./public`) |
| `--chromium-path <path>`| 自定义 Chromium 可执行文件路径 |
| `--timeout <number>` | 浏览器操作超时时间 (毫秒) |
| `--font <spec>` | 加载本地字体文件用于渲染 (可重复指定)。格式: `Family=path` 或 `path` |
| `--bgm <path>` | 从本地 MP3 文件添加背景音乐 |
| `--bgm-volume <number>` | BGM 音量 (0.0-1.0, 默认: 1.0) |

示例 (渲染时添加 BGM):

```bash
open-motion render -u http://localhost:5173 -o out.mp4 --bgm ./music/bgm.mp3 --bgm-volume 0.5
```

注意:
- 如果 BGM 比视频短，它会循环播放以覆盖整个时长。
- 如果 BGM 比视频长，它会被裁剪到视频时长。

## 📚 API 参考

### 核心 Hooks 与配置
**`useCurrentFrame()`**: 获取当前帧数。
**`useVideoConfig()`**: 访问宽度、高度、fps 和时长。

### 组件
- **`<Loop />`**: 创建循环的时间上下文。
- **`<Transition />`**: 平滑的进入/退出效果 (`fade`, `wipe`, `slide`, `zoom`)。
- **`<ThreeCanvas />`**: 渲染同步的 Three.js 场景。
- **`<Lottie />`**: 声明式 Lottie 动画。
- **`<Audio />`**: 具有音量控制的多轨音频。
- **`<Captions />`** / **`<TikTokCaption />`**: 字幕渲染。
- **`<OffthreadVideo />`**: 高性能后台视频解码。

### 工具函数
- **`interpolate()`**: 支持缓动的范围映射。
- **`Easing`**: 完整的缓动函数库。
- **`parseSrt()`**: 将 SRT 文件转换为数据结构。
- **`getVideoMetadata()`**: 获取视频文件的尺寸和时长。

## 💡 最佳实践

### 稳健渲染
对于生产环境，请使用项目自带的 `npm run render` 脚本。它处理完整的 **构建 -> 静态服务 -> 渲染 -> 清理** 链条，消除缓冲区问题。

### 资源存放
将所有本地资源放在 `public/` 中，并通过绝对路径引用 (例如 `/video.mp4`)。

## 📜 许可证

MIT © [jsongo](https://github.com/jsongo)
