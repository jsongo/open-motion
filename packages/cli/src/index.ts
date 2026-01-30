import { renderFrames, getCompositions } from '@open-motion/renderer';
import { encodeVideo } from '@open-motion/encoder';
import path from 'path';
import { Command } from 'commander';

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
    .version('0.1.0');

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
