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

## 🚀 快速开始

### 1. 设置
安装 CLI 工具和必需的浏览器：
```bash
pnpm install -g @open-motion/cli @open-motion/renderer
npx playwright install chromium
```

### 2. 创建项目
```bash
open-motion init my-video
cd my-video && pnpm install
```

### 3. 开发与渲染
在一个终端中启动开发服务器：
```bash
pnpm run dev
```
在另一个终端中，使用服务器 URL 渲染视频：
```bash
open-motion render -u http://localhost:5173 -o out.mp4
```

## 💻 CLI 参考

### `open-motion init <name>`
使用预配置的 React 模板初始化一个新的 OpenMotion 项目。

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
