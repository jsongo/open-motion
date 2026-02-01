import { chromium, Page } from 'playwright';
import { getTimeHijackScript, VideoConfig } from '@open-motion/core';
import fs from 'fs';
import path from 'path';

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

    for (let i = startFrame; i <= endFrame && i < config.durationInFrames; i++) {
      if (i === startFrame) {
        await page.addInitScript(({ frame, fps, hijackScript, compositionId, inputProps }) => {
          (window as any).__OPEN_MOTION_FRAME__ = frame;
          (window as any).__OPEN_MOTION_COMPOSITION_ID__ = compositionId;
          (window as any).__OPEN_MOTION_INPUT_PROPS__ = inputProps;
          (window as any).__OPEN_MOTION_READY__ = false;

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
          eval(hijackScript);
          window.dispatchEvent(new CustomEvent('open-motion-frame-update', { detail: { frame } }));
        }, {
          frame: i,
          fps: config.fps,
          hijackScript: getTimeHijackScript(i, config.fps),
        });
      }

      await page.waitForFunction(() => {
        const ready = (window as any).__OPEN_MOTION_READY__ === true;
        const delayCount = (window as any).__OPEN_MOTION_DELAY_RENDER_COUNT__ || 0;
        return ready && delayCount === 0;
      }, { timeout: 60000 });
      await page.waitForLoadState('networkidle');

      // Additional small wait to ensure style/layout stability
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 200)));

      // Extract audio assets from each frame to catch late-entering audio
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
