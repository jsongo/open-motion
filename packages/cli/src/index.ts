import { renderFrames, getCompositions } from '@open-motion/renderer';
import { chromium } from 'playwright';
import { encodeVideo, encodeGif, encodeWebP } from '@open-motion/encoder';
import path from 'path';
import fs from 'fs';
import { Command } from 'commander';
import cliProgress from 'cli-progress';

export const runInit = async (projectName: string) => {
  const targetDir = path.join(process.cwd(), projectName);
  if (fs.existsSync(targetDir)) {
    console.error(`Directory ${projectName} already exists.`);
    process.exit(1);
  }

  console.log(`Initializing OpenMotion project: ${projectName}...`);

  // Basic template structure
  const dirs = ['', 'src'];
  for (const dir of dirs) {
    fs.mkdirSync(path.join(targetDir, dir), { recursive: true });
  }

  // Template files
  const files = {
    'package.json': JSON.stringify({
      name: projectName,
      private: true,
      version: '0.0.1-alpha.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
        render: 'npm run build && (npx http-server dist -p 5173 -a 127.0.0.1 > /dev/null 2>&1 & sleep 2 && open-motion render -u http://127.0.0.1:5173 --composition main -o ./out.mp4 --concurrency 4 && pkill -f http-server)'
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
import { CompositionProvider, Composition, Player } from '@open-motion/core';

const Root = () => {
  const config = { width: 1920, height: 1080, fps: 30, durationInFrames: 120 };
  const isRendering = typeof (window as any).__OPEN_MOTION_FRAME__ === 'number';

  if (isRendering) {
    return (
      <CompositionProvider config={config} frame={(window as any).__OPEN_MOTION_FRAME__}>
        <App />
      </CompositionProvider>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Player component={App} config={config} />
      <div style={{ display: 'none' }}>
        <Composition id="main" component={App} {...config} />
      </div>
    </div>
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

  console.log(`Success! Project \${projectName} initialized.`);
  console.log(`Next steps:`);
  console.log(`  cd \${projectName}`);
  console.log(`  npm install (or pnpm install)`);
  console.log(`  npm run dev`);
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
}) => {
  if (options.chromiumPath) {
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = options.chromiumPath;
  }
  const tmpDir = path.join(process.cwd(), '.open-motion-tmp');
  const inputProps = options.props ? JSON.parse(options.props) : {};
  const startTime = Date.now();

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
    const compositions = await getCompositions(options.url, { inputProps }).catch(() => []);
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
    const compositions = await getCompositions(options.url, { inputProps });
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
    onProgress: (frame) => renderBar.update(frame)
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

  program
    .name('open-motion')
    .description('CLI for OpenMotion')
    .version(pkg.version);

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

  program
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
          chromiumPath: options.chromiumPath
        });
      } catch (err) {
        console.error('Render failed:', err);
        process.exit(1);
      }
    });

  program.parse(process.argv);
};
