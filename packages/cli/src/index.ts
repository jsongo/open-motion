import { renderFrames, getCompositions, type RenderFont } from '@open-motion/renderer';
import { chromium } from 'playwright';
import { encodeVideo, encodeGif, encodeWebP } from '@open-motion/encoder';
import path from 'path';
import fs from 'fs';
import { Command } from 'commander';
import cliProgress from 'cli-progress';
import { execSync } from 'child_process';
import { runGenerate } from './commands/generate';
import { runEdit } from './commands/edit';
import { runConfigSet, runConfigGet, runConfigList, printConfigHelp } from './commands/config';

const getPackageManager = () => {
  try {
    execSync('pnpm -v', { stdio: 'ignore' });
    return 'pnpm';
  } catch (e) {
    return 'npm';
  }
};

const formatRun = (pm: string, script: string) => {
  return pm === 'npm' ? `npm run ${script}` : `${pm} ${script}`;
};

export const runInit = async (projectName: string) => {
  const targetDir = path.join(process.cwd(), projectName);
  if (fs.existsSync(targetDir)) {
    console.error(`Directory ${projectName} already exists.`);
    process.exit(1);
  }

  const pm = getPackageManager();
  console.log(`Initializing OpenMotion project: ${projectName} using ${pm}...`);

  // Basic template structure
  const dirs = ['', 'src'];
  for (const dir of dirs) {
    fs.mkdirSync(path.join(targetDir, dir), { recursive: true });
  }

  // Template files
  const files = {
    '.npmrc': 'workspaces=false\n',
    'package.json': JSON.stringify({
      name: projectName,
      private: true,
      version: '0.0.1-alpha.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
        render: `${pm} run build && npx http-server dist -p 5173 -a 127.0.0.1 > /dev/null 2>&1 & sleep 2 && open-motion render -u http://127.0.0.1:5173 --composition main -o ./out.mp4 --concurrency 4; pkill -f http-server`
      },
      dependencies: {
        'react': '^18.2.0',
        'react-dom': '^18.2.0',
        '@open-motion/core': 'latest'
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.0.0',
        'vite': '^4.4.0',
        'typescript': '^5.0.0'
      }
    }, null, 2),
    'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
});`,
    'src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.tsx';
import {
  CompositionProvider,
  Composition,
  Player,
  getCompositions,
  getCompositionById,
  type VideoConfig,
} from '@open-motion/core';

const STORAGE_KEY = 'open-motion:preview:compositionId';

const RegisterCompositions = () => {
  const mainConfig: VideoConfig = {
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 120,
  };

  return (
    <div style={{ display: 'none' }}>
      <Composition id="main" component={App} {...mainConfig} />
    </div>
  );
};

const pickInitialCompositionId = (ids: string[]) => {
  if (typeof window === 'undefined') return ids[0] ?? 'main';

  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get('comp');
  if (fromQuery && ids.includes(fromQuery)) return fromQuery;

  const fromStorage = window.localStorage.getItem(STORAGE_KEY);
  if (fromStorage && ids.includes(fromStorage)) return fromStorage;

  return ids[ids.length - 1] ?? 'main';
};

const PreviewMode = () => {
  const compositions = getCompositions();
  const ids = compositions.map((c) => c.id);
  const [selectedId, setSelectedId] = React.useState(() => pickInitialCompositionId(ids));

  const selected = compositions.find((c) => c.id === selectedId) ?? compositions[compositions.length - 1];

  React.useEffect(() => {
    if (!selected && ids.length > 0) {
      setSelectedId(pickInitialCompositionId(ids));
    }
  }, [ids.join('|')]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, selectedId);

    const url = new URL(window.location.href);
    url.searchParams.set('comp', selectedId);
    window.history.replaceState({}, '', url.toString());
  }, [selectedId]);

  if (!selected) {
    return (
      <div style={{ padding: 16, fontFamily: 'ui-sans-serif, system-ui' }}>
        No compositions registered.
      </div>
    );
  }

  const config: VideoConfig = {
    width: selected.width,
    height: selected.height,
    fps: selected.fps,
    durationInFrames: selected.durationInFrames,
  };

  const renderUrl = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:5173';
  const renderCmd = 'open-motion render -u ' + renderUrl + ' -o out.mp4 --composition ' + selectedId;

  return (
    <div style={{ minHeight: '100vh', padding: 16, background: '#f6f6f7', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, color: '#333', fontFamily: 'ui-sans-serif, system-ui' }}>Composition</div>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}
        >
          {compositions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id}
            </option>
          ))}
        </select>
        <div style={{ fontSize: 12, color: '#666', fontFamily: 'ui-sans-serif, system-ui' }}>
          {config.width}x{config.height} / {config.fps}fps / {config.durationInFrames}f
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto', flex: '1 1 520px', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 12, color: '#333', fontFamily: 'ui-sans-serif, system-ui' }}>Render</div>
          <div
            style={{
              fontSize: 12,
              color: '#111',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: '6px 8px',
              maxWidth: 'min(720px, 100%)',
              wordBreak: 'break-all',
            }}
          >
            {renderCmd}
          </div>
        </div>
      </div>

      <Player key={selectedId} component={selected.component} config={config} />
    </div>
  );
};

const RenderMode = () => {
  const frame = (window as any).__OPEN_MOTION_FRAME__ as number;
  const compositionId = ((window as any).__OPEN_MOTION_COMPOSITION_ID__ as string | undefined) ?? 'main';
  const inputProps = (window as any).__OPEN_MOTION_INPUT_PROPS__ ?? {};

  const selected = getCompositionById(compositionId) ?? getCompositions()[0];
  if (!selected) return null;

  const config: VideoConfig = {
    width: selected.width,
    height: selected.height,
    fps: selected.fps,
    durationInFrames: selected.durationInFrames,
  };

  const Component = selected.component;
  return (
    <CompositionProvider config={config} frame={frame} inputProps={inputProps}>
      <Component />
    </CompositionProvider>
  );
};

const Root = () => {
  const isRendering = typeof (window as any).__OPEN_MOTION_FRAME__ === 'number';
  return (
    <>
      <RegisterCompositions />
      {isRendering ? <RenderMode /> : <PreviewMode />}
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);`,
    'src/App.tsx': `import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate
} from '@open-motion/core';

export const App = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const opacity = interpolate(frame, [0, 30], [0, 1]);

  return (
    <div style={{
      flex: 1,
      backgroundColor: 'white',
      width,
      height,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: 80,
      opacity
    }}>
      Hello OpenMotion
    </div>
  );
};`
  };

  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(targetDir, name), content);
  }

  console.log(`Success! Project ${projectName} initialized.`);
  console.log(`Next steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  ${pm} install`);
  console.log(`  ${pm} run dev`);
};

