import { chromium } from 'playwright';
import { getTimeHijackScript } from '@open-motion/core';
import fs from 'fs';
import path from 'path';
export const getCompositions = async (url) => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    // Wait a bit for React to mount and compositions to register
    await page.waitForFunction(() => window.__OPEN_MOTION_COMPOSITIONS__ !== undefined, { timeout: 5000 }).catch(() => { });
    const compositions = await page.evaluate(() => {
        return window.__OPEN_MOTION_COMPOSITIONS__ || [];
    });
    await browser.close();
    return compositions;
};
export const renderFrames = async ({ url, config, outputDir, compositionId, inputProps = {}, concurrency = 1 }) => {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const framesPerWorker = Math.ceil(config.durationInFrames / concurrency);
    const audioAssets = [];
    const renderBatch = async (startFrame, endFrame, workerId) => {
        const browser = await chromium.launch({
            args: ['--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-sandbox']
        });
        const page = await browser.newPage({
            viewport: { width: config.width, height: config.height }
        });
        console.log(`Worker ${workerId}: Rendering frames ${startFrame} to ${endFrame}...`);
        for (let i = startFrame; i <= endFrame && i < config.durationInFrames; i++) {
            if (i === startFrame) {
                await page.goto(url);
            }
            await page.evaluate(({ frame, fps, hijackScript, compositionId, inputProps }) => {
                window.__OPEN_MOTION_FRAME__ = frame;
                window.__OPEN_MOTION_COMPOSITION_ID__ = compositionId;
                window.__OPEN_MOTION_INPUT_PROPS__ = inputProps;
                eval(hijackScript);
            }, {
                frame: i,
                fps: config.fps,
                hijackScript: getTimeHijackScript(i, config.fps),
                compositionId,
                inputProps
            });
            await page.waitForFunction(() => !(window.__OPEN_MOTION_DELAY_RENDER_COUNT__ > 0), { timeout: 30000 });
            await page.waitForLoadState('networkidle');
            // Extract audio assets from the first frame or each frame
            if (workerId === 0 && i === 0) {
                const assets = await page.evaluate(() => window.__OPEN_MOTION_AUDIO_ASSETS__ || []);
                audioAssets.push(...assets);
            }
            const screenshotPath = path.join(outputDir, `frame-${i.toString().padStart(5, '0')}.png`);
            await page.screenshot({ path: screenshotPath, type: 'png' });
        }
        await browser.close();
    };
    const workers = [];
    for (let i = 0; i < concurrency; i++) {
        workers.push(renderBatch(i * framesPerWorker, (i + 1) * framesPerWorker - 1, i));
    }
    await Promise.all(workers);
    console.log('Frame rendering complete.');
    return { audioAssets };
};
