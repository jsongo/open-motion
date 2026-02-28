# OpenMotion

<p align="center">
  <img src="assets/open-motion.jpg" width="120" height="120" alt="OpenMotion Logo" />
</p>

<p align="center">
  <strong>React開発者のためのオープンソース・プログラマティック・ビデオエンジン。</strong>
</p>

<p align="center">
  <a href="#-features">機能</a> •
  <a href="#-packages">パッケージ</a> •
  <a href="#-installation">インストール</a> •
  <a href="#-quick-start">クイックスタート</a> •
  <a href="#-cli-reference">CLI リファレンス</a> •
  <a href="#-api-reference">API リファレンス</a>
</p>

---

OpenMotionは、Remotionに代わる高性能なオープンソースの選択肢です。使い慣れたReactコンポーネント、フック、お気に入りのCSSライブラリを使用して、フレーム単位で正確なビデオを作成できます。

### 🎬 ショーケース

| 機能ショーケース | メディアショーケース |
| :---: | :---: |
| ![Feature Showcase](assets/feature-showcase.gif) | ![Media Showcase](assets/media-showcase.gif) |
| ブランド、ダッシュボード、イージング | ビデオ、オーディオ |

## ✨ 機能

- ⚛️ **Reactファースト**: Reactエコシステムのパワーを最大限に活用。
- 🤖 **AI駆動の生成**: LLMを使用してテキスト記述から完全なビデオを作成。
- ✍️ **AIアシスト編集**: 自然言語を使用してTSXシーンを編集。
- ⏱️ **フレーム精度の決定論**: 高度なタイムジャック技術により、すべてのフレームが同一であることを保証。
- 🚀 **並列レンダリング**: すべてのCPUコアを利用してレンダリング速度をスケール。
- 🎵 **マルチトラック・オーディオミキシング**: 独立した音量制御を持つ複数の `<Audio />` をサポート。
- 📈 **アニメーションコンポーネント**: ループ、トランジション、イージングなどの組み込みライブラリ。
- 📦 **外部連携**: **Three.js** や **Lottie** アニメーションをネイティブサポート。
- 💬 **キャプションシステム**: SRTサポートとTikTokスタイルのアニメーションによる自動字幕レンダリング。
- 📊 **メディア分析**: ビデオ/オーディオの動的なメタデータ抽出（長さ、解像度）。
- 📹 **オフスレッドビデオ**: 高性能なビデオデコードをバックグラウンドプロセスに移行。
- 📊 **動的メタデータ**: ビデオの解像度や長さなどのプロパティを動的に計算。
- 🎬 **GIF & ビデオ出力**: MP4, WebM, GIF, WebP形式でのレンダリングに対応。

## 📦 パッケージ

| パッケージ | 説明 |
| :--- | :--- |
| [`@open-motion/core`](./packages/core) | Reactプリミティブ (`Composition`, `Sequence`, `Loop`), フック, メディアユーティリティ。 |
| [`@open-motion/components`](./packages/components) | 高度なコンポーネント (`Transition`, `ThreeCanvas`, `Lottie`, `Captions`)。 |
| [`@open-motion/renderer`](./packages/renderer) | Playwrightベースのキャプチャエンジン。 |
| [`@open-motion/cli`](./packages/cli) | コマンドラインインターフェース。 |

## 🛠 インストール

```bash
npm install @open-motion/core @open-motion/components
```

## 🔧 ソースからのビルド