export const runRender = async (options: {
  url: string;
  out: string;
  compositionId?: string;
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  props?: string;
  concurrency?: number;
  publicDir?: string;
  format?: 'mp4' | 'gif' | 'webp' | 'webm' | 'auto';
  chromiumPath?: string;
  timeout?: number;
  bgm?: string;
  bgmVolume?: number;
  font?: string[];
}) => {
  const timeout = options.timeout || parseInt(process.env.OPEN_MOTION_RENDER_TIMEOUT || '300000', 10);

  if (options.chromiumPath) {
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = options.chromiumPath;
  }
  const tmpDir = path.join(process.cwd(), '.open-motion-tmp');
  const inputProps = options.props ? JSON.parse(options.props) : {};
  const startTime = Date.now();

  const parseFontSpecs = (specs?: string[]): RenderFont[] => {
    if (!specs || specs.length === 0) return [];

    return specs
      .map((raw) => String(raw).trim())
      .filter(Boolean)
      .map((raw) => {
        const eq = raw.indexOf('=');
        if (eq === -1) {
          return { family: 'OpenMotionFont', path: raw };
        }
        const family = raw.slice(0, eq).trim() || 'OpenMotionFont';
        const p = raw.slice(eq + 1).trim();
        return { family, path: p };
      })
      .filter((f) => Boolean(f.path));
  };

  // Check for browser installation before starting
  try {
    chromium.executablePath();
  } catch (error) {
    console.error('\n❌ Browser not found!');
    console.error('\nPlaywright browsers need to be installed before rendering.');
    console.error('\nPlease run one of the following commands:');
    console.error('\n  # If using global installation:');
    console.error('  npx playwright install');
    console.error('\n  # If using local installation:');
    console.error('  cd /path/to/your/project && npx playwright install');
    console.error('\n  # Or install only the required browser:');
    console.error('  npx playwright install chromium\n');
    process.exit(1);
  }

  console.log(`Fetching compositions from ${options.url}...`);
  let selectedComp: any = null;

  if (options.compositionId) {
    // If ID is provided, we can skip the heavy discovery if we want,
    // but for now let's just make it non-fatal if discovery fails but ID is present
    const compositions = await getCompositions(options.url, { inputProps, timeout }).catch(() => []);
    selectedComp = compositions.find((c: any) => c.id === options.compositionId);

    if (!selectedComp) {
      console.warn(`Composition "${options.compositionId}" not found via discovery, using default config.`);
      selectedComp = {
        id: options.compositionId,
        width: options.width || 1280,
        height: options.height || 720,
        fps: options.fps || 30,
        durationInFrames: options.duration || 100
      };
    }
  } else {
    const compositions = await getCompositions(options.url, { inputProps, timeout });
    if (compositions.length === 0) {
      console.error('No compositions found in the provided URL.');
      process.exit(1);
    }
    selectedComp = compositions[0];
  }

  const config = {
    width: options.width || selectedComp.width,
    height: options.height || selectedComp.height,
    fps: options.fps || selectedComp.fps,
    durationInFrames: options.duration || selectedComp.durationInFrames
  };

  console.log(`Rendering composition: ${selectedComp.id} (${config.width}x${config.height}, ${config.fps}fps, ${config.durationInFrames} frames)`);

  const multibar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format: ' {bar} | {percentage}% | {value}/{total} | {task}',
  }, cliProgress.Presets.shades_grey);

  const renderBar = multibar.create(config.durationInFrames, 0, { task: 'Rendering' });

  const { audioAssets } = await renderFrames({
    url: options.url,
    config,
    outputDir: tmpDir,
    compositionId: selectedComp.id,
    inputProps,
    concurrency: options.concurrency || 1,
    publicDir: options.publicDir ? path.join(process.cwd(), options.publicDir) : undefined,
    onProgress: (frame) => renderBar.update(frame),
    timeout,
    fonts: parseFontSpecs(options.font),
  });

  renderBar.update(config.durationInFrames);

  // Helper to resolve audio paths to absolute file paths
  const resolveAssetPath = (src: string): string => {
    if (!src.startsWith('/') || src.startsWith('//')) {
      return src;
    }

    // Look for public folder based on user input or common locations
    const possiblePaths: string[] = [];

    if (options.publicDir) {
      possiblePaths.push(path.join(process.cwd(), options.publicDir, src.substring(1)));
    }

    // Common fallback paths
    const commonPaths = [
      path.join(process.cwd(), 'public', src.substring(1)),
      path.join(process.cwd(), 'static', src.substring(1)),
      path.join(process.cwd(), 'assets', src.substring(1)),
    ];

    for (const p of commonPaths) {
      if (!possiblePaths.includes(p)) {
        possiblePaths.push(p);
      }
    }

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    return src;
  };

  // Resolve audio paths to absolute file paths if they are relative URLs
  const resolvedAudioAssets = audioAssets.map(asset => {
    if (asset.src.startsWith('/') && !asset.src.startsWith('//')) {
      const resolvedPath = resolveAssetPath(asset.src);
      return { ...asset, src: resolvedPath };
    }
    return asset;
  });

  // Inject a render-time BGM track (file path on disk)
  if (options.bgm) {
    const bgmPath = path.resolve(process.cwd(), options.bgm);

    if (!fs.existsSync(bgmPath)) {
      console.error(`BGM file not found: ${bgmPath}`);
      process.exit(1);
    }

    resolvedAudioAssets.push({
      src: bgmPath,
      startFrame: 0,
      startFrom: 0,
      volume: options.bgmVolume ?? 1.0,
      isBgm: true,
    });
  }

  const encodeBar = multibar.create(100, 0, { task: 'Encoding ' });

  // Determine output format
  let format = options.format || 'auto';
  if (format === 'auto') {
    const ext = path.extname(options.out).toLowerCase();
    if (ext === '.gif') format = 'gif';
    else if (ext === '.webp') format = 'webp';
    else if (ext === '.webm') format = 'webm';
    else format = 'mp4';
  }

  if (format === 'gif') {
    await encodeGif({
      framesDir: tmpDir,
      fps: config.fps,
      outputFile: options.out,
      width: config.width,
      height: config.height,
      onProgress: (percent) => encodeBar.update(Math.round(percent))
    });
  } else if (format === 'webp') {
    await encodeWebP({
      framesDir: tmpDir,
      fps: config.fps,
      outputFile: options.out,
      width: config.width,
      height: config.height,
      onProgress: (percent) => encodeBar.update(Math.round(percent))
    });
  } else {
    // Both MP4 and WebM use encodeVideo, the output format is determined by file extension
    await encodeVideo({
      framesDir: tmpDir,
      fps: config.fps,
      outputFile: options.out,
      durationInFrames: config.durationInFrames,
      audioAssets: resolvedAudioAssets,
      onProgress: (percent) => encodeBar.update(Math.round(percent))
    });
  }

  encodeBar.update(100);
  multibar.stop();

  const endTime = Date.now();
  const durationSec = ((endTime - startTime) / 1000).toFixed(1);

  console.log(`\nSuccess! Video rendered to ${options.out}`);
  console.log(`Total time: ${durationSec}s`);
};

