import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
const TEST_PORT = 3005;
const APP_URL = `http://localhost:${TEST_PORT}`;
async function runTest() {
    console.log('🚀 Starting E2E Tests...');
    // 1. Start dev server
    const devServer = spawn('pnpm', ['dev', '--port', TEST_PORT.toString()], {
        cwd: path.resolve(__dirname, '../../../examples/hello-world'),
        shell: false
    });
    devServer.stdout.on('data', (data) => console.log(`[DevServer]: ${data}`));
    // Wait for dev server to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
    const browser = await chromium.launch();
    const page = await browser.newPage();
    try {
        // Scene 1: Basic Rendering & Hooks
        console.log('Checking Scene 1: Hooks & Rendering...');
        await page.goto(APP_URL);
        await page.waitForSelector('h1');
        const title = await page.innerText('h1');
        if (title !== 'OpenMotion Player Preview')
            throw new Error('Player Title mismatch');
        console.log('✅ Scene 1 Passed');
        // Scene 2: Input Props Injection
        console.log('Checking Scene 2: Input Props...');
        // We'll test this via CLI later, but check if default props work in Player
        const welcomeText = await page.innerText('span');
        if (!welcomeText.includes('Claude Preview'))
            throw new Error('Input Props not reflected');
        console.log('✅ Scene 2 Passed');
        // Scene 3: delayRender
        console.log('Checking Scene 3: delayRender...');
        // Check if __OPEN_MOTION_DELAY_RENDER_COUNT__ exists and becomes 0
        const delayCount = await page.evaluate(() => window.__OPEN_MOTION_DELAY_RENDER_COUNT__);
        console.log(`Initial delay count: ${delayCount}`);
        await page.waitForFunction(() => window.__OPEN_MOTION_DELAY_RENDER_COUNT__ === 0, { timeout: 10000 });
        console.log('✅ Scene 3 Passed');
    }
    catch (err) {
        console.error('❌ Test Failed:', err);
        process.exit(1);
    }
    finally {
        await browser.close();
        devServer.kill();
    }
    console.log('🎉 All E2E Tests Passed!');
    process.exit(0);
}
runTest();
