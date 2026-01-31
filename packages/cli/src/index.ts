import { renderFrames, getCompositions } from '@open-motion/renderer';
import { encodeVideo } from '@open-motion/encoder';
import path from 'path';
import fs from 'fs';
import { Command } from 'commander';

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
        render: 'open-motion render -u http://localhost:5173 -o out.mp4'
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
    <title>\${projectName}</title>
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    'src/App.tsx': `import React from 'react';
import {
  CompositionProvider,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Composition,
  Player
} from '@open-motion/core';

const MyVideo = () => {
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
};

export const App = () => {
  const config = { width: 1280, height: 720, fps: 30, durationInFrames: 60 };
  const isRendering = typeof (window as any).__OPEN_MOTION_FRAME__ === 'number';

  if (isRendering) {
    return (
      <CompositionProvider config={config} frame={(window as any).__OPEN_MOTION_FRAME__}>
        <MyVideo />
      </CompositionProvider>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Player component={MyVideo} config={config} />
      <div style={{ display: 'none' }}>
        <Composition id="main" component={MyVideo} {...config} />
      </div>
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
}) => {
  const tmpDir = path.join(process.cwd(), '.open-motion-tmp');
  const inputProps = options.props ? JSON.parse(options.props) : {};

  console.log(`Fetching compositions from ${options.url}...`);
  const compositions = await getCompositions(options.url);

  if (compositions.length === 0) {
    console.error('No compositions found in the provided URL.');
    process.exit(1);
  }

  let selectedComp = compositions[0];
  if (options.compositionId) {
    selectedComp = compositions.find((c: any) => c.id === options.compositionId);
    if (!selectedComp) {
      console.error(`Composition "${options.compositionId}" not found. Available: ${compositions.map((c: any) => c.id).join(', ')}`);
      process.exit(1);
    }
  }

  const config = {
    width: options.width || selectedComp.width,
    height: options.height || selectedComp.height,
    fps: options.fps || selectedComp.fps,
    durationInFrames: options.duration || selectedComp.durationInFrames
  };

  console.log(`Rendering composition: ${selectedComp.id} (${config.width}x${config.height}, ${config.fps}fps, ${config.durationInFrames} frames)`);

  const { audioAssets } = await renderFrames({
    url: options.url,
    config,
    outputDir: tmpDir,
    compositionId: selectedComp.id,
    inputProps,
    concurrency: options.concurrency || 1
  });

  // Handle first audio asset for now (simplified)
  const audioFile = audioAssets.length > 0 ? audioAssets[0].src : undefined;

  await encodeVideo({
    framesDir: tmpDir,
    fps: config.fps,
    outputFile: options.out,
    audioFile
  });

  console.log(`Success! Video rendered to ${options.out}`);
};

export const main = () => {
  const program = new Command();

  program
    .name('open-motion')
    .description('CLI for OpenMotion')
    .version('0.0.1-alpha.0');

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
    .action(async (options) => {
      try {
        await runRender(options);
      } catch (err) {
        console.error('Render failed:', err);
        process.exit(1);
      }
    });

  program.parse(process.argv);
};
