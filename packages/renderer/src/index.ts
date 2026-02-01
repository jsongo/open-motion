import { chromium, Page } from 'playwright';
import { getTimeHijackScript, VideoConfig } from '@open-motion/core';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Helper to extract a single frame from a video using FFmpeg
const extractFrame = (videoPath: string, time: number, outputPath: string) => {
  try {
    // -ss before -i is faster as it seeks before decoding
    execSync(`ffmpeg -y -ss ${time} -i "${videoPath}" -frames:v 1 -q:v 2 "${outputPath}"`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    console.error(`Failed to extract frame from ${videoPath} at ${time}s`, e);
    return false;
  }
};

export interface RenderOptions {
  url: string;
  config: VideoConfig;
  outputDir: string;
  compositionId?: string;
  inputProps?: any;
  concurrency?: number;
  onProgress?: (frame: number) => void;
}

export const getCompositions = async (url: string) => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForLoadState('networkidle');

  // Wait for React to mount and all compositions to register
  // We wait for the variable to exist AND for a small stabilization period
  await page.waitForFunction(() => (window as any).__OPEN_MOTION_COMPOSITIONS__ !== undefined, { timeout: 10000 }).catch(() => {});
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

  const compositions = await page.evaluate(() => {
    return (window as any).__OPEN_MOTION_COMPOSITIONS__ || [];
  });

  await browser.close();
  return compositions;
};

export const renderFrames = async ({ url, config, outputDir, compositionId, inputProps = {}, concurrency = 1, onProgress }: RenderOptions) => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const framesPerWorker = Math.ceil(config.durationInFrames / concurrency);
  let totalFramesRendered = 0;

  const renderBatch = async (startFrame: number, endFrame: number, workerId: number) => {
    const browser = await chromium.launch({
      args: ['--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-sandbox']
    });
    const page = await browser.newPage({
      viewport: { width: config.width, height: config.height }
    });

    const workerAudioAssets: any[] = [];
    const videoCache = new Map<string, string>(); // Path to local resolved path

    for (let i = startFrame; i <= endFrame && i < config.durationInFrames; i++) {
      if (i === startFrame) {
        await page.addInitScript(({ frame, fps, hijackScript, compositionId, inputProps }) => {
          (window as any).__OPEN_MOTION_FRAME__ = frame;
          (window as any).__OPEN_MOTION_COMPOSITION_ID__ = compositionId;
          (window as any).__OPEN_MOTION_INPUT_PROPS__ = inputProps;
          (window as any).__OPEN_MOTION_READY__ = false;
          (window as any).__OPEN_MOTION_VIDEO_FRAMES__ = {};

          // Execute hijack script
          const script = document.createElement('script');
          script.textContent = hijackScript;
          document.documentElement.appendChild(script);
          script.remove();
        }, {
          frame: i,
          fps: config.fps,
          hijackScript: getTimeHijackScript(i, config.fps),
          compositionId,
          inputProps
        });

        await page.goto(url);
      } else {
        // Update frame for subsequent renders
        await page.evaluate(({ frame, fps, hijackScript }) => {
          (window as any).__OPEN_MOTION_READY__ = false;
          (window as any).__OPEN_MOTION_FRAME__ = frame;
          (window as any).__OPEN_MOTION_VIDEO_ASSETS__ = []; // Reset for this frame
          eval(hijackScript);
          window.dispatchEvent(new CustomEvent('open-motion-frame-update', { detail: { frame } }));
        }, {
          frame: i,
          fps: config.fps,
          hijackScript: getTimeHijackScript(i, config.fps),
        });
      }

      // Wait for content to be ready
      await page.waitForFunction(() => {
        const ready = (window as any).__OPEN_MOTION_READY__ === true;
        const delayCount = (window as any).__OPEN_MOTION_DELAY_RENDER_COUNT__ || 0;
        return ready && delayCount === 0;
      }, { timeout: 60000 });
      await page.waitForLoadState('networkidle');

      // Check for OffthreadVideo assets
      const videoAssets = await page.evaluate(() => (window as any).__OPEN_MOTION_VIDEO_ASSETS__ || []);

      if (videoAssets.length > 0) {
        const videoFrames: Record<string, string> = {};

        for (const asset of videoAssets) {
          // Resolve relative path to absolute
          let localPath = asset.src;
          if (asset.src.startsWith('/') && !asset.src.startsWith('//')) {
            // Check common public folders
            const possiblePaths = [
              path.join(process.cwd(), 'examples/demo/public', asset.src.substring(1)),
              path.join(process.cwd(), 'public', asset.src.substring(1)),
            ];
            for (const p of possiblePaths) {
              if (fs.existsSync(p)) {
                localPath = p;
                break;
              }
            }
          }

          const tempFramePath = path.join(outputDir, `temp-${workerId}-${asset.id}.jpg`);
          if (extractFrame(localPath, asset.time, tempFramePath)) {
            const base64 = fs.readFileSync(tempFramePath, { encoding: 'base64' });
            videoFrames[asset.id] = `data:image/jpeg;base64,${base64}`;
            fs.unlinkSync(tempFramePath); // Cleanup temp file
          }
        }

        // Inject frames back into the page
        await page.evaluate((frames) => {
          (window as any).__OPEN_MOTION_VIDEO_FRAMES__ = frames;
        }, videoFrames);

        // Brief wait for React to re-render the <img> tags with new src
        await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 50)));
      }

      // Additional small wait to ensure style/layout stability
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 150)));

      // Extract audio assets
      const assets = await page.evaluate(() => (window as any).__OPEN_MOTION_AUDIO_ASSETS__ || []);
      workerAudioAssets.push(...assets);

      const screenshotPath = path.join(outputDir, `frame-${i.toString().padStart(5, '0')}.png`);
      // Force a tiny bit of wait before each screenshot to ensure rendering
      await new Promise(r => setTimeout(r, 100));
      await page.screenshot({ path: screenshotPath, type: 'png' });

      totalFramesRendered++;
      if (onProgress) {
        onProgress(totalFramesRendered);
      }
    }

    await browser.close();
    return workerAudioAssets;
  };

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(renderBatch(i * framesPerWorker, (i + 1) * framesPerWorker - 1, i));
  }

  const results = await Promise.all(workers);
  const allAudioAssets = results.flat();

  // Unique audio assets based on src, startFrom, startFrame, and volume
  const uniqueAudioAssets = Array.from(
    new Map(
      allAudioAssets.map((asset) => [
        `${asset.src}-${asset.startFrom || 0}-${asset.startFrame || 0}-${asset.volume || 1}`,
        asset,
      ])
    ).values()
  );

  console.log('Frame rendering complete.');
  return { audioAssets: uniqueAudioAssets };
};