// Read package.json version
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

export const main = () => {
  const program = new Command();
  const pm = getPackageManager();

  program
    .name('open-motion')
    .description('CLI for OpenMotion')
    .version(pkg.version)
    .addHelpText('after', `
Quick Start:
  1. Initialize project:  $ open-motion init my-video
  2. Enter directory:     $ cd my-video
  3. Install deps:        $ ${pm} install
  4. Configure LLM:       $ open-motion config set provider openai
                          $ open-motion config set openai.apiKey sk-...
  5. Generate scenes:     $ open-motion generate "A video explaining the React lifecycle"
  6. Edit a scene:        $ open-motion edit src/scenes/IntroScene.tsx
  7. Start dev server:    $ ${formatRun(pm, 'dev')}
  8. Render video:        $ ${formatRun(pm, 'render')}

Example Usage:
  $ open-motion init my-project
  $ open-motion generate "TypeScript type system explainer"
  $ open-motion edit src/scenes/IntroScene.tsx --message "Change the background to blue"
  $ open-motion render -u http://localhost:5173 -o output.mp4 --composition main
`);

  program
    .command('init <name>')
    .description('Initialize a new OpenMotion project')
    .action(async (name) => {
      try {
        await runInit(name);
      } catch (err) {
        console.error('Init failed:', err);
        process.exit(1);
      }
    });

  const renderCommand = program
    .command('render')
    .description('Render a video')
    .requiredOption('-u, --url <url>', 'URL of the OpenMotion app')
    .requiredOption('-o, --out <path>', 'Output video file path')
    .option('-c, --composition <id>', 'ID of the composition to render')
    .option('-p, --props <json>', 'JSON string of props to pass to the composition')
    .option('-j, --concurrency <number>', 'Number of parallel browser instances', parseInt)
    .option('--width <number>', 'Override width', parseInt)
    .option('--height <number>', 'Override height', parseInt)
    .option('--fps <number>', 'Override FPS', parseInt)
    .option('--duration <number>', 'Override duration in frames', parseInt)
    .option('--public-dir <path>', 'Public directory path for static assets (default: "./public")')
    .option('--format <format>', 'Output format (mp4, webm, gif, webp, auto)', 'auto')
    .option('--chromium-path <path>', 'Custom path to Chromium executable')
    .option('--timeout <number>', 'Timeout for browser operations in milliseconds', parseInt)
    .option(
      '--font <spec>',
      'Load a local font file for rendering (repeatable). Format: "Family=path" or just "path".',
      (value, previous: string[] = []) => {
        previous.push(value);
        return previous;
      },
      [] as string[]
    )
    .option('--bgm <path>', 'Path to an MP3 file to use as background music')
    .option('--bgm-volume <number>', 'BGM volume (0.0-1.0, default: 1.0)', parseFloat)
    .action(async (options) => {
      try {
        await runRender({
          url: options.url,
          out: options.out,
          compositionId: options.composition,
          props: options.props,
          concurrency: options.concurrency,
          width: options.width,
          height: options.height,
          fps: options.fps,
          duration: options.duration,
          publicDir: options.publicDir,
          format: options.format,
          chromiumPath: options.chromiumPath,
          timeout: options.timeout,
          font: options.font,
          bgm: options.bgm,
          bgmVolume: options.bgmVolume,
        });
      } catch (err) {
        console.error('Render failed:', err);
        process.exit(1);
      }
    });

  renderCommand.addHelpText('after', `
Examples:
  $ open-motion render -u http://localhost:5173 -o out.mp4
  $ open-motion render -u http://localhost:5173 -o out.mp4 --composition main --concurrency 4
  $ open-motion render -u http://localhost:3000 -o banner.gif --format gif --width 1200 --height 630
`);

  // ---------------------------------------------------------------------------
  // generate command
  // ---------------------------------------------------------------------------
  const generateCommand = program
    .command('generate <description>')
    .description('Auto-generate video scene TSX files using an LLM')
    .option('--env <path>', 'Path to .env file (default: .env in current directory)')
    .option('--api-key <key>', 'API key (overrides environment variables)')
    .option('--base-url <url>', 'Base URL (for openrouter / openai-compatible / ollama)')
    .option('--scenes <number>', 'Number of scenes to generate (default: decided by LLM)', parseInt)
    .option('--fps <number>', 'Frame rate (default: 30)', parseInt)
    .option('--width <number>', 'Video width (default: 1280)', parseInt)
    .option('--height <number>', 'Video height (default: 720)', parseInt)
    .option('--output <dir>', 'Output directory for scene files (default: src/scenes)')
    .action(async (description: string, options) => {
      try {
        await runGenerate(description, {
          apiKey: options.apiKey,
          baseURL: options.baseUrl,
          scenes: options.scenes,
          fps: options.fps,
          width: options.width,
          height: options.height,
          output: options.output,
        });
      } catch (err) {
        console.error('Generate failed:', err);
        process.exit(1);
      }
    });

  generateCommand.addHelpText('after', `
Examples:
  $ open-motion generate "A video explaining the React lifecycle"
  $ open-motion generate "TypeScript type system explainer" --scenes 4 --fps 30
  $ open-motion generate "CI/CD pipeline explainer" --width 1920 --height 1080
  $ open-motion generate "How Docker works" --env .env.ollama

Note:
  - LLM configuration is read from environment variables
  - By default, .env in the current directory is loaded
  - Use --env to specify a custom .env file path
  - Run this command from the root of an existing project (created with open-motion init)
`);

  // ---------------------------------------------------------------------------
  // edit command
  // ---------------------------------------------------------------------------
  const editCommand = program
    .command('edit <file>')
    .description('Interactively edit a TSX scene file using an LLM')
    .option('-m, --message <instruction>', 'One-shot mode: pass instruction as a string')
    .option('--env <path>', 'Path to .env file (default: .env in current directory)')
    .option('--api-key <key>', 'API key (overrides environment variables)')
    .option('--base-url <url>', 'Base URL (for openrouter / openai-compatible / ollama)')
    .option('-y, --yes', 'Auto-apply changes without confirmation (one-shot mode only)')
    .action(async (file: string, options) => {
      try {
        await runEdit(file, {
          message: options.message,
          apiKey: options.apiKey,
          baseURL: options.baseUrl,
          yes: options.yes,
        });
      } catch (err) {
        console.error('Edit failed:', err);
        process.exit(1);
      }
    });

  editCommand.addHelpText('after', `
Examples:
  # Interactive mode (edit repeatedly in a conversation)
  $ open-motion edit src/scenes/IntroScene.tsx

  # One-shot mode (pass a single instruction)
  $ open-motion edit src/scenes/IntroScene.tsx --message "Change the background to blue"
  $ open-motion edit src/scenes/IntroScene.tsx -m "Make the text larger" --yes
  $ open-motion edit src/scenes/IntroScene.tsx -m "Smooth out the animation" --env .env.anthropic
`);

  // ---------------------------------------------------------------------------
  // config command
  // ---------------------------------------------------------------------------
  const configCommand = program
    .command('config')
    .description('Manage LLM provider configuration (~/.open-motion/config.json)')
    .action(() => {
      printConfigHelp();
    });

  configCommand
    .command('set <key> <value>')
    .description('Save a configuration value')
    .action((key: string, value: string) => {
      runConfigSet(key, value);
    });

  configCommand
    .command('get <key>')
    .description('Show a configuration value')
    .action((key: string) => {
      runConfigGet(key);
    });

  configCommand
    .command('list')
    .description('List all configuration values')
    .action(() => {
      runConfigList();
    });

  configCommand.addHelpText('after', `
Configurable keys:
  provider                      LLM provider to use (openai/openrouter/anthropic/google/ollama/openai-compatible)
  model                         Global model override
  openai.apiKey                 OpenAI API key
  openai.model                  OpenAI model (default: gpt-4o)
  openrouter.apiKey             OpenRouter API key
  openrouter.model              OpenRouter model (default: openai/gpt-4o)
  anthropic.apiKey              Anthropic API key
  anthropic.model               Anthropic model (default: claude-3-5-sonnet-20241022)
  google.apiKey                 Google AI API key
  google.model                  Google model (default: gemini-1.5-pro)
  ollama.baseURL                Ollama server URL (default: http://localhost:11434)
  ollama.model                  Ollama model (default: llama3)
  openai-compatible.baseURL     Base URL for custom API
  openai-compatible.apiKey      API key for custom API
  openai-compatible.model       Model name for custom API

Environment variables (override config file):
  OPEN_MOTION_PROVIDER          Provider override
  OPEN_MOTION_MODEL             Model override
  OPENAI_API_KEY                OpenAI API key
  OPENROUTER_API_KEY            OpenRouter API key
  OPENROUTER_BASE_URL           OpenRouter base URL override
  ANTHROPIC_API_KEY             Anthropic API key
  GOOGLE_API_KEY / GEMINI_API_KEY  Google AI API key
  OPEN_MOTION_BASE_URL          Custom base URL
  OPEN_MOTION_API_KEY           Custom API key

Examples:
  $ open-motion config list
  $ OPEN_MOTION_PROVIDER=openrouter OPENROUTER_API_KEY=sk-or-... open-motion generate "Explain closures"
  $ open-motion config list
`);

  program.parse(process.argv);
};