ソースからビルドするには、[Node.js](https://nodejs.org/) と [pnpm](https://pnpm.io/) が必要です。

```bash
git clone https://github.com/jsongo/open-motion.git
cd open-motion
pnpm install
pnpm build
```

### Windows: pnpm グローバルリンクの設定

Windowsで `pnpm link --global` を使用する場合、先にグローバルbinディレクトリを設定する必要がある場合があります：

```powershell
$env:PNPM_HOME = "C:\Users\<YourUser>\AppData\Local\pnpm"
$env:PATH += ";$env:PNPM_HOME"
cd packages/cli
pnpm link --global
```

または、`pnpm setup` を実行してターミナルを再起動すると、環境変数が自動的に適用されます。

## 🚀 クイックスタート

### 1. セットアップ
CLIツールと必要なブラウザをインストールします：
```bash
pnpm install -g @open-motion/cli @open-motion/renderer
npx playwright install chromium
```

Linuxのヘッドレス環境で日本語/中国語などが文字化けする場合は、フォントが入っていないことが原因です。システムフォントをインストールする（推奨）か、レンダー時にローカルフォントを読み込んでください。

- システムフォントをインストール (Ubuntu/Debian): `sudo apt-get update && sudo apt-get install -y fonts-noto-cjk`
- またはローカルフォントを読み込む: `open-motion render ... --font "Noto Sans JP=./public/fonts/NotoSansJP-Regular.woff2"`

### 2. プロジェクトの作成
```bash
mkdir -p my_videos && cd my_videos
open-motion init my-video1
cd ../..  # monorepoのルートに戻る
pnpm install
```

### 3. 開発とレンダリング

ターミナルで開発サーバーを起動します：

```bash
cd my_videos/my-video1
pnpm run dev
```

または

```bash
pnpm --filter my-video1 dev
```

別のターミナルで、サーバーのURLを使用してビデオをレンダリングします：
```bash
open-motion render -u http://localhost:5173 -o out.mp4 --composition my-video1
```

## 💻 CLI リファレンス

### `open-motion init <name>`
事前設定されたReactテンプレートを使用して、新しいOpenMotionプロジェクトを初期化します。

### `open-motion generate <description>`
LLMを使用してテキスト記述からビデオシーンとコードを自動生成します。

| オプション | 説明 |
| :--- | :--- |
| `--env <path>` | .envファイルのパス (デフォルト: カレントディレクトリの .env) |
| `--scenes <number>` | 生成するシーン数 |
| `--fps <number>` | フレームレート (デフォルト: 30) |
| `--width <number>` | ビデオ幅 (デフォルト: 1280) |
| `--height <number>` | ビデオ高さ (デフォルト: 720) |

### `open-motion edit <file>`
自然言語の指示を使用してTSXシーンファイルを編集します。

| オプション | 説明 |
| :--- | :--- |
| `--env <path>` | .envファイルのパス (デフォルト: カレントディレクトリの .env) |
| `-m, --message <msg>` | 編集指示 |
| `-y, --yes` | 変更を自動適用 (ワンショットモード) |

### `open-motion config`
LLMプロバイダーの設定（APIキー、モデル）を管理します。

- `open-motion config list`
- `open-motion config get <VAR>`

LLM設定は環境変数から読み込まれます（プロジェクトローカルの `.env` ファイルに記述できます）：

```bash
# .env
OPEN_MOTION_PROVIDER=openai
OPEN_MOTION_MODEL=gpt-5.1
OPENAI_API_KEY=sk-...
```

### `open-motion render`
実行中のOpenMotionアプリケーションからビデオをレンダリングします。

| オプション | 説明 |
| :--- | :--- |
| `-u, --url <url>` | **必須。** OpenMotionアプリのURL (例: `http://localhost:5173`) |
| `-o, --out <path>` | **必須。** 出力ファイルパス (例: `out.mp4`, `animation.gif`) |
| `-c, --composition <id>` | レンダリングするコンポジションのID |
| `-p, --props <json>` | コンポジションに渡すプロップのJSON文字列 |
| `-j, --concurrency <n>` | 並列ブラウザインスタンスの数 (デフォルト: 1) |
| `--format <format>` | 出力形式: `mp4`, `webm`, `gif`, `webp`, `auto` |
| `--width <number>` | 出力幅を上書き |
| `--height <number>` | 出力高さを上書き |
| `--fps <number>` | フレームレート(FPS)を上書き |
| `--duration <number>` | レンダリングする総フレーム数を上書き |
| `--public-dir <path>` | 静的アセットの公開ディレクトリ (デフォルト: `./public`) |
| `--chromium-path <path>`| カスタムChromium実行ファイルのパス |
| `--timeout <number>` | ブラウザ操作のタイムアウト (ミリ秒) |
| `--font <spec>` | レンダー時にローカルフォントを読み込む（繰り返し指定可）。形式: `Family=path` または `path` |
| `--bgm <path>` | ローカルのMP3ファイルをBGMとして追加 |
| `--bgm-volume <number>` | BGM音量 (0.0-1.0, デフォルト: 1.0) |

例 (レンダー時にBGMを追加):

```bash
open-motion render -u http://localhost:5173 -o out.mp4 --bgm ./music/bgm.mp3 --bgm-volume 0.5
```

補足:
- BGMが動画より短い場合、動画の最後までループします。
- BGMが動画より長い場合、動画の長さでカットされます。

## 📚 API リファレンス

### コアフックと設定
**`useCurrentFrame()`**: 現在のフレーム番号を取得します。
**`useVideoConfig()`**: 幅、高さ、fps、長さにアクセスします。

### コンポーネント
- **`<Loop />`**: ループする時間コンテキストを作成します。
- **`<Transition />`**: スムーズな開始/終了エフェクト (`fade`, `wipe`, `slide`, `zoom`)。
- **`<ThreeCanvas />`**: 同期されたThree.jsシーンをレンダリングします。
- **`<Lottie />`**: 宣言的なLottieアニメーション。
- **`<Audio />`**: 音量制御可能なマルチトラックオーディオ。
- **`<Captions />`** / **`<TikTokCaption />`**: 字幕レンダリング。
- **`<OffthreadVideo />`**: 高性能なバックグラウンドビデオデコード。

### ユーティリティ
- **`interpolate()`**: イージングをサポートする範囲マッピング。
- **`Easing`**: イージング関数の完全なライブラリ。
- **`parseSrt()`**: SRTファイルをデータ構造に変換します。
- **`getVideoMetadata()`**: ビデオファイルの解像度と長さを取得します。

## 💡 ベストプラクティス

### 堅牢なレンダリング
本番環境では、プロジェクト組み込みの `npm run render` スクリプトを使用してください。これは **ビルド -> 静的サーバー -> レンダリング -> クリーンアップ** の全工程を処理し、バッファ問題を回避します。

### アセットの保存
ローカルアセットはすべて `public/` に配置し、絶対パス（例: `/video.mp4`）で参照してください。

## 📜 ライセンス

MIT © [jsongo](https://github.com/jsongo)
